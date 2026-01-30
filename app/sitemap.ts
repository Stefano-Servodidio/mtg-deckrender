sitemap
import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl =
        process.env.NEXT_PUBLIC_SITE_URL || 'https://mtgdeckrender.com'

    return [
        {
            url: baseUrl,
            changeFrequency: 'monthly',
            priority: 1
        },
        {
            url: `${baseUrl}/create`,
            changeFrequency: 'weekly',
            priority: 0.8
        }
    ]
}
