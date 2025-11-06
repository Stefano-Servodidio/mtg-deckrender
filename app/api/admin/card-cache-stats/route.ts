import { getStore } from '@netlify/blobs'
import { NextResponse } from 'next/server'

export async function GET() {
    const store = getStore({
        name: 'card-images',
        siteID: process.env.NETLIFY_SITE_ID!,
        token: process.env.NETLIFY_AUTH_TOKEN!
    })
    const { blobs } = await store.list()

    return NextResponse.json({
        totalImages: blobs.length,
        images: blobs.slice(0, 10) // First 10 for preview
    })
}
