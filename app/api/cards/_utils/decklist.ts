// Utility functions for processing decklists
// This file contains logic moved from the cards API route to separate data processing concerns

import { CardItem } from '@/app/types/api'
import { ScryfallCard } from '@/app/types/scryfall'

const decklistSeparators = [
    '\n\n',
    '\nSIDEBOARD\n',
    '\nSideboard\n',
    '\nsideboard\n',
    '\nSIDEBOARD:\n',
    '\nSideboard:\n',
    '\nsideboard:\n',
    '\nSB:\n',
    '\nsb:\n',
    '\nSB\n',
    '\nSb\n',
    '\nsb\n',
    '\n--\n',
    '\n\nSIDEBOARD\n',
    '\n\nSideboard\n',
    '\n\nsideboard\n',
    '\n\nSIDEBOARD:\n',
    '\n\nSideboard:\n',
    '\n\nsideboard:\n',
    '\n\nSB:\n',
    '\n\nsb:\n',
    '\n\nSB\n',
    '\n\nSb\n',
    '\n\nsb\n',
    '\n\n--\n'
]

const decklistSeparatorRegex = new RegExp(decklistSeparators.join('|'), 'g')
/**
 * Parse a decklist string and split it into main deck and sideboard sections
 * Supports multiple formats for sideboard separation
 */
export function parseDecklist(decklist: string): string[] {
    let parsedList = decklist.trim()
    const firstCharIndex = parsedList.search(/[^\s\n]/)
    // Remove leading non-alphanumeric characters
    if (firstCharIndex > 0) {
        parsedList = parsedList.slice(firstCharIndex)
    }

    let cardStrings: string[] = parsedList
        .split(decklistSeparatorRegex)
        .reduce<string[]>((acc, section) => {
            const trimmed = section.trim()
            if (trimmed) {
                acc.push(trimmed)
            }
            return acc
        }, [])

    return cardStrings
}

/**
 * Extract unique cards from a decklist section with their quantities
 * Each line should be in format: "4x Card Name" or "4 Card Name"
 */
export function getUniqueCards(
    decklist: string,
    groupId: number
): { name: string; quantity: number; groupId: number }[] {
    // Replace first space with # to split quantity and name, then trim lines
    const cardStrings = decklist
        .split('\n')
        .map((line) => line.replace(' ', '#').trim())

    // Filter out empty lines
    return cardStrings.reduce<
        { name: string; quantity: number; groupId: number }[]
    >((acc, line) => {
        if (!line) {
            return acc
        }
        const [quantityStr, name] = line.split('#')
        const quantity = parseInt(quantityStr.replace('x', ''), 10)
        if (!isNaN(quantity) && quantity > 0 && name) {
            acc.push({ name, quantity, groupId })
        }
        return acc
    }, [])
}

/**
 * Create a CardItem object from Scryfall API response data
 */
export function createCardItem(
    scryfallData: ScryfallCard,
    quantity: number,
    groupId: number
): CardItem {
    let imageUri = null
    if (scryfallData.card_faces && scryfallData.card_faces.length > 0) {
        // If the card has multiple faces, use the front face's image
        imageUri = scryfallData.card_faces[0].image_uris?.png || null
    } else {
        imageUri = scryfallData.image_uris?.png || null
    }
    return {
        id: scryfallData.id,
        name: scryfallData.name,
        cmc: scryfallData.cmc,
        typeLine: scryfallData.type_line,
        rarity: scryfallData.rarity,
        image_uri: imageUri,
        colors: scryfallData.colors,
        legalities: scryfallData.legalities,
        quantity,
        groupId
    }
}

/**
 * Create a mock CardItem for testing or when API is unavailable
 */
export function createMockCardItem(
    name: string,
    quantity: number,
    groupId: number
): CardItem {
    return {
        id: `mock-${name.toLowerCase().replace(/\s+/g, '-')}`,
        name: 'name',
        cmc: Math.floor(Math.random() * 8),
        typeLine: 'Instant',
        rarity: 'common',
        image_uri:
            'https://cards.scryfall.io/large/front/c/4/c41933b2-a91f-4c43-8734-08fc3a392ac2.jpg?1675456210',
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
        groupId
    }
}

/**
 * Utility function to pause execution for rate limiting
 */
export const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms))
