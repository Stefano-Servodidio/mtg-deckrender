/**
 * Supported deck list formats.
 * Priority order for tie-breaking (highest first):
 * 1. mtgo_dek - MTGO XML .dek file (most deterministic)
 * 2. mtgo_csv - MTGO .csv export
 * 3. arena_default - Magic Arena default export (set+collector pattern + section headers)
 * 4. moxfield_exact - Moxfield "Copy for Moxfield" (set+collector pattern)
 * 5. mtggoldfish_exact - MTGGoldfish exact versions (square-bracket set)
 * 6. moxfield_arena - Moxfield "Copy for Arena" (About/Name/Deck block, name only)
 * 7. plain_text - MTGO copy, Moxfield plain text, MTGGoldfish text (fallback)
 */
export type DeckFormat =
    | 'mtgo_dek'
    | 'mtgo_csv'
    | 'arena_default'
    | 'moxfield_exact'
    | 'mtggoldfish_exact'
    | 'moxfield_arena'
    | 'plain_text'

/** Result of a format detection matcher */
export interface MatcherResult {
    format: DeckFormat
    score: number
    evidence: string[]
}

/**
 * Scryfall /cards/collection identifier types.
 * Ordered by reliability (preferred first):
 * 1. mtgo_id  (MTGO CatID / ID#)
 * 2. collector_number + set
 * 3. name + set
 * 4. name only (last resort)
 */
export type ScryfallIdentifier =
    | { mtgo_id: number }
    | { collector_number: string; set: string }
    | { name: string; set: string }
    | { name: string }

export type IdentifierCandidateType =
    | 'mtgo_id'
    | 'collector_set'
    | 'name_set'
    | 'name'

export interface IdentifierCandidate {
    type: IdentifierCandidateType
    identifier: ScryfallIdentifier
}

/**
 * A single parsed card entry.
 * groupId:
 *   0 = commander
 *   1 = main deck
 *   2 = sideboard
 */
export interface ParsedCard {
    quantity: number
    groupId: number
    rawLine: string
    identifierCandidates: IdentifierCandidate[] // ordered best → worst
}

/** Result of parsing a full decklist */
export interface ParsedDecklist {
    format: DeckFormat
    score: number
    evidence: string[]
    cards: ParsedCard[]
}
