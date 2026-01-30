import type { Metadata } from 'next'
import { Providers } from './providers'
import { GoogleAnalytics } from '@/components/GoogleAnalytics'
import { CookieBanner } from '@/components/CookieBanner'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mtgdeckrender.com'

export const metadata: Metadata = {
    metadataBase: new URL(siteUrl),
    title: {
        default:
            'MTG DeckRender - Convert Your Magic Decklists to Beautiful Images',
        template: '%s | MTG DeckRender'
    },
    description:
        'Transform your Magic: The Gathering decklists into stunning, shareable images. Free online tool for MTG players. Create beautiful deck visualizations for social media, forums, and more.',
    keywords: [
        'MTG',
        'Magic The Gathering',
        'Magic: The Gathering',
        'deck',
        'decklist',
        'image',
        'converter',
        'generator',
        'deck builder',
        'deck visualizer',
        'MTG decklist',
        'card game',
        'trading card game'
    ],
    authors: [{ name: 'Stefano Servodidio', url: siteUrl }],
    creator: 'Stefano Servodidio',
    publisher: 'Stefano Servodidio',
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1
        }
    },
    alternates: {
        canonical: siteUrl
    },
    openGraph: {
        type: 'website',
        locale: 'en_US',
        url: siteUrl,
        title: 'MTG DeckRender - Convert Your Magic Decklists to Beautiful Images',
        description:
            'Transform your Magic: The Gathering decklists into stunning, shareable images. Free online tool for MTG players.',
        siteName: 'MTG DeckRender'
    },
    twitter: {
        card: 'summary_large_image',
        title: 'MTG DeckRender - Convert Your Magic Decklists to Beautiful Images',
        description:
            'Transform your Magic: The Gathering decklists into stunning, shareable images. Free online tool for MTG players.',
        creator: '@stefanoservodidio'
    },
    category: 'Gaming',
    classification: 'Card Game Tools'
}

export default function RootLayout({
    children
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <head>
                <link rel="canonical" href={siteUrl} />
            </head>
            <body>
                <GoogleAnalytics />
                <Providers>
                    {children}
                    <CookieBanner />
                </Providers>
            </body>
        </html>
    )
}
