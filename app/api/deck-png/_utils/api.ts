import { CardItem } from '@/app/types/api'
import chalk from 'chalk'
import sharp from 'sharp'
import { Dimensions, CardImageBuffer, ProgressCallback } from '../_types'

/**
 * Download and resize a single card image based on size settings
 */
export async function downloadAndResizeCardImage(
    card: CardItem,
    cardDimensions: Dimensions
): Promise<CardImageBuffer | null> {
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
        const resizedBuffer = await sharp(Buffer.from(buffer))
            .resize({
                width: Math.round(cardDimensions.width),
                height: Math.round(cardDimensions.height)
            })
            .toBuffer()

        return {
            name: card.name,
            groupId: card.groupId,
            buffer: resizedBuffer,
            quantity: card.quantity
        }
    } catch (error) {
        console.error(
            chalk.red(`Error fetching image for ${card.name}:`),
            error
        )
        return null
    }
}

/**
 * Download and resize all card images with progress tracking
 */
export async function downloadAllCardImages(
    cards: CardItem[],
    cardDimensions: Dimensions,
    progressCallback?: ProgressCallback
): Promise<CardImageBuffer[]> {
    const cardImageBuffers: (CardImageBuffer | null)[] = []
    const totalImages = cards.length

    for (let i = 0; i < cards.length; i++) {
        const card = cards[i]

        if (progressCallback) {
            progressCallback(i + 1, totalImages, card.name)
        }

        const cardBuffer = await downloadAndResizeCardImage(
            card,
            cardDimensions
        )
        cardImageBuffers.push(cardBuffer)
    }

    // Filter out failed downloads
    return cardImageBuffers.filter(
        (img): img is CardImageBuffer => img !== null
    )
}
