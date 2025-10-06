import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST, GET } from '../route'
import { NextRequest } from 'next/server'
import * as decklistUtils from '@/utils/decklist'
import * as cacheUtils from '@/utils/cache'
import { CardItem } from '@/types/api'

function createRequest(body: any) {
    return {
        json: async () => body
    } as unknown as NextRequest
}

describe('Collections API route', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('GET returns usage info', async () => {
        const res = await GET()
        const json = await res.json()
        expect(json.message).toBe('Card Images API')
        expect(json.limits.maxCards).toBe(75)
    })

    it('POST returns 400 for missing decklist', async () => {
        const req = createRequest({})
        const res = await POST(req)
        expect(res.status).toBe(400)
        const json = await res.json()
        expect(json.error).toMatch(/Invalid request/)
    })

    it('POST returns 400 for non-string decklist', async () => {
        const req = createRequest({ decklist: 123 })
        const res = await POST(req)
        expect(res.status).toBe(400)
        const json = await res.json()
        expect(json.error).toMatch(/Invalid request/)
    })

    it('POST returns 400 for empty decklist', async () => {
        vi.spyOn(decklistUtils, 'parseDecklist').mockReturnValue([])
        const req = createRequest({ decklist: '' })
        const res = await POST(req)
        expect(res.status).toBe(400)
        const json = await res.json()
        expect(json.error).toMatch(
            /Invalid request. Expected decklist to be a string./
        )
    })

    it('POST returns 400 for >75 unique cards', async () => {
        const cards = Array.from({ length: 76 }, (_, i) => ({
            name: `Card${i}`,
            quantity: 1
        }))
        const cardsString = cards
            .map((c) => `${c.quantity} ${c.name}`)
            .join('\n')
        vi.spyOn(decklistUtils, 'parseDecklist').mockReturnValue([cardsString])
        const req = createRequest({ decklist: '...' })
        const res = await POST(req)
        expect(res.status).toBe(400)
        const json = await res.json()
        expect(json.error).toMatch(/exceeds the maximum/)
    })

    it('POST streams progress and complete for valid decklist', async () => {
        const cards = [
            { name: 'Island', quantity: 2, groupId: 1 },
            { name: 'Mountain', quantity: 3, groupId: 1 }
        ]
        const cardsString = cards
            .map((c) => `${c.quantity} ${c.name}`)
            .join('\n')
        vi.spyOn(decklistUtils, 'parseDecklist').mockReturnValue([cardsString])
        vi.spyOn(decklistUtils, 'createCardItem').mockImplementation(
            (data, quantity, groupId) =>
                ({
                    name: data.name,
                    image_uri: 'img.png',
                    quantity,
                    groupId
                }) as CardItem
        )
        vi.spyOn(decklistUtils, 'createMockCardItem').mockImplementation(
            (name, quantity, groupId) =>
                ({
                    name,
                    image_uri: null,
                    quantity,
                    groupId
                }) as CardItem
        )
        vi.spyOn(cacheUtils.collectionCardCache, 'get').mockReturnValue(
            undefined
        )
        vi.spyOn(global, 'fetch').mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({
                data: [{ name: 'Island' }, { name: 'Mountain' }]
            })
        } as any)

        const req = createRequest({ decklist: 'Island\nMountain' })
        const res = await POST(req)
        expect(res.body).toBeInstanceOf(ReadableStream)
        // Read the stream and check for 'complete'
        const reader = (res.body as ReadableStream).getReader()
        let foundComplete = false
        let chunks = ''
        while (true) {
            const { done, value } = await reader.read()
            if (done) break
            chunks += new TextDecoder().decode(value)
            if (chunks.includes('"type":"complete"')) foundComplete = true
        }
        expect(foundComplete).toBe(true)
    })

    it('POST uses cache for cached cards', async () => {
        const now = Date.now()
        const cards = [{ name: 'Forest', quantity: 1, groupId: 1 }]
        const cardsString = cards
            .map((c) => `${c.quantity} ${c.name}`)
            .join('\n')
        vi.spyOn(decklistUtils, 'parseDecklist').mockReturnValue([cardsString])
        vi.spyOn(cacheUtils.cardCache, 'get').mockReturnValue({
            data: {
                name: 'Forest',
                image_uri: 'img.png',
                quantity: 1,
                groupId: 1
            } as CardItem,
            expires: now + 10000
        })
        const req = createRequest({ decklist: '1 Forest' })
        const res = await POST(req)
        expect(res.body).toBeInstanceOf(ReadableStream)
        const reader = (res.body as ReadableStream).getReader()
        let foundCached = false
        let chunks = ''
        while (true) {
            const { done, value } = await reader.read()
            if (done) break
            chunks += new TextDecoder().decode(value)
            if (chunks.includes('Loaded Forest (cached)')) foundCached = true
        }
        expect(foundCached).toBe(true)
    })

    it('POST returns 500 on unexpected error', async () => {
        vi.spyOn(decklistUtils, 'parseDecklist').mockImplementation(() => {
            throw new Error('fail')
        })
        const req = createRequest({ decklist: 'Island' })
        const res = await POST(req)
        expect(res.status).toBe(500)
        const json = await res.json()
        expect(json.error).toMatch(/Internal server error/)
    })
})
