/**
 * "Which hour is yours?" — three questions that point a guest to one of the three fragrances.
 * Each answer leans towards one hour; the most-chosen wins, and a tie goes to the scent answer (question II).
 */
export type HourSlug = 'amber-hour' | 'open-sky' | 'iron-crown'

export type FinderQuestion = {
  no: string
  q: string
  answers: { label: string; hour: HourSlug }[]
}

export const finderQuestions: FinderQuestion[] = [
  {
    no: 'I',
    q: 'When do you most want to be noticed?',
    answers: [
      { label: 'Mornings and the working day', hour: 'open-sky' },
      { label: 'Evenings, dinners, celebrations', hour: 'amber-hour' },
      { label: 'Late nights and big occasions', hour: 'iron-crown' },
    ],
  },
  {
    no: 'II',
    q: 'Which of these would you reach for?',
    answers: [
      { label: 'Fresh citrus and clean air', hour: 'open-sky' },
      { label: 'Vanilla, honey and warm spice', hour: 'amber-hour' },
      { label: 'Smoke, wood and incense', hour: 'iron-crown' },
    ],
  },
  {
    no: 'III',
    q: 'How should it make you feel?',
    answers: [
      { label: 'Light and free', hour: 'open-sky' },
      { label: 'Warm and magnetic', hour: 'amber-hour' },
      { label: 'Composed and in command', hour: 'iron-crown' },
    ],
  },
]

/** The hour for a set of answers (one hour per question, in order). */
export function matchHour(picks: HourSlug[]): HourSlug {
  const tally = new Map<HourSlug, number>()
  for (const p of picks) tally.set(p, (tally.get(p) ?? 0) + 1)
  const best = Math.max(...tally.values())
  const leaders = [...tally.entries()].filter(([, n]) => n === best).map(([h]) => h)
  return leaders.length === 1 ? leaders[0] : (picks[1] ?? leaders[0])
}

/** Why it matched, in one line, by hour */
export const finderWhy: Record<HourSlug, string> = {
  'amber-hour': 'Warm and sweet, made for evenings with people around you.',
  'open-sky': 'Bright and clean, made for the day and the open road.',
  'iron-crown': 'Smoky and resinous, made for the night and for presence.',
}

/** sessionStorage flag: the guest has started the finder in this visit (the pop-up then stays away) */
export const FINDER_USED = 'ab-finder'
