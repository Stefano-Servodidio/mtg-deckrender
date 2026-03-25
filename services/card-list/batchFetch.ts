/**
 * Fetch a batch of cards from the Scryfall /cards/collection endpoint.
 *
 * Extracted from the collections API route so it can be unit-tested
 * independently of the Next.js request lifecycle.
 */

import { createCardItem } from '@/utils/decklist'
import { ScryfallCard } from '@/types/scryfall'
import { CardItem } from '@/types/api'
import { ParsedCard, ScryfallIdentifier } from './types'
import { identifierKey, matchCardToRequest } from './collectionUtils'

export interface BatchRequest {
    id: ScryfallIdentifier
    parsedCard: ParsedCard
}

export interface BatchResult {
    found: Array<{ cardItem: CardItem; parsedCard: ParsedCard }>
    notFound: ParsedCard[]
}

/**
 * Submit a batch of identifier requests to Scryfall's /cards/collection API.
 *
 * Returns:
 * - `found`    — Scryfall cards successfully matched to their ParsedCard.
 * - `notFound` — ParsedCards whose primary identifier was not found (eligible
 *                for retry with the next fallback candidate tier).
 *
 * Throws on non-2xx HTTP responses so the caller can propagate the error
 * through the SSE stream.
 *
 * @param requests     Array of (identifier, parsedCard) pairs.
 * @param batchLabel   Human-readable label used in log messages.
 * @param scryfallBaseUrl  Base URL for the Scryfall API (e.g. `https://api.scryfall.com`).
 * @param userAgent    User-Agent header value sent to Scryfall.
 */
export async function fetchScryfallBatch(
    requests: BatchRequest[],
    batchLabel: string,
    scryfallBaseUrl: string,
    userAgent: string
): Promise<BatchResult> {
    const identifiers = requests.map((r) => r.id)

    const response = await fetch(`${scryfallBaseUrl}/cards/collection`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': userAgent
        },
        body: JSON.stringify({ identifiers })
    })

    if (!response.ok) {
        throw new Error(
            `HTTP ERROR POST ${scryfallBaseUrl}/cards/collection ${response.status}: ${response.statusText} (${batchLabel})`
        )
    }

    const batchData = await response.json()
    const foundScryfallCards: ScryfallCard[] = batchData.data || []
    const notFoundIdentifiers: ScryfallIdentifier[] = batchData.not_found || []

    // Build key → parsedCard map for fast not_found resolution
    const keyToCard = new Map<string, ParsedCard>()
    for (const req of requests) {
        keyToCard.set(identifierKey(req.id), req.parsedCard)
    }

    const found: Array<{ cardItem: CardItem; parsedCard: ParsedCard }> = []
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

    // Also handle ParsedCards that Scryfall silently dropped (not in found,
    // not explicitly in not_found — treat as not_found for retry)
    for (const req of requests) {
        const key = identifierKey(req.id)
        if (
            !resolvedKeys.has(key) &&
            !notFoundIdentifiers.some((nf) => identifierKey(nf) === key)
        ) {
            if (!notFoundCards.includes(req.parsedCard)) {
                notFoundCards.push(req.parsedCard)
            }
        }
    }

    return { found, notFound: notFoundCards }
}
