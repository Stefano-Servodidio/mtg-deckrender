import { describe, it, expect } from 'vitest'
import {
    detectFormat,
    matchMtgoDek,
    matchMtgoCsv,
    matchArenaDefault,
    matchMoxfieldExact,
    matchMtgGoldfishExact,
    matchMoxfieldArena
} from '../listMatchers'

// ─── Sample decklists ────────────────────────────────────────────────────────

const MTGO_DEK = `<?xml version="1.0" encoding="utf-8"?>
<Deck xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <NetDeckID>0</NetDeckID>
  <Cards CatID="83555" Quantity="1" Sideboard="false" Name="Swamp" Annotation="0" />
  <Cards CatID="83567" Quantity="2" Sideboard="false" Name="Forest" Annotation="0" />
</Deck>`

const MTGO_CSV = `Card Name,Quantity,ID #,Rarity,Set,Collector #,Premium,Sideboarded,Annotation
"Mountain",2,83561,Land,ZNR,277/280,No,No,0
"Plains",3,83543,Land,ZNR,268/280,No,No,0`

const MOXFIELD_EXACT_60 = `4 Archon of Cruelty (MH2) 342
1 Blood Crypt (RNA) 245
4 Bloodstained Mire (MH3) 216

SIDEBOARD:
1 Abrade (INR) 139
2 Force of Despair (SLP) 29`

const MOXFIELD_EXACT_CMD = `4 Faithless Looting (PLST) CM2-96
4 Fatal Push (PLST) AER-57
1 Island (J25) 86`

const ARENA_DEFAULT_60 = `Deck
4 Yawgmoth, Thran Physician (MH1) 116
1 Swamp (LTR) 267

Sideboard
3 Fatal Push (KLR) 84`

const ARENA_DEFAULT_CMD = `Commander
1 Juri, Master of the Revue (MUL) 111

Deck
1 Academy Manufactor (MH2) 219`

const MTGGOLDFISH_EXACT = `4 Boomerang Basics [TLA]
4 Burst Lightning [FDN]
3 Eddymurk Crab [BLB]
3 Elusive Otter [WOE] (F)

1 Annul [KHM]`

const MOXFIELD_ARENA = `About
Name Grixis Reanimator

Deck
4 Abhorrent Oculus
1 Blood Crypt

Sideboard
1 Abrade`

const PLAIN_TEXT = `4 Abhorrent Oculus
1 Blood Crypt
4 Bloodstained Mire

SIDEBOARD:
1 Abrade
2 Force of Despair`

const PLAIN_TEXT_TABS = `4\tRagavan, Nimble Pilferer\t\t
3\tDoorkeeper Thrull\t\t
4\tTerritorial Kavu\t\t
4\tPhlage, Titan of Fire's Fury\t\t
4\tScion of Draco`

// ─── matchMtgoDek ────────────────────────────────────────────────────────────

describe('matchMtgoDek', () => {
    it('matches valid MTGO .dek XML', () => {
        const result = matchMtgoDek(MTGO_DEK)
        expect(result).not.toBeNull()
        expect(result!.format).toBe('mtgo_dek')
        expect(result!.score).toBe(10)
    })

    it('returns null for non-XML input', () => {
        expect(matchMtgoDek('4 Lightning Bolt')).toBeNull()
    })

    it('returns null for XML without <Deck>', () => {
        expect(matchMtgoDek('<?xml version="1.0"?><Root/>')).toBeNull()
    })

    it('returns null for XML with <Deck> but no <Cards>', () => {
        expect(
            matchMtgoDek(
                '<?xml version="1.0"?><Deck><NetDeckID>0</NetDeckID></Deck>'
            )
        ).toBeNull()
    })
})

// ─── matchMtgoCsv ────────────────────────────────────────────────────────────

describe('matchMtgoCsv', () => {
    it('matches valid MTGO .csv header', () => {
        const result = matchMtgoCsv(MTGO_CSV)
        expect(result).not.toBeNull()
        expect(result!.format).toBe('mtgo_csv')
        expect(result!.score).toBe(10)
    })

    it('returns null for non-CSV input', () => {
        expect(matchMtgoCsv('4 Lightning Bolt')).toBeNull()
    })

    it('returns null for partial CSV header', () => {
        expect(matchMtgoCsv('Card Name,Quantity')).toBeNull()
    })
})

// ─── matchArenaDefault ───────────────────────────────────────────────────────

describe('matchArenaDefault', () => {
    it('matches Arena default 60-card list', () => {
        const lines = ARENA_DEFAULT_60.split('\n')
            .map((l) => l.trim())
            .filter(Boolean)
        const result = matchArenaDefault(lines)
        expect(result).not.toBeNull()
        expect(result!.format).toBe('arena_default')
        expect(result!.score).toBeGreaterThanOrEqual(8)
    })

    it('matches Arena default commander list (higher score)', () => {
        const lines = ARENA_DEFAULT_CMD.split('\n')
            .map((l) => l.trim())
            .filter(Boolean)
        const result = matchArenaDefault(lines)
        expect(result).not.toBeNull()
        expect(result!.score).toBe(9)
        expect(result!.evidence).toContain('section_headers')
    })

    it('returns null when Deck header is absent', () => {
        const lines = ['4 Lightning Bolt (M11) 149']
        expect(matchArenaDefault(lines)).toBeNull()
    })

    it('returns null when no set/collector lines present', () => {
        const lines = ['Deck', '4 Lightning Bolt']
        expect(matchArenaDefault(lines)).toBeNull()
    })
})

// ─── matchMoxfieldExact ──────────────────────────────────────────────────────

describe('matchMoxfieldExact', () => {
    it('matches Moxfield exact 60-card list', () => {
        const lines = MOXFIELD_EXACT_60.split('\n')
            .map((l) => l.trim())
            .filter(Boolean)
        const result = matchMoxfieldExact(lines)
        expect(result).not.toBeNull()
        expect(result!.format).toBe('moxfield_exact')
        expect(result!.score).toBe(9)
    })

    it('returns null when Deck header is present (defers to Arena)', () => {
        const lines = ['Deck', '4 Archon of Cruelty (MH2) 342']
        expect(matchMoxfieldExact(lines)).toBeNull()
    })

    it('returns null when no set/collector lines', () => {
        const lines = ['4 Lightning Bolt']
        expect(matchMoxfieldExact(lines)).toBeNull()
    })
})

// ─── matchMtgGoldfishExact ───────────────────────────────────────────────────

describe('matchMtgGoldfishExact', () => {
    it('matches MTGGoldfish exact list', () => {
        const lines = MTGGOLDFISH_EXACT.split('\n')
            .map((l) => l.trim())
            .filter(Boolean)
        const result = matchMtgGoldfishExact(lines)
        expect(result).not.toBeNull()
        expect(result!.format).toBe('mtggoldfish_exact')
        expect(result!.score).toBeGreaterThanOrEqual(7)
    })

    it('returns null for plain text without [SET]', () => {
        const lines = ['4 Lightning Bolt', '2 Counterspell']
        expect(matchMtgGoldfishExact(lines)).toBeNull()
    })
})

// ─── matchMoxfieldArena ──────────────────────────────────────────────────────

describe('matchMoxfieldArena', () => {
    it('matches Moxfield Arena copy', () => {
        const lines = MOXFIELD_ARENA.split('\n')
            .map((l) => l.trim())
            .filter(Boolean)
        const result = matchMoxfieldArena(lines)
        expect(result).not.toBeNull()
        expect(result!.format).toBe('moxfield_arena')
        expect(result!.score).toBe(8)
    })

    it('returns null without About header', () => {
        const lines = ['Deck', '4 Lightning Bolt']
        expect(matchMoxfieldArena(lines)).toBeNull()
    })
})

// ─── detectFormat ────────────────────────────────────────────────────────────

describe('detectFormat', () => {
    it('detects MTGO .dek XML', () => {
        expect(detectFormat(MTGO_DEK).format).toBe('mtgo_dek')
    })

    it('detects MTGO .csv', () => {
        expect(detectFormat(MTGO_CSV).format).toBe('mtgo_csv')
    })

    it('detects Arena default export', () => {
        expect(detectFormat(ARENA_DEFAULT_60).format).toBe('arena_default')
    })

    it('detects Arena default commander', () => {
        expect(detectFormat(ARENA_DEFAULT_CMD).format).toBe('arena_default')
    })

    it('detects Moxfield exact (60-card)', () => {
        expect(detectFormat(MOXFIELD_EXACT_60).format).toBe('moxfield_exact')
    })

    it('detects Moxfield exact (no SIDEBOARD)', () => {
        expect(detectFormat(MOXFIELD_EXACT_CMD).format).toBe('moxfield_exact')
    })

    it('detects MTGGoldfish exact', () => {
        expect(detectFormat(MTGGOLDFISH_EXACT).format).toBe('mtggoldfish_exact')
    })

    it('detects Moxfield Arena copy', () => {
        expect(detectFormat(MOXFIELD_ARENA).format).toBe('moxfield_arena')
    })

    it('falls back to plain_text for generic decklist', () => {
        expect(detectFormat(PLAIN_TEXT).format).toBe('plain_text')
    })

    it('falls back to plain_text for tab-separated decklist', () => {
        expect(detectFormat(PLAIN_TEXT_TABS).format).toBe('plain_text')
    })

    it('Arena default wins over Moxfield exact (has Deck header)', () => {
        const result = detectFormat(ARENA_DEFAULT_60)
        expect(result.format).toBe('arena_default')
        expect(result.format).not.toBe('moxfield_exact')
    })

    it('returns format with highest score', () => {
        const result = detectFormat(MTGO_DEK)
        expect(result.score).toBe(10)
    })
})
