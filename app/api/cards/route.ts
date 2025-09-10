import { NextRequest, NextResponse } from 'next/server'

// Simple in-memory cache for card data
const cardCache = new Map<string, { data: any; expires: number }>()

export async function POST(request: NextRequest) {
    try {
        // decklist is a string with one card name per line
        const { decklist } = await request.json()

        if (!decklist || typeof decklist !== 'string') {
            return NextResponse.json(
                { error: 'Invalid request. Expected decklist to be a string.' },
                { status: 400 }
            )
        }

        // Parse decklist into unique card names with quantities
        const cardStrings = decklist
            .split('\n')
            .map((line) => line.replace(' ', '#').trim())

        const uniqueCards = cardStrings.reduce<
            { name: string; quantity: number }[]
        >((acc, line) => {
            if (!line) {
                return acc
            }
            const [quantityStr, name] = line.split('#')
            const quantity = parseInt(quantityStr.replace('x', ''), 10)
            if (!isNaN(quantity) && quantity > 0 && name) {
                acc.push({ name, quantity })
            }
            return acc
        }, [])

        if (!uniqueCards.length) {
            return NextResponse.json(
                { error: 'No valid cards found in the decklist.' },
                { status: 400 }
            )
        }

        const cards = []
        const errors = []
        const now = Date.now()
        const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours in ms

        // Fetch card data from Scryfall for each unique card, with cache
        for (const { name, quantity } of uniqueCards) {
            const cacheKey = name.toLowerCase()
            const cached = cardCache.get(cacheKey)
            if (cached && cached.expires > now) {
                cards.push({ card: cached.data, quantity })
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
            console.log(`Fetching card: ${name}, Status: ${response.status}`)
            if (!response.ok) {
                errors.push(name)
            }
            const cardData = await response.json()
            cards.push({ card: cardData, quantity })
            // Cache the card data for 24 hours
            cardCache.set(cacheKey, {
                data: cardData,
                expires: now + CACHE_DURATION
            })
            await sleep(60) // Sleep for 60ms to respect rate limits
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

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function GET() {
    return NextResponse.json({
        message: 'Card Images API',
        usage: 'POST with { "decklist": "4x Card Name 1\n4x Card Name 2" }',
        description:
            'Fetches card information and images for the provided text decklist.'
    })
}
