/**
 * Deck format detection utilities.
 * Uses score-based matching to identify the input decklist format,
 * enabling format-aware card name extraction.
 *
 * Supported text-based formats (complete list per DECK-FORMATS.md):
 *
 *  PLAIN          – Plain "qty name" lines. Covers: Moxfield (Copy for MTGO / Copy plain
 *                   text / Download for MTGO), Magic Online .txt export, MTGGoldfish text.
 *  ARENA          – "(SET) number" suffix. Covers: Magic Arena default export, Moxfield
 *                   "Copy for Moxfield".
 *  MTGO           – Inline "SB: " per-line sideboard prefix.
 *  MANABOX        – "(SET) number *F* / *E*" foil/etched markers.
 *  MOXFIELD_ARENA – Moxfield "Copy for Arena": plain names, "About" metadata header,
 *                   optional "Commander" label. Commander group detection is tracked;
 *                   full group assignment is deferred to a future phase.
 *  GOLDFISH_TABLETOP   – MTGGoldfish exact tabletop: "4 Name [SET]" (square brackets,
 *                        no collector number). Additional row cleanup per
 *                        plan-deckFormatDetection.prompt.md is pending.
 *  GOLDFISH_ANNOTATED  – MTGGoldfish exact Arena/MTGO: "4 Name [SET] (F)" (brackets +
 *                        foil/treatment annotation).
 *
 * NOT YET SUPPORTED (require plan-deckFormatDetection.prompt.md details + file-based
 * parsing outside this text pipeline):
 *  – Magic Online .dek XML export (identify by XML signature + <Deck> element)
 *  – Magic Online .csv export (identify by CSV column layout)
 */

export const DECK_FORMAT = {
    /** Plain text: "4 Card Name" or "4x Card Name" (default fallback).
     *  Covers: Moxfield Copy for MTGO/plain/Download, MTGO .txt, MTGGoldfish text. */
    PLAIN: 'plain',
    /** "(SET) number" suffix: Magic Arena default export, Moxfield "Copy for Moxfield". */
    ARENA: 'arena',
    /** Inline "SB: " per-line sideboard prefix (Magic Online / MTGO exports). */
    MTGO: 'mtgo',
    /** "(SET) number *F* / *E*" foil/etched markers (Manabox export). */
    MANABOX: 'manabox',
    /** Moxfield "Copy for Arena": plain card names, "About" metadata header,
     *  optional "Commander" section label.
     *  NOTE: Commander group assignment requires a future phase. */
    MOXFIELD_ARENA: 'moxfield_arena',
    /** MTGGoldfish "Exact card versions (tabletop)": "4 Name [SET]" (square brackets,
     *  no collector number).
     *  NOTE: Additional row cleanup per plan-deckFormatDetection.prompt.md is pending. */
    GOLDFISH_TABLETOP: 'goldfish_tabletop',
    /** MTGGoldfish "Exact card versions (Arena / Magic Online)": "4 Name [SET] (F)"
     *  — square-bracket set code plus foil/treatment annotation like "(F)". */
    GOLDFISH_ANNOTATED: 'goldfish_annotated'
} as const

export type DeckFormat = (typeof DECK_FORMAT)[keyof typeof DECK_FORMAT]

/** A matcher returns a confidence score in the range [0, 100] for a given format. */
type FormatMatcher = (decklist: string) => number

// ---------------------------------------------------------------------------
// Shared regex primitives
// ---------------------------------------------------------------------------

/** Shared character class for MTG set codes (3–4 uppercase alphanumeric chars) */
const SET_CODE_CHARS = '[A-Z0-9]{3,4}'

/** Matches set-code + collector-number pattern: e.g. "(M10) 101" (Arena / Moxfield) */
const SET_COLLECTOR_RE = new RegExp(`\\(${SET_CODE_CHARS}\\)\\s+\\d+`)

/** Matches foil / etched markers used by Manabox: *F*, *E* */
const FOIL_MARKER_RE = /\*[A-Z]\*/

/** Matches the "SB: " prefix used by MTGO on individual sideboard lines */
const MTGO_SB_LINE_RE = /^SB:\s+\d/m

/** Matches the "Deck" header line produced by MTG Arena exports */
const ARENA_DECK_HEADER_RE = /^Deck\s*$/m

/** Matches the "About" metadata header in Moxfield "Copy for Arena" exports */
const MOXFIELD_ABOUT_HEADER_RE = /^About\s*$/m

/** Matches a MTGGoldfish-style square-bracket set code: e.g. "[TLA]" */
const GOLDFISH_BRACKET_SET_RE = new RegExp(`\\[${SET_CODE_CHARS}\\]`)

/** Matches a Goldfish square-bracket set code followed by a foil/treatment annotation,
 *  e.g. "[TLA] (F)" or "[ICE] (FT)". The annotation must be at least one uppercase letter
 *  to avoid matching unrelated parenthesised text. */
const GOLDFISH_ANNOTATION_RE = new RegExp(
    `\\[${SET_CODE_CHARS}\\]\\s*\\([A-Z]+`
)

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

const matchMoxfieldArena: FormatMatcher = (decklist) => {
    let score = 0

    // "About" on its own line is the distinctive Moxfield Arena copy header
    if (MOXFIELD_ABOUT_HEADER_RE.test(decklist)) score += 60

    // No set codes expected (plain card names only)
    if (
        score > 0 &&
        !SET_COLLECTOR_RE.test(decklist) &&
        !GOLDFISH_BRACKET_SET_RE.test(decklist)
    ) {
        score += 20
    }

    return Math.min(100, score)
}

const matchGoldfishAnnotated: FormatMatcher = (decklist) => {
    const cardLines = getCardLines(decklist)
    if (cardLines.length === 0) return 0

    const withBracket = cardLines.filter((l) => GOLDFISH_BRACKET_SET_RE.test(l))
    if (withBracket.length === 0) return 0

    // Annotations (e.g. "(F)") after the bracket set code are exclusive to this
    // format. Any annotated line is a definitive signal.
    const withAnnotation = withBracket.filter((l) =>
        GOLDFISH_ANNOTATION_RE.test(l)
    )
    if (withAnnotation.length === 0) return 0

    const bracketProportion = withBracket.length / cardLines.length
    // Score = bracket proportion * 50 (max 50) + 55 annotation bonus.
    // The +55 ensures this format always outscores GOLDFISH_TABLETOP (max 60)
    // when annotations are present, since annotations are exclusive to this format.
    return Math.min(100, Math.round(bracketProportion * 50) + 55)
}

const matchGoldfishTabletop: FormatMatcher = (decklist) => {
    const cardLines = getCardLines(decklist)
    if (cardLines.length === 0) return 0

    const withBracket = cardLines.filter((l) => GOLDFISH_BRACKET_SET_RE.test(l))
    if (withBracket.length === 0) return 0

    // Score = base 10 + bracket proportion * 50.
    // Max score is 60, which is intentionally below GOLDFISH_ANNOTATED (min ~55)
    // so the annotated format always wins when annotation markers are present.
    return Math.min(
        100,
        Math.round((withBracket.length / cardLines.length) * 50) + 10
    )
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
    [DECK_FORMAT.MOXFIELD_ARENA]: matchMoxfieldArena,
    [DECK_FORMAT.GOLDFISH_ANNOTATED]: matchGoldfishAnnotated,
    [DECK_FORMAT.GOLDFISH_TABLETOP]: matchGoldfishTabletop,
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

    // Arena / Manabox: strip "(SET) number" suffix and everything after.
    // Example: "4 Lightning Bolt (M10) 101"      →  "4 Lightning Bolt"
    //          "4 Lightning Bolt (M10) 101 *F*"   →  "4 Lightning Bolt"
    if (format === DECK_FORMAT.ARENA || format === DECK_FORMAT.MANABOX) {
        normalized = normalized.replace(
            new RegExp(`\\s+\\(${SET_CODE_CHARS}\\)\\s+\\d+.*$`),
            ''
        )
    }

    // Goldfish tabletop / annotated: strip "[SET]" and everything that follows.
    // Example: "4 Boomerang Basics [TLA]"          →  "4 Boomerang Basics"
    //          "4 Boomerang Basics [TLA] (F)"       →  "4 Boomerang Basics"
    // NOTE: Additional Goldfish-specific row cleanup is pending details from
    //       plan-deckFormatDetection.prompt.md.
    if (
        format === DECK_FORMAT.GOLDFISH_TABLETOP ||
        format === DECK_FORMAT.GOLDFISH_ANNOTATED
    ) {
        normalized = normalized.replace(
            new RegExp(`\\s+\\[${SET_CODE_CHARS}\\].*$`),
            ''
        )
    }

    // MOXFIELD_ARENA: card names are plain – no token stripping needed.
    // Commander group assignment is deferred to a future phase.

    return normalized
}
