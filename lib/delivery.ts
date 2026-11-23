import { site, isFastPin } from './site'

/**
 * The delivery promise as a date ("Arrives tomorrow, Monday 23 November"), worked out in India time.
 * Shoppers read a date as a promise, so this errs late: Sundays are neither dispatch nor delivery days.
 */

const TZ = 'Asia/Kolkata'
const DAY = 864e5

/** Today's calendar day in India (as a UTC-midnight Date; India has no daylight saving) and the hour there */
function nowInIndia(now: Date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now)
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value)
  return { day: new Date(Date.UTC(get('year'), get('month') - 1, get('day'))), hour: get('hour') }
}

const addDays = (d: Date, n: number) => new Date(d.getTime() + n * DAY)
const isSunday = (d: Date) => d.getUTCDay() === 0
/** n working days after d (Sundays skipped) */
const addWorking = (d: Date, n: number) => {
  let x = d
  for (let i = 0; i < n; ) {
    x = addDays(x, 1)
    if (!isSunday(x)) i++
  }
  return x
}

/** The day an order placed now leaves the house: today before the cut-off (Monday to Saturday), else the next working day */
export function dispatchDay(now = new Date()) {
  const { day, hour } = nowInIndia(now)
  if (!isSunday(day) && hour < site.delivery.cutoffHour) return day
  return addWorking(day, 1)
}

export type Arrival = { fast: boolean; from: Date; to: Date; today: Date }

export function arrivalFor(pin: string, now = new Date()): Arrival {
  const today = nowInIndia(now).day
  const sent = dispatchDay(now)
  if (isFastPin(pin)) {
    const d = addWorking(sent, 1)
    return { fast: true, from: d, to: d, today }
  }
  const [min, max] = site.delivery.standardDays
  return { fast: false, from: addWorking(sent, min), to: addWorking(sent, max), today }
}

const fmt = (d: Date, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', ...o }).format(d)
const long = (d: Date) => fmt(d, { weekday: 'long', day: 'numeric', month: 'long' })
const short = (d: Date) => fmt(d, { weekday: 'short', day: 'numeric', month: 'short' })

/** "tomorrow, Monday 23 November" · "Monday 23 November" · "between Thu 26 Nov and Wed 2 Dec" */
export function arrivalText(a: Arrival) {
  if (a.fast) {
    const ahead = Math.round((a.from.getTime() - a.today.getTime()) / DAY)
    return ahead === 1 ? `tomorrow, ${long(a.from)}` : long(a.from)
  }
  return `between ${short(a.from)} and ${short(a.to)}`
}

/** One sentence for a PIN code: "Arrives tomorrow, Monday 23 November" */
export const arrivalLine = (pin: string, now = new Date()) => `Arrives ${arrivalText(arrivalFor(pin, now))}`

export const validPin = (pin: string) => /^[1-9]\d{5}$/.test(pin)
