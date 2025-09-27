import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
    getUniqueCards,
    sleep,
    prepareCardOperations,
    prepareCountOperations
} from '../utils/api'

// Mock fs/promises for testing
vi.mock('fs/promises', () => ({
    readFile: vi.fn()
}))

describe('API Utilities', () => {
    describe('getUniqueCards', () => {
        it('should parse a simple decklist correctly', () => {
            const decklist = '4 Lightning Bolt\n2 Counterspell\n1 Black Lotus'
            const result = getUniqueCards(decklist, 'main')

            expect(result).toHaveLength(3)
            expect(result[0]).toEqual({
                name: 'Lightning Bolt',
                quantity: 4,
                type: 'main'
            })
            expect(result[1]).toEqual({
                name: 'Counterspell',
                quantity: 2,
                type: 'main'
            })
            expect(result[2]).toEqual({
                name: 'Black Lotus',
                quantity: 1,
                type: 'main'
            })
        })

        it('should handle sideboard cards correctly', () => {
            const decklist = "3 Nature's Claim\n2 Rest in Peace"
            const result = getUniqueCards(decklist, 'sideboard')

            expect(result).toHaveLength(2)
            expect(result[0]).toEqual({
                name: "Nature's Claim",
                quantity: 3,
                type: 'sideboard'
            })
            expect(result[1]).toEqual({
                name: 'Rest in Peace',
                quantity: 2,
                type: 'sideboard'
            })
        })

        it('should handle cards with x prefix', () => {
            const decklist = '4x Lightning Bolt\n1x Sol Ring'
            const result = getUniqueCards(decklist, 'main')

            expect(result).toHaveLength(2)
            expect(result[0]).toEqual({
                name: 'Lightning Bolt',
                quantity: 4,
                type: 'main'
            })
            expect(result[1]).toEqual({
                name: 'Sol Ring',
                quantity: 1,
                type: 'main'
            })
        })

        it('should ignore empty lines', () => {
            const decklist = '4 Lightning Bolt\n\n2 Counterspell\n\n'
            const result = getUniqueCards(decklist, 'main')

            expect(result).toHaveLength(2)
            expect(result[0].name).toBe('Lightning Bolt')
            expect(result[1].name).toBe('Counterspell')
        })

        it('should ignore invalid lines', () => {
            const decklist =
                '4 Lightning Bolt\nInvalid Line\n0 Zero Quantity\n-1 Negative'
            const result = getUniqueCards(decklist, 'main')

            expect(result).toHaveLength(1)
            expect(result[0].name).toBe('Lightning Bolt')
        })

        it('should handle empty input', () => {
            const result = getUniqueCards('', 'main')
            expect(result).toHaveLength(0)
        })
    })

    describe('sleep', () => {
        beforeEach(() => {
            vi.useFakeTimers()
        })

        afterEach(() => {
            vi.useRealTimers()
        })

        it('should resolve after specified time', async () => {
            const promise = sleep(100)
            let resolved = false

            promise.then(() => {
                resolved = true
            })

            expect(resolved).toBe(false)

            vi.advanceTimersByTime(100)
            await promise

            expect(resolved).toBe(true)
        })
    })

    describe('prepareCardOperations', () => {
        it('should calculate correct positions for main deck cards', () => {
            const mockImages = [
                {
                    name: 'Card 1',
                    buffer: Buffer.from('test1'),
                    quantity: 1,
                    type: 'main' as const
                },
                {
                    name: 'Card 2',
                    buffer: Buffer.from('test2'),
                    quantity: 1,
                    type: 'main' as const
                },
                {
                    name: 'Card 3',
                    buffer: Buffer.from('test3'),
                    quantity: 1,
                    type: 'main' as const
                }
            ]

            const operations = prepareCardOperations(
                mockImages,
                2, // cardsPerRow
                100, // cardWidth
                150, // rowHeight
                10, // spacing
                20, // sideboardSpacing
                0 // mainHeight
            )

            expect(operations).toHaveLength(3)

            // First card (row 0, col 0)
            expect(operations[0]).toEqual({
                input: mockImages[0].buffer,
                left: 10, // spacing
                top: 10 // spacing
            })

            // Second card (row 0, col 1)
            expect(operations[1]).toEqual({
                input: mockImages[1].buffer,
                left: 120, // spacing + col * (cardWidth + spacing)
                top: 10
            })

            // Third card (row 1, col 0)
            expect(operations[2]).toEqual({
                input: mockImages[2].buffer,
                left: 10,
                top: 170 // spacing + row * (rowHeight + spacing)
            })
        })

        it('should calculate correct positions for sideboard cards', () => {
            const mockImages = [
                {
                    name: 'Card SB',
                    buffer: Buffer.from('test1'),
                    quantity: 1,
                    type: 'sideboard' as const
                }
            ]

            const operations = prepareCardOperations(
                mockImages,
                2, // cardsPerRow
                100, // cardWidth
                150, // rowHeight
                10, // spacing
                20, // sideboardSpacing
                300 // mainHeight
            )

            expect(operations).toHaveLength(1)
            expect(operations[0]).toEqual({
                input: mockImages[0].buffer,
                left: 10,
                top: 480 // spacing + mainHeight + rowHeight + sideboardSpacing
            })
        })
    })

    describe('prepareCountOperations', () => {
        it('should generate operations only for cards with quantity > 1', () => {
            const mockImages = [
                {
                    name: 'Card 1',
                    buffer: Buffer.from('test1'),
                    quantity: 1,
                    type: 'main' as const
                },
                {
                    name: 'Card 2',
                    buffer: Buffer.from('test2'),
                    quantity: 4,
                    type: 'main' as const
                },
                {
                    name: 'Card 3',
                    buffer: Buffer.from('test3'),
                    quantity: 2,
                    type: 'main' as const
                }
            ]

            const mockCountIconBuffers = {
                1: Buffer.from('count1'),
                2: Buffer.from('count2'),
                4: Buffer.from('count4')
            }

            const operations = prepareCountOperations(
                mockImages,
                2, // cardsPerRow
                100, // cardWidth
                150, // rowHeight
                10, // spacing
                20, // sideboardSpacing
                mockCountIconBuffers,
                0 // mainHeight
            )

            expect(operations).toHaveLength(2) // Only cards with quantity > 1

            // Second card (quantity 4, row 0, col 1)
            expect(operations[0]).toEqual({
                input: mockCountIconBuffers[4],
                left: 170, // spacing + col * (cardWidth + spacing) + cardWidth - 50 = 10 + 1 * (100 + 10) + 100 - 50
                top: 38 // spacing + row * (rowHeight + spacing) + 28 = 10 + 0 * (150 + 10) + 28
            })

            // Third card (quantity 2, row 1, col 0)
            expect(operations[1]).toEqual({
                input: mockCountIconBuffers[2],
                left: 60, // spacing + col * (cardWidth + spacing) + cardWidth - 50 = 10 + 0 * (100 + 10) + 100 - 50
                top: 198 // spacing + row * (rowHeight + spacing) + 28 = 10 + 1 * (150 + 10) + 28
            })
        })

        it('should use fallback count icon for unknown quantities', () => {
            const mockImages = [
                {
                    name: 'Card 7',
                    buffer: Buffer.from('test1'),
                    quantity: 7,
                    type: 'main' as const
                }
            ]

            const mockCountIconBuffers = {
                1: Buffer.from('count1'),
                2: Buffer.from('count2')
            }

            const operations = prepareCountOperations(
                mockImages,
                2,
                100,
                150,
                10,
                20,
                mockCountIconBuffers,
                0
            )

            expect(operations).toHaveLength(1)
            expect(operations[0].input).toBe(mockCountIconBuffers[1]) // Falls back to count1
        })

        it('should handle sideboard cards with correct positioning', () => {
            const mockImages = [
                {
                    name: 'Card SB3',
                    buffer: Buffer.from('test1'),
                    quantity: 3,
                    type: 'sideboard' as const
                }
            ]

            const mockCountIconBuffers = {
                1: Buffer.from('count1'),
                3: Buffer.from('count3')
            }

            const operations = prepareCountOperations(
                mockImages,
                2,
                100,
                150,
                10,
                20,
                mockCountIconBuffers,
                300 // mainHeight
            )

            expect(operations).toHaveLength(1)
            expect(operations[0]).toEqual({
                input: mockCountIconBuffers[3],
                left: 60,
                top: 508 // spacing + mainHeight + rowHeight + sideboardSpacing + 28 = 10 + 300 + 150 + 20 + 28
            })
        })
    })
})
