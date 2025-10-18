import { getStore } from '@netlify/blobs'
import { NextResponse } from 'next/server'

export async function GET() {
    const store = getStore('card-images')
    const { blobs } = await store.list()

    const imageCount = blobs.filter((b) => !b.key.endsWith('-metadata')).length

    return NextResponse.json({
        totalImages: imageCount,
        images: blobs.slice(0, 100) // First 100 for preview
    })
}
