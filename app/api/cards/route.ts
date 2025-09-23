import chalk from 'chalk'
import { NextRequest, NextResponse } from 'next/server'
import {
    parseDecklist,
    getUniqueCards,
    createCardItem,
    createMockCardItem,
    sleep
} from './_utils/decklist'
import { CardItem } from '@/app/types/api'

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

        const groups = parseDecklist(decklist)

        // Parse the decklist to get unique cards and their quantities
        const uniqueCards = groups
            .map(
                (group, index) => getUniqueCards(group, index + 1) // 1 for main deck, 2 for sideboard, etc.
            )
            .flat()

        if (!uniqueCards.length) {
            return NextResponse.json(
                { error: 'No valid cards found in the decklist.' },
                { status: 400 }
            )
        }

        if (uniqueCards.length > 75) {
            return NextResponse.json(
                { error: 'Decklist exceeds the maximum of 75 unique cards.' },
                { status: 400 }
            )
        }

        // Create a readable stream for real-time progress updates
        const stream = new ReadableStream({
            async start(controller) {
                const cards: CardItem[] = []
                const errors: string[] = []
                const now = Date.now()
                const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours in ms
                const totalCards = uniqueCards.length

                try {
                    // Send initial progress
                    controller.enqueue(
                        new TextEncoder().encode(
                            `data: ${JSON.stringify({
                                type: 'progress',
                                current: 0,
                                total: totalCards,
                                message: 'Starting to fetch cards...'
                            })}\n\n`
                        )
                    )

                    // Fetch card data from Scryfall for each unique card, with cache
                    for (let i = 0; i < uniqueCards.length; i++) {
                        const { name, quantity, groupId } = uniqueCards[i]
                        const cacheKey = name.toLowerCase()
                        const cached = cardCache.get(cacheKey)

                        if (cached && cached.expires > now) {
                            const cardData = {
                                ...cached.data,
                                quantity,
                                groupId
                            }
                            cards.push(cardData)
                            console.log(
                                chalk.cyan(`Cache hit for card: ${name}`)
                            )

                            // Send progress update for cached card
                            controller.enqueue(
                                new TextEncoder().encode(
                                    `data: ${JSON.stringify({
                                        type: 'progress',
                                        current: i + 1,
                                        total: totalCards,
                                        message: `Loaded ${name} (cached)`,
                                        card: cardData
                                    })}\n\n`
                                )
                            )
                            continue
                        }

                        // Send progress update for fetching
                        controller.enqueue(
                            new TextEncoder().encode(
                                `data: ${JSON.stringify({
                                    type: 'progress',
                                    current: i + 1,
                                    total: totalCards,
                                    message: `Fetching ${name}...`
                                })}\n\n`
                            )
                        )

                        try {
                            const response = await fetch(
                                process.env.NEXT_PUBLIC_API_URL_SCRYFALL +
                                    `cards/named?fuzzy=${encodeURIComponent(name)}`,
                                {
                                    method: 'GET',
                                    headers: {
                                        'User-Agent':
                                            process.env
                                                .NEXT_PUBLIC_API_USER_AGENT ||
                                            'mtg-deck-to-png/1.0'
                                    }
                                }
                            )

                            console.log(
                                chalk.cyan(
                                    `Fetching card: ${name}, Status: ${response.status}`
                                )
                            )

                            if (!response.ok) {
                                errors.push(name)
                                controller.enqueue(
                                    new TextEncoder().encode(
                                        `data: ${JSON.stringify({
                                            type: 'progress',
                                            current: i + 1,
                                            total: totalCards,
                                            message: `Failed to fetch ${name}`,
                                            error: name
                                        })}\n\n`
                                    )
                                )
                                continue
                            }

                            const scryfallData = await response.json()
                            const cardData = createCardItem(
                                scryfallData,
                                quantity,
                                groupId
                            )
                            cards.push(cardData)

                            // Cache the card data for 24 hours
                            cardCache.set(cacheKey, {
                                data: cardData,
                                expires: now + CACHE_DURATION
                            })

                            // Send progress update with fetched card
                            controller.enqueue(
                                new TextEncoder().encode(
                                    `data: ${JSON.stringify({
                                        type: 'progress',
                                        current: i + 1,
                                        total: totalCards,
                                        message: `Loaded ${name}`,
                                        card: cardData
                                    })}\n\n`
                                )
                            )
                        } catch (fetchError) {
                            // Fallback to mock data for demonstration
                            console.log(
                                chalk.yellow(
                                    `API unavailable, using mock data for ${name}`
                                )
                            )

                            const mockCardData = createMockCardItem(
                                name,
                                quantity,
                                groupId
                            )
                            cards.push(mockCardData)

                            // Cache the mock data
                            cardCache.set(cacheKey, {
                                data: mockCardData,
                                expires: now + CACHE_DURATION
                            })

                            // Send progress update with mock card
                            controller.enqueue(
                                new TextEncoder().encode(
                                    `data: ${JSON.stringify({
                                        type: 'progress',
                                        current: i + 1,
                                        total: totalCards,
                                        message: `Loaded ${name} (mock data)`,
                                        card: mockCardData
                                    })}\n\n`
                                )
                            )
                        }

                        await sleep(50) // Sleep for 50ms to respect Scryfall rate limits
                    }

                    // Send final result
                    controller.enqueue(
                        new TextEncoder().encode(
                            `data: ${JSON.stringify({
                                type: 'complete',
                                result: { cards, errors },
                                message: `Completed! Loaded ${cards.length} cards`
                            })}\n\n`
                        )
                    )
                } catch (error) {
                    console.error('Error in stream:', error)
                    controller.enqueue(
                        new TextEncoder().encode(
                            `data: ${JSON.stringify({
                                type: 'error',
                                error: 'Internal server error',
                                message: 'Failed to fetch cards'
                            })}\n\n`
                        )
                    )
                } finally {
                    controller.close()
                }
            }
        })

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Cache-Control': 'no-cache',
                Connection: 'keep-alive',
                'X-Accel-Buffering': 'no' // Disable nginx buffering
            }
        })
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
