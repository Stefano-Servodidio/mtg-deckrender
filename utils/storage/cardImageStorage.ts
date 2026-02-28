import { getStore } from '@netlify/blobs'
import chalk from 'chalk'

// Lazy initialization of the blob store
let cardImageStore: ReturnType<typeof getStore> | null = null

function getCardImageStore() {
    if (!cardImageStore) {
        // On Netlify, credentials are auto-detected. Only provide them for local development.
        const config: any = { name: 'card-images' }

        // Only explicitly set credentials if we're NOT on Netlify (local dev)
        if (process.env.NETLIFY_SITE_ID && process.env.NETLIFY_AUTH_TOKEN) {
            config.siteID = process.env.NETLIFY_SITE_ID
            config.token = process.env.NETLIFY_AUTH_TOKEN
        }

        cardImageStore = getStore(config)
    }
    return cardImageStore
}

interface StoredImageMetadata {
    scryfallUri: string
    contentType: string
    storedAt: number
}

/**
 * Type guard to check if metadata is StoredImageMetadata
 */
function isStoredImageMetadata(
    metadata: unknown
): metadata is StoredImageMetadata {
    return (
        typeof metadata === 'object' &&
        metadata !== null &&
        'scryfallUri' in metadata &&
        'contentType' in metadata &&
        'storedAt' in metadata &&
        typeof (metadata as any).scryfallUri === 'string' &&
        typeof (metadata as any).contentType === 'string' &&
        typeof (metadata as any).storedAt === 'number'
    )
}

const REVALIDATION_PERIOD = 90 * 24 * 60 * 60 * 1000 // 90 days
const DEV_DEBUG_DISABLE_BLOBS = process.env.NODE_ENV === 'development' && false
/**
 * Get image from Netlify Blobs
 */
export async function getImageFromBlobs(
    cardId: string
): Promise<Buffer | null> {
    if (DEV_DEBUG_DISABLE_BLOBS) {
        console.log(
            chalk.yellow(`(Dev Mode) Skipping fetch from Blobs: ${cardId}`)
        )
        return null
    }
    try {
        const result = await getCardImageStore().getWithMetadata(cardId, {
            type: 'arrayBuffer'
        })
        if (!result) return null

        return Buffer.from(result.data)
    } catch (error) {
        console.error(
            chalk.red(`Error retrieving from Blobs: ${cardId}`),
            error
        )
        return null
    }
}

/**
 * Save image to Netlify Blobs with metadata
 */
export async function saveImageToBlobs(
    cardId: string,
    buffer: Buffer,
    scryfallUri: string,
    contentType: string = 'image/jpeg'
): Promise<void> {
    if (DEV_DEBUG_DISABLE_BLOBS) {
        console.log(
            chalk.yellow(`(Dev Mode) Skipping save to Blobs: ${cardId}`)
        )
        return
    }
    try {
        // Store the image with metadata
        const metadata: StoredImageMetadata = {
            scryfallUri,
            contentType,
            storedAt: Date.now()
        }
        await getCardImageStore().set(cardId, buffer as any, {
            metadata: metadata as any
        })

        console.log(chalk.green(`Saved to Blobs: ${cardId}`))
    } catch (error) {
        console.error(chalk.red(`Error saving to Blobs: ${cardId}`), error)
    }
}

/**
 * Check if image needs revalidation
 */
export async function needsRevalidation(cardId: string): Promise<boolean> {
    if (DEV_DEBUG_DISABLE_BLOBS) {
        console.log(
            chalk.yellow(`(Dev Mode) Skipping revalidation check: ${cardId}`)
        )
        return true
    }
    try {
        const result = await getCardImageStore().getMetadata(cardId)
        if (!result || !result.metadata) return true

        if (!isStoredImageMetadata(result.metadata)) {
            console.warn(`Invalid metadata structure for ${cardId}`)
            return true
        }

        const metadata = result.metadata
        if (!metadata.storedAt) return true

        return Date.now() - metadata.storedAt > REVALIDATION_PERIOD
    } catch {
        return true
    }
}

/**
 * List all stored card images (useful for debugging)
 */
export async function listStoredCards(): Promise<string[]> {
    if (DEV_DEBUG_DISABLE_BLOBS) {
        console.log(chalk.yellow(`(Dev Mode) Skipping list stored cards: `))
        return []
    }
    const { blobs } = await getCardImageStore().list()
    return blobs.map((blob) => blob.key)
}

// Export for testing
export const __testing__ = {
    resetStore: () => {
        cardImageStore = null
    }
}
