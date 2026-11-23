import 'server-only'
import { getStore, type Review } from './db'

/** "Priya Sharma" → "Priya S." — enough to be a real person, not enough to find them. */
export const displayName = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'A client'
  return parts.length === 1 ? parts[0] : `${parts[0]} ${parts.at(-1)![0].toUpperCase()}.`
}

/**
 * Feedback the guest agreed to share and the house chose to show, newest first.
 * Never fails a page: if the store cannot be reached, there are simply no reviews to show.
 */
export async function getReviews(slug?: string, limit = 6): Promise<Review[]> {
  try {
    const all = await (await getStore()).listFeedback()
    return all
      .filter((f) => f.published && f.consent && f.comments.trim() && (!slug || f.fragrance.includes(slug)))
      .reverse()
      .slice(0, limit)
      .map((f) => ({ id: f.id ?? f.at, fragrance: f.fragrance, scent: f.scent, comments: f.comments.trim(), name: displayName(f.name), at: f.at }))
  } catch (e) {
    console.error('reviews unavailable', e)
    return []
  }
}

/** Average scent rating and count, for structured data — only once there are enough to mean something. */
export function ratingSummary(reviews: Review[]) {
  if (reviews.length < 3) return null
  const avg = reviews.reduce((n, r) => n + r.scent, 0) / reviews.length
  return { ratingValue: Math.round(avg * 10) / 10, reviewCount: reviews.length }
}
