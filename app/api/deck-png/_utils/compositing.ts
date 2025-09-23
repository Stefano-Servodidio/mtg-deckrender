// Image compositing utilities for deck PNG generation
// This file contains logic for positioning cards and quantity overlays on the canvas

import path from 'path'
import fs from 'fs/promises'
import sharp from 'sharp'
import { CardImageBuffer, Dimensions } from '../_types'
import { DECK_LAYOUT_CONFIG, ROW_SIZE, calculateRowHeight } from './config'
import { ImageSize, ImageVariant, BackgroundStyle } from '@/app/types/api'

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
 * Calculate position for a card in the grid based on layout settings
 */
function calculateCardPosition(
    index: number,
    cardDimensions: Dimensions,
    imageVariant?: ImageVariant,
    imageSize?: ImageSize
    // mainDeckRowHeight?: number
): { left: number; top: number } {
    const {
        spacing: { betweenCards, canvasPadding, sideboardSeparator }
    } = DECK_LAYOUT_CONFIG

    // const cardDimensions = calculateCardDimensions(imageSize, imageOrientation)
    const cardsPerRow = imageSize ? ROW_SIZE[imageSize] : 7
    const rowHeight = calculateRowHeight(imageVariant, cardDimensions.height)

    const row = Math.floor(index / cardsPerRow)
    const col = index % cardsPerRow

    const leftPosition =
        canvasPadding + col * (cardDimensions.width + betweenCards)
    const baseTopPosition = canvasPadding + row * (rowHeight + betweenCards)

    // Add extra spacing for sideboard
    // const sideboardOffset =
    //     !isMainDeck && mainDeckRowHeight !== undefined
    //         ? mainDeckRowHeight + rowHeight + sideboardSeparator
    //         : 0

    return {
        left: leftPosition,
        // top: baseTopPosition + sideboardOffset
        top: baseTopPosition
    }
}

/**
 * Prepare card composite operations for Sharp
 */
export function prepareCardOperations(
    images: CardImageBuffer[],
    cardDimensions: Dimensions,
    imageVariant?: ImageVariant,
    imageSize?: ImageSize
    // mainDeckRowHeight?: number
): sharp.OverlayOptions[] {
    return images.map((imageData, index) => {
        // const isMainDeck = imageData.groupId === 0
        const { left, top } = calculateCardPosition(
            index,
            cardDimensions,
            // isMainDeck,
            imageVariant,
            imageSize
            // mainDeckRowHeight
        )
        // return position rounded to avoid subpixel rendering issues
        return {
            input: imageData.buffer,
            left: Math.floor(left),
            top: Math.floor(top)
        }
    })
}

/**
 * Calculate position for quantity overlay based on layout settings
 */
function calculateOverlayPosition(
    index: number,
    cardDimensions: Dimensions,
    // isMainDeck: boolean,
    imageVariant?: ImageVariant,
    imageSize?: ImageSize
    // mainDeckRowHeight?: number
): { left: number; top: number } {
    const { spacing, overlay } = DECK_LAYOUT_CONFIG
    const cardsPerRow = imageSize ? ROW_SIZE[imageSize] : 7
    // const cardDimensions = calculateCardDimensions(imageSize, imageOrientation)
    const rowHeight = calculateRowHeight(imageVariant, cardDimensions.height)

    const row = Math.floor(index / cardsPerRow)
    const col = index % cardsPerRow

    // Scale overlay offset based on card scale
    // const scaleRatio = cardDimensions.width / DECK_LAYOUT_CONFIG.card.baseWidth
    const scaledOverlayOffsetFromRight =
        overlay.offsetFromRight * cardDimensions.scale!

    const scaledOverlayOffsetFromTop =
        overlay.offsetFromTop * cardDimensions.scale!

    const leftPosition =
        spacing.canvasPadding +
        col * (cardDimensions.width + spacing.betweenCards) +
        cardDimensions.width -
        scaledOverlayOffsetFromRight

    const baseTopPosition =
        spacing.canvasPadding +
        row * (rowHeight + spacing.betweenCards) +
        scaledOverlayOffsetFromTop

    // Add extra spacing for sideboard
    // const sideboardOffset =
    //     !isMainDeck && mainDeckRowHeight !== undefined
    //         ? mainDeckRowHeight + rowHeight + spacing.sideboardSeparator
    //         : 0

    return {
        left: leftPosition,
        // top: baseTopPosition + sideboardOffset
        top: baseTopPosition
    }
}

/**
 * Prepare quantity overlay operations for Sharp
 */
export function prepareQuantityOverlayOperations(
    images: CardImageBuffer[],
    cardDimensions: Dimensions,
    quantityAssets: { [key: number]: Buffer },
    imageVariant?: ImageVariant,
    imageSize?: ImageSize
    // mainDeckRowHeight?: number
): any[] {
    return images
        .map((imageData, index) => {
            if (imageData.quantity < 2) return null // No overlay for single cards

            // const isMainDeck = imageData.groupId === 0
            const { left, top } = calculateOverlayPosition(
                index,
                cardDimensions,
                // isMainDeck,
                imageVariant,
                imageSize
                // mainDeckRowHeight
            )
            // return position rounded to avoid subpixel rendering issues
            return {
                input: quantityAssets[imageData.quantity] || quantityAssets[1],
                left: Math.floor(left),
                top: Math.floor(top)
            }
        })
        .filter((op): op is NonNullable<typeof op> => op !== null)
}

/**
 * Create the base canvas for compositing with background style support
 */
export function createCanvas(
    dimensions: Dimensions,
    backgroundStyle: BackgroundStyle = 'transparent',
    customBackground?: string
): sharp.Sharp {
    const { width, height } = dimensions
    let background: { r: number; g: number; b: number; alpha: number }

    switch (backgroundStyle) {
        case 'white':
            background = { r: 255, g: 255, b: 255, alpha: 1 }
            break
        case 'custom':
            // Parse custom background color (e.g., "#FF0000", "rgb(255,0,0)", etc.)
            if (customBackground) {
                // For now, default to white for custom - could be enhanced to parse hex/rgb
                background = { r: 255, g: 255, b: 255, alpha: 1 }
            } else {
                background = { r: 0, g: 0, b: 0, alpha: 0 }
            }
            break
        case 'transparent':
        default:
            background = { r: 0, g: 0, b: 0, alpha: 0 }
            break
    }

    return sharp({
        create: {
            width,
            height,
            channels: 4,
            background
        }
    })
}

/**
 * Create the final composite image with all cards and overlays
 * Supports different output file formats
 */
export async function createCompositeImage(
    canvas: sharp.Sharp,
    cardOperations: sharp.OverlayOptions[],
    overlayOperations: sharp.OverlayOptions[],
    fileType: 'png' | 'jpeg' | 'webp' = 'png'
): Promise<Buffer> {
    const compositeImage = canvas.composite([
        ...cardOperations,
        ...overlayOperations
    ])

    // Apply appropriate output format
    switch (fileType) {
        case 'jpeg':
            return await compositeImage.jpeg({ quality: 90 }).toBuffer()
        case 'webp':
            return await compositeImage.webp({ quality: 90 }).toBuffer()
        case 'png':
        default:
            return await compositeImage.png().toBuffer()
    }
}
