// Image processing utilities for deck PNG generation
// This file contains logic for downloading, resizing, and preparing card images

import {
    CardItem,
    SortOption,
    SortDirection,
    SORT_OPTION,
    ImageResolution,
    ImageSize,
    ImageVariant,
    CardImageBuffer,
    Dimensions,
    Modifiers
} from '@/types/api'
import { DECK_LAYOUT_CONFIG, ROW_SIZE, CANVAS_SIZE } from './config'
import sharp from 'sharp'

/**
 * Calculate card dimensions based on image size and orientation settings
 */
export function calculateCardDimensions(
    images: CardImageBuffer[],
    canvasSize: Dimensions,
    imageSize?: ImageSize,
    imageVariant?: ImageVariant
): [Dimensions, Modifiers] {
    const { width: canvasWidth, height: canvasHeight } = canvasSize
    const { card, row, spacing } = DECK_LAYOUT_CONFIG
    const baseWidth = card.baseWidth
    const baseHeight = card.baseHeight
    const rowSize = getRowSize(imageSize, imageVariant)

    let groups = new Map<number, CardImageBuffer[]>()

    images.forEach((card) => {
        if (!groups.has(card.groupId)) {
            groups.set(card.groupId, [])
        }
        groups.get(card.groupId)?.push(card)
    })

    // Calculate available space on canvas
    // Subtract padding and space for group separators
    const availableWidth = canvasWidth - 2 * spacing.canvasPadding

    const availableHeight =
        canvasHeight -
        2 * spacing.canvasPadding -
        spacing.groupSeparator * (groups.size - 1)

    const totalRows = Array.from(groups.values()).reduce((sum, group) => {
        return sum + Math.ceil(group.length / rowSize)
    }, 0)

    const cardHeightMultiplier = row.heightMultiplier[imageVariant || 'default']

    // Calculate max card dimensions to fit in the canvas
    const maxCardWidth = availableWidth / rowSize - spacing.betweenCards

    // last row of each group is always fully visible, so we calculate based on that
    const adjustedRows =
        (totalRows - groups.size) * cardHeightMultiplier + groups.size

    const maxRawHeight = availableHeight / adjustedRows

    const maxCardHeight = maxRawHeight - spacing.betweenCards

    // Maintain aspect ratio based on base card dimensions
    let scale = 1 // Default scale
    let width = baseWidth
    let height = baseHeight
    let modifiers = {
        topModifier: 0,
        leftModifier: 0
    }
    if (maxCardWidth < baseWidth || maxCardHeight < baseHeight) {
        const widthScale = maxCardWidth / baseWidth
        const heightScale = maxCardHeight / baseHeight
        scale = Math.min(widthScale, heightScale)
        width = baseWidth * scale
        height = baseHeight * scale

        if (widthScale < heightScale) {
            // Center vertically
            const adjustedHeight = height + spacing.betweenCards
            const totalHeight =
                adjustedHeight * adjustedRows - spacing.betweenCards
            modifiers.topModifier = (availableHeight - totalHeight) / 2
        } else if (heightScale < widthScale) {
            // Center horizontally
            const adjustedWidth = width + spacing.betweenCards
            const totalWidth = adjustedWidth * rowSize - spacing.betweenCards
            modifiers.leftModifier = (availableWidth - totalWidth) / 2
        }
    }

    return [
        {
            width,
            height,
            original: { width: baseWidth, height: baseHeight },
            scale
        },
        modifiers
    ]
}

/**
 * Calculate canvas dimensions based on layout parameters
 */
export function calculateCanvasDimensions(
    imageSize?: ImageSize,
    imageResolution?: ImageResolution
): Dimensions {
    if (!imageSize || !CANVAS_SIZE[imageSize]) {
        throw new Error(`Invalid image size: ${imageSize}`)
    }
    const baseDimensions = CANVAS_SIZE[imageSize]

    //default to IG Square if something goes wrong
    let canvasWidth = baseDimensions?.width || 1080
    let canvasHeight = baseDimensions?.height || 1080

    if (imageResolution === 'high') {
        canvasWidth = canvasWidth * 1.5
        canvasHeight = canvasHeight * 1.5
    }

    return { width: canvasWidth, height: canvasHeight }
}

/**
 * Calculate row height based on variant and card height
 */
export function calculateRowHeight(
    imageVariant?: ImageVariant,
    cardHeight?: number
): number {
    const { row } = DECK_LAYOUT_CONFIG
    if (!cardHeight) return 0
    let rowHeight = 0
    if (imageVariant === 'grid') {
        rowHeight = cardHeight * row.heightMultiplier.grid
    } else if (imageVariant === 'spoiler') {
        rowHeight = cardHeight * row.heightMultiplier.spoiler
    } else if (imageVariant === 'stacks') {
        rowHeight = cardHeight * row.heightMultiplier.stacks
    } else {
        rowHeight = cardHeight * row.heightMultiplier.default
    }
    return rowHeight
}

/**
 * Sort cards for image processing
 * Removes invalid cards and sorts by CMC then by name
 */
export function sortCards(
    cards: CardItem[],
    sortBy?: SortOption,
    sortDirection?: SortDirection
): CardItem[] {
    return cards.sort((a, b) => {
        // Keep groups together
        if (a.groupId !== b.groupId) {
            return 0
        }
        const key = sortBy && SORT_OPTION.includes(sortBy) ? sortBy : 'name'
        const direction = sortDirection === 'desc' ? -1 : 1
        if (key === 'rarity') {
            const rarityOrder = ['common', 'uncommon', 'rare', 'mythic']
            return (
                (rarityOrder.indexOf(a.rarity) -
                    rarityOrder.indexOf(b.rarity)) *
                direction
            )
        } else if (key === 'colors') {
            const colorOrder = ['W', 'U', 'B', 'R', 'G', 'multi', 'colorless']
            const aColor = a.colors?.length
                ? a.colors.length > 1
                    ? 'multi'
                    : a.colors[0]
                : 'colorless'
            const bColor = b.colors?.length
                ? b.colors.length > 1
                    ? 'multi'
                    : b.colors[0]
                : 'colorless'
            return (
                (colorOrder.indexOf(aColor) - colorOrder.indexOf(bColor)) *
                direction
            )
        } else {
            const sortKeyA = a[key]
            const sortKeyB = b[key]
            if (sortKeyA < sortKeyB) return -1 * direction
            if (sortKeyA > sortKeyB) return 1 * direction
            return 0
        }
    })
}

/**
 * resize downloaded images to target dimensions and apply rounded corners
 */
export async function resizeImages(
    images: CardImageBuffer[],
    cardDimensions: Dimensions
): Promise<CardImageBuffer[]> {
    const { card } = DECK_LAYOUT_CONFIG
    const targetWidth = Math.round(cardDimensions.width)
    const targetHeight = Math.round(cardDimensions.height)

    // Scale corner radius proportionally with card dimensions
    const scaledCornerRadius = cardDimensions.scale
        ? Math.round(card.cornerRadius * cardDimensions.scale)
        : card.cornerRadius

    return Promise.all(
        images.map(async (img) => {
            if (!img.buffer) return img

            // Create an SVG rounded rectangle mask
            const roundedCornerSvg = `
                <svg width="${targetWidth}" height="${targetHeight}">
                    <rect
                        x="0"
                        y="0"
                        width="${targetWidth}"
                        height="${targetHeight}"
                        rx="${scaledCornerRadius}"
                        ry="${scaledCornerRadius}"
                        fill="white"
                    />
                </svg>
            `

            // Apply rounded corners by compositing with mask
            // The 'dest-in' blend mode keeps only the parts of the card that overlap with the mask
            const resizedBuffer = await sharp(img.buffer)
                .resize({
                    width: targetWidth,
                    height: targetHeight
                })
                .ensureAlpha() // Ensure alpha channel for proper compositing
                .composite([
                    {
                        input: Buffer.from(roundedCornerSvg),
                        blend: 'dest-in'
                    }
                ])
                .png()
                .toBuffer()

            return {
                ...img,
                buffer: resizedBuffer
            }
        })
    )
}

export function getRowSize(
    imageSize?: ImageSize,
    imageVariant?: ImageVariant
): number {
    let size =
        imageSize && ROW_SIZE[imageSize]
            ? ROW_SIZE[imageSize]
            : ROW_SIZE['ig_square']
    // Extend row size for spoiler variant to accommodate full card visibility
    if (imageVariant === 'spoiler') {
        size += 1
    }
    return size
}
