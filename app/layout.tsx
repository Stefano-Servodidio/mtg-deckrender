import type { Metadata } from 'next'
import { Providers } from './providers'

export const metadata: Metadata = {
    title: 'MTG Deck to PNG - Convert Your Magic Decklists',
    description:
        'Convert your Magic: The Gathering decklists into beautiful PNG images'
}

export default function RootLayout({
    children
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body>
                <Providers>{children}</Providers>
            </body>
        </html>
    )
}
