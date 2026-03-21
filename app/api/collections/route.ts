import chalk from 'chalk'
import { NextRequest, NextResponse } from 'next/server'
import { createCardItem, sleep } from '../../../utils/decklist'
import { parseDecklistToRequests } from '@/services/card-list'
import type {
    DeckFormat,
    ParsedCard,
    ScryfallIdentifier
} from '@/services/card-list'
import { CardItem } from '@/types/api'
import { collectionCardCache } from '@/utils/cache'
import { isMaintenanceMode, maintenanceResponse } from '@/utils/maintenance'
import { createSSEStream } from '@/utils/stream'
import { ScryfallCard } from '@/types/scryfall'

/**
 * Build a stable string key for a ScryfallIdentifier (used for mapping
 * not_found responses back to our ParsedCard objects).
 */
function identifierKey(id: ScryfallIdentifier): string {
    if ('mtgo_id' in id) return `mtgo_id:${id.mtgo_id}`
    if ('collector_number' in id) return `cn:${id.set}:${id.collector_number}`
    if ('set' in id) return `ns:${id.set}:${id.name}`
    return `n:${id.name}`
}

/**
 * Extract a human-readable card name from a ParsedCard for use in progress
 * messages and error reporting. Falls back to the first identifier key.
 */
function getCardName(pc: ParsedCard): string {
    for (const candidate of pc.identifierCandidates) {
        const id = candidate.identifier
        if ('name' in id) return id.name
    }
    return identifierKey(pc.identifierCandidates[0].identifier)
}

/**
 * Try to match a returned Scryfall card against one of the request
 * identifier objects. Uses a matched-set to avoid matching the same
 * request twice when multiple cards share a name.
 */
function matchCardToRequest(
    card: ScryfallCard,
    requests: Array<{ id: ScryfallIdentifier; parsedCard: ParsedCard }>,
    alreadyMatched: Set<ParsedCard>
): ParsedCard | undefined {
    // First pass: exact collector_number + set match
    for (const req of requests) {
        if (alreadyMatched.has(req.parsedCard)) continue
        const id = req.id
        if (
            'collector_number' in id &&
            'set' in id &&
            card.collector_number === id.collector_number &&
            card.set === id.set
        ) {
            return req.parsedCard
        }
    }
    // Second pass: name match (case-insensitive)
    for (const req of requests) {
        if (alreadyMatched.has(req.parsedCard)) continue
        const id = req.id
        if ('name' in id && card.name.toLowerCase() === id.name.toLowerCase()) {
            return req.parsedCard
        }
    }
    return undefined
}

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

            /**
             * Submit a batch of (identifier, parsedCard) pairs to Scryfall's
             * /cards/collection endpoint. Returns found CardItems and the list
             * of ParsedCards that were not_found for retry.
             */
            async function fetchBatch(
                requests: Array<{
                    id: ScryfallIdentifier
                    parsedCard: ParsedCard
                }>,
                batchLabel: string
            ): Promise<{
                found: Array<{ cardItem: CardItem; parsedCard: ParsedCard }>
                notFound: ParsedCard[]
            }> {
                const identifiers = requests.map((r) => r.id)

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
                    chalk.cyan(`${batchLabel} Status: ${response.status}`)
                )

                if (!response.ok) {
                    console.log(
                        chalk.yellow(`${batchLabel} failed: `),
                        response.status,
                        response.statusText
                    )
                    throw new Error(
                        `HTTP ERROR POST ${process.env.API_URL_SCRYFALL}/cards/collection ${response.status}: ${response.statusText}`
                    )
                }

                const batchData = await response.json()
                const foundScryfallCards: ScryfallCard[] = batchData.data || []
                const notFoundIdentifiers: ScryfallIdentifier[] =
                    batchData.not_found || []

                // Build key → parsedCard map for not_found resolution
                const keyToCard = new Map<string, ParsedCard>()
                for (const req of requests) {
                    keyToCard.set(identifierKey(req.id), req.parsedCard)
                }

                const found: Array<{
                    cardItem: CardItem
                    parsedCard: ParsedCard
                }> = []
                const resolvedKeys = new Set<string>()
                const matchedParsedCards = new Set<ParsedCard>()

                for (const scryfallCard of foundScryfallCards) {
                    const parsedCard = matchCardToRequest(
                        scryfallCard,
                        requests,
                        matchedParsedCards
                    )
                    if (!parsedCard) continue

                    matchedParsedCards.add(parsedCard)

                    const cardItem = createCardItem(
                        scryfallCard,
                        parsedCard.quantity,
                        parsedCard.groupId
                    )
                    found.push({ cardItem, parsedCard })

                    // Track which parsedCards were resolved (by first candidate key)
                    const firstKey = identifierKey(
                        parsedCard.identifierCandidates[0].identifier
                    )
                    resolvedKeys.add(firstKey)
                }

                // Cards in not_found: find their ParsedCard for retry
                const notFoundCards: ParsedCard[] = []
                for (const nfId of notFoundIdentifiers) {
                    const key = identifierKey(nfId)
                    const pc = keyToCard.get(key)
                    if (pc) notFoundCards.push(pc)
                }

                // Also handle ParsedCards that weren't in not_found but had no match
                // (e.g. if Scryfall drops duplicates)
                for (const req of requests) {
                    const key = identifierKey(req.id)
                    if (
                        !resolvedKeys.has(key) &&
                        !notFoundIdentifiers.some(
                            (nf) => identifierKey(nf) === key
                        )
                    ) {
                        // Not resolved, not explicitly not_found – treat as not_found
                        if (!notFoundCards.includes(req.parsedCard)) {
                            notFoundCards.push(req.parsedCard)
                        }
                    }
                }

                return { found, notFound: notFoundCards }
            }

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
                        await fetchBatch(
                            primaryRequests,
                            `Batch ${batchIndex + 1}`
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
                            } = await fetchBatch(
                                retryRequests,
                                `Batch ${batchIndex + 1} retry`
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
