/**
 * Format matchers for deck list detection.
 *
 * Each matcher analyses a sample of the input text and returns a MatcherResult
 * when it is confident in its identification, or null otherwise.
 *
 * Tie-break priority (deterministic signatures → structured → generic):
 *   mtgo_dek > mtgo_csv > arena_default > moxfield_exact >
 *   mtggoldfish_exact > moxfield_arena > plain_text
 */

import { DeckFormat, MatcherResult } from './types'

/** Maximum lines to sample for heuristic matchers (header lines are always included). */
const MAX_SAMPLE_LINES = 40

/** Exact CSV header produced by MTGO .csv export. */
const MTGO_CSV_HEADER =
    'Card Name,Quantity,ID #,Rarity,Set,Collector #,Premium,Sideboarded,Annotation'

/**
 * `name (SET) collector` pattern used by Moxfield exact and Arena default.
 * SET: 2–8 uppercase letters/digits/hyphens.
 * Collector: alphanumeric with optional slash, hyphen, letter suffixes (e.g. "CM2-96", "42p", "277/280", "115a").
 * Handles tab-separated quantity and trailing whitespace.
 */
const SET_COLLECTOR_RE =
    /^\d+[\tx ]+.+\s+\([A-Z0-9\-]{2,8}\)\s+[A-Za-z0-9\/\-p]+\s*$/

/**
 * `name [SET]` pattern used by MTGGoldfish exact variants.
 * SET: 2–8 uppercase letters/digits/hyphens.
 */
const SQUARE_BRACKET_SET_RE = /^\d+[\tx ]+.+\[[A-Z0-9\-]{2,8}\]/

// ─── helpers ────────────────────────────────────────────────────────────────

/** Return the first MAX_SAMPLE_LINES non-empty trimmed lines of the text. */
function sampleLines(text: string): string[] {
    return text
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0)
        .slice(0, MAX_SAMPLE_LINES)
}

// ─── deterministic matchers (early-stop) ────────────────────────────────────

/**
 * Matches MTGO .dek XML files.
 * Signal: XML prolog (`<?xml`) + `<Deck` + `<Cards` elements.
 */
export function matchMtgoDek(text: string): MatcherResult | null {
    const t = text.trimStart()
    if (!t.startsWith('<?xml')) return null
    if (!t.includes('<Deck')) return null
    if (!t.includes('<Cards')) return null
    return {
        format: 'mtgo_dek',
        score: 10,
        evidence: ['xml_prolog', 'deck_element', 'cards_element']
    }
}

/**
 * Matches MTGO .csv export files.
 * Signal: exact CSV header on the first line.
 */
export function matchMtgoCsv(text: string): MatcherResult | null {
    const firstLine = text.split('\n')[0].trim()
    if (firstLine === MTGO_CSV_HEADER) {
        return { format: 'mtgo_csv', score: 10, evidence: ['csv_header_exact'] }
    }
    return null
}

// ─── heuristic matchers ──────────────────────────────────────────────────────

/**
 * Matches Magic Arena default export.
 * Required signal: `Deck` section header.
 * Supporting signals: `(SET) number` lines, `Commander`/`Sideboard` headers.
 */
export function matchArenaDefault(lines: string[]): MatcherResult | null {
    const hasDeckHeader = lines.some((l) => /^deck$/i.test(l))
    if (!hasDeckHeader) return null

    const setCollectorCount = lines.filter((l) =>
        SET_COLLECTOR_RE.test(l)
    ).length
    if (setCollectorCount === 0) return null

    const evidence: string[] = ['deck_header', 'set_collector_pattern']
    let score = 8

    if (
        lines.some((l) => /^sideboard$/i.test(l)) ||
        lines.some((l) => /^commander$/i.test(l))
    ) {
        score = 9
        evidence.push('section_headers')
    }

    return { format: 'arena_default', score, evidence }
}

/**
 * Matches Moxfield "Copy for Moxfield" (exact set+collector format).
 * Requires `(SET) collector` lines but must NOT have a bare `Deck` header
 * (which would indicate Arena default export).
 * Supporting signal: `SIDEBOARD:` header.
 */
export function matchMoxfieldExact(lines: string[]): MatcherResult | null {
    // If a bare `Deck` header is present, defer to Arena default.
    if (lines.some((l) => /^deck$/i.test(l))) return null

    const setCollectorCount = lines.filter((l) =>
        SET_COLLECTOR_RE.test(l)
    ).length
    if (setCollectorCount === 0) return null

    const evidence: string[] = ['set_collector_pattern']
    let score = 8

    if (lines.some((l) => /^sideboard:/i.test(l))) {
        score = 9
        evidence.push('sideboard_colon_header')
    }

    return { format: 'moxfield_exact', score, evidence }
}

/**
 * Matches MTGGoldfish exact variants (tabletop, Arena, Magic Online).
 * Signal: card lines with `[SET]` in square brackets.
 */
export function matchMtgGoldfishExact(lines: string[]): MatcherResult | null {
    const squareBracketCount = lines.filter((l) =>
        SQUARE_BRACKET_SET_RE.test(l)
    ).length
    if (squareBracketCount === 0) return null

    const score = squareBracketCount >= 3 ? 8 : 7
    return {
        format: 'mtggoldfish_exact',
        score,
        evidence: ['square_bracket_set']
    }
}

/**
 * Matches Moxfield "Copy for Arena" format.
 * Signal: `About` header line (Arena-specific export block).
 * Supporting signal: `Name` header following `About`.
 */
export function matchMoxfieldArena(lines: string[]): MatcherResult | null {
    const hasAbout = lines.some((l) => /^about$/i.test(l))
    if (!hasAbout) return null

    const evidence: string[] = ['about_header']
    let score = 7

    if (lines.some((l) => /^name\s+\S/i.test(l))) {
        score = 8
        evidence.push('name_header')
    }

    return { format: 'moxfield_arena', score, evidence }
}

// ─── format priority for tie-breaking ───────────────────────────────────────

const FORMAT_PRIORITY: DeckFormat[] = [
    'arena_default',
    'moxfield_exact',
    'mtggoldfish_exact',
    'moxfield_arena',
    'plain_text'
]

// ─── main detection entry-point ──────────────────────────────────────────────

/**
 * Detect the deck list format of the provided text.
 *
 * Detection order:
 * 1. Deterministic signatures (XML, CSV) → early stop.
 * 2. Heuristic matchers → pick highest score; tie-break by FORMAT_PRIORITY.
 * 3. Fall back to `plain_text`.
 */
export function detectFormat(text: string): MatcherResult {
    // 1. Deterministic early-stop
    const xmlMatch = matchMtgoDek(text)
    if (xmlMatch) return xmlMatch

    const csvMatch = matchMtgoCsv(text)
    if (csvMatch) return csvMatch

    // 2. Heuristic matchers over a bounded sample
    const lines = sampleLines(text)
    const candidates: MatcherResult[] = []

    const arenaMatch = matchArenaDefault(lines)
    if (arenaMatch) candidates.push(arenaMatch)

    const moxExactMatch = matchMoxfieldExact(lines)
    if (moxExactMatch) candidates.push(moxExactMatch)

    const goldfishMatch = matchMtgGoldfishExact(lines)
    if (goldfishMatch) candidates.push(goldfishMatch)

    const arenaAboutMatch = matchMoxfieldArena(lines)
    if (arenaAboutMatch) candidates.push(arenaAboutMatch)

    if (candidates.length > 0) {
        candidates.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score
            // Tie-break by FORMAT_PRIORITY (lower index = higher priority)
            return (
                FORMAT_PRIORITY.indexOf(a.format) -
                FORMAT_PRIORITY.indexOf(b.format)
            )
        })
        return candidates[0]
    }

    // 3. Fallback
    return { format: 'plain_text', score: 5, evidence: ['fallback'] }
}
