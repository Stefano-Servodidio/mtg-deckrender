import { describe, expect, test } from 'vitest'
import {
    DECK_FORMAT,
    detectDeckFormat,
    normalizeCardLine
} from '../deckFormatDetection'

// ---------------------------------------------------------------------------
// Sample decklists used across multiple tests
// ---------------------------------------------------------------------------

const plainDecklist = `4 Lightning Bolt
2 Counterspell
1 Jace, the Mind Sculptor

2 Pyroblast
1 Rest in Peace`

const arenaDecklist = `Deck
4 Lightning Bolt (M10) 101
2 Counterspell (TSR) 46
1 Jace, the Mind Sculptor (WWK) 31

Sideboard
2 Pyroblast (ME4) 115
1 Rest in Peace (RTR) 20`

const arenaNoHeaderDecklist = `4 Lightning Bolt (M10) 101
2 Counterspell (TSR) 46
1 Jace, the Mind Sculptor (WWK) 31

2 Pyroblast (ME4) 115`

const mtgoDecklist = `4 Lightning Bolt
2 Counterspell
1 Jace, the Mind Sculptor
SB: 2 Pyroblast
SB: 1 Rest in Peace`

const manaboxDecklist = `4 Lightning Bolt (M10) 101 *F*
2 Counterspell (TSR) 46
1 Jace, the Mind Sculptor (WWK) 31 *E*

2 Pyroblast (ME4) 115 *F*`

const manaboxNoFoilDecklist = `4 Lightning Bolt (M10) 101
2 Counterspell (TSR) 46

2 Pyroblast (ME4) 115`

// ---------------------------------------------------------------------------
// detectDeckFormat
// ---------------------------------------------------------------------------

describe('detectDeckFormat', () => {
    test('returns plain for a basic plain-text decklist', () => {
        expect(detectDeckFormat(plainDecklist)).toBe(DECK_FORMAT.PLAIN)
    })

    test('returns arena for a full MTG Arena export (with Deck header)', () => {
        expect(detectDeckFormat(arenaDecklist)).toBe(DECK_FORMAT.ARENA)
    })

    test('returns arena for an Arena-style decklist without the Deck header', () => {
        expect(detectDeckFormat(arenaNoHeaderDecklist)).toBe(DECK_FORMAT.ARENA)
    })

    test('returns mtgo for a decklist with SB: prefixed sideboard lines', () => {
        expect(detectDeckFormat(mtgoDecklist)).toBe(DECK_FORMAT.MTGO)
    })

    test('returns manabox for a decklist with foil markers and set codes', () => {
        expect(detectDeckFormat(manaboxDecklist)).toBe(DECK_FORMAT.MANABOX)
    })

    test('returns arena (not manabox) when set codes are present but no foil markers', () => {
        // Without foil markers, Manabox score is lower than Arena score
        expect(detectDeckFormat(manaboxNoFoilDecklist)).toBe(DECK_FORMAT.ARENA)
    })

    test('returns plain for an empty decklist', () => {
        expect(detectDeckFormat('')).toBe(DECK_FORMAT.PLAIN)
    })

    test('returns plain for a decklist with no recognisable format signals', () => {
        expect(detectDeckFormat('4x Lightning Bolt\n2x Counterspell')).toBe(
            DECK_FORMAT.PLAIN
        )
    })

    test('arena score increases with more lines that have set codes', () => {
        // A single card with a set code should still resolve to arena
        expect(detectDeckFormat('4 Lightning Bolt (M10) 101')).toBe(
            DECK_FORMAT.ARENA
        )
    })

    test('prefers manabox over arena when foil markers are present', () => {
        const mixed = `4 Lightning Bolt (M10) 101 *F*
2 Counterspell (TSR) 46 *F*
1 Island (ISD) 254 *E*`
        expect(detectDeckFormat(mixed)).toBe(DECK_FORMAT.MANABOX)
    })
})

// ---------------------------------------------------------------------------
// normalizeCardLine
// ---------------------------------------------------------------------------

describe('normalizeCardLine', () => {
    describe('plain format – no changes', () => {
        test('leaves a plain "quantity name" line unchanged', () => {
            expect(
                normalizeCardLine('4 Lightning Bolt', DECK_FORMAT.PLAIN)
            ).toBe('4 Lightning Bolt')
        })

        test('leaves a "4x Card Name" line unchanged', () => {
            expect(
                normalizeCardLine('4x Lightning Bolt', DECK_FORMAT.PLAIN)
            ).toBe('4x Lightning Bolt')
        })
    })

    describe('arena format – strip set code + collector number', () => {
        test('strips "(SET) number" suffix from an arena card line', () => {
            expect(
                normalizeCardLine(
                    '4 Lightning Bolt (M10) 101',
                    DECK_FORMAT.ARENA
                )
            ).toBe('4 Lightning Bolt')
        })

        test('strips suffix from a multi-word card name', () => {
            expect(
                normalizeCardLine(
                    '1 Jace, the Mind Sculptor (WWK) 31',
                    DECK_FORMAT.ARENA
                )
            ).toBe('1 Jace, the Mind Sculptor')
        })

        test('leaves a plain line unchanged when no suffix present', () => {
            expect(
                normalizeCardLine('4 Lightning Bolt', DECK_FORMAT.ARENA)
            ).toBe('4 Lightning Bolt')
        })

        test('trims surrounding whitespace', () => {
            expect(
                normalizeCardLine(
                    '  4 Lightning Bolt (M10) 101  ',
                    DECK_FORMAT.ARENA
                )
            ).toBe('4 Lightning Bolt')
        })

        test('handles set codes with digits (e.g. P09)', () => {
            expect(
                normalizeCardLine('1 Black Lotus (P09) 1', DECK_FORMAT.ARENA)
            ).toBe('1 Black Lotus')
        })
    })

    describe('manabox format – strip set code, collector number, and foil markers', () => {
        test('strips "(SET) number *F*" from a manabox card line', () => {
            expect(
                normalizeCardLine(
                    '4 Lightning Bolt (M10) 101 *F*',
                    DECK_FORMAT.MANABOX
                )
            ).toBe('4 Lightning Bolt')
        })

        test('strips "(SET) number *E*" (etched foil) from a manabox card line', () => {
            expect(
                normalizeCardLine(
                    '1 Black Lotus (LEB) 233 *E*',
                    DECK_FORMAT.MANABOX
                )
            ).toBe('1 Black Lotus')
        })

        test('strips set code even without a foil marker', () => {
            expect(
                normalizeCardLine(
                    '2 Counterspell (TSR) 46',
                    DECK_FORMAT.MANABOX
                )
            ).toBe('2 Counterspell')
        })
    })

    describe('mtgo format – strip SB: prefix', () => {
        test('strips "SB: " prefix from an MTGO sideboard line', () => {
            expect(normalizeCardLine('SB: 2 Pyroblast', DECK_FORMAT.MTGO)).toBe(
                '2 Pyroblast'
            )
        })

        test('leaves a main deck line unchanged', () => {
            expect(
                normalizeCardLine('4 Lightning Bolt', DECK_FORMAT.MTGO)
            ).toBe('4 Lightning Bolt')
        })

        test('handles "SB:" without a trailing space', () => {
            expect(normalizeCardLine('SB:2 Pyroblast', DECK_FORMAT.MTGO)).toBe(
                '2 Pyroblast'
            )
        })
    })
})
