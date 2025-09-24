import { CardItem } from '@/app/types/api'
import chalk from 'chalk'
import { CardImageBuffer, ProgressCallback } from '../_types'

/**
 * Download and resize a single card image based on size settings
 */
export async function downloadAndResizeCardImage(
    card: CardItem
): Promise<CardImageBuffer> {
    try {
        const response = await fetch(card.image_uri as string, {
            headers: {
                'Cache-Control': 'max-age=86400'
            }
        })
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

        const cardBuffer = await downloadAndResizeCardImage(card)
        if (cardBuffer?.buffer) successfulImages.push(cardBuffer)
        else failedImages.push(cardBuffer)
    }

    // Filter out failed downloads
    return [successfulImages, failedImages]
}
