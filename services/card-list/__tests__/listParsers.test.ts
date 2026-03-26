import { describe, it, expect } from 'vitest'
import {
    parseMtgoDek,
    parseMtgoCsv,
    parseMoxfieldExact,
    parseArenaDefault,
    parseMtgGoldfishExact,
    parseMoxfieldArena,
    parsePlainText
} from '../listParsers'

// ─── parseMtgoDek ────────────────────────────────────────────────────────────

describe('parseMtgoDek', () => {
    // Use 3-4 digit CatIDs (valid range per MTGO API constraint)
    const DEK_60 = `<?xml version="1.0" encoding="utf-8"?>
<Deck>
  <Cards CatID="555" Quantity="1" Sideboard="false" Name="Swamp" Annotation="0" />
  <Cards CatID="567" Quantity="2" Sideboard="false" Name="Forest" Annotation="0" />
  <Cards CatID="5026" Quantity="3" Sideboard="true" Name="Thoughtseize" Annotation="0" />
</Deck>`

    // Commander deck uses an out-of-range CatID to test fallback
    const DEK_CMD = `<?xml version="1.0" encoding="utf-8"?>
<Deck>
  <Cards CatID="726" Quantity="1" Sideboard="false" Name="Command Tower" Annotation="0" />
  <Cards CatID="142375" Quantity="1" Sideboard="true" Name="Juri, Master of the Revue" Annotation="16777728" />
</Deck>`

    // A deck with only 5-digit+ IDs (all should fall back to name-only)
    const DEK_LARGE_IDS = `<?xml version="1.0" encoding="utf-8"?>
<Deck>
  <Cards CatID="83555" Quantity="1" Sideboard="false" Name="Swamp" Annotation="0" />
</Deck>`

    it('parses main deck cards (Sideboard=false) as groupId 1', () => {
        const cards = parseMtgoDek(DEK_60)
        const swamp = cards.find((c) => c.rawLine.includes('Swamp'))
        expect(swamp).toBeDefined()
        expect(swamp!.groupId).toBe(1)
        expect(swamp!.quantity).toBe(1)
    })

    it('parses sideboard cards (Sideboard=true) as groupId 2', () => {
        const cards = parseMtgoDek(DEK_60)
        const ts = cards.find((c) => c.rawLine.includes('Thoughtseize'))
        expect(ts).toBeDefined()
        expect(ts!.groupId).toBe(2)
        expect(ts!.quantity).toBe(3)
    })

    it('parses commander (Annotation=16777728) as groupId 0', () => {
        const cards = parseMtgoDek(DEK_CMD)
        const cmd = cards.find((c) => c.rawLine.includes('Juri'))
        expect(cmd).toBeDefined()
        expect(cmd!.groupId).toBe(0)
    })

    it('sets mtgo_id as primary identifier for valid 3-4 digit CatIDs', () => {
        const cards = parseMtgoDek(DEK_60)
        expect(cards[0].identifierCandidates[0].type).toBe('mtgo_id')
        const id = cards[0].identifierCandidates[0].identifier
        expect('mtgo_id' in id).toBe(true)
    })

    it('sets name as fallback identifier', () => {
        const cards = parseMtgoDek(DEK_60)
        const last = cards[0].identifierCandidates.at(-1)!
        expect(last.type).toBe('name')
    })

    it('omits mtgo_id when CatID has 5 or more digits (API constraint)', () => {
        const cards = parseMtgoDek(DEK_LARGE_IDS)
        expect(cards).toHaveLength(1)
        // Only name identifier should be present; no mtgo_id
        expect(cards[0].identifierCandidates).toHaveLength(1)
        expect(cards[0].identifierCandidates[0].type).toBe('name')
    })

    it('returns empty array for empty input', () => {
        expect(parseMtgoDek('')).toHaveLength(0)
    })
})

// ─── parseMtgoCsv ────────────────────────────────────────────────────────────

describe('parseMtgoCsv', () => {
    // Use 3-4 digit IDs so mtgo_id is valid; 5-digit IDs to test exclusion
    const CSV = `Card Name,Quantity,ID #,Rarity,Set,Collector #,Premium,Sideboarded,Annotation
"Mountain",2,561,Land,ZNR,277/280,No,No,0
"Plains",3,543,Land,ZNR,268/280,No,No,0
"Thoughtseize",1,5026,Rare,THS,107/249,No,Yes,0
"Juri, Master of the Revue",1,142375,Uncommon,EOC,119,No,Yes,16777728`

    const CSV_LARGE_ID = `Card Name,Quantity,ID #,Rarity,Set,Collector #,Premium,Sideboarded,Annotation
"Lightning Bolt",4,83561,Common,M11,149,No,No,0`

    it('parses main deck (Sideboarded=No) as groupId 1', () => {
        const cards = parseMtgoCsv(CSV)
        const mains = cards.filter((c) => c.groupId === 1)
        expect(mains.length).toBe(2)
    })

    it('parses sideboard (Sideboarded=Yes) as groupId 2', () => {
        const cards = parseMtgoCsv(CSV)
        const ts = cards.find((c) => c.rawLine.includes('Thoughtseize'))
        expect(ts!.groupId).toBe(2)
    })

    it('parses commander (Annotation=16777728 + Sideboarded=Yes) as groupId 0', () => {
        const cards = parseMtgoCsv(CSV)
        const cmd = cards.find((c) => c.rawLine.includes('Juri'))
        expect(cmd!.groupId).toBe(0)
    })

    it('sets mtgo_id as primary identifier for valid 3-4 digit IDs', () => {
        const cards = parseMtgoCsv(CSV)
        expect(cards[0].identifierCandidates[0].type).toBe('mtgo_id')
    })

    it('includes collector_set as second identifier', () => {
        const cards = parseMtgoCsv(CSV)
        expect(cards[0].identifierCandidates[1].type).toBe('collector_set')
        // Collector number should be trimmed of "/280" suffix
        const id = cards[0].identifierCandidates[1].identifier
        expect('collector_number' in id && id.collector_number).toBe('277')
    })

    it('omits mtgo_id when ID # has 5 or more digits (API constraint)', () => {
        const cards = parseMtgoCsv(CSV_LARGE_ID)
        expect(cards).toHaveLength(1)
        // Should fall back to collector_set as first, then name
        expect(cards[0].identifierCandidates[0].type).toBe('collector_set')
        expect(
            cards[0].identifierCandidates.every((c) => c.type !== 'mtgo_id')
        ).toBe(true)
    })

    it('returns empty for header-only input', () => {
        expect(
            parseMtgoCsv(
                'Card Name,Quantity,ID #,Rarity,Set,Collector #,Premium,Sideboarded,Annotation'
            )
        ).toHaveLength(0)
    })
})

// ─── parseMoxfieldExact ──────────────────────────────────────────────────────

describe('parseMoxfieldExact', () => {
    const LIST = `4 Archon of Cruelty (MH2) 342
1 Blood Crypt (RNA) 245

SIDEBOARD:
1 Abrade (INR) 139
2 Force of Despair (SLP) 29`

    const COLLECTOR_HYPHEN = `4 Faithless Looting (PLST) CM2-96
4 Fatal Push (PLST) AER-57`

    it('parses main deck as groupId 1', () => {
        const cards = parseMoxfieldExact(LIST)
        const archon = cards.find((c) => c.rawLine.includes('Archon'))
        expect(archon!.groupId).toBe(1)
        expect(archon!.quantity).toBe(4)
    })

    it('parses sideboard after SIDEBOARD: as groupId 2', () => {
        const cards = parseMoxfieldExact(LIST)
        const abrade = cards.find((c) => c.rawLine.includes('Abrade'))
        expect(abrade!.groupId).toBe(2)
    })

    it('extracts set and collector number as primary identifier', () => {
        const cards = parseMoxfieldExact(LIST)
        const archon = cards.find((c) => c.rawLine.includes('Archon'))
        const id = archon!.identifierCandidates[0]
        expect(id.type).toBe('collector_set')
        expect(
            'collector_number' in id.identifier &&
                id.identifier.collector_number
        ).toBe('342')
        expect('set' in id.identifier && id.identifier.set).toBe('mh2')
    })

    it('handles hyphenated collector numbers (e.g. CM2-96)', () => {
        const cards = parseMoxfieldExact(COLLECTOR_HYPHEN)
        const fl = cards.find((c) => c.rawLine.includes('Faithless'))
        const id = fl!.identifierCandidates[0]
        expect(
            'collector_number' in id.identifier &&
                id.identifier.collector_number
        ).toBe('CM2-96')
    })

    it('includes name_set as second identifier and name as third', () => {
        const cards = parseMoxfieldExact(LIST)
        const archon = cards.find((c) => c.rawLine.includes('Archon'))!
        expect(archon.identifierCandidates[1].type).toBe('name_set')
        expect(archon.identifierCandidates[2].type).toBe('name')
    })

    it('trims DFC names (Front / Back)', () => {
        const cards = parseMoxfieldExact(
            '1 Callous Sell-Sword / Burn Together (WOE) 221'
        )
        const card = cards[0]
        const nameCand = card.identifierCandidates.find(
            (c) => c.type === 'name'
        )!
        expect('name' in nameCand.identifier && nameCand.identifier.name).toBe(
            'Callous Sell-Sword'
        )
    })
})

// ─── parseArenaDefault ───────────────────────────────────────────────────────

describe('parseArenaDefault', () => {
    const LIST_60 = `Deck
4 Yawgmoth, Thran Physician (MH1) 116
1 Swamp (LTR) 267

Sideboard
3 Fatal Push (KLR) 84`

    const LIST_CMD = `Commander
1 Juri, Master of the Revue (MUL) 111

Deck
1 Academy Manufactor (MH2) 219`

    it('parses Deck section as groupId 1', () => {
        const cards = parseArenaDefault(LIST_60)
        const yawg = cards.find((c) => c.rawLine.includes('Yawgmoth'))
        expect(yawg!.groupId).toBe(1)
        expect(yawg!.quantity).toBe(4)
    })

    it('parses Sideboard section as groupId 2', () => {
        const cards = parseArenaDefault(LIST_60)
        const fp = cards.find((c) => c.rawLine.includes('Fatal Push'))
        expect(fp!.groupId).toBe(2)
    })

    it('parses Commander section as groupId 0', () => {
        const cards = parseArenaDefault(LIST_CMD)
        const cmd = cards.find((c) => c.rawLine.includes('Juri'))
        expect(cmd!.groupId).toBe(0)
    })

    it('uses collector_set as primary identifier', () => {
        const cards = parseArenaDefault(LIST_60)
        const yawg = cards.find((c) => c.rawLine.includes('Yawgmoth'))!
        expect(yawg.identifierCandidates[0].type).toBe('collector_set')
        const id = yawg.identifierCandidates[0].identifier
        expect('set' in id && id.set).toBe('mh1')
    })

    it('skips About and Name lines', () => {
        const withMeta = `About\nName My Deck\n\nDeck\n1 Island (LTR) 267`
        const cards = parseArenaDefault(withMeta)
        expect(cards).toHaveLength(1)
    })
})

// ─── parseMtgGoldfishExact ───────────────────────────────────────────────────

describe('parseMtgGoldfishExact', () => {
    const LIST = `4 Boomerang Basics [TLA]
3 Elusive Otter [WOE] (F)
6 Island <251> [THB]
4 Steam Vents <Shadowmoor - borderless> [ECL]

1 Annul [KHM]`

    it('parses main section as groupId 1', () => {
        const cards = parseMtgGoldfishExact(LIST)
        const bb = cards.find((c) => c.rawLine.includes('Boomerang'))
        expect(bb!.groupId).toBe(1)
        expect(bb!.quantity).toBe(4)
    })

    it('parses sideboard section (after blank line) as groupId 2', () => {
        const cards = parseMtgGoldfishExact(LIST)
        const annul = cards.find((c) => c.rawLine.includes('Annul'))
        expect(annul!.groupId).toBe(2)
    })

    it('extracts SET from [SET] bracket', () => {
        const cards = parseMtgGoldfishExact(LIST)
        const bb = cards.find((c) => c.rawLine.includes('Boomerang'))!
        const id = bb.identifierCandidates[0]
        expect(id.type).toBe('name_set')
        expect('set' in id.identifier && id.identifier.set).toBe('tla')
    })

    it('strips foil suffix (F) from card name', () => {
        const cards = parseMtgGoldfishExact(LIST)
        const otter = cards.find((c) => c.rawLine.includes('Otter'))!
        const nameId = otter.identifierCandidates.find(
            (c) => c.type === 'name'
        )!
        expect('name' in nameId.identifier && nameId.identifier.name).toBe(
            'Elusive Otter'
        )
    })

    it('strips treatment annotations <...> from card name', () => {
        const cards = parseMtgGoldfishExact(LIST)
        const island = cards.find((c) => c.rawLine.includes('Island'))!
        const nameId = island.identifierCandidates.find(
            (c) => c.type === 'name'
        )!
        expect('name' in nameId.identifier && nameId.identifier.name).toBe(
            'Island'
        )
    })

    it('strips complex treatment like <Shadowmoor - borderless>', () => {
        const cards = parseMtgGoldfishExact(LIST)
        const sv = cards.find((c) => c.rawLine.includes('Steam Vents'))!
        const nameId = sv.identifierCandidates.find((c) => c.type === 'name')!
        expect('name' in nameId.identifier && nameId.identifier.name).toBe(
            'Steam Vents'
        )
    })

    it('uses name-only identifier when no [SET] present', () => {
        const cards = parseMtgGoldfishExact('4 Deceit')
        expect(cards[0].identifierCandidates[0].type).toBe('name')
    })
})

// ─── parseMoxfieldArena ──────────────────────────────────────────────────────

describe('parseMoxfieldArena', () => {
    const LIST = `About
Name Grixis Reanimator

Commander
1 Juri, Master of the Revue

Deck
4 Abhorrent Oculus
1 Blood Crypt

Sideboard
1 Abrade`

    it('parses Deck section as groupId 1', () => {
        const cards = parseMoxfieldArena(LIST)
        const ao = cards.find((c) => c.rawLine.includes('Abhorrent'))
        expect(ao!.groupId).toBe(1)
        expect(ao!.quantity).toBe(4)
    })

    it('parses Sideboard section as groupId 2', () => {
        const cards = parseMoxfieldArena(LIST)
        const ab = cards.find((c) => c.rawLine.includes('Abrade'))
        expect(ab!.groupId).toBe(2)
    })

    it('parses Commander section as groupId 0', () => {
        const cards = parseMoxfieldArena(LIST)
        const cmd = cards.find((c) => c.rawLine.includes('Juri'))
        expect(cmd!.groupId).toBe(0)
    })

    it('uses name-only identifier', () => {
        const cards = parseMoxfieldArena(LIST)
        const ao = cards.find((c) => c.rawLine.includes('Abhorrent'))!
        expect(ao.identifierCandidates[0].type).toBe('name')
    })

    it('skips About and Name metadata lines', () => {
        const cards = parseMoxfieldArena(LIST)
        expect(cards.every((c) => !c.rawLine.includes('About'))).toBe(true)
        expect(cards.every((c) => !c.rawLine.includes('Name Grixis'))).toBe(
            true
        )
    })
})

// ─── parsePlainText ──────────────────────────────────────────────────────────

describe('parsePlainText', () => {
    it('parses simple main-deck list as groupId 1', () => {
        const cards = parsePlainText('4 Lightning Bolt\n2 Counterspell')
        expect(cards).toHaveLength(2)
        expect(cards.every((c) => c.groupId === 1)).toBe(true)
    })

    it('splits on SIDEBOARD: marker', () => {
        const text = '4 Lightning Bolt\n\nSIDEBOARD:\n2 Counterspell'
        const cards = parsePlainText(text)
        const bolt = cards.find((c) => c.rawLine.includes('Lightning Bolt'))
        const counter = cards.find((c) => c.rawLine.includes('Counterspell'))
        expect(bolt!.groupId).toBe(1)
        expect(counter!.groupId).toBe(2)
    })

    it('splits on SB: marker', () => {
        const text = '4 Lightning Bolt\nSB:\n2 Counterspell'
        const cards = parsePlainText(text)
        expect(
            cards.find((c) => c.rawLine.includes('Counterspell'))!.groupId
        ).toBe(2)
    })

    it('splits on double newline', () => {
        const text =
            '4 Lightning Bolt\n2 Island\n\n1 Counterspell\n1 Path to Exile'
        const cards = parsePlainText(text)
        expect(
            cards.find((c) => c.rawLine.includes('Counterspell'))!.groupId
        ).toBe(2)
    })

    it('detects commander heuristic (single card after blank line)', () => {
        const text = '4 Lightning Bolt\n2 Island\n\n1 Juri, Master of the Revue'
        const cards = parsePlainText(text)
        const juri = cards.find((c) => c.rawLine.includes('Juri'))
        expect(juri!.groupId).toBe(0)
    })

    it('does NOT assign commander if last section has >1 card', () => {
        const text = '4 Lightning Bolt\n\n2 Counterspell\n1 Island'
        const cards = parsePlainText(text)
        expect(cards.every((c) => c.groupId !== 0)).toBe(true)
    })

    it('handles x notation (4x Name)', () => {
        const cards = parsePlainText('4x Lightning Bolt')
        expect(cards[0].quantity).toBe(4)
        const nameId = cards[0].identifierCandidates[0]
        expect('name' in nameId.identifier && nameId.identifier.name).toBe(
            'Lightning Bolt'
        )
    })

    it('handles tab-separated quantity (tab between count and name)', () => {
        const text = '4\tRagavan, Nimble Pilferer\t\t\n3\tDoorkeeper Thrull'
        const cards = parsePlainText(text)
        expect(cards).toHaveLength(2)
        expect(cards[0].quantity).toBe(4)
        const nameId = cards[0].identifierCandidates[0]
        expect('name' in nameId.identifier && nameId.identifier.name).toBe(
            'Ragavan, Nimble Pilferer'
        )
    })

    it('trims DFC names', () => {
        const cards = parsePlainText('1 Callous Sell-Sword / Burn Together')
        const nameId = cards[0].identifierCandidates[0]
        expect('name' in nameId.identifier && nameId.identifier.name).toBe(
            'Callous Sell-Sword'
        )
    })

    it('ignores empty lines', () => {
        const cards = parsePlainText('4 Lightning Bolt\n\n\n2 Counterspell')
        // Double newlines are treated as section separators
        expect(cards.length).toBeGreaterThanOrEqual(2)
    })

    it('uses name-only identifier', () => {
        const cards = parsePlainText('1 Island')
        expect(cards[0].identifierCandidates[0].type).toBe('name')
    })
})
