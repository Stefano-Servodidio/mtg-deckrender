// Configuration file for deck PNG generation dimensions and settings
// This centralizes all layout calculations and makes them human-readable

import { ImageSize, ImageOrientation, ImageVariant, BackgroundStyle } from '../_types'

// Image size configurations
export const IMAGE_SIZE_CONFIG = {
    small: {
        crossAxis: 1080, // Cross-axis size in pixels
        cardScale: 0.6   // Scale factor for card images
    },
    medium: {
        crossAxis: 1440, // Cross-axis size in pixels
        cardScale: 0.8   // Scale factor for card images
    },
    large: {
        crossAxis: 1920, // Cross-axis size in pixels
        cardScale: 1.0   // Scale factor for card images
    }
} as const

export const DECK_LAYOUT_CONFIG = {
    // Base card dimensions (from Scryfall small images)
    card: {
        baseWidth: 146, // Small image width from Scryfall
        baseHeight: 204 // Small image height from Scryfall
    },

    // Layout spacing
    spacing: {
        betweenCards: 4, // Space between individual cards
        sideboardSeparator: 70, // Extra space before sideboard section
        canvasPadding: 4 // Padding around the entire canvas (using spacing value)
    },

    // Row configuration
    row: {
        defaultCardsPerRow: 7, // Default number of cards per row
        gridHeightMultiplier: 0.5, // For grid variant: row height = cardHeight * this (50% overlap)
        spoilerHeightMultiplier: 1.0 // For visual spoiler: no overlap
    },

    // Quantity overlay settings
    overlay: {
        offsetFromRight: 50, // Distance from right edge of card
        offsetFromTop: 28 // Distance from top edge of card
    }
} as const

/**
 * Calculate card dimensions based on image size and orientation settings
 */
export function calculateCardDimensions(
    imageSize: ImageSize,
    imageOrientation: ImageOrientation
): { width: number; height: number } {
    const { card } = DECK_LAYOUT_CONFIG
    const sizeConfig = IMAGE_SIZE_CONFIG[imageSize]
    
    // Calculate scaled card dimensions
    const scaledWidth = card.baseWidth * sizeConfig.cardScale
    const scaledHeight = card.baseHeight * sizeConfig.cardScale
    
    if (imageOrientation === 'horizontal') {
        // For horizontal orientation, we want the height to fit within cross-axis
        const scale = sizeConfig.crossAxis / scaledHeight
        return {
            width: scaledWidth * scale,
            height: scaledHeight * scale
        }
    } else {
        // For vertical orientation, we want the width to fit within cross-axis
        const scale = sizeConfig.crossAxis / scaledWidth
        return {
            width: scaledWidth * scale,
            height: scaledHeight * scale
        }
    }
}

/**
 * Calculate canvas dimensions based on layout parameters
 */
export function calculateCanvasDimensions(
    cardsPerRow: number,
    totalRows: number,
    hasSideboard: boolean,
    imageSize: ImageSize,
    imageOrientation: ImageOrientation,
    imageVariant: ImageVariant
): { width: number; height: number } {
    const {
        spacing: { betweenCards, sideboardSeparator, canvasPadding }
    } = DECK_LAYOUT_CONFIG

    const cardDimensions = calculateCardDimensions(imageSize, imageOrientation)
    const rowHeight = calculateRowHeight(imageVariant, cardDimensions.height)

    let canvasWidth: number
    let canvasHeight: number

    if (imageOrientation === 'horizontal') {
        // Horizontal orientation: cards arranged horizontally, main axis is width
        canvasWidth =
            cardDimensions.width * cardsPerRow +
            betweenCards * (cardsPerRow - 1) +
            canvasPadding * 2

        canvasHeight =
            rowHeight * totalRows +
            betweenCards * (totalRows - 1) +
            canvasPadding * 2 +
            (hasSideboard ? sideboardSeparator + 2 * rowHeight : 0)
    } else {
        // Vertical orientation: cards arranged vertically, main axis is height
        canvasWidth =
            cardDimensions.width * cardsPerRow +
            betweenCards * (cardsPerRow - 1) +
            canvasPadding * 2

        canvasHeight =
            rowHeight * totalRows +
            betweenCards * (totalRows - 1) +
            canvasPadding * 2 +
            (hasSideboard ? sideboardSeparator + 2 * rowHeight : 0)
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
