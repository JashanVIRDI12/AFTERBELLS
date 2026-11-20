'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { allowed, checkCode, endSession, getSession, issueCode, normaliseEmail, safeNext, startSession } from '@/lib/account'
import { customerSchema } from '@/lib/checkout-schema'
import { getStore } from '@/lib/db'
import { sendLoginCode } from '@/lib/email'

export type SignInState = {
  step: 'email' | 'code'
  email?: string
  error?: string
  /** a fresh code was just sent (shows a quiet confirmation) */
  resent?: boolean
  /** development only, when no email could be sent: the code itself */
  devCode?: string
}

const isDev = process.env.NODE_ENV !== 'production'

async function send(email: string): Promise<SignInState> {
  const code = await issueCode(email)
  if (await sendLoginCode(email, code)) return { step: 'code', email }
  if (isDev) {
    console.info(`[account] sign-in code for ${email}: ${code}`)
    return { step: 'code', email, devCode: code }
  }
  return { step: 'email', email, error: 'We could not send your code just now. Please try again in a moment, or call our concierge.' }
}

/** One form, three intents: send a code, check it, or start again with another email. */
export async function signIn(prev: SignInState, fd: FormData): Promise<SignInState> {
  const intent = String(fd.get('intent') ?? 'send')

  if (intent === 'restart') return { step: 'email', email: prev.email }

  if (intent === 'send' || intent === 'resend') {
    const parsed = z.email().max(120).safeParse(String(fd.get('email') ?? prev.email ?? '').trim())
    if (!parsed.success) return { step: 'email', error: 'Enter a valid email address' }
    if (!(await allowed('account-code', 5, 15 * 60_000))) {
      return { ...prev, error: 'Too many codes requested. Please wait a few minutes and try again.' }
    }
    const next = await send(normaliseEmail(parsed.data))
    return intent === 'resend' && !next.error ? { ...next, resent: true } : next
  }

  // verify
  const email = normaliseEmail(String(fd.get('email') ?? prev.email ?? ''))
  const code = String(fd.get('code') ?? '').replace(/\D/g, '')
  if (code.length !== 6) return { ...prev, step: 'code', email, error: 'Enter the six-digit code from your email', resent: false }
  if (!(await allowed('account-verify', 20, 15 * 60_000))) {
    return { ...prev, step: 'code', email, error: 'Too many attempts. Please wait a few minutes and try again.', resent: false }
  }
  const result = await checkCode(email, code)
  if (result === 'ok') {
    await startSession(email)
    redirect(safeNext(String(fd.get('next') ?? '')))
  }
  if (result === 'wrong') return { ...prev, step: 'code', email, error: 'That code is not right. Please check it and try again.', resent: false }
  return { step: 'code', email, error: 'That code has expired. Please ask for a new one.', resent: false }
}

export async function signOut() {
  await endSession()
  redirect('/')
}

export type ProfileState = { ok?: boolean; error?: string; fields?: Partial<Record<string, string>> }

const profileSchema = customerSchema.omit({ email: true })

export async function saveProfile(_prev: ProfileState, fd: FormData): Promise<ProfileState> {
  const email = await getSession()
  if (!email) redirect('/account/sign-in?next=/account/profile')

  const raw = Object.fromEntries(['name', 'phone', 'address1', 'address2', 'city', 'state', 'pin'].map((k) => [k, String(fd.get(k) ?? '')]))
  const parsed = profileSchema.safeParse(raw)
  if (!parsed.success) {
    const fields: Record<string, string> = {}
    for (const i of parsed.error.issues) fields[String(i.path[0])] ??= i.message
    return { error: 'Please check the highlighted details.', fields }
  }

  const store = await getStore()
  await store.saveProfile({ ...parsed.data, email })
  if (fd.get('news') === 'on') await store.addSubscriber(email, 'account')
  else await store.removeSubscriber(email)

  revalidatePath('/account', 'layout')
  return { ok: true }
}
