import sharp from 'sharp'
import path from 'path'
import fs from 'fs/promises'

/**
 * Utility for compositing card images into the final deck PNG
 * 
 * Usage:
 * import { createCanvas, prepareCompositeOperations, loadCountAssets } from './_utils/compositing'
 * 
 * const canvas = createCanvas(canvasWidth, canvasHeight)
 * const operations = prepareCompositeOperations(images, ...)
 * const result = await canvas.composite(operations).png().toBuffer()
 */

export interface CardImageBuffer {
    name: string
    type: 'main' | 'sideboard'
    buffer: Buffer
    quantity: number
}

/**
 * Create a base canvas for the deck image
 */
export function createCanvas(canvasWidth: number, canvasHeight: number) {
    return sharp({
        create: {
            width: canvasWidth,
            height: canvasHeight,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
    })
}

/**
 * Load an asset file as a buffer
 */
export async function getAssetBuffer(filename: string): Promise<Buffer> {
    const assetPath = path.join(process.cwd(), 'assets', filename)
    return await fs.readFile(assetPath)
}

/**
 * Load all count overlay assets
 */
export async function loadCountAssets(): Promise<{ [key: number]: Buffer }> {
    const x1Buffer = await getAssetBuffer('x1.png')
    const x2Buffer = await getAssetBuffer('x2.png')
    const x3Buffer = await getAssetBuffer('x3.png')
    const x4Buffer = await getAssetBuffer('x4.png')

    return {
        1: x1Buffer,
        2: x2Buffer,
        3: x3Buffer,
        4: x4Buffer
    }
}

/**
 * Prepare card composite operations for positioning cards on the canvas
 */
export function prepareCardOperations(
    images: CardImageBuffer[],
    cardsPerRow: number,
    cardWidth: number,
    rowHeight: number,
    spacing: number,
    sideboardSpacing: number,
    mainHeight: number = 0
) {
    return images.map((imageData, index) => {
        const row = Math.floor(index / cardsPerRow)
        const col = index % cardsPerRow

        const left = spacing + col * (cardWidth + spacing)
        const top =
            spacing +
            row * (rowHeight + spacing) +
            (imageData.type === 'sideboard'
                ? mainHeight + rowHeight + sideboardSpacing
                : 0)

        return {
            input: imageData.buffer,
            left,
            top
        }
    })
}

/**
 * Prepare quantity overlay operations for cards with quantity > 1
 */
export function prepareCountOperations(
    images: CardImageBuffer[],
    cardsPerRow: number,
    cardWidth: number,
    rowHeight: number,
    spacing: number,
    sideboardSpacing: number,
    countIconBuffers: { [key: number]: Buffer },
    mainHeight: number = 0
) {
    return images
        .map((imageData, index) => {
            if (imageData.quantity < 2) return null // No overlay for single cards

            const row = Math.floor(index / cardsPerRow)
            const col = index % cardsPerRow

            const left = spacing + col * (cardWidth + spacing) + cardWidth - 50
            const top =
                spacing +
                row * (rowHeight + spacing) +
                28 +
                (imageData.type === 'sideboard'
                    ? mainHeight + rowHeight + sideboardSpacing
                    : 0)

            return {
                input:
                    countIconBuffers[imageData.quantity] || countIconBuffers[1],
                left,
                top
            }
        })
        .filter((op) => op !== null)
}

/**
 * Prepare all composite operations for the deck image
 */
export function prepareCompositeOperations(
    mainImages: CardImageBuffer[],
    sideboardImages: CardImageBuffer[],
    cardsPerRow: number,
    cardWidth: number,
    rowHeight: number,
    spacing: number,
    sideboardSpacing: number,
    totalMainRows: number,
    countIconBuffers: { [key: number]: Buffer }
) {
    // Prepare card composite operations
    const mainOperations = prepareCardOperations(
        mainImages,
        cardsPerRow,
        cardWidth,
        rowHeight,
        spacing,
        sideboardSpacing
    )

    const sideboardOperations = prepareCardOperations(
        sideboardImages,
        cardsPerRow,
        cardWidth,
        rowHeight,
        spacing,
        sideboardSpacing,
        rowHeight * totalMainRows
    )

    // Prepare quantity overlay operations
    const mainCountOperations = prepareCountOperations(
        mainImages,
        cardsPerRow,
        cardWidth,
        rowHeight,
        spacing,
        sideboardSpacing,
        countIconBuffers
    )

    const sideboardCountOperations = prepareCountOperations(
        sideboardImages,
        cardsPerRow,
        cardWidth,
        rowHeight,
        spacing,
        sideboardSpacing,
        countIconBuffers,
        rowHeight * totalMainRows
    )

    return [
        ...mainOperations,
        ...sideboardOperations,
        ...mainCountOperations,
        ...sideboardCountOperations
    ]
}