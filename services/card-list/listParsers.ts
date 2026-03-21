/**
 * Format-specific deck list parsers.
 *
 * Each parser converts a raw decklist string into a normalized array of
 * ParsedCard objects, ordered best-identifier-first in identifierCandidates.
 *
 * groupId convention:
 *   0 = commander
 *   1 = main deck
 *   2 = sideboard
 */

import { ParsedCard } from './types'
import {
    buildMtgoIdCandidate,
    buildCollectorSetCandidate,
    buildNameSetCandidate,
    buildNameCandidate
} from './identifierBuilders'

// ─── shared helpers ──────────────────────────────────────────────────────────

/**
 * Parse a quantity + card-name token from the start of a (trimmed) line.
 * Supports: "4 Name", "4x Name", "4\tName", "4\t\tName".
 * Returns null if the line is not a valid card line.
 */
function parseQtyAndRest(
    rawLine: string
): { quantity: number; rest: string } | null {
    // Trim trailing whitespace (including tabs from e.g. Moxfield tab-export)
    const line = rawLine.trim()
    const m = line.match(/^(\d+)[x\t ]+(.+)$/)
    if (!m) return null
    const quantity = parseInt(m[1], 10)
    if (isNaN(quantity) || quantity <= 0) return null
    return { quantity, rest: m[2].trim() }
}

/**
 * For double-faced cards exported as "Front / Back" or "Front/Back",
 * keep only the front face name.
 */
function trimDfc(name: string): string {
    const slashIdx = name.indexOf(' / ')
    if (slashIdx !== -1) return name.slice(0, slashIdx).trim()
    // Some exports use "Name/Name" without spaces
    const compactIdx = name.indexOf('/')
    if (compactIdx > 0 && compactIdx < name.length - 1) {
        // Only trim if first part looks like a real word (no set codes)
        const part = name.slice(0, compactIdx).trim()
        if (/[a-z]/i.test(part)) return part
    }
    return name
}

// ─── MTGO .dek XML parser ────────────────────────────────────────────────────

const CARDS_ELEMENT_RE =
    /<Cards\s+CatID="(\d+)"\s+Quantity="(\d+)"\s+Sideboard="(\w+)"\s+Name="([^"]+)"\s+Annotation="(\d+)"/g

/**
 * Parse an MTGO .dek XML string.
 * - Commander annotation (16777728) → groupId 0
 * - Sideboard="true" → groupId 2
 * - Sideboard="false" → groupId 1
 * Primary identifier: mtgo_id (CatID). Fallback: name.
 */
export function parseMtgoDek(text: string): ParsedCard[] {
    const cards: ParsedCard[] = []
    let m: RegExpExecArray | null

    CARDS_ELEMENT_RE.lastIndex = 0
    while ((m = CARDS_ELEMENT_RE.exec(text)) !== null) {
        const catId = parseInt(m[1], 10)
        const quantity = parseInt(m[2], 10)
        const sideboard = m[3].toLowerCase() === 'true'
        const name = m[4]
        const annotation = parseInt(m[5], 10)

        // Commander annotation value
        const isCommander = annotation === 16777728

        const groupId = isCommander ? 0 : sideboard ? 2 : 1

        cards.push({
            quantity,
            groupId,
            rawLine: m[0],
            identifierCandidates: [
                buildMtgoIdCandidate(catId),
                buildNameCandidate(name)
            ]
        })
    }

    return cards
}

// ─── MTGO .csv parser ────────────────────────────────────────────────────────

/**
 * Minimal CSV row tokenizer that handles double-quoted fields.
 */
function parseCsvRow(row: string): string[] {
    const fields: string[] = []
    let cur = ''
    let inQuote = false

    for (let i = 0; i < row.length; i++) {
        const ch = row[i]
        if (ch === '"') {
            inQuote = !inQuote
        } else if (ch === ',' && !inQuote) {
            fields.push(cur)
            cur = ''
        } else {
            cur += ch
        }
    }
    fields.push(cur)
    return fields
}

/**
 * Parse an MTGO .csv export string.
 * Columns: Card Name, Quantity, ID #, Rarity, Set, Collector #, Premium, Sideboarded, Annotation
 * - Annotation 16777728 + Sideboarded=Yes → groupId 0 (commander)
 * - Sideboarded=Yes → groupId 2
 * - Sideboarded=No  → groupId 1
 * Primary: mtgo_id. Fallback: collector_set, name.
 */
export function parseMtgoCsv(text: string): ParsedCard[] {
    const lines = text.split('\n')
    if (lines.length < 2) return []

    // Skip header row (index 0)
    const cards: ParsedCard[] = []

    for (let i = 1; i < lines.length; i++) {
        const raw = lines[i].trim()
        if (!raw) continue

        const fields = parseCsvRow(raw)
        if (fields.length < 9) continue

        const name = fields[0].trim()
        const quantity = parseInt(fields[1], 10)
        const mtgoId = parseInt(fields[2], 10)
        const set = fields[4].trim()
        const collectorRaw = fields[5].trim()
        const sideboarded = fields[7].trim().toLowerCase() === 'yes'
        const annotation = parseInt(fields[8], 10)

        if (!name || isNaN(quantity) || quantity <= 0) continue

        const isCommander = sideboarded && annotation === 16777728
        const groupId = isCommander ? 0 : sideboarded ? 2 : 1

        const candidates = []
        if (!isNaN(mtgoId) && mtgoId > 0) {
            candidates.push(buildMtgoIdCandidate(mtgoId))
        }
        if (set && collectorRaw) {
            candidates.push(buildCollectorSetCandidate(collectorRaw, set))
        }
        candidates.push(buildNameCandidate(name))

        cards.push({
            quantity,
            groupId,
            rawLine: raw,
            identifierCandidates: candidates
        })
    }

    return cards
}

// ─── set+collector pattern (Moxfield exact & Arena default) ──────────────────

/**
 * Parse a single card line in `count name (SET) collector` format.
 * Returns null if the line does not match.
 */
function parseSetCollectorLine(
    rawLine: string,
    groupId: number
): ParsedCard | null {
    const line = rawLine.trim()
    const m = line.match(
        /^(\d+)[\tx ]+(.+?)\s+\(([A-Z0-9\-]{2,8})\)\s+([A-Za-z0-9\/\-p]+)\s*$/
    )
    if (!m) return null

    const quantity = parseInt(m[1], 10)
    if (isNaN(quantity) || quantity <= 0) return null

    const name = trimDfc(m[2].trim())
    const set = m[3]
    const collector = m[4]

    return {
        quantity,
        groupId,
        rawLine,
        identifierCandidates: [
            buildCollectorSetCandidate(collector, set),
            buildNameSetCandidate(name, set),
            buildNameCandidate(name)
        ]
    }
}

// ─── Moxfield exact parser ────────────────────────────────────────────────────

/** Separator patterns shared by Moxfield/MTGO plain-text formats. */
const SIDEBOARD_HEADER_RE = /^sideboard[:\s]*$/i
const SIDEBOARD_COLON_RE = /^sideboard:/i
const DOUBLE_NEWLINE_RE = /\r?\n\r?\n/

/**
 * Parse a Moxfield "Copy for Moxfield" decklist.
 * Format: `count name (SET) collector` lines.
 * Sections: main deck (groupId 1) / sideboard after `SIDEBOARD:` or blank line (groupId 2).
 * Commander identification is not possible from this format; all cards are groupId 1 or 2.
 */
export function parseMoxfieldExact(text: string): ParsedCard[] {
    const cards: ParsedCard[] = []

    // Split into sections by SIDEBOARD: or double newline
    const sideboardMatch = SIDEBOARD_COLON_RE.exec(text)
    let mainText = text
    let sideText = ''

    if (sideboardMatch) {
        mainText = text.slice(0, sideboardMatch.index)
        sideText = text.slice(sideboardMatch.index + sideboardMatch[0].length)
    } else {
        // Try double-newline split
        const parts = text.split(DOUBLE_NEWLINE_RE)
        if (parts.length >= 2) {
            mainText = parts[0]
            sideText = parts.slice(1).join('\n\n')
        }
    }

    for (const rawLine of mainText.split('\n')) {
        const card = parseSetCollectorLine(rawLine, 1)
        if (card) cards.push(card)
    }

    if (sideText) {
        for (const rawLine of sideText.split('\n')) {
            const card = parseSetCollectorLine(rawLine, 2)
            if (card) cards.push(card)
        }
    }

    return cards
}

// ─── Arena default export parser ─────────────────────────────────────────────

/**
 * Parse a Magic Arena default export.
 * Sections: `Commander` (groupId 0), `Deck` (groupId 1), `Sideboard` (groupId 2).
 * Card lines: `count name (SET) number`.
 */
export function parseArenaDefault(text: string): ParsedCard[] {
    const cards: ParsedCard[] = []
    const lines = text.split('\n')

    let currentGroupId = 1 // default to main deck

    for (const rawLine of lines) {
        const trimmed = rawLine.trim()

        if (/^commander$/i.test(trimmed)) {
            currentGroupId = 0
            continue
        }
        if (/^deck$/i.test(trimmed)) {
            currentGroupId = 1
            continue
        }
        if (/^sideboard$/i.test(trimmed)) {
            currentGroupId = 2
            continue
        }
        // Skip metadata lines (About, Name <deck name>, empty)
        if (!trimmed || /^about$/i.test(trimmed) || /^name\s+/i.test(trimmed)) {
            continue
        }

        const card = parseSetCollectorLine(rawLine, currentGroupId)
        if (card) cards.push(card)
    }

    return cards
}

// ─── MTGGoldfish exact parser ─────────────────────────────────────────────────

/**
 * Parse a single MTGGoldfish exact card line.
 * Format: `count name [optional: <treatment>] [SET] [optional: (F|FE)]`
 * Treatment and foil markers are stripped; only name and SET are used.
 * Returns null if the line does not match the pattern.
 */
function parseMtgGoldfishLine(
    rawLine: string,
    groupId: number
): ParsedCard | null {
    const line = rawLine.trim()

    const parsed = parseQtyAndRest(line)
    if (!parsed) return null

    let { quantity, rest } = parsed

    // Strip trailing foil suffix: "(F)" or "(FE)"
    rest = rest.replace(/\s+\(F[E]?\)\s*$/, '').trim()

    // Extract "[SET]" from end
    const setMatch = rest.match(/\[([A-Z0-9\-]{2,8})\]\s*$/)
    let set: string | undefined
    if (setMatch) {
        set = setMatch[1]
        rest = rest.slice(0, setMatch.index).trim()
    }

    // Strip treatment annotations: "<anything>"
    rest = rest.replace(/\s*<[^>]+>\s*/g, ' ').trim()

    // Remaining text is the card name; clean up DFC notation
    const name = trimDfc(rest)
    if (!name) return null

    const candidates = set
        ? [buildNameSetCandidate(name, set), buildNameCandidate(name)]
        : [buildNameCandidate(name)]

    return {
        quantity,
        groupId,
        rawLine,
        identifierCandidates: candidates
    }
}

/**
 * Parse MTGGoldfish exact variant decklists (tabletop, Arena, Magic Online).
 * Section separator: blank line (main → sideboard).
 * Commander identification is not available in this format.
 */
export function parseMtgGoldfishExact(text: string): ParsedCard[] {
    const cards: ParsedCard[] = []

    // Split sections by blank lines
    const sections = text.split(DOUBLE_NEWLINE_RE)

    for (let s = 0; s < sections.length; s++) {
        const groupId = s === 0 ? 1 : 2 // first section = main, rest = sideboard
        for (const rawLine of sections[s].split('\n')) {
            const card = parseMtgGoldfishLine(rawLine, groupId)
            if (card) cards.push(card)
        }
    }

    return cards
}

// ─── Moxfield Arena copy parser ───────────────────────────────────────────────

/**
 * Parse a Moxfield "Copy for Arena" decklist.
 * Sections: `Commander` (groupId 0), `Deck` (groupId 1), `Sideboard` (groupId 2).
 * Card lines are plain `count name` (no set info).
 */
export function parseMoxfieldArena(text: string): ParsedCard[] {
    const cards: ParsedCard[] = []
    const lines = text.split('\n')

    let currentGroupId = 1

    for (const rawLine of lines) {
        const trimmed = rawLine.trim()

        if (/^commander$/i.test(trimmed)) {
            currentGroupId = 0
            continue
        }
        if (/^deck$/i.test(trimmed)) {
            currentGroupId = 1
            continue
        }
        if (/^sideboard$/i.test(trimmed)) {
            currentGroupId = 2
            continue
        }
        // Skip About / Name / empty lines
        if (!trimmed || /^about$/i.test(trimmed) || /^name\s+/i.test(trimmed)) {
            continue
        }

        const parsed = parseQtyAndRest(rawLine)
        if (!parsed) continue

        const name = trimDfc(parsed.rest)
        if (!name) continue

        cards.push({
            quantity: parsed.quantity,
            groupId: currentGroupId,
            rawLine,
            identifierCandidates: [buildNameCandidate(name)]
        })
    }

    return cards
}

// ─── Plain text / MTGO copy parser ───────────────────────────────────────────

/**
 * Parse a plain-text or MTGO copy decklist.
 * Supports:
 * - "count name" lines (space or tab separated)
 * - `SIDEBOARD:` / `Sideboard:` / `SB:` / `--` header for sideboard section
 * - Blank-line section split: if the last section has exactly 1 unique card
 *   (total count may vary) and no SIDEBOARD marker was found, that card is
 *   treated as the commander (groupId 0).
 *
 * All other formats fall through to this parser as a last resort.
 */
export function parsePlainText(text: string): ParsedCard[] {
    const cards: ParsedCard[] = []

    // Normalise line endings
    const normalised = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

    // Explicit sideboard markers
    const SIDEBOARD_MARKERS = /^(sideboard[:\s]*|sb:|sb\s*$|--\s*)$/im

    const sideboardMarkerMatch = SIDEBOARD_MARKERS.exec(normalised)
    let foundExplicitSideboard = false

    if (sideboardMarkerMatch) {
        foundExplicitSideboard = true
        const mainText = normalised.slice(0, sideboardMarkerMatch.index)
        const sideText = normalised.slice(
            sideboardMarkerMatch.index + sideboardMarkerMatch[0].length
        )

        for (const rawLine of mainText.split('\n')) {
            const parsed = parseQtyAndRest(rawLine)
            if (!parsed) continue
            const name = trimDfc(parsed.rest)
            if (name) {
                cards.push({
                    quantity: parsed.quantity,
                    groupId: 1,
                    rawLine,
                    identifierCandidates: [buildNameCandidate(name)]
                })
            }
        }

        for (const rawLine of sideText.split('\n')) {
            const parsed = parseQtyAndRest(rawLine)
            if (!parsed) continue
            const name = trimDfc(parsed.rest)
            if (name) {
                cards.push({
                    quantity: parsed.quantity,
                    groupId: 2,
                    rawLine,
                    identifierCandidates: [buildNameCandidate(name)]
                })
            }
        }

        return cards
    }

    // No explicit sideboard marker: split by double newline
    const sections = normalised.split(DOUBLE_NEWLINE_RE)

    // Heuristic: if the last section has exactly 1 card line, treat as commander
    let commanderSection: string | null = null
    let mainSections = sections

    if (sections.length >= 2) {
        const lastSection = sections[sections.length - 1].trim()
        const lastSectionLines = lastSection
            .split('\n')
            .filter((l) => parseQtyAndRest(l) !== null)

        if (lastSectionLines.length === 1) {
            commanderSection = lastSection
            mainSections = sections.slice(0, -1)
        }
    }

    for (let s = 0; s < mainSections.length; s++) {
        // First section → main (groupId 1), subsequent → sideboard (groupId 2)
        const groupId = s === 0 ? 1 : 2
        for (const rawLine of mainSections[s].split('\n')) {
            const parsed = parseQtyAndRest(rawLine)
            if (!parsed) continue
            const name = trimDfc(parsed.rest)
            if (name) {
                cards.push({
                    quantity: parsed.quantity,
                    groupId,
                    rawLine,
                    identifierCandidates: [buildNameCandidate(name)]
                })
            }
        }
    }

    if (commanderSection) {
        for (const rawLine of commanderSection.split('\n')) {
            const parsed = parseQtyAndRest(rawLine)
            if (!parsed) continue
            const name = trimDfc(parsed.rest)
            if (name) {
                cards.push({
                    quantity: parsed.quantity,
                    groupId: 0,
                    rawLine,
                    identifierCandidates: [buildNameCandidate(name)]
                })
            }
        }
    }

    return cards
}
