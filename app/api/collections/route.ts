import chalk from 'chalk'
import { NextRequest, NextResponse } from 'next/server'
import { sleep } from '../../../utils/decklist'
import { parseDecklistToRequests } from '@/services/card-list'
import {
    identifierKey,
    getCardName,
    fetchScryfallBatch
} from '@/services/card-list'
import type {
    DeckFormat,
    ParsedCard,
    ScryfallIdentifier
} from '@/services/card-list'
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
            const batches: ParsedCard[][] = []
            for (let i = 0; i < uniqueCards.length; i += BATCH_SIZE) {
                batches.push(uniqueCards.slice(i, i + BATCH_SIZE))
            }

            let processedCards = 0
            let cachedCardsCount = 0

            // Scryfall API config (resolved once per request)
            const scryfallBaseUrl =
                process.env.API_URL_SCRYFALL ?? 'https://api.scryfall.com'
            const userAgent =
                process.env.API_USER_AGENT ?? 'mtg-deck-to-png/1.0'

            // Process each batch
            for (
                let batchIndex = 0;
                batchIndex < batches.length;
                batchIndex++
            ) {
                const batch = batches[batchIndex]

                // Check cache first and separate cached vs non-cached cards
                const cachedCards: CardItem[] = []
                const cardsToFetch: ParsedCard[] = []

                for (const card of batch) {
                    // Cache key: use best candidate identifier
                    const bestId = card.identifierCandidates[0].identifier
                    const cacheKey = identifierKey(bestId)
                    const cached = collectionCardCache.get(cacheKey)

                    if (cached && cached.expires > now) {
                        const cardData: CardItem = {
                            ...cached.data,
                            quantity: card.quantity,
                            groupId: card.groupId
                        }
                        cachedCards.push(cardData)
                        cachedCardsCount++
                        const cardName = getCardName(card)
                        console.log(
                            chalk.cyan(`Cache hit for card: ${cardName}`)
                        )

                        processedCards++
                        controller.send({
                            type: 'progress',
                            current: processedCards,
                            total: totalCards,
                            message: `Loaded ${cardName} (cached)`,
                            card: cardData
                        })
                    } else {
                        cardsToFetch.push(card)
                    }
                }

                cards.push(...cachedCards)

                // Fetch non-cached cards using Collections API
                if (cardsToFetch.length > 0) {
                    controller.send({
                        type: 'progress',
                        current: processedCards,
                        total: totalCards,
                        message: `Fetching batch ${batchIndex + 1}/${batches.length} (${cardsToFetch.length} cards)...`
                    })

                    // Build primary request: best candidate per card
                    const primaryRequests = cardsToFetch.map((pc) => ({
                        id: pc.identifierCandidates[0].identifier,
                        parsedCard: pc
                    }))

                    const { found: primaryFound, notFound: primaryNotFound } =
                        await fetchScryfallBatch(
                            primaryRequests,
                            `Batch ${batchIndex + 1}`,
                            scryfallBaseUrl,
                            userAgent
                        )

                    // Process found cards from primary pass
                    for (const { cardItem, parsedCard } of primaryFound) {
                        if (cardItem.image_uri === null) {
                            const name = getCardName(parsedCard)
                            errors.push(name)
                            processedCards++
                            controller.send({
                                type: 'progress',
                                current: processedCards,
                                total: totalCards,
                                message: `No image available for ${name}`,
                                error: name
                            })
                            continue
                        }

                        cards.push(cardItem)

                        const cacheKey = identifierKey(
                            parsedCard.identifierCandidates[0].identifier
                        )
                        collectionCardCache.set(cacheKey, {
                            data: cardItem,
                            expires: now + CACHE_DURATION
                        })

                        processedCards++
                        controller.send({
                            type: 'progress',
                            current: processedCards,
                            total: totalCards,
                            message: `Loaded ${cardItem.name}`,
                            card: cardItem
                        })
                    }

                    // Single retry pass for not_found cards using next fallback tier
                    if (primaryNotFound.length > 0) {
                        const retryRequests: Array<{
                            id: ScryfallIdentifier
                            parsedCard: ParsedCard
                        }> = []

                        for (const pc of primaryNotFound) {
                            // Find next candidate after the one already tried
                            const nextCandidate = pc.identifierCandidates[1]
                            if (nextCandidate) {
                                retryRequests.push({
                                    id: nextCandidate.identifier,
                                    parsedCard: pc
                                })
                            } else {
                                // No more fallback tiers; mark as not_found
                                const name = getCardName(pc)
                                errors.push(name)
                                console.log(
                                    chalk.yellow(`Card not found: ${name}`)
                                )
                                processedCards++
                                controller.send({
                                    type: 'progress',
                                    current: processedCards,
                                    total: totalCards,
                                    message: `Card not found: ${name}`,
                                    error: name
                                })
                            }
                        }

                        if (retryRequests.length > 0) {
                            await sleep(50) // respect rate limit between retry and next batch

                            const {
                                found: retryFound,
                                notFound: retryNotFound
                            } = await fetchScryfallBatch(
                                retryRequests,
                                `Batch ${batchIndex + 1} retry`,
                                scryfallBaseUrl,
                                userAgent
                            )

                            for (const { cardItem, parsedCard } of retryFound) {
                                if (cardItem.image_uri === null) {
                                    const name = getCardName(parsedCard)
                                    errors.push(name)
                                    processedCards++
                                    controller.send({
                                        type: 'progress',
                                        current: processedCards,
                                        total: totalCards,
                                        message: `No image available for ${name}`,
                                        error: name
                                    })
                                    continue
                                }

                                cards.push(cardItem)

                                const cacheKey = identifierKey(
                                    parsedCard.identifierCandidates[0]
                                        .identifier
                                )
                                collectionCardCache.set(cacheKey, {
                                    data: cardItem,
                                    expires: now + CACHE_DURATION
                                })

                                processedCards++
                                controller.send({
                                    type: 'progress',
                                    current: processedCards,
                                    total: totalCards,
                                    message: `Loaded ${cardItem.name}`,
                                    card: cardItem
                                })
                            }

                            // Cards still not found after retry are final errors
                            for (const pc of retryNotFound) {
                                const name = getCardName(pc)
                                errors.push(name)
                                console.log(
                                    chalk.yellow(
                                        `Card not found after retry: ${name}`
                                    )
                                )
                                processedCards++
                                controller.send({
                                    type: 'progress',
                                    current: processedCards,
                                    total: totalCards,
                                    message: `Card not found: ${name}`,
                                    error: name
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
                // Re-sort to maintain groupId order when mixing cached and fresh cards
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
        usage: 'POST with { "decklist": "4x Card Name 1\n4x Card Name 2", "format": "(optional) detected format" }',
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
