/**
 * Pure utility helpers for the Scryfall /cards/collection request lifecycle.
 *
 * Kept in a separate module so they can be unit-tested independently of the
 * Next.js API route that orchestrates the full request flow.
 */

import { ParsedCard, ScryfallIdentifier } from './types'
import { ScryfallCard } from '@/types/scryfall'

// ─── identifierKey ────────────────────────────────────────────────────────────

/**
 * Build a stable string key for a ScryfallIdentifier.
 * Used to map Scryfall `not_found` responses back to our ParsedCard objects.
 *
 * Priority mirrors identifier reliability:
 *   mtgo_id  >  collector_number+set  >  name+set  >  name
 */
export function identifierKey(id: ScryfallIdentifier): string {
    if ('mtgo_id' in id) return `mtgo_id:${id.mtgo_id}`
    if ('collector_number' in id) return `cn:${id.set}:${id.collector_number}`
    if ('set' in id) return `ns:${id.set}:${id.name}`
    return `n:${id.name}`
}

// ─── getCardName ──────────────────────────────────────────────────────────────

/**
 * Extract a human-readable card name from a ParsedCard.
 * Iterates identifier candidates in order, returning the first one that
 * carries a `name` field.  Falls back to the identifier key string if none do.
 */
export function getCardName(pc: ParsedCard): string {
    for (const candidate of pc.identifierCandidates) {
        const id = candidate.identifier
        if ('name' in id) return id.name
    }
    return identifierKey(pc.identifierCandidates[0].identifier)
}

// ─── matchCardToRequest ───────────────────────────────────────────────────────

/**
 * Match a Scryfall-returned card to one of the outstanding request entries.
 *
 * Resolution order (most specific first):
 *   1. Exact `collector_number + set` match.
 *   2. Case-insensitive `name` match.
 *
 * The `alreadyMatched` set prevents one ParsedCard from being bound to
 * multiple Scryfall results when several cards share the same name.
 */
export function matchCardToRequest(
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
