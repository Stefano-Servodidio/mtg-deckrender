// Configuration file for deck PNG generation dimensions and settings
// This centralizes all layout calculations and makes them human-readable

import { ImageSize } from '../_types'

export const DECK_LAYOUT_CONFIG = {
    // Card dimensions (from Scryfall small images)
    card: {
        width: 146, // Small image width from Scryfall
        height: 204 // Small image height from Scryfall
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
        heightMultiplier: 0.5 // Adjust row height to change visualization style (rowHeight = cardHeight * this)
    },

    // Quantity overlay settings
    overlay: {
        offsetFromRight: 50, // Distance from right edge of card
        offsetFromTop: 28 // Distance from top edge of card
    },

    // Fixed output image sizes
    outputSizes: {
        small: 1080,  // Small output width in pixels
        medium: 1440  // Medium output width in pixels
    }
} as const

// Calculate card and spacing dimensions based on target output width
function calculateDimensionsForSize(targetWidth: number, cardsPerRow: number): {
    cardWidth: number;
    cardHeight: number;
    spacing: number;
    canvasPadding: number;
} {
    const baseCardRatio = DECK_LAYOUT_CONFIG.card.height / DECK_LAYOUT_CONFIG.card.width
    const baseSpacing = DECK_LAYOUT_CONFIG.spacing.betweenCards
    const basePadding = DECK_LAYOUT_CONFIG.spacing.canvasPadding
    
    // Calculate the available width for cards and spacing
    const availableWidth = targetWidth - (basePadding * 2)
    const totalSpacing = baseSpacing * (cardsPerRow - 1)
    const totalCardWidth = availableWidth - totalSpacing
    const cardWidth = totalCardWidth / cardsPerRow
    const cardHeight = cardWidth * baseCardRatio
    
    return {
        cardWidth,
        cardHeight,
        spacing: baseSpacing,
        canvasPadding: basePadding
    }
}

// Calculated values based on configuration
export function calculateCanvasDimensions(
    cardsPerRow: number,
    totalRows: number,
    hasSideboard: boolean,
    imageSize: ImageSize = 'medium'
): { width: number; height: number; cardDimensions: ReturnType<typeof calculateDimensionsForSize> } {
    const targetWidth = DECK_LAYOUT_CONFIG.outputSizes[imageSize]
    const cardDimensions = calculateDimensionsForSize(targetWidth, cardsPerRow)
    
    const {
        spacing: { sideboardSeparator },
        row
    } = DECK_LAYOUT_CONFIG

    const canvasWidth = targetWidth

    const rowHeight = cardDimensions.cardHeight * row.heightMultiplier

    const canvasHeight =
        rowHeight * totalRows +
        cardDimensions.spacing * (totalRows - 1) +
        cardDimensions.canvasPadding * 2 +
        (hasSideboard ? sideboardSeparator + 2 * rowHeight : 0)

    return { 
        width: canvasWidth, 
        height: canvasHeight,
        cardDimensions
    }
}

export function calculateRowHeight(imageSize: ImageSize = 'medium', cardsPerRow: number = 7): number {
    const targetWidth = DECK_LAYOUT_CONFIG.outputSizes[imageSize]
    const cardDimensions = calculateDimensionsForSize(targetWidth, cardsPerRow)
    return cardDimensions.cardHeight * DECK_LAYOUT_CONFIG.row.heightMultiplier
}
