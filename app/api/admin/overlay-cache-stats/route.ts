import { NextResponse } from 'next/server'
import { overlayCache } from '@/utils/cache'

export async function GET() {
    const cacheSize = overlayCache.size()
    const cacheKeys = overlayCache.getKeys()

    return NextResponse.json({
        totalImages: cacheSize,
        images: cacheKeys.slice(0, 10) // First 10 for preview
    })
}
