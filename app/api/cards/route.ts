import chalk from 'chalk'
import { NextRequest, NextResponse } from 'next/server'
import { createCardItem, sleep } from '../../../utils/decklist'
import { parseDecklistToRequests } from '@/services/card-list'
import type { DeckFormat } from '@/services/card-list'
import { CardItem } from '@/types/api'
import { cardCache } from '@/utils/cache'
import { isMaintenanceMode, maintenanceResponse } from '@/utils/maintenance'
import { createSSEStream } from '@/utils/stream'

export async function POST(request: NextRequest) {
    if (isMaintenanceMode()) {
        return maintenanceResponse()
    }

    try {
        console.log(chalk.yellow('API: ', chalk.cyan('POST /api/cards')))

        // decklist is a string with one card name per line
        // format is an optional DeckFormat value pre-identified client-side
        const body = await request.json()
        const { decklist, format } = body as {
            decklist?: string
            format?: DeckFormat
        }

        if (!decklist || typeof decklist !== 'string') {
            return NextResponse.json(
                { error: 'Invalid request. Expected decklist to be a string.' },
                { status: 400 }
            )
        }

        const parsed = parseDecklistToRequests(decklist, format)
        const uniqueCards = parsed.cards

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
        return createSSEStream(async (controller) => {
            const cards: CardItem[] = []
            const errors: string[] = []
            const now = Date.now()
            const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours in ms
            const totalCards = uniqueCards.length

            // Send initial progress
            controller.send({
                type: 'progress',
                current: 0,
                total: totalCards,
                message: 'Starting to fetch cards...'
            })

            // Fetch card data from Scryfall for each unique card, with cache
            for (let i = 0; i < uniqueCards.length; i++) {
                const parsedCard = uniqueCards[i]
                // For the /api/cards route, always use the name-only identifier
                // (this endpoint uses the fuzzy named lookup, not the collection API)
                const nameCandidate = parsedCard.identifierCandidates.find(
                    (c) => c.type === 'name'
                )
                const name =
                    nameCandidate && 'name' in nameCandidate.identifier
                        ? nameCandidate.identifier.name
                        : parsedCard.identifierCandidates[0] &&
                            'name' in
                                parsedCard.identifierCandidates[0].identifier
                          ? parsedCard.identifierCandidates[0].identifier.name
                          : ''

                if (!name) continue

                const { quantity, groupId } = parsedCard
                const cacheKey = name.toLowerCase()
                const cached = cardCache.get(cacheKey)

                if (cached && cached.expires > now) {
                    const cardData = {
                        ...cached.data,
                        quantity,
                        groupId
                    }
                    cards.push(cardData)
                    console.log(chalk.cyan(`Cache hit for card: ${name}`))

                    // Send progress update for cached card
                    controller.send({
                        type: 'progress',
                        current: i + 1,
                        total: totalCards,
                        message: `Loaded ${name} (cached)`,
                        card: cardData
                    })
                    continue
                }

                // Send progress update for fetching
                controller.send({
                    type: 'progress',
                    current: i + 1,
                    total: totalCards,
                    message: `Fetching ${name}...`
                })

                try {
                    const response = await fetch(
                        process.env.API_URL_SCRYFALL +
                            `/cards/named?fuzzy=${encodeURIComponent(name)}`,
                        {
                            method: 'GET',
                            headers: {
                                'User-Agent':
                                    process.env.API_USER_AGENT ||
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
                        controller.send({
                            type: 'progress',
                            current: i + 1,
                            total: totalCards,
                            message: `Failed to fetch ${name}`,
                            error: name
                        })
                        continue
                    }

                    const scryfallData = await response.json()
                    const cardData = createCardItem(
                        scryfallData,
                        quantity,
                        groupId
                    )
                    if (cardData.image_uri === null) {
                        errors.push(name)
                        controller.send({
                            type: 'progress',
                            current: i + 1,
                            total: totalCards,
                            message: `No image available for ${name}`,
                            error: name
                        })
                        continue
                    }
                    cards.push(cardData)

                    // Cache the card data for 24 hours
                    cardCache.set(cacheKey, {
                        data: cardData,
                        expires: now + CACHE_DURATION
                    })

                    // Send progress update with fetched card
                    controller.send({
                        type: 'progress',
                        current: i + 1,
                        total: totalCards,
                        message: `Loaded ${name}`,
                        card: cardData
                    })
                    // eslint-disable-next-line unused-imports/no-unused-vars
                } catch (_fetchError) {
                    // API unavailable: mark as error (no mock fallback)
                    errors.push(name)
                    console.log(chalk.yellow(`Failed to fetch card: ${name}`))
                    controller.send({
                        type: 'progress',
                        current: i + 1,
                        total: totalCards,
                        message: `Failed to fetch ${name}`,
                        error: name
                    })
                }

                await sleep(50) // Sleep for 50ms to respect Scryfall rate limits
            }

            // Send final result
            controller.send({
                type: 'complete',
                result: { cards, errors },
                message: `Completed! Loaded ${cards.length} cards`
            })
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
    if (isMaintenanceMode()) {
        return maintenanceResponse()
    }

    return NextResponse.json({
        message: 'Card Images API',
        usage: 'POST with { "decklist": "4x Card Name 1\n4x Card Name 2", "format": "(optional) detected format" }',
        description:
            'Fetches card information and images for the provided text decklist. Supports up to 75 unique cards.',
        limits: {
            maxCards: 75,
            throttling: '50ms between requests to Scryfall',
            cacheDuration: '24 hours'
        }
    })
}
