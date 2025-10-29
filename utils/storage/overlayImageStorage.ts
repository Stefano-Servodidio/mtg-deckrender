import { getStore } from '@netlify/blobs'
import chalk from 'chalk'

// Lazy initialization of the blob store
let overlayStore: ReturnType<typeof getStore> | null = null

function getOverlayStore() {
    if (!overlayStore) {
        overlayStore = getStore({
            name: 'overlay-images',
            siteID: process.env.NETLIFY_SITE_ID!,
            token: process.env.NETLIFY_AUTH_TOKEN!
        })
    }
    return overlayStore
}

interface StoredOverlayMetadata {
    quantity: number
    svgSource: string
    storedAt: number
}

const REVALIDATION_PERIOD = 90 * 24 * 60 * 60 * 1000 // 90 days
const DEV_DEBUG_DISABLE_BLOBS = process.env.NODE_ENV === 'development' && true
/**
 * Get overlay from Netlify Blobs
 */
export async function getOverlayFromBlobs(
    overlayKey: string
): Promise<Buffer | null> {
    if (DEV_DEBUG_DISABLE_BLOBS) {
        console.log(
            chalk.yellow(`(Dev Mode) Skipping fetch from Blobs: ${overlayKey}`)
        )
        return null
    }
    try {
        const result = await getOverlayStore().getWithMetadata(overlayKey, {
            type: 'arrayBuffer'
        })
        if (!result) return null

        return Buffer.from(result.data)
    } catch (error) {
        console.error(
            chalk.red(`Error retrieving from Blobs: ${overlayKey}`),
            error
        )
        return null
    }
}

/**
 * Save overlay to Netlify Blobs with metadata
 */
export async function saveOverlayToBlobs(
    overlayKey: string,
    buffer: Buffer,
    quantity: number,
    svgSource: string
): Promise<void> {
    if (DEV_DEBUG_DISABLE_BLOBS) {
        console.log(
            chalk.yellow(`(Dev Mode) Skipping save to Blobs: ${overlayKey}`)
        )
        return
    }
    try {
        // Store the overlay with metadata
        const metadata: StoredOverlayMetadata = {
            quantity,
            svgSource,
            storedAt: Date.now()
        }
        await getOverlayStore().set(overlayKey, buffer as any, {
            metadata: metadata as any
        })

        console.log(chalk.green(`Saved to Blobs: ${overlayKey}`))
    } catch (error) {
        console.error(chalk.red(`Error saving to Blobs: ${overlayKey}`), error)
    }
}

/**
 * Check if overlay needs revalidation
 */
export async function needsRevalidation(overlayKey: string): Promise<boolean> {
    if (DEV_DEBUG_DISABLE_BLOBS) {
        console.log(
            chalk.yellow(
                `(Dev Mode) Skipping revalidation check: ${overlayKey}`
            )
        )
        return true
    }
    try {
        const result = await getOverlayStore().getMetadata(overlayKey)
        if (!result || !result.metadata) return true

        const metadata = result.metadata as unknown as StoredOverlayMetadata
        if (!metadata.storedAt) return true

        return Date.now() - metadata.storedAt > REVALIDATION_PERIOD
    } catch {
        return true
    }
}

/**
 * List all stored overlay images (useful for debugging)
 */
export async function listStoredOverlays(): Promise<string[]> {
    if (DEV_DEBUG_DISABLE_BLOBS) {
        console.log(chalk.yellow(`(Dev Mode) Skipping list stored overlays: `))
        return []
    }
    const { blobs } = await getOverlayStore().list()
    return blobs.map((blob) => blob.key)
}

// Export for testing
export const __testing__ = {
    resetStore: () => {
        overlayStore = null
    }
}
