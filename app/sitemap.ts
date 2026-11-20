import type { MetadataRoute } from 'next'
import { allFragrances } from '@/lib/catalog'
import { site } from '@/lib/site'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return [
    { url: site.url, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${site.url}/collection`, lastModified: now, changeFrequency: 'weekly', priority: 0.95 },
    { url: `${site.url}/house`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${site.url}/client-care`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${site.url}/gift-set`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    ...allFragrances.map((f) => ({
      url: `${site.url}/fragrances/${f.slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    })),
    { url: `${site.url}/feedback`, lastModified: now, priority: 0.3 },
    { url: `${site.url}/policies`, lastModified: now, priority: 0.3 },
  ]
}
