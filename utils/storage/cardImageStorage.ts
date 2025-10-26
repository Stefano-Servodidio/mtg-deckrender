import { getStore } from '@netlify/blobs'
import chalk from 'chalk'

// Initialize the blob store
const cardImageStore = getStore({
    name: 'card-images',
    siteID: process.env.NETLIFY_SITE_ID!,
    token: process.env.NETLIFY_AUTH_TOKEN!
})

interface StoredImageMetadata {
    scryfallUri: string
    contentType: string
    storedAt: number
}

const REVALIDATION_PERIOD = 90 * 24 * 60 * 60 * 1000 // 90 days
const DEV_DEBUG_DISABLE_BLOBS = process.env.NODE_ENV === 'development' && true
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
        const imageData = await cardImageStore.get(cardId, {
            type: 'arrayBuffer'
        })
        if (!imageData) return null

        return Buffer.from(imageData)
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
        // Store the image
        await cardImageStore.set(cardId, buffer)

        // Store metadata separately
        const metadata: StoredImageMetadata = {
            scryfallUri,
            contentType,
            storedAt: Date.now()
        }
        await cardImageStore.setJSON(`${cardId}-metadata`, metadata)

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
        const metadata = (await cardImageStore.get(`${cardId}-metadata`, {
            type: 'json'
        })) as StoredImageMetadata | null
        if (!metadata) return true

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
    const { blobs } = await cardImageStore.list()
    return blobs
        .map((blob) => blob.key)
        .filter((key) => !key.endsWith('-metadata'))
}
