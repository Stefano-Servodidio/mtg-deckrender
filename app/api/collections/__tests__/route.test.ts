import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest'
import { POST, GET } from '../route'
import { NextRequest } from 'next/server'

// Mock chalk
vi.mock('chalk', () => ({
    default: {
        yellow: vi.fn((str: string) => str),
        cyan: vi.fn((str: string) => str)
    }
}))

describe('Collections API', () => {
    let originalEnv: NodeJS.ProcessEnv

    beforeEach(() => {
        originalEnv = process.env
        process.env = {
            ...originalEnv,
            NEXT_PUBLIC_API_USER_AGENT: 'test-agent/1.0',
            NEXT_PUBLIC_API_URL_SCRYFALL: 'https://api.scryfall.com/'
        }
        // Reset fetch mock before each test
        vi.restoreAllMocks()
    })

    afterEach(() => {
        process.env = originalEnv
        vi.clearAllMocks()
    })

    describe('Maintenance mode', () => {
        test('GET should return 503 when maintenance mode is enabled', async () => {
            process.env.NEXT_PUBLIC_MAINTENANCE = 'true'
            const response = await GET()
            expect(response.status).toBe(503)
            const data = await response.json()
            expect(data.error).toBe('Service Unavailable - Maintenance mode')
        })

        test('POST should return 503 when maintenance mode is enabled', async () => {
            process.env.NEXT_PUBLIC_MAINTENANCE = 'true'
            const request = new NextRequest(
                'http://localhost:3000/api/collections',
                {
                    method: 'POST',
                    body: JSON.stringify({ decklist: '4x Lightning Bolt' })
                }
            )
            const response = await POST(request)
            expect(response.status).toBe(503)
            const data = await response.json()
            expect(data.error).toBe('Service Unavailable - Maintenance mode')
        })
    })

    describe('GET /api/collections', () => {
        test('should return API documentation', async () => {
            const response = await GET()
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data.message).toBe('Collections API')
            expect(data.usage).toContain('POST with')
            expect(data.description).toContain('Scryfall Collections API')
            expect(data.limits.maxCards).toBe(150)
            expect(data.limits.batchSize).toBe(75)
        })
    })

    describe('POST /api/collections', () => {
        test('should reject invalid request body', async () => {
            const request = new NextRequest(
                'http://localhost/api/collections',
                {
                    method: 'POST',
                    body: JSON.stringify({})
                }
            )

            const response = await POST(request)
            const data = await response.json()

            expect(response.status).toBe(400)
            expect(data.error).toContain('Invalid request')
        })

        test('should reject non-string decklist', async () => {
            const request = new NextRequest(
                'http://localhost/api/collections',
                {
                    method: 'POST',
                    body: JSON.stringify({ decklist: 123 })
                }
            )

            const response = await POST(request)
            const data = await response.json()

            expect(response.status).toBe(400)
            expect(data.error).toContain('Invalid request')
        })

        test('should reject empty decklist', async () => {
            const request = new NextRequest(
                'http://localhost/api/collections',
                {
                    method: 'POST',
                    body: JSON.stringify({ decklist: 'invalid card line' })
                }
            )

            const response = await POST(request)
            const data = await response.json()

            expect(response.status).toBe(400)
            expect(data.error).toContain('No valid cards found')
        })

        test('should reject decklist exceeding 150 cards', async () => {
            // Create a decklist with 151 unique cards
            const cards = Array.from({ length: 101 }, (_, i) => `1 Card ${i}`)
            const decklist = cards.join('\n')

            const request = new NextRequest(
                'http://localhost/api/collections',
                {
                    method: 'POST',
                    body: JSON.stringify({ decklist })
                }
            )

            const response = await POST(request)
            const data = await response.json()

            expect(response.status).toBe(400)
            expect(data.error).toContain(
                'exceeds the maximum of 100 unique cards'
            )
        })

        test('should accept valid decklist with less than 100 cards', async () => {
            // Create a decklist with 3 cards
            const decklist = '4 Lightning Bolt\n2 Counterspell\n1 Black Lotus'

            // Mock fetch for the Collections API
            global.fetch = vi.fn().mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    data: [
                        {
                            id: '1',
                            name: 'Lightning Bolt',
                            cmc: 1,
                            type_line: 'Instant',
                            rarity: 'common',
                            image_uris: { png: 'https://example.com/bolt.png' },
                            colors: ['R'],
                            legalities: {
                                standard: 'legal',
                                modern: 'legal',
                                legacy: 'legal',
                                commander: 'legal',
                                vintage: 'legal',
                                pioneer: 'legal',
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
                        },
                        {
                            id: '2',
                            name: 'Counterspell',
                            cmc: 2,
                            type_line: 'Instant',
                            rarity: 'common',
                            image_uris: {
                                png: 'https://example.com/counter.png'
                            },
                            colors: ['U'],
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
                                paupercommander: 'legal'
                            }
                        },
                        {
                            id: '3',
                            name: 'Black Lotus',
                            cmc: 0,
                            type_line: 'Artifact',
                            rarity: 'rare',
                            image_uris: {
                                png: 'https://example.com/lotus.png'
                            },
                            colors: [],
                            legalities: {
                                standard: 'not_legal',
                                modern: 'not_legal',
                                legacy: 'banned',
                                commander: 'banned',
                                vintage: 'restricted',
                                pioneer: 'not_legal',
                                historic: 'not_legal',
                                pauper: 'not_legal',
                                penny: 'not_legal',
                                duel: 'banned',
                                oldschool: 'legal',
                                premodern: 'not_legal',
                                predh: 'banned',
                                alchemy: 'not_legal',
                                future: 'not_legal',
                                timeless: 'restricted',
                                gladiator: 'banned',
                                oathbreaker: 'banned',
                                standardbrawl: 'not_legal',
                                brawl: 'not_legal',
                                paupercommander: 'not_legal'
                            }
                        }
                    ],
                    not_found: []
                })
            })

            const request = new NextRequest(
                'http://localhost/api/collections',
                {
                    method: 'POST',
                    body: JSON.stringify({ decklist })
                }
            )

            const response = await POST(request)

            expect(response.status).toBe(200)
            expect(response.headers.get('Content-Type')).toBe(
                'text/plain; charset=utf-8'
            )
            expect(response.headers.get('Cache-Control')).toBe('no-cache')

            // Verify the fetch was called with correct parameters
            expect(global.fetch).toHaveBeenCalledWith(
                'https://api.scryfall.com/cards/collection',
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Content-Type': 'application/json',
                        'User-Agent': 'test-agent/1.0'
                    }),
                    body: expect.stringContaining('Lightning Bolt')
                })
            )
        })

        test('should handle batching for more than 75 cards', async () => {
            // Create a decklist with 80 unique cards (requires 2 batches)
            // Use unique names to avoid cache hits from other tests
            const cards = Array.from(
                { length: 80 },
                (_, i) => `1 BatchCard ${i}`
            )
            const decklist = cards.join('\n')

            // Mock fetch to return data for both batches
            global.fetch = vi
                .fn()
                .mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    json: async () => ({
                        data: Array.from({ length: 75 }, (_, i) => ({
                            id: `${i}`,
                            name: `BatchCard ${i}`,
                            cmc: 1,
                            type_line: 'Instant',
                            rarity: 'common',
                            image_uris: {
                                png: `https://example.com/card${i}.png`
                            },
                            colors: ['U'],
                            legalities: {
                                standard: 'legal',
                                modern: 'legal',
                                legacy: 'legal',
                                commander: 'legal',
                                vintage: 'legal',
                                pioneer: 'legal',
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
                        })),
                        not_found: []
                    })
                })
                .mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    json: async () => ({
                        data: Array.from({ length: 5 }, (_, i) => ({
                            id: `${75 + i}`,
                            name: `BatchCard ${75 + i}`,
                            cmc: 1,
                            type_line: 'Instant',
                            rarity: 'common',
                            image_uris: {
                                png: `https://example.com/card${75 + i}.png`
                            },
                            colors: ['U'],
                            legalities: {
                                standard: 'legal',
                                modern: 'legal',
                                legacy: 'legal',
                                commander: 'legal',
                                vintage: 'legal',
                                pioneer: 'legal',
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
                        })),
                        not_found: []
                    })
                })

            const request = new NextRequest(
                'http://localhost/api/collections',
                {
                    method: 'POST',
                    body: JSON.stringify({ decklist })
                }
            )

            const response = await POST(request)

            // Consume the stream to ensure all batches are processed
            if (response.body) {
                const reader = response.body.getReader()

                try {
                    while (true) {
                        const { done } = await reader.read()
                        if (done) break
                    }
                } catch {
                    // Ignore stream errors in test
                }
            }

            expect(response.status).toBe(200)
            // Verify fetch was called twice (2 batches)
            expect(global.fetch).toHaveBeenCalledTimes(2)
        })

        test('should use mock data when API fails', async () => {
            const decklist = '4 Lightning Bolt'

            // Mock fetch to fail
            global.fetch = vi.fn().mockRejectedValueOnce(new Error('API Error'))

            const request = new NextRequest(
                'http://localhost/api/collections',
                {
                    method: 'POST',
                    body: JSON.stringify({ decklist })
                }
            )

            const response = await POST(request)

            expect(response.status).toBe(200)
            // Should still return a streaming response
            expect(response.headers.get('Content-Type')).toBe(
                'text/plain; charset=utf-8'
            )
        })

        test('should handle not_found cards', async () => {
            const decklist = '1 Nonexistent Card'

            global.fetch = vi.fn().mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    data: [],
                    not_found: [{ name: 'Nonexistent Card' }]
                })
            })

            const request = new NextRequest(
                'http://localhost/api/collections',
                {
                    method: 'POST',
                    body: JSON.stringify({ decklist })
                }
            )

            const response = await POST(request)

            expect(response.status).toBe(200)
            expect(response.headers.get('Content-Type')).toBe(
                'text/plain; charset=utf-8'
            )
        })

        test('should handle internal server error', async () => {
            const request = new NextRequest(
                'http://localhost/api/collections',
                {
                    method: 'POST',
                    body: 'invalid json'
                }
            )

            const response = await POST(request)
            const data = await response.json()

            expect(response.status).toBe(500)
            expect(data.error).toBe('Internal server error')
        })
    })
})
