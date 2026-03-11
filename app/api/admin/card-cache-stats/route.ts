import { getStore } from '@netlify/blobs'
import { NextResponse } from 'next/server'
import { isMaintenanceMode, maintenanceResponse } from '@/utils/maintenance'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
    if (isMaintenanceMode()) {
        return maintenanceResponse()
    }

    try {
        // On Netlify, credentials are auto-detected. Only provide them for local development.
        const config: any = { name: 'card-images' }

        if (process.env.NETLIFY_SITE_ID && process.env.NETLIFY_AUTH_TOKEN) {
            config.siteID = process.env.NETLIFY_SITE_ID
            config.token = process.env.NETLIFY_AUTH_TOKEN
        }

        const store = getStore(config)

        // Paginate through all blobs to get accurate count
        let totalCount = 0
        let exampleBlobs: any[] = []

        for await (const result of store.list({ paginate: true })) {
            totalCount += result.blobs.length

            // Only keep first 5 blobs as examples
            if (exampleBlobs.length < 5) {
                const remaining = 5 - exampleBlobs.length
                exampleBlobs.push(...result.blobs.slice(0, remaining))
            }
        }

        return NextResponse.json({
            totalImages: totalCount,
            examples: exampleBlobs // First 5 for preview
        })
    } catch (error) {
        console.error('Error fetching card cache stats:', error)
        return NextResponse.json(
            { error: 'Failed to fetch cache statistics' },
            { status: 500 }
        )
    }
}
