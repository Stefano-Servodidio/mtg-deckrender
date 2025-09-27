// Image processing utilities for deck PNG generation
// This file contains logic for downloading, resizing, and preparing card images

import {
    CardItem,
    SortOption,
    SortDirection,
    SORT_OPTION,
    ImageResolution,
    ImageSize,
    ImageVariant
} from '@/app/types/api'
import { CardImageBuffer, Dimensions } from '../_types'
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
): Dimensions {
    const { width: canvasWidth, height: canvasHeight } = canvasSize
    const { card, row, spacing } = DECK_LAYOUT_CONFIG
    const baseWidth = card.baseWidth
    const baseHeight = card.baseHeight
    const rowSize = imageSize ? ROW_SIZE[imageSize] : 7

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
    const maxCardWidth =
        availableWidth / ROW_SIZE[imageSize || 'ig_square'] -
        spacing.betweenCards

    // last row of each group is always fully visible, so we calculate based on that
    const maxRawHeight =
        availableHeight /
        ((totalRows - groups.size) * cardHeightMultiplier + groups.size)

    const maxCardHeight = maxRawHeight - spacing.betweenCards

    // Maintain aspect ratio based on base card dimensions
    let scale = 1 // Default scale
    if (maxCardWidth < baseWidth || maxCardHeight < baseHeight) {
        scale = Math.min(maxCardWidth / baseWidth, maxCardHeight / baseHeight)
    }
    return {
        width: baseWidth * scale,
        height: baseHeight * scale,
        original: { width: baseWidth, height: baseHeight },
        scale
    }
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
 * resize downloaded images to target dimensions
 */
export async function resizeImages(
    images: CardImageBuffer[],
    cardDimensions: Dimensions
): Promise<CardImageBuffer[]> {
    return Promise.all(
        images.map(async (img) => {
            if (!img.buffer) return img
            const resizedBuffer = await sharp(img.buffer)
                .resize({
                    width: Math.round(cardDimensions.width),
                    height: Math.round(cardDimensions.height)
                })
                .toBuffer()
            return {
                ...img,
                buffer: resizedBuffer
            }
        })
    )
}
