import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchScryfallBatch } from '../batchFetch'
import type { ParsedCard } from '../types'

const SCRYFALL_URL = 'https://api.scryfall.com'
const USER_AGENT = 'test/1.0'

function makeParsedCard(name: string, groupId = 1): ParsedCard {
    return {
        quantity: 1,
        groupId,
        rawLine: `1 ${name}`,
        identifierCandidates: [{ type: 'name', identifier: { name } }]
    }
}

const LIGHTNING_BOLT_SCRYFALL = {
    id: 'bolt-id',
    name: 'Lightning Bolt',
    set: 'm11',
    collector_number: '149',
    cmc: 1,
    type_line: 'Instant',
    rarity: 'common',
    image_uris: { png: 'https://example.com/bolt.png' },
    colors: ['R'],
    legalities: {
        standard: 'not_legal',
        modern: 'legal',
        legacy: 'legal',
        commander: 'legal',
        vintage: 'legal',
        pioneer: 'not_legal',
        historic: 'legal',
        pauper: 'legal',
        penny: 'legal',
        duel: 'legal',
        oldschool: 'legal',
        premodern: 'legal',
        predh: 'legal',
        alchemy: 'not_legal',
        future: 'not_legal',
        timeless: 'legal',
        gladiator: 'legal',
        oathbreaker: 'legal',
        standardbrawl: 'not_legal',
        brawl: 'legal',
        paupercommander: 'not_legal'
    }
}

describe('fetchScryfallBatch', () => {
    beforeEach(() => {
        vi.restoreAllMocks()
    })

    it('returns found cards and empty notFound on full hit', async () => {
        const pc = makeParsedCard('Lightning Bolt')
        vi.spyOn(global, 'fetch').mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => ({
                data: [LIGHTNING_BOLT_SCRYFALL],
                not_found: []
            })
        } as any)

        const result = await fetchScryfallBatch(
            [{ id: { name: 'Lightning Bolt' }, parsedCard: pc }],
            'Batch 1',
            SCRYFALL_URL,
            USER_AGENT
        )

        expect(result.found).toHaveLength(1)
        expect(result.found[0].cardItem.name).toBe('Lightning Bolt')
        expect(result.notFound).toHaveLength(0)
    })

    it('returns not_found when card is missing', async () => {
        const pc = makeParsedCard('Nonexistent Card')
        vi.spyOn(global, 'fetch').mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => ({
                data: [],
                not_found: [{ name: 'Nonexistent Card' }]
            })
        } as any)

        const result = await fetchScryfallBatch(
            [{ id: { name: 'Nonexistent Card' }, parsedCard: pc }],
            'Batch 1',
            SCRYFALL_URL,
            USER_AGENT
        )

        expect(result.found).toHaveLength(0)
        expect(result.notFound).toHaveLength(1)
        expect(result.notFound[0]).toBe(pc)
    })

    it('throws on non-2xx HTTP response', async () => {
        const pc = makeParsedCard('Island')
        vi.spyOn(global, 'fetch').mockResolvedValueOnce({
            ok: false,
            status: 400,
            statusText: 'Bad Request'
        } as any)

        await expect(
            fetchScryfallBatch(
                [{ id: { name: 'Island' }, parsedCard: pc }],
                'Batch 1',
                SCRYFALL_URL,
                USER_AGENT
            )
        ).rejects.toThrow('HTTP ERROR')
    })

    it('sends correct headers and body to Scryfall', async () => {
        const pc = makeParsedCard('Island')
        const mockFetch = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => ({ data: [], not_found: [{ name: 'Island' }] })
        } as any)

        await fetchScryfallBatch(
            [{ id: { name: 'Island' }, parsedCard: pc }],
            'Batch test',
            SCRYFALL_URL,
            USER_AGENT
        )

        expect(mockFetch).toHaveBeenCalledWith(
            `${SCRYFALL_URL}/cards/collection`,
            expect.objectContaining({
                method: 'POST',
                headers: expect.objectContaining({
                    'Content-Type': 'application/json',
                    'User-Agent': USER_AGENT
                }),
                body: expect.stringContaining('Island')
            })
        )
    })

    it('handles multiple cards with deduplication (alreadyMatched)', async () => {
        const pc1 = makeParsedCard('Forest')
        const pc2 = makeParsedCard('Forest')
        vi.spyOn(global, 'fetch').mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => ({
                data: [
                    {
                        ...LIGHTNING_BOLT_SCRYFALL,
                        id: 'f1',
                        name: 'Forest',
                        set: 'eld',
                        collector_number: '266',
                        colors: [],
                        image_uris: { png: 'https://example.com/forest.png' }
                    }
                ],
                not_found: []
            })
        } as any)

        const result = await fetchScryfallBatch(
            [
                { id: { name: 'Forest' }, parsedCard: pc1 },
                { id: { name: 'Forest' }, parsedCard: pc2 }
            ],
            'Batch 1',
            SCRYFALL_URL,
            USER_AGENT
        )

        // Only one match (the Scryfall response has 1 card); the second pc is not_found
        expect(result.found).toHaveLength(1)
    })

    it('detects silently-dropped cards (not in found and not in not_found)', async () => {
        const pc1 = makeParsedCard('Lightning Bolt')
        const pc2 = makeParsedCard('Counterspell')
        vi.spyOn(global, 'fetch').mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => ({
                // Scryfall returns only Lightning Bolt; Counterspell is silently absent
                data: [LIGHTNING_BOLT_SCRYFALL],
                not_found: []
            })
        } as any)

        const result = await fetchScryfallBatch(
            [
                { id: { name: 'Lightning Bolt' }, parsedCard: pc1 },
                { id: { name: 'Counterspell' }, parsedCard: pc2 }
            ],
            'Batch 1',
            SCRYFALL_URL,
            USER_AGENT
        )

        expect(result.found).toHaveLength(1)
        expect(result.notFound).toContain(pc2)
    })
})
