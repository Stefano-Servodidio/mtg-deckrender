// Configuration file for deck PNG generation dimensions and settings
// This centralizes all layout calculations and makes them human-readable

import {
    CardItem,
    ImageResolution,
    ImageSize,
    ImageVariant
} from '@/app/types/api'
import { Dimensions } from '../_types'

export const DECK_LAYOUT_CONFIG = {
    // Base card dimensions (from Scryfall small images)
    card: {
        baseWidth: 745, // PNG image width from Scryfall
        baseHeight: 1040 // PNG image height from Scryfall
    },

    // Layout spacing
    spacing: {
        betweenCards: 0, // Space between individual cards
        sideboardSeparator: 70, // Extra space before sideboard section
        canvasPadding: 4 // Padding around the entire canvas (using spacing value)
    },

    // Row configuration
    row: {
        heightMultiplier: {
            default: 1.0,
            grid: 0.4, // For grid variant: row height = cardHeight * this (50% overlap)
            spoiler: 1.0, // For visual spoiler: no overlap
            stacks: 1.0 // For stacks: no overlap
        }
    },

    // Quantity overlay settings
    overlay: {
        offsetFromRight: 50, // Distance from right edge of card
        offsetFromTop: 28 // Distance from top edge of card
    }
} as const

export const CANVAS_SIZE: Record<ImageSize, Dimensions> = {
    ig_square: { width: 1080, height: 1080 },
    ig_story: { width: 1080, height: 1920 },
    ig_portrait: { width: 1080, height: 1350 },
    ig_landscape: { width: 1080, height: 566 },
    facebook_post: { width: 1200, height: 630 },
    facebook_cover: { width: 820, height: 312 },
    twitter_post: { width: 1200, height: 675 },
    twitter_header: { width: 1500, height: 500 },
    tiktok_post: { width: 1080, height: 1920 }
} as const

const ROW_SIZE: Record<ImageSize, number> = {
    ig_square: 7,
    ig_story: 6,
    ig_portrait: 7,
    ig_landscape: 12,
    facebook_post: 7,
    facebook_cover: 7,
    twitter_post: 7,
    twitter_header: 12,
    tiktok_post: 6
}

/**
 * Calculate card dimensions based on image size and orientation settings
 */
export function calculateCardDimensions(
    validImages: CardItem[],
    canvasSize: Dimensions,
    imageSize: ImageSize,
    imageVariant: ImageVariant
): Dimensions {
    const { width: canvasWidth, height: canvasHeight } = canvasSize

    const baseWidth = DECK_LAYOUT_CONFIG.card.baseWidth
    const baseHeight = DECK_LAYOUT_CONFIG.card.baseHeight

    const availableWidth =
        canvasWidth - 2 * DECK_LAYOUT_CONFIG.spacing.canvasPadding
    const availableHeight =
        canvasHeight - 2 * DECK_LAYOUT_CONFIG.spacing.canvasPadding

    const totalRows = Math.min(
        ROW_SIZE[imageSize || 'ig_square'],
        validImages.length
    )
    const cardHeightMultiplier =
        DECK_LAYOUT_CONFIG.row.heightMultiplier[imageVariant || 'default']

    // Calculate max card dimensions to fit in the canvas
    const maxCardWidth =
        availableWidth / ROW_SIZE[imageSize || 'ig_square'] -
        DECK_LAYOUT_CONFIG.spacing.betweenCards

    const maxRawHeight = availableHeight / totalRows

    const maxCardHeight =
        maxRawHeight * cardHeightMultiplier -
        DECK_LAYOUT_CONFIG.spacing.betweenCards

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
    imageSize: ImageSize,
    imageResolution: ImageResolution
): Dimensions {
    if (!CANVAS_SIZE[imageSize]) {
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
    imageVariant: ImageVariant,
    cardHeight: number
): number {
    const { row } = DECK_LAYOUT_CONFIG

    switch (imageVariant) {
        case 'grid':
            // Grid layout with 50% overlap
            return cardHeight * row.gridHeightMultiplier
        case 'spoiler':
            // Visual spoiler with no overlap
            return cardHeight * row.spoilerHeightMultiplier
        case 'stacks':
            // Stacks layout (similar to grid for now)
            return cardHeight * row.gridHeightMultiplier
        default:
            return cardHeight * row.gridHeightMultiplier
    }
}
