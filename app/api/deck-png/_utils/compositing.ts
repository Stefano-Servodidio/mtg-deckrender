// Image compositing utilities for deck PNG generation
// This file contains logic for positioning cards and quantity overlays on the canvas

import sharp from 'sharp'
import { CardImageBuffer, Dimensions } from '../_types'
import { DECK_LAYOUT_CONFIG, ROW_SIZE } from './config'
import { ImageSize, ImageVariant, BackgroundStyle } from '@/app/types/api'
import { calculateRowHeight } from './processing'
import { overlayCache } from '@/utils/cache'
import { getAssetBuffer } from '@/utils/assets'

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
): { left: number; top: number } {
    const {
        spacing: { betweenCards, canvasPadding }
    } = DECK_LAYOUT_CONFIG

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

    return {
        left: leftPosition,
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
): sharp.OverlayOptions[] {
    let separator = DECK_LAYOUT_CONFIG.spacing.groupSeparator

    if (imageVariant === 'grid') {
        separator +=
            cardDimensions.height *
            (1 - DECK_LAYOUT_CONFIG.row.heightMultiplier.grid)
    }

    let processedGroups: Set<number> = new Set()
    let cardIndex = -1
    return images
        .map((imageData) => {
            if (!processedGroups.has(imageData.groupId)) {
                // Skip to the next row when a new group is encountered
                const rowSize = imageSize ? ROW_SIZE[imageSize] : 7
                cardIndex = Math.floor(cardIndex / rowSize) * rowSize + rowSize
            } else {
                cardIndex += 1
            }

            processedGroups.add(imageData.groupId)

            const topModifier = (processedGroups.size - 1) * separator
            const { left, top } = calculateCardPosition(
                cardIndex,
                cardDimensions,
                imageVariant,
                imageSize,
                topModifier
            )
            // return position rounded to avoid subpixel rendering issues
            return {
                input: imageData.buffer!,
                left: Math.floor(left),
                top: Math.floor(top)
            }
        })
        .filter((op) => op.input !== null)
}

/**
 * Prepare quantity overlay operations for Sharp
 */
export async function prepareQuantityOverlayOperations(
    images: CardImageBuffer[],
    cardDimensions: Dimensions,
    imageVariant?: ImageVariant,
    imageSize?: ImageSize
): Promise<sharp.OverlayOptions[]> {
    const { overlay } = DECK_LAYOUT_CONFIG

    let separator = DECK_LAYOUT_CONFIG.spacing.groupSeparator

    if (imageVariant === 'grid') {
        separator +=
            cardDimensions.height *
            (1 - DECK_LAYOUT_CONFIG.row.heightMultiplier.grid)
    }

    const scaledOverlayOffsetFromRight =
        overlay.offsetFromRight * cardDimensions.scale!

    const scaledOverlayOffsetFromTop =
        overlay.offsetFromTop * cardDimensions.scale!

    const leftModifier = cardDimensions.width - scaledOverlayOffsetFromRight

    let processedGroups: Set<number> = new Set()
    let cardIndex = -1

    const overlayOperations = await Promise.all(
        images.map(async (imageData) => {
            // Reset card index when a new group is encountered
            if (!processedGroups.has(imageData.groupId)) {
                const rowSize = imageSize ? ROW_SIZE[imageSize] : 7
                cardIndex = Math.floor(cardIndex / rowSize) * rowSize + rowSize
            } else {
                cardIndex += 1
            }

            processedGroups.add(imageData.groupId)

            if (imageData.quantity < 2) return null // No overlay for single cards

            const topModifier =
                (processedGroups.size - 1) * separator +
                scaledOverlayOffsetFromTop
            const { left, top } = calculateCardPosition(
                cardIndex,
                cardDimensions,
                imageVariant,
                imageSize,
                topModifier,
                leftModifier
            )

            // In your prepareQuantityOverlayOperations function:
            const cacheKey = `x${imageData.quantity}_${Math.floor(125 * cardDimensions.scale!)}`

            if (overlayCache.has(cacheKey)) {
                const cachedBuffer = overlayCache.get(cacheKey)!
                return {
                    input: cachedBuffer,
                    left: Math.floor(left),
                    top: Math.floor(top)
                }
            } else {
                const buffer = await getAssetBuffer(
                    `assets/overlays/x${imageData.quantity}.png`,
                    'assets/overlayError.png'
                )
                const resizedBuffer = await sharp(buffer)
                    .resize(Math.floor(125 * cardDimensions.scale!), null)
                    .toBuffer()

                // Cache the resized overlay
                overlayCache.set(cacheKey, resizedBuffer)

                return {
                    input: resizedBuffer,
                    left: Math.floor(left),
                    top: Math.floor(top)
                }
            }
        })
    )

    return overlayOperations.filter(
        (op): op is NonNullable<typeof op> => op !== null
    )
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
