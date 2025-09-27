import path from 'path'
import fs from 'fs/promises'
import { CardImageBuffer } from '../app/api/deck-png/_types'

// Re-export functions from new utility files for backward compatibility
export { getUniqueCards, sleep } from '../app/api/cards/_utils/decklist'
export { getAssetBuffer } from '../app/api/deck-png/_utils/compositing'

// Legacy function - use prepareCardOperations from deck-png compositing utils instead
export const prepareCardOperations = (
    images: CardImageBuffer[],
    cardsPerRow: number,
    cardWidth: number,
    rowHeight: number,
    spacing: number,
    sideboardSpacing: number,
    mainHeight: number = 0
) => {
    return images.map((imageData, index) => {
        const row = Math.floor(index / cardsPerRow)
        const col = index % cardsPerRow

        const left = spacing + col * (cardWidth + spacing)
        const top =
            spacing +
            row * (rowHeight + spacing) +
            (imageData.type === 'sideboard'
                ? mainHeight + rowHeight + sideboardSpacing
                : 0)

        return {
            input: imageData.buffer,
            left,
            top
        }
    })
}

// Legacy function - use prepareQuantityOverlayOperations from deck-png compositing utils instead
export const prepareCountOperations = (
    images: CardImageBuffer[],
    cardsPerRow: number,
    cardWidth: number,
    rowHeight: number,
    spacing: number,
    sideboardSpacing: number,
    countIconBuffers: { [key: number]: Buffer },
    mainHeight: number = 0
) => {
    return images
        .map((imageData, index) => {
            if (imageData.quantity < 2) return null // No overlay for single cards

            const row = Math.floor(index / cardsPerRow)
            const col = index % cardsPerRow

            const left = spacing + col * (cardWidth + spacing) + cardWidth - 50
            const top =
                spacing +
                row * (rowHeight + spacing) +
                28 +
                (imageData.type === 'sideboard'
                    ? mainHeight + rowHeight + sideboardSpacing
                    : 0)

            let countImage = null
            return {
                input:
                    countIconBuffers[imageData.quantity] || countIconBuffers[1],
                left,
                top
            }
        })
        .filter((op) => op !== null)
}
