import type { Metadata } from 'next'
import { Providers } from './providers'
import { GoogleAnalytics } from '@/components/GoogleAnalytics'
import { CookieBanner } from '@/components/CookieBanner'

export const metadata: Metadata = {
    title: 'MTG Deck to PNG - Convert Your Magic Decklists',
    description:
        'Convert your Magic: The Gathering decklists into beautiful PNG images. Fast, free, and easy to use.',
    keywords: [
        'MTG',
        'Magic The Gathering',
        'deck',
        'decklist',
        'PNG',
        'image',
        'converter',
        'generator'
    ],
    authors: [{ name: 'MTG Deck to PNG' }],
    creator: 'MTG Deck to PNG',
    publisher: 'MTG Deck to PNG',
    robots: 'index, follow',
    openGraph: {
        title: 'MTG Deck to PNG - Convert Your Magic Decklists',
        description:
            'Convert your Magic: The Gathering decklists into beautiful PNG images. Fast, free, and easy to use.',
        type: 'website',
        locale: 'en_US'
    },
    twitter: {
        card: 'summary_large_image',
        title: 'MTG Deck to PNG - Convert Your Magic Decklists',
        description:
            'Convert your Magic: The Gathering decklists into beautiful PNG images. Fast, free, and easy to use.'
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
                <Providers>
                    {children}
                    <CookieBanner />
                </Providers>
            </body>
        </html>
    )
}
