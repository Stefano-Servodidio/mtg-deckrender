/**
 * Deck format detection utilities.
 * Uses score-based matching to identify the input decklist format,
 * enabling format-aware card name extraction.
 */

export const DECK_FORMAT = {
    /** Plain text: "4 Card Name" or "4x Card Name" (default fallback) */
    PLAIN: 'plain',
    /** MTG Arena export: "4 Card Name (SET) 123", optional "Deck"/"Sideboard" headers */
    ARENA: 'arena',
    /** MTGO export: "4 Card Name" for main deck, "SB: 4 Card Name" per sideboard line */
    MTGO: 'mtgo',
    /** Manabox export: "4 Card Name (SET) 123 *F*" with optional foil/etched markers */
    MANABOX: 'manabox'
} as const

export type DeckFormat = (typeof DECK_FORMAT)[keyof typeof DECK_FORMAT]

/** A matcher returns a confidence score in the range [0, 100] for a given format. */
type FormatMatcher = (decklist: string) => number

/** Shared character class for MTG set codes (3–4 uppercase alphanumeric chars) */
const SET_CODE_CHARS = '[A-Z0-9]{3,4}'

/** Matches set-code + collector-number pattern: e.g. "(M10) 101" */
const SET_COLLECTOR_RE = new RegExp(`\\(${SET_CODE_CHARS}\\)\\s+\\d+`)

/** Matches foil / etched markers used by Manabox: *F*, *E* */
const FOIL_MARKER_RE = /\*[A-Z]\*/

/** Matches the "SB: " prefix used by MTGO on individual sideboard lines */
const MTGO_SB_LINE_RE = /^SB:\s+\d/m

/** Matches the "Deck" header line produced by MTG Arena exports */
const ARENA_DECK_HEADER_RE = /^Deck\s*$/m

/** Returns the card lines (lines that start with a quantity) from the decklist */
function getCardLines(decklist: string): string[] {
    return decklist
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => /^\d+x?\s/.test(l))
}

// ---------------------------------------------------------------------------
// Individual format matchers
// ---------------------------------------------------------------------------

const matchArena: FormatMatcher = (decklist) => {
    let score = 0

    // "Deck" header is a strong Arena-specific indicator
    if (ARENA_DECK_HEADER_RE.test(decklist)) score += 40

    const cardLines = getCardLines(decklist)
    if (cardLines.length === 0) return score

    const withSetCollector = cardLines.filter((l) => SET_COLLECTOR_RE.test(l))
    if (withSetCollector.length > 0) {
        // Scale up to 60 points based on the proportion of matching lines
        score += Math.round((withSetCollector.length / cardLines.length) * 60)
    }

    return Math.min(100, score)
}

const matchManabox: FormatMatcher = (decklist) => {
    let score = 0

    const cardLines = getCardLines(decklist)
    if (cardLines.length === 0) return score

    // Foil/etched markers are unique to Manabox exports
    const withFoil = cardLines.filter((l) => FOIL_MARKER_RE.test(l))
    if (withFoil.length > 0) {
        score += Math.round((withFoil.length / cardLines.length) * 50) + 10
    }

    const withSetCollector = cardLines.filter((l) => SET_COLLECTOR_RE.test(l))
    if (withSetCollector.length > 0) {
        score += Math.round((withSetCollector.length / cardLines.length) * 40)
    }

    return Math.min(100, score)
}

const matchMTGO: FormatMatcher = (decklist) => {
    let score = 0

    // "SB: <quantity>" at the start of a line is the MTGO sideboard marker
    if (MTGO_SB_LINE_RE.test(decklist)) score += 60

    // Only award extra points for "no set codes" if the MTGO marker is present –
    // otherwise every plain decklist would outscore the plain matcher.
    if (score > 0 && !SET_COLLECTOR_RE.test(decklist)) score += 20

    return Math.min(100, score)
}

/** Plain format is the safe fallback – always scores just above zero */
const matchPlain: FormatMatcher = (_decklist) => 10

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

const matchers: Record<DeckFormat, FormatMatcher> = {
    [DECK_FORMAT.MANABOX]: matchManabox,
    [DECK_FORMAT.ARENA]: matchArena,
    [DECK_FORMAT.MTGO]: matchMTGO,
    [DECK_FORMAT.PLAIN]: matchPlain
}

/**
 * Detect the deck format from a raw decklist string using score-based matching.
 * Returns the format with the highest confidence score, defaulting to `plain`.
 */
export function detectDeckFormat(decklist: string): DeckFormat {
    let bestFormat: DeckFormat = DECK_FORMAT.PLAIN
    let bestScore = 0

    for (const [format, matcher] of Object.entries(matchers) as [
        DeckFormat,
        FormatMatcher
    ][]) {
        const score = matcher(decklist)
        if (score > bestScore) {
            bestScore = score
            bestFormat = format
        }
    }

    return bestFormat
}

/**
 * Normalize a single card line by stripping format-specific tokens,
 * leaving only the "quantity name" form expected by `getUniqueCards`.
 */
export function normalizeCardLine(line: string, format: DeckFormat): string {
    let normalized = line.trim()

    // MTGO: strip "SB: " prefix so the rest of the line is a plain card entry.
    // (parseDecklist already splits on "SB:" as a section separator, but this
    // handles edge cases where the prefix is encountered inside a section.)
    if (format === DECK_FORMAT.MTGO) {
        normalized = normalized.replace(/^SB:\s*/i, '')
    }

    // Arena / Manabox: strip set-code + collector-number suffix and everything after.
    // Example: "4 Lightning Bolt (M10) 101"  →  "4 Lightning Bolt"
    //          "4 Lightning Bolt (M10) 101 *F*"  →  "4 Lightning Bolt"
    if (format === DECK_FORMAT.ARENA || format === DECK_FORMAT.MANABOX) {
        normalized = normalized.replace(
            new RegExp(`\\s+\\(${SET_CODE_CHARS}\\)\\s+\\d+.*$`),
            ''
        )
    }

    return normalized
}
