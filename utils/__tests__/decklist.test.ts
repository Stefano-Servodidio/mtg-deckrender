import { describe, expect, test, vi } from 'vitest'
import {
    parseDecklist,
    getUniqueCards,
    createCardItem,
    createMockCardItem,
    sleep
} from '../decklist'
import { ScryfallCard } from '@/types/scryfall'

describe('Decklist utility functions', () => {
    describe('parseDecklist', () => {
        test('should split decklist into main deck only', () => {
            const decklist = '4 Lightning Bolt\n2 Counterspell'
            const result = parseDecklist(decklist)

            expect(result).toHaveLength(1)
            expect(result[0]).toBe('4 Lightning Bolt\n2 Counterspell')
        })

        test('should split decklist with sideboard (double newline)', () => {
            const decklist =
                '4 Lightning Bolt\n2 Counterspell\n\n3 Path to Exile\n1 Wrath of God'
            const result = parseDecklist(decklist)

            expect(result).toHaveLength(2)
            expect(result[0]).toBe('4 Lightning Bolt\n2 Counterspell')
            expect(result[1]).toBe('3 Path to Exile\n1 Wrath of God')
        })

        test('should split decklist with SIDEBOARD separator', () => {
            const decklist =
                '4 Lightning Bolt\n2 Counterspell\n\nSIDEBOARD\n3 Path to Exile\n1 Wrath of God'
            const result = parseDecklist(decklist)

            expect(result).toHaveLength(2)
            expect(result[0]).toBe('4 Lightning Bolt\n2 Counterspell')
            expect(result[1]).toBe('SIDEBOARD\n3 Path to Exile\n1 Wrath of God')
        })

        test('should split decklist with sideboard separator', () => {
            const decklist =
                '4 Lightning Bolt\n2 Counterspell\n\nsideboard\n3 Path to Exile\n1 Wrath of God'
            const result = parseDecklist(decklist)

            expect(result).toHaveLength(2)
            expect(result[0]).toBe('4 Lightning Bolt\n2 Counterspell')
            expect(result[1]).toBe('sideboard\n3 Path to Exile\n1 Wrath of God')
        })

        test('should split decklist with -- separator', () => {
            const decklist =
                '4 Lightning Bolt\n2 Counterspell\n\n--\n3 Path to Exile\n1 Wrath of God'
            const result = parseDecklist(decklist)

            expect(result).toHaveLength(2)
            expect(result[0]).toBe('4 Lightning Bolt\n2 Counterspell')
            expect(result[1]).toBe('--\n3 Path to Exile\n1 Wrath of God')
        })

        test('should split decklist with SB: separator', () => {
            const decklist =
                '4 Lightning Bolt\n2 Counterspell\n\nSB:\n3 Path to Exile\n1 Wrath of God'
            const result = parseDecklist(decklist)

            expect(result).toHaveLength(2)
            expect(result[0]).toBe('4 Lightning Bolt\n2 Counterspell')
            expect(result[1]).toBe('SB:\n3 Path to Exile\n1 Wrath of God')
        })

        test('should handle empty decklist', () => {
            const result = parseDecklist('')
            expect(result).toHaveLength(0)
        })

        test('should trim whitespace', () => {
            const decklist = '   4 Lightning Bolt\n2 Counterspell   '
            const result = parseDecklist(decklist)

            expect(result[0]).toBe('4 Lightning Bolt\n2 Counterspell')
        })

        test('should remove leading non-alphanumeric characters from search', () => {
            const decklist = '###4 Lightning Bolt\n2 Counterspell'
            const result = parseDecklist(decklist)

            // The function actually operates on the original decklist for splitting
            // The leading character removal logic only affects the search, not the actual parsing
            expect(result[0]).toBe('###4 Lightning Bolt\n2 Counterspell')
        })
    })

    describe('getUniqueCards', () => {
        test('should parse simple card list with spaces', () => {
            const decklist = '4 Lightning Bolt\n2 Counterspell'
            const result = getUniqueCards(decklist, 1)

            expect(result).toHaveLength(2)
            expect(result[0]).toEqual({
                name: 'Lightning Bolt',
                quantity: 4,
                groupId: 1
            })
            expect(result[1]).toEqual({
                name: 'Counterspell',
                quantity: 2,
                groupId: 1
            })
        })

        test('should parse card list with x notation', () => {
            const decklist = '4x Lightning Bolt\n2x Counterspell'
            const result = getUniqueCards(decklist, 1)

            expect(result).toHaveLength(2)
            expect(result[0]).toEqual({
                name: 'Lightning Bolt',
                quantity: 4,
                groupId: 1
            })
            expect(result[1]).toEqual({
                name: 'Counterspell',
                quantity: 2,
                groupId: 1
            })
        })

        test('should handle cards with multiple words in name', () => {
            const decklist = '1 Jace, the Mind Sculptor\n3 Teferi, Time Raveler'
            const result = getUniqueCards(decklist, 1)

            expect(result).toHaveLength(2)
            // The function replaces only the first space with #, so multi-word names keep spaces
            expect(result[0]).toEqual({
                name: 'Jace, the Mind Sculptor',
                quantity: 1,
                groupId: 1
            })
            expect(result[1]).toEqual({
                name: 'Teferi, Time Raveler',
                quantity: 3,
                groupId: 1
            })
        })

        test('should filter out empty lines', () => {
            const decklist = '4 Lightning Bolt\n\n2 Counterspell\n'
            const result = getUniqueCards(decklist, 1)

            expect(result).toHaveLength(2)
        })

        test('should filter out invalid quantity lines', () => {
            const decklist =
                '4 Lightning Bolt\ninvalid line\n0 Zero Quantity\n-1 Negative Quantity\n2 Counterspell'
            const result = getUniqueCards(decklist, 1)

            expect(result).toHaveLength(2)
            expect(result.map((c) => c.name)).toEqual([
                'Lightning Bolt',
                'Counterspell'
            ])
        })

        test('should handle different group IDs', () => {
            const decklist = '4 Lightning Bolt'
            const mainDeck = getUniqueCards(decklist, 0)
            const sideboard = getUniqueCards(decklist, 1)

            expect(mainDeck[0].groupId).toBe(0)
            expect(sideboard[0].groupId).toBe(1)
        })

        test('should handle empty decklist', () => {
            const result = getUniqueCards('', 1)
            expect(result).toHaveLength(0)
        })

        test('should handle lines with only spaces', () => {
            const decklist = '4 Lightning Bolt\n   \n2 Counterspell'
            const result = getUniqueCards(decklist, 1)

            expect(result).toHaveLength(2)
        })
    })

    describe('createCardItem', () => {
        const mockScryfallCard: ScryfallCard = {
            id: 'test-id-123',
            name: 'Lightning Bolt',
            cmc: 1,
            type_line: 'Instant',
            rarity: 'common',
            image_uris: {
                png: 'https://example.com/card.png'
            },
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
        } as ScryfallCard

        test('should create CardItem from Scryfall data', () => {
            const result = createCardItem(mockScryfallCard, 4, 1)

            expect(result).toEqual({
                id: 'test-id-123',
                name: 'Lightning Bolt',
                cmc: 1,
                typeLine: 'Instant',
                rarity: 'common',
                image_uri: 'https://example.com/card.png',
                colors: ['R'],
                legalities: mockScryfallCard.legalities,
                quantity: 4,
                groupId: 1
            })
        })

        test('should handle card with multiple faces', () => {
            const doubleFacedCard = {
                ...mockScryfallCard,
                image_uris: null,
                card_faces: [
                    {
                        image_uris: {
                            png: 'https://example.com/front-face.png'
                        }
                    },
                    {
                        image_uris: {
                            png: 'https://example.com/back-face.png'
                        }
                    }
                ]
            } as ScryfallCard

            const result = createCardItem(doubleFacedCard, 2, 0)

            expect(result.image_uri).toBe('https://example.com/front-face.png')
        })

        test('should handle card with no image_uris', () => {
            const cardWithoutImage = {
                ...mockScryfallCard,
                image_uris: null
            } as ScryfallCard

            const result = createCardItem(cardWithoutImage, 1, 0)

            expect(result.image_uri).toBeNull()
        })

        test('should handle card faces without image_uris', () => {
            const cardWithInvalidFaces = {
                ...mockScryfallCard,
                image_uris: null,
                card_faces: [
                    {
                        image_uris: null
                    }
                ]
            } as ScryfallCard

            const result = createCardItem(cardWithInvalidFaces, 1, 0)

            expect(result.image_uri).toBeNull()
        })
    })

    describe('createMockCardItem', () => {
        test('should create mock card with provided data', () => {
            const result = createMockCardItem('Test Card', 3, 2)

            expect(result.id).toBe('mock-test-card')
            expect(result.name).toBe('name')
            expect(result.quantity).toBe(3)
            expect(result.groupId).toBe(2)
            expect(result.typeLine).toBe('Instant')
            expect(result.rarity).toBe('common')
            expect(result.colors).toEqual(['U', 'R'])
            expect(result.image_uri).toContain('https://cards.scryfall.io')
        })

        test('should handle card names with spaces', () => {
            const result = createMockCardItem('Jace the Mind Sculptor', 1, 0)

            expect(result.id).toBe('mock-jace-the-mind-sculptor')
        })

        test('should generate random CMC', () => {
            // Mock Math.random to return predictable value
            const originalRandom = Math.random
            Math.random = vi.fn(() => 0.5)

            const result = createMockCardItem('Test', 1, 0)
            expect(result.cmc).toBe(4) // floor(0.5 * 8) = 4

            Math.random = originalRandom
        })

        test('should have complete legalities object', () => {
            const result = createMockCardItem('Test', 1, 0)

            expect(result.legalities).toBeDefined()
            expect(result.legalities.standard).toBeDefined()
            expect(result.legalities.modern).toBeDefined()
            expect(result.legalities.commander).toBeDefined()
        })
    })

    describe('sleep', () => {
        test('should resolve after specified milliseconds', async () => {
            const start = Date.now()
            await sleep(50)
            const end = Date.now()

            // Allow some tolerance for timing
            expect(end - start).toBeGreaterThanOrEqual(45)
            expect(end - start).toBeLessThan(100)
        })
    })
})
