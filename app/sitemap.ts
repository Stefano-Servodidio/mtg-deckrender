sitemap
import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl =
        process.env.NEXT_PUBLIC_SITE_URL || 'https://mtgdeckrender.com'

    return [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 1
        },
        {
            url: `${baseUrl}/create`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8
        }
    ]
}
