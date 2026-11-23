import 'server-only'
import crypto from 'node:crypto'
import postgres from 'postgres'
import { CODE_ATTEMPTS, HOLD_MS, RESERVING, leadKey, mergeLead, type Lead, type CodeCheck, type Profile, type CreateResult, type EventStats, type Feedback, type InventoryLog, type InventoryRow, type NewOrder, type Order, type Reserved, type Store, type Subscriber, type TrackEvent } from './types'

/**
 * Production store: any Postgres (Neon, Supabase, Railway, RDS…) via DATABASE_URL.
 * Each order is kept whole as JSONB beside a few indexed columns, so the shape can grow
 * without migrations. Tables are created on first use.
 */

type Sql = postgres.Sql

/**
 * Neon and others append libpq-only options (e.g. `channel_binding=require`) that postgres.js would
 * forward to the server as settings, which the server rejects. TLS is enforced below instead.
 */
function cleanUrl(raw: string) {
  try {
    const u = new URL(raw)
    for (const k of ['channel_binding', 'options', 'sslrootcert', 'sslcert', 'sslkey']) u.searchParams.delete(k)
    return u.toString()
  } catch {
    return raw
  }
}

// One pool per process — shared across route handlers, pages and dev reloads.
const g = globalThis as typeof globalThis & { __abSql?: Sql; __abSchema?: Promise<void> | null; __abSchemaFor?: string }

function db(): Sql {
  if (g.__abSql) return g.__abSql
  const url = cleanUrl(process.env.DATABASE_URL!)
  const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url)
  g.__abSql = postgres(url, {
    // serverless-friendly: few connections, no prepared statements (works behind PgBouncer / Neon pooler)
    max: Number(process.env.DATABASE_POOL_MAX ?? 3),
    prepare: false,
    ssl: local || /sslmode=disable/.test(url) ? false : 'require',
    idle_timeout: 20,
    connect_timeout: 15,
    onnotice: () => {},
  })
  return g.__abSql
}

const SCHEMA = `
create table if not exists ab_orders (
  id                text primary key,
  number            text not null unique,
  status            text not null,
  email             text not null,
  razorpay_order_id text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  data              jsonb not null
);
create index if not exists ab_orders_rp_idx on ab_orders (razorpay_order_id);
create index if not exists ab_orders_status_idx on ab_orders (status, created_at desc);
create sequence if not exists ab_order_number_seq start 1001;
create table if not exists ab_subscribers (
  email      text primary key,
  source     text,
  created_at timestamptz not null default now()
);
create table if not exists ab_feedback (
  id         bigserial primary key,
  created_at timestamptz not null default now(),
  data       jsonb not null
);
create table if not exists ab_inventory (
  variant_id   text primary key,
  edition_size integer not null,
  offline      integer not null default 0,
  paused       boolean not null default false,
  updated_at   timestamptz not null default now()
);
create table if not exists ab_inventory_log (
  id         bigserial primary key,
  at         timestamptz not null default now(),
  variant_id text not null,
  change     text not null,
  note       text
);
create table if not exists ab_events (
  id       bigserial primary key,
  at       timestamptz not null default now(),
  name     text not null,
  vid      text not null,
  sid      text not null,
  path     text not null,
  slug     text,
  source   text,
  medium   text,
  campaign text,
  device   text,
  country  text,
  city     text
);
create index if not exists ab_events_at_idx on ab_events (at);
create index if not exists ab_events_name_at_idx on ab_events (name, at);
create index if not exists ab_orders_email_idx on ab_orders (email, created_at desc);
create table if not exists ab_profiles (
  email      text primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  data       jsonb not null
);
create table if not exists ab_leads (
  id         text primary key,
  key        text not null unique,
  kind       text not null,
  status     text not null,
  updated_at timestamptz not null default now(),
  data       jsonb not null
);
create index if not exists ab_leads_updated_idx on ab_leads (updated_at desc);
create table if not exists ab_login_codes (
  email      text primary key,
  hash       text not null,
  expires_at timestamptz not null,
  attempts   integer not null default 0
);
`

function migrate(): Promise<void> {
  // re-run when the schema itself changes (new tables added while a server keeps running)
  if (g.__abSchemaFor !== SCHEMA) {
    g.__abSchema = null
    g.__abSchemaFor = SCHEMA
  }
  if (!g.__abSchema) {
    g.__abSchema = db()
      .unsafe(SCHEMA)
      .then(() => undefined)
      .catch((e) => {
        g.__abSchema = null
        throw e
      })
  }
  return g.__abSchema
}

/** a JSONB parameter (postgres.js types it from a plain object) */
const json = (sql: Sql | postgres.TransactionSql, v: unknown) => sql.json(v as postgres.JSONValue)

// Serialises checkouts across every server instance, so two guests can never take the last bottle.
const CHECKOUT_LOCK = 7_701_177

async function reserved(sql: Sql | postgres.TransactionSql): Promise<Reserved> {
  const since = new Date(Date.now() - HOLD_MS)
  const rows = await sql<{ v: string; q: number }[]>`
    select line->>'variantId' as v, sum((line->>'qty')::int)::int as q
    from ab_orders, jsonb_array_elements(data->'totals'->'lines') as line
    where status in ${sql(RESERVING)} or (status = 'pending' and created_at > ${since})
    group by 1`
  return Object.fromEntries(rows.map((r) => [r.v, Number(r.q)]))
}

export const pgStore: Store = {
  kind: 'postgres',

  async createOrder<F>(input: NewOrder, check?: (reserved: Reserved) => F | null): Promise<CreateResult<F>> {
    await migrate()
    const result = await db().begin(async (tx) => {
      await tx`select pg_advisory_xact_lock(${CHECKOUT_LOCK})`
      const fail = check?.(await reserved(tx))
      if (fail) return { ok: false as const, fail }
      const [{ n }] = await tx<{ n: string }[]>`select nextval('ab_order_number_seq')::text as n`
      const now = new Date().toISOString()
      const order: Order = {
        ...input,
        id: crypto.randomBytes(12).toString('base64url'),
        number: `AB-${n}`,
        createdAt: now,
        updatedAt: now,
        status: 'pending',
        events: [{ at: now, type: 'created' }],
      }
      await tx`
        insert into ab_orders (id, number, status, email, razorpay_order_id, created_at, updated_at, data)
        values (${order.id}, ${order.number}, ${order.status}, ${order.customer.email.toLowerCase()},
                ${order.payment.razorpayOrderId ?? null}, ${now}, ${now}, ${json(tx, order)})`
      return { ok: true as const, order }
    })
    return result as unknown as CreateResult<F>
  },

  async getOrder(id) {
    await migrate()
    const [row] = await db()<{ data: Order }[]>`select data from ab_orders where id = ${id}`
    return row?.data
  },
  async findByNumber(number) {
    await migrate()
    const [row] = await db()<{ data: Order }[]>`select data from ab_orders where number = ${number.trim().toUpperCase()}`
    return row?.data
  },
  async findByRazorpayOrder(rp) {
    await migrate()
    const [row] = await db()<{ data: Order }[]>`select data from ab_orders where razorpay_order_id = ${rp} limit 1`
    return row?.data
  },
  async listOrders() {
    await migrate()
    const rows = await db()<{ data: Order }[]>`select data from ab_orders order by created_at asc`
    return rows.map((r) => r.data)
  },

  async updateOrder(id, mutate) {
    await migrate()
    return db().begin(async (tx) => {
      const [row] = await tx<{ data: Order }[]>`select data from ab_orders where id = ${id} for update`
      if (!row) return undefined
      const next = mutate(structuredClone(row.data))
      if (!next) return row.data
      const now = new Date().toISOString()
      const saved: Order = { ...next, updatedAt: now }
      await tx`
        update ab_orders set
          status = ${saved.status},
          email = ${saved.customer.email.toLowerCase()},
          razorpay_order_id = ${saved.payment.razorpayOrderId ?? null},
          updated_at = ${now},
          data = ${json(tx, saved)}
        where id = ${id}`
      return saved
    }) as Promise<Order | undefined>
  },

  async reservedByVariant() {
    await migrate()
    return reserved(db())
  },

  async addSubscriber(email, source) {
    await migrate()
    const rows = await db()`
      insert into ab_subscribers (email, source) values (${email}, ${source ?? null})
      on conflict (email) do nothing returning email`
    return rows.length > 0
  },
  async listSubscribers() {
    await migrate()
    const rows = await db()<{ email: string; source: string | null; created_at: Date }[]>`
      select email, source, created_at from ab_subscribers order by created_at asc`
    return rows.map<Subscriber>((r) => ({ email: r.email, source: r.source ?? undefined, at: r.created_at.toISOString() }))
  },

  async addFeedback(f) {
    await migrate()
    await db()`insert into ab_feedback (data) values (${json(db(), f)})`
  },
  async listFeedback() {
    await migrate()
    const rows = await db()<{ id: string; data: Omit<Feedback, 'at'>; created_at: Date }[]>`
      select id::text as id, data, created_at from ab_feedback order by created_at asc`
    return rows.map((r) => ({ ...r.data, id: r.id, at: r.created_at.toISOString() }))
  },
  async removeFeedback(id) {
    await migrate()
    if (!/^\d+$/.test(id)) return false
    const rows = await db()`delete from ab_feedback where id = ${id} returning id`
    return rows.length > 0
  },
  async publishFeedback(id, on) {
    await migrate()
    if (!/^\d+$/.test(id)) return false
    const rows = on
      ? await db()`update ab_feedback set data = data || '{"published":true}'::jsonb where id = ${id} and (data->>'consent')::boolean is true returning id`
      : await db()`update ab_feedback set data = data || '{"published":false}'::jsonb where id = ${id} returning id`
    return rows.length > 0
  },

  async saveLead(input) {
    await migrate()
    const key = leadKey(input)
    return db().begin(async (tx) => {
      const [row] = await tx<{ data: Lead }[]>`select data from ab_leads where key = ${key} for update`
      const lead = mergeLead(row?.data, input, new Date().toISOString(), crypto.randomBytes(8).toString('hex'))
      await tx`
        insert into ab_leads (id, key, kind, status, updated_at, data)
        values (${lead.id}, ${key}, ${lead.kind}, ${lead.status}, ${lead.updatedAt}, ${json(tx, lead)})
        on conflict (key) do update set status = excluded.status, updated_at = excluded.updated_at, data = excluded.data`
      return lead
    }) as Promise<Lead>
  },
  async listLeads() {
    await migrate()
    const rows = await db()<{ data: Lead }[]>`select data from ab_leads order by updated_at desc limit 2000`
    return rows.map((r) => r.data)
  },
  async setLeadStatus(id, status) {
    await migrate()
    const now = new Date().toISOString()
    const rows = await db()`
      update ab_leads set status = ${status}, updated_at = ${now},
        data = data || ${json(db(), { status, updatedAt: now })}
      where id = ${id} returning id`
    return rows.length > 0
  },
  async removeLead(id) {
    await migrate()
    const rows = await db()`delete from ab_leads where id = ${id} returning id`
    return rows.length > 0
  },

  async removeSubscriber(email) {
    await migrate()
    const rows = await db()`delete from ab_subscribers where email = ${email} returning email`
    return rows.length > 0
  },

  async getInventory() {
    await migrate()
    const rows = await db()<{ variant_id: string; edition_size: number; offline: number; paused: boolean; updated_at: Date }[]>`
      select variant_id, edition_size, offline, paused, updated_at from ab_inventory`
    return Object.fromEntries(
      rows.map((r) => [
        r.variant_id,
        { variantId: r.variant_id, editionSize: r.edition_size, offline: r.offline, paused: r.paused, updatedAt: r.updated_at.toISOString() } satisfies InventoryRow,
      ]),
    )
  },
  async setInventory(row, change, note) {
    await migrate()
    await db().begin(async (tx) => {
      await tx`
        insert into ab_inventory (variant_id, edition_size, offline, paused, updated_at)
        values (${row.variantId}, ${row.editionSize}, ${row.offline}, ${row.paused}, now())
        on conflict (variant_id) do update set
          edition_size = excluded.edition_size, offline = excluded.offline, paused = excluded.paused, updated_at = now()`
      await tx`insert into ab_inventory_log (variant_id, change, note) values (${row.variantId}, ${change}, ${note ?? null})`
    })
  },
  async listInventoryLog(limit = 50) {
    await migrate()
    const rows = await db()<{ at: Date; variant_id: string; change: string; note: string | null }[]>`
      select at, variant_id, change, note from ab_inventory_log order by at desc limit ${limit}`
    return rows.map<InventoryLog>((r) => ({ at: r.at.toISOString(), variantId: r.variant_id, change: r.change, ...(r.note ? { note: r.note } : {}) }))
  },

  async addEvent(e: TrackEvent) {
    await migrate()
    await db()`
      insert into ab_events (name, vid, sid, path, slug, source, medium, campaign, device, country, city)
      values (${e.name}, ${e.vid}, ${e.sid}, ${e.path}, ${e.slug ?? null}, ${e.source ?? null}, ${e.medium ?? null},
              ${e.campaign ?? null}, ${e.device ?? null}, ${e.country ?? null}, ${e.city ?? null})`
  },

  async eventStats(since: Date): Promise<EventStats> {
    await migrate()
    const sql = db()
    const [totals] = await sql<{ visitors: number; sessions: number; views: number }[]>`
      select count(distinct vid)::int as visitors, count(distinct sid)::int as sessions,
             (count(*) filter (where name = 'page_view'))::int as views
      from ab_events where at >= ${since}`
    const byDay = await sql<{ day: string; visitors: number; views: number }[]>`
      select to_char(date_trunc('day', at), 'YYYY-MM-DD') as day, count(distinct vid)::int as visitors, count(*)::int as views
      from ab_events where at >= ${since} and name = 'page_view' group by 1 order by 1`
    const topPages = await sql<{ key: string; n: number }[]>`
      select path as key, count(*)::int as n from ab_events
      where at >= ${since} and name = 'page_view' group by 1 order by 2 desc limit 10`
    const sources = await sql<{ key: string; n: number }[]>`
      select coalesce(nullif(source, ''), 'Direct') as key, count(distinct vid)::int as n from ab_events
      where at >= ${since} group by 1 order by 2 desc limit 10`
    const devices = await sql<{ key: string; n: number }[]>`
      select device as key, count(distinct vid)::int as n from ab_events
      where at >= ${since} and device is not null group by 1 order by 2 desc`
    const places = await sql<{ key: string; n: number }[]>`
      select case when city is not null then city || coalesce(', ' || country, '') else country end as key,
             count(distinct vid)::int as n
      from ab_events where at >= ${since} and (city is not null or country is not null) group by 1 order by 2 desc limit 10`
    const names = await sql<{ name: string; n: number; reach: number }[]>`
      select name, count(*)::int as n, count(distinct vid)::int as reach from ab_events where at >= ${since} group by 1`
    const products = await sql<{ slug: string; views: number; adds: number }[]>`
      select slug, (count(*) filter (where name = 'product_view'))::int as views,
             (count(*) filter (where name = 'add_to_bag'))::int as adds
      from ab_events where at >= ${since} and slug is not null group by 1 order by 2 desc`
    return {
      since: since.toISOString(),
      visitors: totals?.visitors ?? 0,
      sessions: totals?.sessions ?? 0,
      pageViews: totals?.views ?? 0,
      byDay: byDay.map((r) => ({ ...r })),
      topPages: topPages.map((r) => ({ ...r })),
      sources: sources.map((r) => ({ ...r })),
      devices: devices.map((r) => ({ ...r })),
      places: places.map((r) => ({ ...r })),
      events: Object.fromEntries(names.map((r) => [r.name, r.n])),
      reach: Object.fromEntries(names.map((r) => [r.name, r.reach])),
      products: products.map((r) => ({ ...r })),
    }
  },

  async health() {
    await migrate()
    await db()`select 1`
  },

  async listOrdersByEmail(email) {
    await migrate()
    const rows = await db()<{ data: Order }[]>`
      select data from ab_orders where email = ${email.trim().toLowerCase()} order by created_at desc`
    return rows.map((r) => r.data)
  },

  async getProfile(email) {
    await migrate()
    const [row] = await db()<{ data: Profile }[]>`select data from ab_profiles where email = ${email.trim().toLowerCase()}`
    return row?.data
  },
  async saveProfile(input) {
    await migrate()
    const email = input.email.trim().toLowerCase()
    return db().begin(async (tx) => {
      const [row] = await tx<{ data: Profile }[]>`select data from ab_profiles where email = ${email} for update`
      const now = new Date().toISOString()
      const profile: Profile = { ...input, email, createdAt: row?.data.createdAt ?? now, updatedAt: now }
      await tx`
        insert into ab_profiles (email, created_at, updated_at, data)
        values (${email}, ${profile.createdAt}, ${now}, ${json(tx, profile)})
        on conflict (email) do update set updated_at = excluded.updated_at, data = excluded.data`
      return profile
    }) as Promise<Profile>
  },

  async putLoginCode(email, hash, expiresAt) {
    await migrate()
    await db()`
      insert into ab_login_codes (email, hash, expires_at, attempts)
      values (${email}, ${hash}, ${expiresAt.toISOString()}, 0)
      on conflict (email) do update set hash = excluded.hash, expires_at = excluded.expires_at, attempts = 0`
  },
  async checkLoginCode(email, hash) {
    await migrate()
    return db().begin(async (tx) => {
      const [row] = await tx<{ hash: string; expires_at: Date; attempts: number }[]>`
        select hash, expires_at, attempts from ab_login_codes where email = ${email} for update`
      if (!row) return 'none'
      if (row.expires_at.getTime() < Date.now() || row.attempts >= CODE_ATTEMPTS) {
        await tx`delete from ab_login_codes where email = ${email}`
        return 'expired'
      }
      const a = Buffer.from(row.hash)
      const b = Buffer.from(hash)
      if (a.length === b.length && crypto.timingSafeEqual(a, b)) {
        await tx`delete from ab_login_codes where email = ${email}`
        return 'ok'
      }
      await tx`update ab_login_codes set attempts = attempts + 1 where email = ${email}`
      return 'wrong'
    }) as Promise<CodeCheck>
  },
}
