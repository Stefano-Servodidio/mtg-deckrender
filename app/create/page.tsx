'use client'

import { FaUpload, FaImage, FaDownload } from 'react-icons/fa'
import { ClientCreatePage } from '@/components/ClientCreatePage'
import { Metadata } from 'next'

// export const metadata: Metadata = {
//     title: 'Create Deck Image - MTG Deck to PNG',
//     description:
//         'Convert your Magic: The Gathering decklist into a beautiful PNG image. Upload or paste your decklist to get started.',
//     keywords: [
//         'MTG',
//         'Magic The Gathering',
//         'deck',
//         'decklist',
//         'PNG',
//         'image',
//         'converter'
//     ]
// }

// This page will now render fully client-side
export default function CreatePage() {
    return <ClientCreatePage />
}
