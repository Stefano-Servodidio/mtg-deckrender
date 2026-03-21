/**
 * Builder functions for Scryfall /cards/collection identifier candidates.
 *
 * Candidates should be ordered best → worst in ParsedCard.identifierCandidates:
 *   mtgo_id  >  collector_set  >  name_set  >  name
 */

import { IdentifierCandidate } from './types'

/** Build a Scryfall identifier candidate using an MTGO CatID / ID#. */
export function buildMtgoIdCandidate(catId: number): IdentifierCandidate {
    return {
        type: 'mtgo_id',
        identifier: { mtgo_id: catId }
    }
}

/**
 * Build a Scryfall identifier candidate using a set code and collector number.
 * The set code is lower-cased to match Scryfall's convention.
 * Collector numbers like "277/280" are trimmed to "277".
 */
export function buildCollectorSetCandidate(
    collectorNumber: string,
    set: string
): IdentifierCandidate {
    // Strip "/total" suffix from collector numbers (e.g. "277/280" → "277")
    const trimmedCollector = collectorNumber.split('/')[0]
    return {
        type: 'collector_set',
        identifier: {
            collector_number: trimmedCollector,
            set: set.toLowerCase()
        }
    }
}

/** Build a Scryfall identifier candidate using a card name and set code. */
export function buildNameSetCandidate(
    name: string,
    set: string
): IdentifierCandidate {
    return {
        type: 'name_set',
        identifier: { name, set: set.toLowerCase() }
    }
}

/** Build a Scryfall identifier candidate using a card name only (last resort). */
export function buildNameCandidate(name: string): IdentifierCandidate {
    return {
        type: 'name',
        identifier: { name }
    }
}
