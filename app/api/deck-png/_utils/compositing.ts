// Image compositing utilities for deck PNG generation
// This file contains logic for positioning cards and quantity overlays on the canvas

import path from 'path'
import fs from 'fs/promises'
import sharp from 'sharp'
import { CardImageBuffer } from '../_types'
import { DECK_LAYOUT_CONFIG, calculateRowHeight } from './config'

/**
 * Load an asset file as a buffer
 */
export async function getAssetBuffer(filename: string): Promise<Buffer> {
    const assetPath = path.join(process.cwd(), 'assets', filename)
    return await fs.readFile(assetPath)
}

/**
 * Load quantity overlay assets
 */
export async function loadQuantityOverlayAssets(): Promise<{
    [key: number]: Buffer
}> {
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
 * Calculate position for a card in the grid
 */
function calculateCardPosition(
    index: number,
    cardsPerRow: number,
    isMainDeck: boolean,
    mainDeckRowHeight?: number
): { left: number; top: number } {
    const { card, spacing } = DECK_LAYOUT_CONFIG
    const rowHeight = calculateRowHeight()

    const row = Math.floor(index / cardsPerRow)
    const col = index % cardsPerRow

    const leftPosition =
        spacing.canvasPadding + col * (card.width + spacing.betweenCards)
    const baseTopPosition =
        spacing.canvasPadding + row * (rowHeight + spacing.betweenCards)

    // Add extra spacing for sideboard
    const sideboardOffset =
        !isMainDeck && mainDeckRowHeight !== undefined
            ? mainDeckRowHeight + rowHeight + spacing.sideboardSeparator
            : 0

    return {
        left: leftPosition,
        top: baseTopPosition + sideboardOffset
    }
}

/**
 * Prepare card composite operations for Sharp
 */
export function prepareCardOperations(
    images: CardImageBuffer[],
    cardsPerRow: number,
    mainDeckRowHeight?: number
): any[] {
    return images.map((imageData, index) => {
        const isMainDeck = imageData.type === 'main'
        const { left, top } = calculateCardPosition(
            index,
            cardsPerRow,
            isMainDeck,
            mainDeckRowHeight
        )

        return {
            input: imageData.buffer,
            left,
            top
        }
    })
}

/**
 * Calculate position for quantity overlay
 */
function calculateOverlayPosition(
    index: number,
    cardsPerRow: number,
    isMainDeck: boolean,
    mainDeckRowHeight?: number
): { left: number; top: number } {
    const { card, spacing, overlay } = DECK_LAYOUT_CONFIG
    const rowHeight = calculateRowHeight()

    const row = Math.floor(index / cardsPerRow)
    const col = index % cardsPerRow

    const leftPosition =
        spacing.canvasPadding +
        col * (card.width + spacing.betweenCards) +
        card.width -
        overlay.offsetFromRight

    const baseTopPosition =
        spacing.canvasPadding +
        row * (rowHeight + spacing.betweenCards) +
        overlay.offsetFromTop

    // Add extra spacing for sideboard
    const sideboardOffset =
        !isMainDeck && mainDeckRowHeight !== undefined
            ? mainDeckRowHeight + rowHeight + spacing.sideboardSeparator
            : 0

    return {
        left: leftPosition,
        top: baseTopPosition + sideboardOffset
    }
}

/**
 * Prepare quantity overlay operations for Sharp
 */
export function prepareQuantityOverlayOperations(
    images: CardImageBuffer[],
    cardsPerRow: number,
    quantityAssets: { [key: number]: Buffer },
    mainDeckRowHeight?: number
): any[] {
    return images
        .map((imageData, index) => {
            if (imageData.quantity < 2) return null // No overlay for single cards

            const isMainDeck = imageData.type === 'main'
            const { left, top } = calculateOverlayPosition(
                index,
                cardsPerRow,
                isMainDeck,
                mainDeckRowHeight
            )

            return {
                input: quantityAssets[imageData.quantity] || quantityAssets[1],
                left,
                top
            }
        })
        .filter((op): op is NonNullable<typeof op> => op !== null)
}

/**
 * Create the base canvas for compositing
 */
export function createCanvas(width: number, height: number): sharp.Sharp {
    return sharp({
        create: {
            width,
            height,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
    })
}

/**
 * Create the final composite image with all cards and overlays
 */
export async function createCompositeImage(
    canvas: sharp.Sharp,
    cardOperations: any[],
    overlayOperations: any[]
): Promise<Buffer> {
    const compositeImage = canvas.composite([
        ...cardOperations,
        ...overlayOperations
    ])

    return await compositeImage.png().toBuffer()
}
