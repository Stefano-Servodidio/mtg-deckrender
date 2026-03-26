import { describe, it, expect } from 'vitest'
import {
    identifierKey,
    getCardName,
    matchCardToRequest
} from '../collectionUtils'
import type { ScryfallIdentifier, ParsedCard } from '../types'
import type { ScryfallCard } from '@/types/scryfall'

// ─── identifierKey ────────────────────────────────────────────────────────────

describe('identifierKey', () => {
    it('returns mtgo_id: prefix for mtgo_id identifiers', () => {
        const id: ScryfallIdentifier = { mtgo_id: 12345 }
        expect(identifierKey(id)).toBe('mtgo_id:12345')
    })

    it('returns cn: prefix for collector_number+set identifiers', () => {
        const id: ScryfallIdentifier = { collector_number: '342', set: 'mh2' }
        expect(identifierKey(id)).toBe('cn:mh2:342')
    })

    it('returns ns: prefix for name+set identifiers', () => {
        const id: ScryfallIdentifier = {
            name: 'Lightning Bolt',
            set: 'm11'
        }
        expect(identifierKey(id)).toBe('ns:m11:Lightning Bolt')
    })

    it('returns n: prefix for name-only identifiers', () => {
        const id: ScryfallIdentifier = { name: 'Counterspell' }
        expect(identifierKey(id)).toBe('n:Counterspell')
    })

    it('prefers mtgo_id over collector_number when both present', () => {
        // TypeScript union would not allow this, but just validate JS runtime
        const id = { mtgo_id: 99, collector_number: '1', set: 'zzz' } as any
        expect(identifierKey(id)).toMatch(/^mtgo_id:/)
    })

    it('prefers collector_number over name when both present', () => {
        const id = {
            collector_number: '1',
            set: 'zzz',
            name: 'foo'
        } as any
        expect(identifierKey(id)).toMatch(/^cn:/)
    })
})

// ─── getCardName ──────────────────────────────────────────────────────────────

const makeCard = (candidates: ScryfallIdentifier[]): ParsedCard => ({
    quantity: 1,
    groupId: 1,
    rawLine: 'test',
    identifierCandidates: candidates.map((id) => ({
        type:
            'name' in id
                ? 'name' in id && !('set' in id)
                    ? 'name'
                    : 'name_set'
                : 'collector_set',
        identifier: id
    })) as ParsedCard['identifierCandidates']
})

describe('getCardName', () => {
    it('returns name from name-only identifier', () => {
        const pc = makeCard([{ name: 'Island' }])
        expect(getCardName(pc)).toBe('Island')
    })

    it('returns name from name+set identifier', () => {
        const pc = makeCard([{ name: 'Lightning Bolt', set: 'm11' }])
        expect(getCardName(pc)).toBe('Lightning Bolt')
    })

    it('falls back to identifierKey when no name field present', () => {
        const pc: ParsedCard = {
            quantity: 1,
            groupId: 1,
            rawLine: 'test',
            identifierCandidates: [
                {
                    type: 'collector_set',
                    identifier: { collector_number: '342', set: 'mh2' }
                }
            ]
        }
        expect(getCardName(pc)).toBe('cn:mh2:342')
    })

    it('skips non-name candidates and returns first name found', () => {
        const pc: ParsedCard = {
            quantity: 1,
            groupId: 1,
            rawLine: 'test',
            identifierCandidates: [
                {
                    type: 'collector_set',
                    identifier: { collector_number: '1', set: 'abc' }
                },
                { type: 'name', identifier: { name: 'Forest' } }
            ]
        }
        expect(getCardName(pc)).toBe('Forest')
    })
})

// ─── matchCardToRequest ───────────────────────────────────────────────────────

const makeScryfallCard = (overrides: Partial<ScryfallCard>): ScryfallCard =>
    ({
        id: 'test-id',
        name: 'Test Card',
        set: 'tst',
        collector_number: '001',
        ...overrides
    }) as ScryfallCard

const makeParsedCard = (id: ScryfallIdentifier): ParsedCard => ({
    quantity: 1,
    groupId: 1,
    rawLine: '',
    identifierCandidates: [
        {
            type:
                'mtgo_id' in id
                    ? 'mtgo_id'
                    : 'collector_number' in id
                      ? 'collector_set'
                      : 'name' in id && 'set' in id
                        ? 'name_set'
                        : 'name',
            identifier: id
        }
    ]
})

describe('matchCardToRequest', () => {
    it('matches by collector_number + set (exact)', () => {
        const card = makeScryfallCard({
            name: 'Island',
            set: 'ltr',
            collector_number: '267'
        })
        const pc = makeParsedCard({ collector_number: '267', set: 'ltr' })
        const matched = new Set<ParsedCard>()
        expect(
            matchCardToRequest(
                card,
                [{ id: pc.identifierCandidates[0].identifier, parsedCard: pc }],
                matched
            )
        ).toBe(pc)
    })

    it('matches by name (case-insensitive) when no collector_number', () => {
        const card = makeScryfallCard({ name: 'Lightning Bolt' })
        const pc = makeParsedCard({ name: 'lightning bolt' })
        const matched = new Set<ParsedCard>()
        expect(
            matchCardToRequest(
                card,
                [{ id: pc.identifierCandidates[0].identifier, parsedCard: pc }],
                matched
            )
        ).toBe(pc)
    })

    it('prefers collector_number match over name match', () => {
        const card = makeScryfallCard({
            name: 'Forest',
            set: 'znr',
            collector_number: '277'
        })
        const pcName = makeParsedCard({ name: 'Forest' })
        const pcCollector = makeParsedCard({
            collector_number: '277',
            set: 'znr'
        })
        const matched = new Set<ParsedCard>()
        const requests = [
            {
                id: pcName.identifierCandidates[0].identifier,
                parsedCard: pcName
            },
            {
                id: pcCollector.identifierCandidates[0].identifier,
                parsedCard: pcCollector
            }
        ]
        expect(matchCardToRequest(card, requests, matched)).toBe(pcCollector)
    })

    it('skips already-matched ParsedCards', () => {
        const card = makeScryfallCard({ name: 'Forest' })
        const pc = makeParsedCard({ name: 'Forest' })
        const matched = new Set<ParsedCard>([pc])
        expect(
            matchCardToRequest(
                card,
                [{ id: pc.identifierCandidates[0].identifier, parsedCard: pc }],
                matched
            )
        ).toBeUndefined()
    })

    it('returns undefined when no request matches', () => {
        const card = makeScryfallCard({ name: 'Counterspell' })
        const pc = makeParsedCard({ name: 'Lightning Bolt' })
        const matched = new Set<ParsedCard>()
        expect(
            matchCardToRequest(
                card,
                [{ id: pc.identifierCandidates[0].identifier, parsedCard: pc }],
                matched
            )
        ).toBeUndefined()
    })

    it('does not match when set differs even if collector_number matches', () => {
        const card = makeScryfallCard({ set: 'mh2', collector_number: '342' })
        const pc = makeParsedCard({ collector_number: '342', set: 'znr' })
        const matched = new Set<ParsedCard>()
        expect(
            matchCardToRequest(
                card,
                [{ id: pc.identifierCandidates[0].identifier, parsedCard: pc }],
                matched
            )
        ).toBeUndefined()
    })
})
