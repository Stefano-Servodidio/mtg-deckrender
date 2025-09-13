import { getUniqueCards, sleep } from '@/utils/api'
import chalk from 'chalk'
import { NextRequest, NextResponse } from 'next/server'
import { CardItem } from './_types'

// Simple in-memory cache for card data
const cardCache = new Map<string, { data: any; expires: number }>()

export async function POST(request: NextRequest) {
    try {
        console.log(chalk.yellow('API: ', chalk.cyan('POST /api/cards')))

        // decklist is a string with one card name per line
        const { decklist } = await request.json()

        if (!decklist || typeof decklist !== 'string') {
            return NextResponse.json(
                { error: 'Invalid request. Expected decklist to be a string.' },
                { status: 400 }
            )
        }

        const [mainString, sideboardString] = decklist.includes('\n\n')
            ? decklist.split('\n\n')
            : decklist.includes('\n\nSIDEBOARD\n')
              ? decklist.split('\n\nSIDEBOARD\n')
              : [decklist, '']

        // Parse the decklist to get unique cards and their quantities
        const uniqueCards = [
            ...getUniqueCards(mainString, 'main'),
            ...getUniqueCards(sideboardString, 'sideboard')
        ]
        if (!uniqueCards.length) {
            return NextResponse.json(
                { error: 'No valid cards found in the decklist.' },
                { status: 400 }
            )
        }

        const cards: CardItem[] = []
        const errors = []
        const now = Date.now()
        const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours in ms

        // Fetch card data from Scryfall for each unique card, with cache
        for (const { name, quantity, type } of uniqueCards) {
            const cacheKey = name.toLowerCase()
            const cached = cardCache.get(cacheKey)
            if (cached && cached.expires > now) {
                cards.push({
                    ...cached.data,
                    quantity,
                    type
                })
                console.log(chalk.cyan(`Cache hit for card: ${name}`))
                continue
            }

            const response = await fetch(
                process.env.NEXT_PUBLIC_API_URL_SCRYFALL +
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
            }
            const scryfallData = await response.json()
            const cardData: CardItem = {
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
            cards.push(cardData)
            // Cache the card data for 24 hours
            cardCache.set(cacheKey, {
                data: cardData,
                expires: now + CACHE_DURATION
            })
            await sleep(50) // Sleep for 50ms to respect Scryfall rate limits
        }

        return NextResponse.json({ cards, errors })
    } catch (error) {
        console.error('Error fetching card images:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function GET() {
    return NextResponse.json({
        message: 'Card Images API',
        usage: 'POST with { "decklist": "4x Card Name 1\n4x Card Name 2" }',
        description:
            'Fetches card information and images for the provided text decklist.'
    })
}
