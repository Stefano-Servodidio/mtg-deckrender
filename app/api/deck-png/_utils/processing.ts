import sharp from 'sharp'
import { CardItem } from '@/app/services/serverless/types'
import { CardImageBuffer } from './compositing'

/**
 * Utility for processing card images for deck PNG generation
 * 
 * Usage:
 * import { processCardImages, CardImageData } from './_utils/processing'
 * 
 * const cardImages = extractCardImageData(cards)
 * const validImages = filterValidImages(cardImages)
 * const imageBuffers = await downloadAndResizeImages(validImages, cardWidth, cardHeight)
 */

export interface CardImageData {
    name: string
    quantity: number
    type: 'main' | 'sideboard'
    imageUri: string
    cmc?: number
    typeLine?: string
    rarity?: string
}

/**
 * Extract image data from card items
 */
export function extractCardImageData(cards: CardItem[]): CardImageData[] {
    return cards.map(({ card, type, quantity }) => ({
        name: card.name,
        quantity,
        type,
        imageUri: card.image_uris?.png || '',
        cmc: card.cmc || 0,
        typeLine: card.type_line || '',
        rarity: card.rarity || 'common'
    }))
}

/**
 * Filter out invalid card images and sort them
 */
export function filterValidImages(cardImages: CardImageData[]): CardImageData[] {
    return cardImages
        .filter(
            (card) =>
                card.imageUri && card.quantity > 0 && card.quantity <= 4
        )
        .sort((a, b) => {
            //sort by cmc then by name
            const aCmc = a.cmc ?? 0
            const bCmc = b.cmc ?? 0
            if (aCmc === bCmc) {
                return a.name.localeCompare(b.name)
            }
            return aCmc - bCmc
        })
}

/**
 * Download and resize card images
 */
export async function downloadAndResizeImages(
    cardImages: CardImageData[],
    cardWidth: number,
    cardHeight: number
): Promise<CardImageBuffer[]> {
    const cardImageBuffers = await Promise.all(
        cardImages.map(async (card) => {
            try {
                const response = await fetch(card.imageUri)
                if (!response.ok) {
                    throw new Error(
                        `Failed to fetch image for ${card.name}`
                    )
                }
                const buffer = await response.arrayBuffer()
                const resizedBuffer = await sharp(Buffer.from(buffer))
                    .resize({
                        width: cardWidth,
                        height: cardHeight
                    })
                    .toBuffer()
                return {
                    name: card.name,
                    type: card.type,
                    buffer: resizedBuffer,
                    quantity: card.quantity
                }
            } catch (error) {
                console.error(
                    `Error fetching image for ${card.name}:`,
                    error
                )
                return null
            }
        })
    )

    // Filter out failed downloads
    return cardImageBuffers.filter((img) => img !== null) as CardImageBuffer[]
}

/**
 * Calculate layout dimensions for the deck image
 */
export function calculateLayoutDimensions(
    successfulImages: CardImageBuffer[],
    cardsPerRow: number,
    cardWidth: number,
    rowHeight: number,
    spacing: number,
    sideboardSpacing: number
) {
    const hasSideboard = successfulImages.some(
        (img) => img.type === 'sideboard'
    )

    const totalMainRows = Math.ceil(
        successfulImages.filter((img) => img.type === 'main').length /
            cardsPerRow
    )
    const totalSideboardRows = hasSideboard
        ? Math.ceil(
              successfulImages.filter((img) => img.type === 'sideboard')
                  .length / cardsPerRow
          )
        : 0
    const totalRows =
        totalMainRows + (hasSideboard ? totalSideboardRows : 0)
    const canvasWidth =
        cardWidth * cardsPerRow + spacing * (cardsPerRow - 1) + spacing * 2 // Add padding
    const canvasHeight =
        rowHeight * totalRows +
        spacing * (totalRows - 1) +
        spacing * 2 +
        (hasSideboard ? sideboardSpacing + 2 * rowHeight : 0) // Add padding

    return {
        hasSideboard,
        totalMainRows,
        totalSideboardRows,
        totalRows,
        canvasWidth,
        canvasHeight
    }
}

/**
 * Split images into main and sideboard groups
 */
export function splitImagesByType(images: CardImageBuffer[]) {
    const mainImages = images.filter((img) => img.type === 'main')
    const sideboardImages = images.filter((img) => img.type === 'sideboard')
    
    return { mainImages, sideboardImages }
}