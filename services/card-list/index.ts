/**
 * Deck list parsing orchestrator.
 *
 * Provides a single entry point `parseDecklistToRequests` that:
 *  1. Detects the deck list format (or uses a pre-identified one).
 *  2. Dispatches to the appropriate format-specific parser.
 *  3. Returns a `ParsedDecklist` ready for use in API routes.
 *
 * groupId convention (used throughout the application):
 *   0 = commander
 *   1 = main deck
 *   2 = sideboard
 */

import { detectFormat } from './listMatchers'
import {
    parseMtgoDek,
    parseMtgoCsv,
    parseMoxfieldExact,
    parseArenaDefault,
    parseMtgGoldfishExact,
    parseMoxfieldArena,
    parsePlainText
} from './listParsers'
import { DeckFormat, ParsedDecklist } from './types'

/**
 * Parse a raw deck list string into a normalised list of card requests.
 *
 * @param decklist - Raw deck list text in any supported format.
 * @param format   - Optional pre-identified format (skips auto-detection).
 *                   Useful when the format is known from a file extension
 *                   (e.g. `.dek`, `.csv`) and was identified client-side.
 */
export function parseDecklistToRequests(
    decklist: string,
    format?: DeckFormat
): ParsedDecklist {
    const start = Date.now()

    // Step 1: detect or use provided format
    let matcherResult = format
        ? { format, score: 10, evidence: ['provided_by_client'] }
        : detectFormat(decklist)

    const detectedFormat = matcherResult.format

    // Step 2: dispatch to the correct parser
    let cards = dispatchParser(detectedFormat, decklist)

    // Step 3: non-prod observability log
    if (process.env.NODE_ENV !== 'production') {
        console.debug(
            `[parseDecklistToRequests] format=${detectedFormat} score=${matcherResult.score}` +
                ` evidence=${matcherResult.evidence.join(',')}` +
                ` cards=${cards.length} ms=${Date.now() - start}`
        )
    }

    return {
        format: detectedFormat,
        score: matcherResult.score,
        evidence: matcherResult.evidence,
        cards
    }
}

function dispatchParser(format: DeckFormat, text: string) {
    switch (format) {
        case 'mtgo_dek':
            return parseMtgoDek(text)
        case 'mtgo_csv':
            return parseMtgoCsv(text)
        case 'moxfield_exact':
            return parseMoxfieldExact(text)
        case 'arena_default':
            return parseArenaDefault(text)
        case 'mtggoldfish_exact':
            return parseMtgGoldfishExact(text)
        case 'moxfield_arena':
            return parseMoxfieldArena(text)
        case 'plain_text':
        default:
            return parsePlainText(text)
    }
}

export type { DeckFormat, ParsedDecklist } from './types'
export type {
    ParsedCard,
    IdentifierCandidate,
    ScryfallIdentifier
} from './types'
