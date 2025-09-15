import { CardItem } from '@/app/services/serverless/types'
import chalk from 'chalk'

// Simple in-memory cache for card data
const cardCache = new Map<string, { data: any; expires: number }>()

/**
 * Utility for parsing decklist strings and fetching card data
 * 
 * Usage:
 * import { parseDecklist, fetchCardData } from './_utils/decklist'
 * 
 * const uniqueCards = parseDecklist(decklistString)
 * const cards = await fetchCardData(uniqueCards)
 */

export interface UniqueCard {
    name: string
    quantity: number
    type: 'main' | 'sideboard'
}

/**
 * Parse a decklist string and split it into main and sideboard sections
 */
export function parseDecklist(decklist: string): {
    mainString: string
    sideboardString: string
} {
    const [mainString, sideboardString] = decklist.includes('\n\n')
        ? decklist.split('\n\n')
        : decklist.includes('\n\nSIDEBOARD\n')
          ? decklist.split('\n\nSIDEBOARD\n')
          : [decklist, '']

    return { mainString, sideboardString }
}

/**
 * Parse a decklist section and return unique cards with their quantities
 */
export function getUniqueCards(
    decklist: string,
    type: 'main' | 'sideboard'
): UniqueCard[] {
    const cardStrings = decklist
        .split('\n')
        .map((line) => line.replace(' ', '#').trim())

    return cardStrings.reduce<UniqueCard[]>((acc, line) => {
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
 * Sleep utility for rate limiting
 */
export const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Fetch card data from Scryfall API with caching
 */
export async function fetchCardData(uniqueCards: UniqueCard[]): Promise<{
    cards: CardItem[]
    errors: string[]
}> {
    const cards: CardItem[] = []
    const errors: string[] = []
    const now = Date.now()
    const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours in ms

    for (const { name, quantity, type } of uniqueCards) {
        const cacheKey = name.toLowerCase()
        const cached = cardCache.get(cacheKey)
        
        if (cached && cached.expires > now) {
            cards.push({
                card: cached.data,
                quantity,
                type,
                id: cached.data.id
            })
            console.log(chalk.cyan(`Cache hit for card: ${name}`))
            continue
        }

        try {
            const response = await fetch(
                (process.env.NEXT_PUBLIC_API_URL_SCRYFALL || 'https://api.scryfall.com/') +
                    `cards/named?fuzzy=${encodeURIComponent(name)}`,
                {
                    method: 'GET',
                    headers: {
                        'User-Agent':
                            process.env.NEXT_PUBLIC_API_USER_AGENT ||
                            'mtg-deck-to-png/1.0'
                    }
                }
            )
            
            console.log(
                chalk.cyan(`Fetching card: ${name}, Status: ${response.status}`)
            )
            
            if (!response.ok) {
                errors.push(name)
                continue
            }
            
            const cardData = await response.json()
            cards.push({ card: cardData, quantity, type, id: cardData.id })
            
            // Cache the card data for 24 hours
            cardCache.set(cacheKey, {
                data: cardData,
                expires: now + CACHE_DURATION
            })
            
            await sleep(50) // Sleep for 50ms to respect Scryfall rate limits
        } catch (error) {
            console.error(`Error fetching card ${name}:`, error)
            errors.push(name)
        }
    }

    return { cards, errors }
}