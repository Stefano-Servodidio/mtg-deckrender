import path from 'path'
import fs from 'fs/promises'
import { CardImageBuffer } from '../app/api/deck-png/route'

// Utility function to parse a decklist string and return unique cards with their quantities
export const getUniqueCards = (
    decklist: string,
    type: 'main' | 'sideboard'
) => {
    const cardStrings = decklist
        .split('\n')
        .map((line) => line.replace(' ', '#').trim())

    return cardStrings.reduce<
        { name: string; quantity: number; type: 'main' | 'sideboard' }[]
    >((acc, line) => {
        if (!line) {
            return acc
        }
        const [quantityStr, name] = line.split('#')
        const quantity = parseInt(quantityStr.replace('x', ''), 10)
        if (!isNaN(quantity) && quantity > 0 && name) {
            acc.push({ name, quantity, type })
        }
        return acc
    }, [])
}

// Utility function to pause execution for a given number of milliseconds
export const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms))

// Utility function to load an asset file as a buffer
export const getAssetBuffer = async (filename: string) => {
    const assetPath = path.join(process.cwd(), 'assets', filename)
    return await fs.readFile(assetPath)
}

// Prepare card composite operations
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

//prepare quantity overlay operations
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
