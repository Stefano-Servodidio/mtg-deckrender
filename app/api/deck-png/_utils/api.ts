import { CardItem } from '@/types/api'
import chalk from 'chalk'
import { CardImageBuffer, ProgressCallback } from '../_types'
import { cardImageCache } from '@/utils/cache'

/**
 * Download and resize a single card image based on size settings
 */
export async function downloadCardImage(
    card: CardItem
): Promise<CardImageBuffer> {
    try {
        const response = await fetch(card.image_uri as string)
        if (!response.ok) {
            throw new Error(`Failed to fetch image for ${card.name}`)
        }

        const buffer = await response.arrayBuffer()

        return {
            name: card.name,
            groupId: card.groupId,
            buffer: Buffer.from(buffer),
            quantity: card.quantity
        }
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

        // Check cache first
        const cacheKey = `${card.id}`
        const cached = cardImageCache.get(cacheKey)

        if (cached) {
            successfulImages.push(cached)
            console.log(chalk.cyan(`Cache hit for card image: ${card.name}`))
            continue
        }

        const cardBuffer = await downloadCardImage(card)
        if (cardBuffer?.buffer) {
            successfulImages.push(cardBuffer)
            cardImageCache.set(cacheKey, cardBuffer)
        } else {
            failedImages.push(cardBuffer)
        }
    }

    // Filter out failed downloads
    return [successfulImages, failedImages]
}
