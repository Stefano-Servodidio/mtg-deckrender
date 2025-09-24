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

/**
 * Calculate card dimensions based on image size and orientation settings
 */
export function calculateCardDimensions(
    validImagesCount: number,
    canvasSize: Dimensions,
    imageSize?: ImageSize,
    imageVariant?: ImageVariant
): Dimensions {
    const { width: canvasWidth, height: canvasHeight } = canvasSize

    const baseWidth = DECK_LAYOUT_CONFIG.card.baseWidth
    const baseHeight = DECK_LAYOUT_CONFIG.card.baseHeight

    const availableWidth =
        canvasWidth - 2 * DECK_LAYOUT_CONFIG.spacing.canvasPadding
    const availableHeight =
        canvasHeight - 2 * DECK_LAYOUT_CONFIG.spacing.canvasPadding

    const totalRows = Math.ceil(
        validImagesCount / ROW_SIZE[imageSize || 'ig_square']
    )

    const cardHeightMultiplier =
        DECK_LAYOUT_CONFIG.row.heightMultiplier[imageVariant || 'default']

    // Calculate max card dimensions to fit in the canvas
    const maxCardWidth =
        availableWidth / ROW_SIZE[imageSize || 'ig_square'] -
        DECK_LAYOUT_CONFIG.spacing.betweenCards

    // last row is always fully visible, so we calculate based on that
    const maxRawHeight =
        availableHeight / ((totalRows - 1) * cardHeightMultiplier + 1)

    const maxCardHeight = maxRawHeight - DECK_LAYOUT_CONFIG.spacing.betweenCards

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
        const key = sortBy && SORT_OPTION.includes(sortBy) ? sortBy : 'name'
        const direction = sortDirection === 'desc' ? -1 : 1
        if (sortBy === 'rarity') {
            const rarityOrder = ['common', 'uncommon', 'rare', 'mythic']
            return (
                (rarityOrder.indexOf(a.rarity) -
                    rarityOrder.indexOf(b.rarity)) *
                direction
            )
        } else if (sortBy === 'colors') {
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
 * Calculate layout metrics for the image grid
 */
export function calculateLayoutMetrics(
    successfulImages: CardImageBuffer[],
    cardsPerRow: number
): {
    mainImages: CardImageBuffer[]
    sideboardImages: CardImageBuffer[]
    totalMainRows: number
    totalSideboardRows: number
    hasSideboard: boolean
} {
    const mainImages = successfulImages.filter((img) => img.groupId === 0)
    const sideboardImages = successfulImages.filter((img) => img.groupId !== 0)

    const hasSideboard = sideboardImages.length > 0
    const totalMainRows = Math.ceil(mainImages.length / cardsPerRow)
    const totalSideboardRows = hasSideboard
        ? Math.ceil(sideboardImages.length / cardsPerRow)
        : 0

    return {
        mainImages,
        sideboardImages,
        totalMainRows,
        totalSideboardRows,
        hasSideboard
    }
}
