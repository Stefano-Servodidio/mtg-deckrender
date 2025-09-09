import { FaUpload, FaImage, FaDownload } from 'react-icons/fa'
import { ClientCreatePage } from '@/components/ClientCreatePage'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Create Deck Image - MTG Deck to PNG',
    description:
        'Convert your Magic: The Gathering decklist into a beautiful PNG image. Upload or paste your decklist to get started.',
    keywords: [
        'MTG',
        'Magic The Gathering',
        'deck',
        'decklist',
        'PNG',
        'image',
        'converter'
    ]
}

// This page is statically generated but includes client components

export default function CreatePage() {
    return <ClientCreatePage />
}

// Enable static generation with client-side hydration
export const dynamic = 'force-static'
export const revalidate = false
