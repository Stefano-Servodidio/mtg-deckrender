// Image compositing utilities for deck PNG generation
// This file contains logic for positioning cards and quantity overlays on the canvas

import sharp from 'sharp'
import { DECK_LAYOUT_CONFIG } from './config'
import {
    ImageSize,
    ImageVariant,
    BackgroundStyle,
    CardImageBuffer,
    Dimensions,
    Modifiers
} from '@/types/api'
import { calculateRowHeight, getRowSize } from './processing'
import { overlayCache } from '@/utils/cache'
import chalk from 'chalk'
import { getOverlayFromBlobs } from './storage/overlayImageStorage'

/**
 * Calculate position for a card in the grid based on layout settings
 */
function calculateCardPosition(
    index: number,
    cardDimensions: Dimensions,
    imageVariant?: ImageVariant,
    imageSize?: ImageSize,
    modifiers?: Modifiers
): { left: number; top: number } {
    const {
        spacing: { betweenCards, canvasPadding }
    } = DECK_LAYOUT_CONFIG

    const { topModifier, leftModifier } = modifiers || {}
    const cardsPerRow = getRowSize(imageSize, imageVariant)

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
    imageSize?: ImageSize,
    modifiers?: Modifiers
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
                const rowSize = getRowSize(imageSize, imageVariant)
                cardIndex = Math.floor(cardIndex / rowSize) * rowSize + rowSize
            } else {
                cardIndex += 1
            }

            processedGroups.add(imageData.groupId)

            const topModifier = (processedGroups.size - 1) * separator
            const mods = sumModifiers(modifiers || {}, topModifier)
            const { left, top } = calculateCardPosition(
                cardIndex,
                cardDimensions,
                imageVariant,
                imageSize,
                mods
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
    imageSize?: ImageSize,
    modifiers?: Modifiers
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
                const rowSize = getRowSize(imageSize, imageVariant)
                cardIndex = Math.floor(cardIndex / rowSize) * rowSize + rowSize
            } else {
                cardIndex += 1
            }

            processedGroups.add(imageData.groupId)

            if (imageData.quantity < 2) return null // No overlay for single cards

            const topModifier =
                (processedGroups.size - 1) * separator +
                scaledOverlayOffsetFromTop
            const mods = sumModifiers(
                modifiers || {},
                topModifier,
                leftModifier
            )
            const { left, top } = calculateCardPosition(
                cardIndex,
                cardDimensions,
                imageVariant,
                imageSize,
                mods
            )
            const scaledOverlaySize = Math.floor(
                overlay.size * cardDimensions.scale!
            )

            // In your prepareQuantityOverlayOperations function:
            const cacheKey = `x${imageData.quantity}_${scaledOverlaySize}`

            if (overlayCache.has(cacheKey)) {
                const cachedBuffer = overlayCache.get(cacheKey)!
                console.log(
                    chalk.blueBright(
                        `Memory Cache hit for overlay: x${imageData.quantity}, scale: ${cardDimensions.scale}`
                    )
                )
                return {
                    input: cachedBuffer,
                    left: Math.floor(left),
                    top: Math.floor(top)
                }
            } else {
                const buffer = await getOverlayFromBlobs(
                    `x${imageData.quantity}`
                )
                if (!buffer) {
                    console.warn(
                        chalk.red(`Overlay not found: x${imageData.quantity}`)
                    )
                    return null
                }
                console.log(
                    chalk.grey(
                        `Getting overlay from blob: x${imageData.quantity}, size: ${scaledOverlaySize}`
                    )
                )
                const resizedBuffer = await sharp(buffer)
                    .resize(scaledOverlaySize, null)
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
 * Note: For custom images, we create a transparent canvas here and the image
 * will be processed separately in createCompositeImage
 */
export function createCanvas(
    dimensions: Dimensions,
    backgroundStyle: BackgroundStyle = 'transparent',
    customBackgroundColor?: string
): sharp.Sharp {
    const { width, height } = dimensions
    let background: { r: number; g: number; b: number; alpha: number }

    switch (backgroundStyle) {
        case 'custom_color':
            // Parse hex color (e.g., "#FF0000")
            if (customBackgroundColor) {
                background = parseHexColor(customBackgroundColor)
            } else {
                background = { r: 255, g: 255, b: 255, alpha: 1 }
            }
            break
        case 'custom_image':
        case 'transparent':
        default:
            // For custom image and transparent, start with transparent canvas
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
 * Parse hex color string to RGB object
 */
function parseHexColor(hex: string): {
    r: number
    g: number
    b: number
    alpha: number
} {
    // Remove # if present
    const cleanHex = hex.replace('#', '')

    // Parse hex values
    const r = parseInt(cleanHex.substring(0, 2), 16)
    const g = parseInt(cleanHex.substring(2, 4), 16)
    const b = parseInt(cleanHex.substring(4, 6), 16)

    return { r, g, b, alpha: 1 }
}

/**
 * Create the final composite image with all cards and overlays
 * Supports different output file formats and custom background images
 */
export async function createCompositeImage(
    canvas: sharp.Sharp,
    cardOperations: sharp.OverlayOptions[],
    overlayOperations: sharp.OverlayOptions[],
    fileType: 'png' | 'jpeg' | 'webp' = 'png',
    customBackgroundImage?: string,
    dimensions?: Dimensions
): Promise<Buffer> {
    let baseCanvas: sharp.Sharp

    // If custom background image is provided, use it as the base canvas
    if (customBackgroundImage && dimensions) {
        console.log(
            chalk.yellow('Custom background image detected, processing...')
        )
        const backgroundCanvas = await createBackgroundImageCanvas(
            customBackgroundImage,
            dimensions
        )
        if (backgroundCanvas) {
            console.log(
                chalk.green('Using custom background image as base canvas')
            )
            baseCanvas = backgroundCanvas
        } else {
            console.log(
                chalk.red(
                    'Failed to create background image canvas, using flat canvas'
                )
            )
            baseCanvas = canvas
        }
    } else {
        if (!customBackgroundImage) {
            console.log(chalk.gray('No custom background image provided'))
        }
        if (!dimensions) {
            console.log(chalk.gray('No dimensions provided'))
        }
        baseCanvas = canvas
    }

    // Composite all cards and overlays on top of the base canvas
    const operations = [...cardOperations, ...overlayOperations]
    const compositeImage = baseCanvas.composite(operations)

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

/**
 * Create a Sharp canvas from a custom background image
 * This replaces the flat-color background with the uploaded image
 */
async function createBackgroundImageCanvas(
    base64Image: string,
    dimensions: Dimensions
): Promise<sharp.Sharp | null> {
    try {
        console.log(
            chalk.yellow(
                'Creating background image canvas, dimensions:',
                dimensions.width,
                'x',
                dimensions.height
            )
        )

        // Extract the base64 data (remove data:image/...;base64, prefix)
        const base64Data = base64Image.includes(',')
            ? base64Image.split(',')[1]
            : base64Image

        const imageBuffer = Buffer.from(base64Data, 'base64')
        console.log(
            chalk.yellow('Decoded image buffer size:', imageBuffer.length)
        )

        // Create Sharp instance from the background image and resize to canvas dimensions
        // Using 'cover' fit to fill the entire canvas while maintaining aspect ratio
        const backgroundCanvas = sharp(imageBuffer).resize(
            dimensions.width,
            dimensions.height,
            {
                fit: 'cover',
                position: 'center'
            }
        )

        console.log(chalk.green('Background image canvas created successfully'))

        return backgroundCanvas
    } catch (error) {
        console.error(
            chalk.red('Error creating background image canvas:'),
            error
        )
        return null
    }
}

/** function to sum modifiers
 * Sums the top and left modifiers with the provided values.
 */
export function sumModifiers(
    modifiers: Modifiers,
    top?: number,
    left?: number
): Modifiers {
    const { topModifier, leftModifier } = modifiers || {}
    const sumTop = (topModifier || 0) + (top || 0)
    const sumLeft = (leftModifier || 0) + (left || 0)
    return {
        topModifier: sumTop,
        leftModifier: sumLeft
    }
}
