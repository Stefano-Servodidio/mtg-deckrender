import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest'
import { POST, GET } from '../route'
import { NextRequest } from 'next/server'

// Mock dependencies
vi.mock('@/utils/processing', () => ({
    calculateCanvasDimensions: vi.fn(() => ({ width: 1080, height: 1080 })),
    calculateCardDimensions: vi.fn(() => ({
        width: 200,
        height: 280,
        scale: 1,
        original: { width: 745, height: 1040 }
    })),
    resizeImages: vi.fn(() =>
        Promise.resolve([
            {
                name: 'Test Card',
                groupId: 1,
                buffer: Buffer.from('resized-image'),
                quantity: 1
            }
        ])
    ),
    sortCards: vi.fn((cards) => cards)
}))

vi.mock('@/utils/compositing', () => ({
    prepareCardOperations: vi.fn(() => [
        { input: Buffer.from('card'), left: 0, top: 0 }
    ]),
    createCanvas: vi.fn(() => ({
        composite: vi.fn().mockReturnThis(),
        png: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockResolvedValue(Buffer.from('final-image'))
    })),
    createCompositeImage: vi.fn().mockResolvedValue(Buffer.from('final-image')),
    prepareQuantityOverlayOperations: vi.fn(() => [])
}))

vi.mock('@/utils/api', () => ({
    downloadAllCardImages: vi.fn(() =>
        Promise.resolve({
            successfulImages: [
                {
                    name: 'Test Card',
                    groupId: 1,
                    buffer: Buffer.from('image'),
                    quantity: 1
                }
            ],
            failedImages: []
        })
    )
}))

describe('POST /api/deck-png', () => {
    let originalEnv: NodeJS.ProcessEnv

    beforeEach(() => {
        vi.clearAllMocks()
        originalEnv = process.env
        process.env = { ...originalEnv }
    })

    afterEach(() => {
        process.env = originalEnv
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
            const request = new NextRequest('http://localhost/api/deck-png', {
                method: 'POST',
                body: JSON.stringify({
                    cards: [
                        {
                            card: {
                                name: 'Test Card',
                                image_uris: {
                                    png: 'http://example.com/test.png'
                                }
                            },
                            quantity: 1
                        }
                    ]
                })
            })
            const response = await POST(request)
            expect(response.status).toBe(503)
            const data = await response.json()
            expect(data.error).toBe('Service Unavailable - Maintenance mode')
        })
    })

    describe('Request validation', () => {
        test('should reject request without cards array', async () => {
            const request = new NextRequest('http://localhost/api/deck-png', {
                method: 'POST',
                body: JSON.stringify({ options: {} })
            })

            const response = await POST(request)
            const data = await response.json()

            expect(response.status).toBe(400)
            expect(data.error).toContain('Invalid request')
        })

        test('should reject request with empty cards array', async () => {
            const request = new NextRequest('http://localhost/api/deck-png', {
                method: 'POST',
                body: JSON.stringify({ cards: [] })
            })

            const response = await POST(request)
            const data = await response.json()

            expect(response.status).toBe(400)
            expect(data.error).toContain('No cards provided')
        })

        test('should reject request with invalid cards type', async () => {
            const request = new NextRequest('http://localhost/api/deck-png', {
                method: 'POST',
                body: JSON.stringify({ cards: 'invalid' })
            })

            const response = await POST(request)
            const data = await response.json()

            expect(response.status).toBe(400)
            expect(data.error).toContain('Invalid request')
        })
    })

    describe('Streaming response', () => {
        test('should return streaming response for valid request', async () => {
            const cards = [
                {
                    id: '1',
                    name: 'Test Card',
                    cmc: 1,
                    typeLine: 'Creature',
                    rarity: 'common',
                    image_uri: 'https://example.com/card.png',
                    colors: ['R'],
                    legalities: {} as any,
                    quantity: 1,
                    groupId: 1
                }
            ]

            const request = new NextRequest('http://localhost/api/deck-png', {
                method: 'POST',
                body: JSON.stringify({ cards })
            })

            const response = await POST(request)

            expect(response.status).toBe(200)
            expect(response.headers.get('Content-Type')).toBe(
                'text/plain; charset=utf-8'
            )
            expect(response.headers.get('Cache-Control')).toBe('no-cache')
            expect(response.body).toBeDefined()
        })

        test('should handle cards with no valid images', async () => {
            const { downloadAllCardImages } = await import('@/utils/api')
            vi.mocked(downloadAllCardImages).mockResolvedValueOnce([[], []])

            const cards = [
                {
                    id: '1',
                    name: 'Invalid Card',
                    cmc: 1,
                    typeLine: 'Creature',
                    rarity: 'common',
                    image_uri: null,
                    colors: ['R'],
                    legalities: {} as any,
                    quantity: 0,
                    groupId: 1
                }
            ]

            const request = new NextRequest('http://localhost/api/deck-png', {
                method: 'POST',
                body: JSON.stringify({ cards })
            })

            const response = await POST(request)
            expect(response.status).toBe(200)
        })

        test('should handle image download failures gracefully', async () => {
            const { downloadAllCardImages } = await import('@/utils/api')
            vi.mocked(downloadAllCardImages).mockResolvedValueOnce([
                [
                    {
                        name: 'Card 1',
                        groupId: 1,
                        buffer: Buffer.from('image'),
                        quantity: 1
                    }
                ],
                [
                    {
                        name: 'Card 2',
                        groupId: 1,
                        buffer: null,
                        quantity: 1
                    }
                ]
            ])

            const cards = [
                {
                    id: '1',
                    name: 'Card 1',
                    cmc: 1,
                    typeLine: 'Creature',
                    rarity: 'common',
                    image_uri: 'https://example.com/card1.png',
                    colors: ['R'],
                    legalities: {} as any,
                    quantity: 1,
                    groupId: 1
                },
                {
                    id: '2',
                    name: 'Card 2',
                    cmc: 2,
                    typeLine: 'Instant',
                    rarity: 'rare',
                    image_uri: 'https://example.com/card2.png',
                    colors: ['U'],
                    legalities: {} as any,
                    quantity: 1,
                    groupId: 1
                }
            ]

            const request = new NextRequest('http://localhost/api/deck-png', {
                method: 'POST',
                body: JSON.stringify({ cards })
            })

            const response = await POST(request)
            expect(response.status).toBe(200)
        })
    })

    describe('Options handling', () => {
        test('should use default options when not provided', async () => {
            const cards = [
                {
                    id: '1',
                    name: 'Test Card',
                    cmc: 1,
                    typeLine: 'Creature',
                    rarity: 'common',
                    image_uri: 'https://example.com/card.png',
                    colors: ['R'],
                    legalities: {} as any,
                    quantity: 1,
                    groupId: 1
                }
            ]

            const request = new NextRequest('http://localhost/api/deck-png', {
                method: 'POST',
                body: JSON.stringify({ cards })
            })

            const response = await POST(request)
            expect(response.status).toBe(200)
        })

        test('should merge provided options with defaults', async () => {
            const cards = [
                {
                    id: '1',
                    name: 'Test Card',
                    cmc: 1,
                    typeLine: 'Creature',
                    rarity: 'common',
                    image_uri: 'https://example.com/card.png',
                    colors: ['R'],
                    legalities: {} as any,
                    quantity: 1,
                    groupId: 1
                }
            ]

            const options = {
                fileType: 'jpeg' as const,
                sortBy: 'name' as const
            }

            const request = new NextRequest('http://localhost/api/deck-png', {
                method: 'POST',
                body: JSON.stringify({ cards, options })
            })

            const response = await POST(request)
            expect(response.status).toBe(200)
        })
    })

    describe('Error handling', () => {
        test('should handle JSON parsing errors', async () => {
            const request = new NextRequest('http://localhost/api/deck-png', {
                method: 'POST',
                body: 'invalid json'
            })

            const response = await POST(request)
            expect(response.status).toBe(500)
        })

        test('should handle internal processing errors', async () => {
            const { downloadAllCardImages } = await import('@/utils/api')
            vi.mocked(downloadAllCardImages).mockRejectedValueOnce(
                new Error('Download failed')
            )

            const cards = [
                {
                    id: '1',
                    name: 'Test Card',
                    cmc: 1,
                    typeLine: 'Creature',
                    rarity: 'common',
                    image_uri: 'https://example.com/card.png',
                    colors: ['R'],
                    legalities: {} as any,
                    quantity: 1,
                    groupId: 1
                }
            ]

            const request = new NextRequest('http://localhost/api/deck-png', {
                method: 'POST',
                body: JSON.stringify({ cards })
            })

            const response = await POST(request)
            expect(response.status).toBe(200) // Stream starts before error
        })
    })
})

describe('GET /api/deck-png', () => {
    test('should return API documentation', async () => {
        const response = await GET()
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.message).toBe('Deck PNG Generator API')
        expect(data.usage).toBeDefined()
        expect(data.description).toBeDefined()
        expect(data.expectedFormat).toBeDefined()
        expect(data.returns).toBeDefined()
    })

    test('should have correct documentation structure', async () => {
        const response = await GET()
        const data = await response.json()

        expect(data.expectedFormat.cards).toBeDefined()
        expect(data.expectedFormat.options).toBeDefined()
        expect(Array.isArray(data.expectedFormat.cards)).toBe(true)
    })
})
