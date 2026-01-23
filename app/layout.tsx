import type { Metadata } from 'next'
import { Providers } from './providers'
import { GoogleAnalytics } from '@/components/GoogleAnalytics'

export const metadata: Metadata = {
    title: 'MTG DeckRender - Convert Your Magic Decklists',
    description:
        'Convert your Magic: The Gathering decklists into beautiful images. Fast, free, and easy to use.',
    keywords: [
        'MTG',
        'Magic The Gathering',
        'Magic: The Gathering',
        'deck',
        'decklist',
        'image',
        'converter',
        'generator'
    ],
    authors: [{ name: 'Stefano Servodidio' }],
    creator: 'Stefano Servodidio',
    publisher: 'Stefano Servodidio',
    robots: 'index, follow',
    openGraph: {
        title: 'MTG DeckRender - Convert Your Magic Decklists',
        description:
            'Convert your Magic: The Gathering decklists into beautiful images. Fast, free, and easy to use.',
        type: 'website',
        locale: 'en_US'
    },
    twitter: {
        card: 'summary_large_image',
        title: 'MTG DeckRender - Convert Your Magic Decklists',
        description:
            'Convert your Magic: The Gathering decklists into beautiful images. Fast, free, and easy to use.'
    }
}

export default function RootLayout({
    children
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body>
                <GoogleAnalytics />
                <Providers>{children}</Providers>
            </body>
        </html>
    )
}
