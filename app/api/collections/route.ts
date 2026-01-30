import chalk from 'chalk'
import { NextRequest, NextResponse } from 'next/server'
import {
    parseDecklist,
    getUniqueCards,
    createCardItem,
    createMockCardItem,
    sleep
} from '../../../utils/decklist'
import { CardItem } from '@/types/api'
import { collectionCardCache } from '@/utils/cache'
import { isMaintenanceMode, maintenanceResponse } from '@/utils/maintenance'
import { createSSEStream } from '@/utils/stream'

export async function POST(request: NextRequest) {
    if (isMaintenanceMode()) {
        return maintenanceResponse()
    }

    try {
        console.log(chalk.yellow('API: ', chalk.cyan('POST /api/collections')))
        console.log(process.env.API_URL_SCRYFALL)

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
        console.log('Parsed unique cards:', uniqueCards.length)
        if (uniqueCards.length > 150) {
            return NextResponse.json(
                { error: 'Decklist exceeds the maximum of 150 unique cards.' },
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
            const BATCH_SIZE = 75

            // Send initial progress
            controller.send({
                type: 'progress',
                current: 0,
                total: totalCards,
                message: 'Starting to fetch cards...'
            })

            // Split cards into batches
            const batches: (typeof uniqueCards)[] = []
            for (let i = 0; i < uniqueCards.length; i += BATCH_SIZE) {
                batches.push(uniqueCards.slice(i, i + BATCH_SIZE))
            }

            let processedCards = 0
            let cachedCardsCount = 0

            // Process each batch
            for (
                let batchIndex = 0;
                batchIndex < batches.length;
                batchIndex++
            ) {
                const batch = batches[batchIndex]

                // Check cache first and separate cached vs non-cached cards
                const cachedCards: CardItem[] = []
                const cardsToFetch: typeof uniqueCards = []

                for (const card of batch) {
                    const cacheKey = card.name.toLowerCase()
                    const cached = collectionCardCache.get(cacheKey)

                    if (cached && cached.expires > now) {
                        const cardData = {
                            ...cached.data,
                            quantity: card.quantity,
                            groupId: card.groupId
                        }
                        cachedCards.push(cardData)
                        cachedCardsCount++
                        console.log(
                            chalk.cyan(`Cache hit for card: ${card.name}`)
                        )

                        processedCards++
                        // Send progress update for cached card
                        controller.send({
                            type: 'progress',
                            current: processedCards,
                            total: totalCards,
                            message: `Loaded ${card.name} (cached)`,
                            card: cardData
                        })
                    } else {
                        cardsToFetch.push(card)
                    }
                }

                cards.push(...cachedCards)

                // Fetch non-cached cards using Collections API
                if (cardsToFetch.length > 0) {
                    // Send progress update for batch fetching
                    controller.send({
                        type: 'progress',
                        current: processedCards,
                        total: totalCards,
                        message: `Fetching batch ${batchIndex + 1}/${batches.length} (${cardsToFetch.length} cards)...`
                    })

                    const identifiers = cardsToFetch.map((card) => ({
                        name: card.name
                    }))

                    const response = await fetch(
                        `${process.env.API_URL_SCRYFALL}/cards/collection`,
                        {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'User-Agent':
                                    process.env.API_USER_AGENT ||
                                    'mtg-deck-to-png/1.0'
                            },
                            body: JSON.stringify({ identifiers })
                        }
                    )

                    console.log(
                        chalk.cyan(
                            `Fetching batch ${batchIndex + 1}, Status: ${response.status}`
                        )
                    )

                    if (!response.ok) {
                        console.log(
                            chalk.yellow(`Batch ${batchIndex + 1} failed: `),
                            response.status,
                            response.statusText
                        )
                        throw new Error(
                            `HTTP ERROR POST ${process.env.API_URL_SCRYFALL}/cards/collection ${response.status}: ${response.statusText}`
                        )
                    } else {
                        const batchData = await response.json()
                        const foundCards = batchData.data || []

                        // Process each card in the fetch list
                        for (const card of cardsToFetch) {
                            const cacheKey = card.name.toLowerCase()
                            let scryfallData = null

                            for (const foundCard of foundCards) {
                                // Exact match first
                                if (foundCard.name.toLowerCase() === cacheKey) {
                                    scryfallData = foundCard
                                    break
                                } else if (
                                    foundCard.name
                                        .toLowerCase()
                                        .includes(cacheKey) &&
                                    !cards.find(
                                        (c) =>
                                            c.name.toLowerCase() ===
                                            foundCard.name.toLowerCase()
                                    )
                                ) {
                                    // Partial match if no exact match and not already added
                                    scryfallData = foundCard
                                }
                            }

                            if (scryfallData) {
                                const cardData = createCardItem(
                                    scryfallData,
                                    card.quantity,
                                    card.groupId
                                )

                                if (cardData.image_uri === null) {
                                    errors.push(card.name)
                                    processedCards++
                                    controller.send({
                                        type: 'progress',
                                        current: processedCards,
                                        total: totalCards,
                                        message: `No image available for ${card.name}`,
                                        error: card.name
                                    })
                                    continue
                                }

                                cards.push(cardData)

                                // Cache the card data for 24 hours
                                collectionCardCache.set(cacheKey, {
                                    data: cardData,
                                    expires: now + CACHE_DURATION
                                })

                                processedCards++
                                controller.send({
                                    type: 'progress',
                                    current: processedCards,
                                    total: totalCards,
                                    message: `Loaded ${card.name}`,
                                    card: cardData
                                })
                            } else {
                                // Card not found, add to errors or use mock
                                errors.push(card.name)
                                console.log(
                                    chalk.yellow(
                                        `Card not found: ${card.name}, using mock data`
                                    )
                                )

                                const mockCardData = createMockCardItem(
                                    card.name,
                                    card.quantity,
                                    card.groupId
                                )
                                cards.push(mockCardData)

                                processedCards++
                                controller.send({
                                    type: 'progress',
                                    current: processedCards,
                                    total: totalCards,
                                    message: `Loaded ${card.name} (mock data)`,
                                    card: mockCardData
                                })
                            }
                        }
                    }
                }

                // Sleep for 50ms between batches to respect rate limits
                if (batchIndex < batches.length - 1) {
                    await sleep(50)
                }
            }

            let sortedByGroup = cards
            if (cachedCardsCount > 0 && cachedCardsCount < cards.length) {
                // If we used a mix of  cached and non-cached cards, re-sort the final list by groupId to maintain original order
                sortedByGroup = cards.sort((a, b) => a.groupId - b.groupId)
            }

            // Send final result
            controller.send({
                type: 'complete',
                result: { cards: sortedByGroup, errors },
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
        message: 'Collections API',
        usage: 'POST with { "decklist": "4x Card Name 1\n4x Card Name 2" }',
        description:
            'Fetches card information and images using Scryfall Collections API. Supports up to 150 unique cards with batch processing.',
        limits: {
            maxCards: 150,
            batchSize: 75,
            throttling: '50ms between batches',
            cacheDuration: '24 hours'
        }
    })
}
