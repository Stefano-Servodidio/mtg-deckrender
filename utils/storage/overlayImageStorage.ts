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

const DEV_DEBUG_DISABLE_BLOBS = process.env.NODE_ENV === 'development' && false

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
        const imageData = await getOverlayStore().get(overlayKey, {
            type: 'arrayBuffer'
        })
        if (!imageData) return null

        return Buffer.from(imageData)
    } catch (error) {
        console.error(
            chalk.red(`Error retrieving from Blobs: ${overlayKey}`),
            error
        )
        return null
    }
}

/**
 * Save overlay to Netlify Blobs
 */
export async function saveOverlayToBlobs(
    overlayKey: string,
    buffer: Buffer
): Promise<void> {
    if (DEV_DEBUG_DISABLE_BLOBS) {
        console.log(
            chalk.yellow(`(Dev Mode) Skipping save to Blobs: ${overlayKey}`)
        )
        return
    }
    try {
        await getOverlayStore().set(overlayKey, buffer as any)

        console.log(chalk.green(`Saved overlay to Blobs: ${overlayKey}`))
    } catch (error) {
        console.error(
            chalk.red(`Error saving overlay to Blobs: ${overlayKey}`),
            error
        )
    }
}

/**
 * List all stored overlay images (useful for debugging)
 */
export async function listStoredOverlays(): Promise<string[]> {
    if (DEV_DEBUG_DISABLE_BLOBS) {
        console.log(chalk.yellow(`(Dev Mode) Skipping list stored overlays`))
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
