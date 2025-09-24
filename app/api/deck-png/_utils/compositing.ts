// Image compositing utilities for deck PNG generation
// This file contains logic for positioning cards and quantity overlays on the canvas

import path from 'path'
import fs from 'fs/promises'
import sharp from 'sharp'
import { CardImageBuffer, Dimensions } from '../_types'
import { DECK_LAYOUT_CONFIG, ROW_SIZE } from './config'
import { ImageSize, ImageVariant, BackgroundStyle } from '@/app/types/api'
import { calculateRowHeight } from './processing'

/**
 * Load an asset file as a buffer
 */
export async function getAssetBuffer(filename: string): Promise<Buffer> {
    const assetPath = path.join(process.cwd(), 'assets', filename)
    return await fs.readFile(assetPath)
}

/**
 * Calculate position for a card in the grid based on layout settings
 */
function calculateCardPosition(
    index: number,
    cardDimensions: Dimensions,
    imageVariant?: ImageVariant,
    imageSize?: ImageSize,
    topModifier?: number,
    leftModifier?: number
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

    const yMod = topModifier ? topModifier : 0
    const xMod = leftModifier ? leftModifier : 0

    const leftPosition =
        canvasPadding + col * (cardDimensions.width + betweenCards) + xMod
    const baseTopPosition =
        canvasPadding + row * (rowHeight + betweenCards) + yMod

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

const svgCount = (count: number, scale: number) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="${125 * scale}" height="${125 * scale}" viewBox="0 0 ${125 * scale} ${125 * scale}" role="img" aria-label="x${count} box"><defs><style>@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700");</style></defs><rect x="0" y="0" width="${125 * scale}" height="${125 * scale}" rx="4" ry="4" fill="#000000"/><text x="50%" y="50%" fill="#FFFFFF" font-size="${60 * scale}" font-family="Inter, system-ui, sans-serif" font-weight="bold" text-anchor="middle" dominant-baseline="middle">x${count}</text></svg>`

/**
 * Prepare quantity overlay operations for Sharp
 */
export function prepareQuantityOverlayOperations(
    images: CardImageBuffer[],
    cardDimensions: Dimensions,
    imageVariant?: ImageVariant,
    imageSize?: ImageSize
    // mainDeckRowHeight?: number
): any[] {
    const { overlay } = DECK_LAYOUT_CONFIG
    const scaledOverlayOffsetFromRight =
        overlay.offsetFromRight * cardDimensions.scale!

    const scaledOverlayOffsetFromTop =
        overlay.offsetFromTop * cardDimensions.scale!

    const leftModifier = cardDimensions.width - scaledOverlayOffsetFromRight

    const topModifier = scaledOverlayOffsetFromTop

    return images
        .map((imageData, index) => {
            if (imageData.quantity < 2) return null // No overlay for single cards
            const { left, top } = calculateCardPosition(
                index,
                cardDimensions,
                // isMainDeck,
                imageVariant,
                imageSize,
                topModifier,
                leftModifier
                // mainDeckRowHeight
            )
            // return position rounded to avoid subpixel rendering issues
            let svgOverlay = svgCount(imageData.quantity, cardDimensions.scale!)
            return {
                input: Buffer.from(svgOverlay),
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
