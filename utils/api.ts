import { CardImageBuffer, CardItem, ProgressCallback } from '@/types/api'
import chalk from 'chalk'
import { cardImageCache } from '@/utils/cache'
import {
    getImageFromBlobs,
    saveImageToBlobs,
    needsRevalidation
} from '@/utils/storage/cardImageStorage'

/**
 * Download and resize a single card image based on size settings
 */
export async function downloadCardImage(
    card: CardItem
): Promise<CardImageBuffer> {
    try {
        const cacheKey = `${card.id}`

        // 1. Check in-memory cache first (fastest)
        const memCached = cardImageCache.get(cacheKey)
        if (memCached) {
            console.log(
                chalk.blueBright(`Memory cache hit for card: ${card.name}`)
            )
            return {
                name: card.name,
                groupId: card.groupId,
                buffer: memCached.buffer,
                quantity: card.quantity
            }
        }

        // 2. Check Netlify Blobs (persistent storage)
        const blobImage = await getImageFromBlobs(card.id)
        if (blobImage) {
            console.log(chalk.grey(`Blob cache hit for card: ${card.name}`))

            const cardBuffer: CardImageBuffer = {
                name: card.name,
                groupId: card.groupId,
                buffer: blobImage,
                quantity: card.quantity
            }

            // Store in memory cache for subsequent requests in this session
            cardImageCache.set(cacheKey, cardBuffer)

            // Check if needs revalidation (background task, non-blocking)
            if (await needsRevalidation(card.id)) {
                console.log(
                    chalk.yellow(`Image will be revalidated: ${card.name}`)
                )
                // Optionally trigger background revalidation here
            }

            return cardBuffer
        }

        // 3. Download from Scryfall (only if not cached anywhere)
        console.log(chalk.yellow(`Downloading from Scryfall: ${card.name}`))
        const response = await fetch(card.image_uri as string)

        if (!response.ok) {
            throw new Error(`Failed to fetch image for ${card.name}`)
        }

        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        const cardBuffer: CardImageBuffer = {
            name: card.name,
            groupId: card.groupId,
            buffer: buffer,
            quantity: card.quantity
        }

        // 4. Save to Netlify Blobs for future use
        await saveImageToBlobs(
            card.id,
            buffer,
            card.image_uri as string,
            response.headers.get('content-type') || 'image/jpeg'
        )

        // 5. Store in memory cache
        cardImageCache.set(cacheKey, cardBuffer)

        console.log(chalk.green(`✓ Cached new image: ${card.name}`))

        return cardBuffer
    } catch (error) {
        console.error(
            chalk.red(`Error fetching image for ${card.name}:`),
            error
        )
        return {
            name: card.name,
            groupId: card.groupId,
            buffer: null,
            quantity: card.quantity
        }
    }
}

/**
 * Download and resize all card images with progress tracking
 */
export async function downloadAllCardImages(
    cards: CardItem[],
    progressCallback?: ProgressCallback
): Promise<[CardImageBuffer[], CardImageBuffer[]]> {
    const successfulImages: CardImageBuffer[] = []
    const failedImages: CardImageBuffer[] = []
    const totalImages = cards.length

    for (let i = 0; i < cards.length; i++) {
        const card = cards[i]

        if (progressCallback) {
            progressCallback(i + 1, totalImages, card.name)
        }

        const cardBuffer = await downloadCardImage(card)

        if (cardBuffer?.buffer) {
            successfulImages.push(cardBuffer)
        } else {
            failedImages.push(cardBuffer)
        }
    }

    // Filter out failed downloads
    return [successfulImages, failedImages]
}
