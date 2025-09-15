// Configuration file for deck PNG generation dimensions and settings
// This centralizes all layout calculations and makes them human-readable

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
    }
} as const

// Calculated values based on configuration
export function calculateCanvasDimensions(
    cardsPerRow: number,
    totalRows: number,
    hasSideboard: boolean
): { width: number; height: number } {
    const {
        card,
        spacing: { betweenCards, sideboardSeparator, canvasPadding },
        row
    } = DECK_LAYOUT_CONFIG

    const canvasWidth =
        card.width * cardsPerRow +
        betweenCards * (cardsPerRow - 1) +
        canvasPadding * 2

    const rowHeight = card.height * row.heightMultiplier

    const canvasHeight =
        rowHeight * totalRows +
        betweenCards * (totalRows - 1) +
        canvasPadding * 2 +
        (hasSideboard ? sideboardSeparator + 2 * rowHeight : 0)

    return { width: canvasWidth, height: canvasHeight }
}

export function calculateRowHeight(): number {
    return (
        DECK_LAYOUT_CONFIG.card.height * DECK_LAYOUT_CONFIG.row.heightMultiplier
    )
}
