// Utility functions for processing decklists
// This file contains logic moved from the cards API route to separate data processing concerns

import { CardItem } from '../_types'

/**
 * Parse a decklist string and split it into main deck and sideboard sections
 * Supports multiple formats for sideboard separation
 */
export function parseDecklist(decklist: string): [string, string] {
    if (decklist.includes('\n\n')) {
        const parts = decklist.split('\n\n')
        return [parts[0] || '', parts[1] || '']
    } else if (decklist.includes('\n\nSIDEBOARD\n')) {
        const parts = decklist.split('\n\nSIDEBOARD\n')
        return [parts[0] || '', parts[1] || '']
    } else {
        return [decklist, '']
    }
}

/**
 * Extract unique cards from a decklist section with their quantities
 * Each line should be in format: "4x Card Name" or "4 Card Name"
 */
export function getUniqueCards(
    decklist: string,
    type: 'main' | 'sideboard'
): { name: string; quantity: number; type: 'main' | 'sideboard' }[] {
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

/**
 * Create a CardItem object from Scryfall API response data
 */
export function createCardItem(
    scryfallData: any,
    quantity: number,
    type: 'main' | 'sideboard'
): CardItem {
    return {
        id: scryfallData.id,
        name: scryfallData.name,
        cmc: scryfallData.cmc,
        type_line: scryfallData.type_line,
        rarity: scryfallData.rarity,
        image_uri: scryfallData.image_uris?.png || null,
        colors: scryfallData.colors,
        legalities: scryfallData.legalities,
        quantity,
        type
    }
}

/**
 * Create a mock CardItem for testing or when API is unavailable
 */
export function createMockCardItem(
    name: string,
    quantity: number,
    type: 'main' | 'sideboard'
): CardItem {
    return {
        id: `mock-${name.toLowerCase().replace(/\s+/g, '-')}`,
        name: name,
        cmc: Math.floor(Math.random() * 8),
        type_line: 'Instant',
        rarity: 'common',
        image_uri: 'https://cards.scryfall.io/png/front/4/5/4506713a-6a58-4e44-a514-09555ad3cd96.png',
        colors: ['U', 'R'],
        legalities: {
            standard: 'legal',
            modern: 'legal',
            legacy: 'legal',
            commander: 'legal',
            vintage: 'legal',
            pioneer: 'legal',
            historic: 'legal',
            pauper: 'not_legal',
            penny: 'legal',
            duel: 'legal',
            oldschool: 'not_legal',
            premodern: 'legal',
            predh: 'legal',
            alchemy: 'not_legal',
            future: 'not_legal',
            timeless: 'legal',
            gladiator: 'legal',
            oathbreaker: 'legal',
            standardbrawl: 'not_legal',
            brawl: 'legal',
            paupercommander: 'not_legal'
        },
        quantity,
        type
    }
}

/**
 * Utility function to pause execution for rate limiting
 */
export const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms))