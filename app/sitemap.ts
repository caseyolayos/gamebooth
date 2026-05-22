import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://gamebooth.app'
  const now = new Date()

  return [
    { url: base,                                      lastModified: now, changeFrequency: 'hourly',  priority: 1 },
    { url: `${base}/about`,                           lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/sports-broadcasting-training`,        lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/watch-sports-without-announcers`,     lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/privacy`,                         lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${base}/discover`,                        lastModified: now, changeFrequency: 'hourly',  priority: 0.7 },
    { url: `${base}/booths`,                          lastModified: now, changeFrequency: 'hourly',  priority: 0.7 },
    { url: `${base}/go-live`,                         lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
  ]
}
