import { describe, expect, test, vi } from 'vitest'
import { sortCards, resizeImages } from '../processing'
import { CardImageBuffer, CardItem } from '@/types/api'

// Mock sharp
vi.mock('sharp', () => {
    const mockSharp = {
        resize: vi.fn().mockReturnThis(),
        ensureAlpha: vi.fn().mockReturnThis(),
        composite: vi.fn().mockReturnThis(),
        png: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockResolvedValue(Buffer.from('resized-image'))
    }
    return {
        default: vi.fn(() => mockSharp)
    }
})

describe('Processing utility functions', () => {
    describe('sortCards', () => {
        const mockCards: CardItem[] = [
            {
                id: '1',
                name: 'Zebra Card',
                cmc: 3,
                typeLine: 'Creature',
                rarity: 'rare',
                image_uri: 'test.jpg',
                colors: ['R'],
                legalities: {} as any,
                quantity: 1,
                groupId: 0
            },
            {
                id: '2',
                name: 'Alpha Card',
                cmc: 1,
                typeLine: 'Instant',
                rarity: 'common',
                image_uri: 'test2.jpg',
                colors: ['U'],
                legalities: {} as any,
                quantity: 2,
                groupId: 0
            },
            {
                id: '3',
                name: 'Beta Card',
                cmc: 5,
                typeLine: 'Sorcery',
                rarity: 'mythic',
                image_uri: 'test3.jpg',
                colors: ['B', 'R'],
                legalities: {} as any,
                quantity: 1,
                groupId: 0
            }
        ]

        test('should sort by name ascending by default', () => {
            const result = sortCards([...mockCards])

            expect(result[0].name).toBe('Alpha Card')
            expect(result[1].name).toBe('Beta Card')
            expect(result[2].name).toBe('Zebra Card')
        })

        test('should sort by name descending', () => {
            const result = sortCards([...mockCards], 'name', 'desc')

            expect(result[0].name).toBe('Zebra Card')
            expect(result[1].name).toBe('Beta Card')
            expect(result[2].name).toBe('Alpha Card')
        })

        test('should sort by cmc ascending', () => {
            const result = sortCards([...mockCards], 'cmc', 'asc')

            expect(result[0].cmc).toBe(1)
            expect(result[1].cmc).toBe(3)
            expect(result[2].cmc).toBe(5)
        })

        test('should sort by cmc descending', () => {
            const result = sortCards([...mockCards], 'cmc', 'desc')

            expect(result[0].cmc).toBe(5)
            expect(result[1].cmc).toBe(3)
            expect(result[2].cmc).toBe(1)
        })

        test('should sort by rarity ascending', () => {
            const result = sortCards([...mockCards], 'rarity', 'asc')

            expect(result[0].rarity).toBe('common')
            expect(result[1].rarity).toBe('rare')
            expect(result[2].rarity).toBe('mythic')
        })

        test('should sort by rarity descending', () => {
            const result = sortCards([...mockCards], 'rarity', 'desc')

            expect(result[0].rarity).toBe('mythic')
            expect(result[1].rarity).toBe('rare')
            expect(result[2].rarity).toBe('common')
        })

        test('should sort by colors ascending', () => {
            const result = sortCards([...mockCards], 'colors', 'asc')

            // Expected order: U (Blue), R (Red), multi (Black+Red)
            expect(result[0].colors).toEqual(['U']) // Blue
            expect(result[1].colors).toEqual(['R']) // Red
            expect(result[2].colors).toEqual(['B', 'R']) // Multi
        })

        test('should sort by colors descending', () => {
            const result = sortCards([...mockCards], 'colors', 'desc')

            // Reverse order: multi, R, U
            expect(result[0].colors).toEqual(['B', 'R']) // Multi
            expect(result[1].colors).toEqual(['R']) // Red
            expect(result[2].colors).toEqual(['U']) // Blue
        })

        test('should handle colorless cards', () => {
            const colorlessCard: CardItem = {
                ...mockCards[0],
                colors: [],
                name: 'Colorless Card'
            }

            const result = sortCards(
                [colorlessCard, mockCards[1]],
                'colors',
                'asc'
            )

            expect(result[0].colors).toEqual(['U']) // Blue comes before colorless
            expect(result[1].colors).toEqual([]) // Colorless
        })

        test('should handle cards with no colors property', () => {
            const noColorsCard: CardItem = {
                ...mockCards[0],
                colors: undefined as any,
                name: 'No Colors Card'
            }

            const result = sortCards(
                [noColorsCard, mockCards[1]],
                'colors',
                'asc'
            )

            expect(result[0].colors).toEqual(['U']) // Blue
            expect(result[1].colors).toBeUndefined() // No colors
        })

        test('should keep groups together and not sort across groups', () => {
            const cardsInDifferentGroups: CardItem[] = [
                { ...mockCards[0], groupId: 0, name: 'Zebra' },
                { ...mockCards[1], groupId: 1, name: 'Alpha' },
                { ...mockCards[2], groupId: 0, name: 'Beta' }
            ]

            const result = sortCards([...cardsInDifferentGroups], 'name', 'asc')

            // Should maintain original order when cards are in different groups
            expect(result[0].name).toBe('Zebra')
            expect(result[1].name).toBe('Alpha')
            expect(result[2].name).toBe('Beta')
        })

        test('should use default sort when invalid sortBy provided', () => {
            const result = sortCards([...mockCards], 'invalid' as any, 'asc')

            // Should fall back to name sorting
            expect(result[0].name).toBe('Alpha Card')
            expect(result[1].name).toBe('Beta Card')
            expect(result[2].name).toBe('Zebra Card')
        })

        test('should handle empty array', () => {
            const result = sortCards([])
            expect(result).toEqual([])
        })

        test('should handle single card', () => {
            const result = sortCards([mockCards[0]])
            expect(result).toEqual([mockCards[0]])
        })

        test('should sort by typeLine', () => {
            const result = sortCards([...mockCards], 'typeLine', 'asc')

            expect(result[0].typeLine).toBe('Creature')
            expect(result[1].typeLine).toBe('Instant')
            expect(result[2].typeLine).toBe('Sorcery')
        })

        test('should handle equal values in sorting', () => {
            const equalCards: CardItem[] = [
                { ...mockCards[0], cmc: 2, name: 'Card A' },
                { ...mockCards[1], cmc: 2, name: 'Card B' },
                { ...mockCards[2], cmc: 2, name: 'Card C' }
            ]

            const result = sortCards([...equalCards], 'cmc', 'asc')

            // When CMC is equal, should maintain relative order
            expect(result.every((card) => card.cmc === 2)).toBe(true)
        })
    })

    describe('resizeImages', () => {
        const mockCardImages: CardImageBuffer[] = [
            {
                name: 'Card 1',
                groupId: 0,
                buffer: Buffer.from('image1'),
                quantity: 1
            },
            {
                name: 'Card 2',
                groupId: 0,
                buffer: Buffer.from('image2'),
                quantity: 2
            },
            {
                name: 'Card 3',
                groupId: 0,
                buffer: null,
                quantity: 1
            }
        ]

        const mockDimensions = {
            width: 100,
            height: 140
        }

        test('should resize images with valid buffers', async () => {
            const sharp = await import('sharp')
            const mockSharpInstance = {
                resize: vi.fn().mockReturnThis(),
                ensureAlpha: vi.fn().mockReturnThis(),
                composite: vi.fn().mockReturnThis(),
                png: vi.fn().mockReturnThis(),
                toBuffer: vi
                    .fn()
                    .mockResolvedValue(Buffer.from('resized-image'))
            }

            // Mock sharp to return our mock instance
            vi.mocked(sharp.default).mockReturnValue(mockSharpInstance as any)

            const result = await resizeImages(mockCardImages, mockDimensions)

            expect(result).toHaveLength(3)
            expect(result[0].buffer).toEqual(Buffer.from('resized-image'))
            expect(result[1].buffer).toEqual(Buffer.from('resized-image'))
            expect(result[2].buffer).toBeNull() // Should remain null if original was null

            // Verify sharp was called correctly
            expect(sharp.default).toHaveBeenCalledWith(Buffer.from('image1'))
            expect(sharp.default).toHaveBeenCalledWith(Buffer.from('image2'))
            expect(mockSharpInstance.resize).toHaveBeenCalledWith({
                width: 100,
                height: 140
            })

            // Verify rounded corners are applied
            expect(mockSharpInstance.ensureAlpha).toHaveBeenCalled()
            expect(mockSharpInstance.composite).toHaveBeenCalled()
        })

        test('should handle images with null buffers', async () => {
            const imagesWithNullBuffers: CardImageBuffer[] = [
                {
                    name: 'Card 1',
                    groupId: 0,
                    buffer: null,
                    quantity: 1
                },
                {
                    name: 'Card 2',
                    groupId: 0,
                    buffer: null,
                    quantity: 1
                }
            ]

            const result = await resizeImages(
                imagesWithNullBuffers,
                mockDimensions
            )

            expect(result).toHaveLength(2)
            expect(result[0].buffer).toBeNull()
            expect(result[1].buffer).toBeNull()
        })

        test('should preserve card metadata during resize', async () => {
            const sharp = await import('sharp')
            const mockSharpInstance = {
                resize: vi.fn().mockReturnThis(),
                ensureAlpha: vi.fn().mockReturnThis(),
                composite: vi.fn().mockReturnThis(),
                png: vi.fn().mockReturnThis(),
                toBuffer: vi.fn().mockResolvedValue(Buffer.from('resized'))
            }

            vi.mocked(sharp.default).mockReturnValue(mockSharpInstance as any)

            const result = await resizeImages(
                [mockCardImages[0]],
                mockDimensions
            )

            expect(result[0].name).toBe('Card 1')
            expect(result[0].groupId).toBe(0)
            expect(result[0].quantity).toBe(1)
            expect(result[0].buffer).toEqual(Buffer.from('resized'))
        })

        test('should handle empty array', async () => {
            const result = await resizeImages([], mockDimensions)
            expect(result).toEqual([])
        })

        test('should round dimensions to integers', async () => {
            const sharp = await import('sharp')
            const mockSharpInstance = {
                resize: vi.fn().mockReturnThis(),
                ensureAlpha: vi.fn().mockReturnThis(),
                composite: vi.fn().mockReturnThis(),
                png: vi.fn().mockReturnThis(),
                toBuffer: vi.fn().mockResolvedValue(Buffer.from('resized'))
            }

            vi.mocked(sharp.default).mockReturnValue(mockSharpInstance as any)

            const fractionalDimensions = {
                width: 100.7,
                height: 140.3
            }

            await resizeImages([mockCardImages[0]], fractionalDimensions)

            expect(mockSharpInstance.resize).toHaveBeenCalledWith({
                width: 101, // Math.round(100.7)
                height: 140 // Math.round(140.3)
            })
        })

        test('should handle sharp errors gracefully', async () => {
            const sharp = await import('sharp')
            const mockSharpInstance = {
                resize: vi.fn().mockReturnThis(),
                ensureAlpha: vi.fn().mockReturnThis(),
                composite: vi.fn().mockReturnThis(),
                png: vi.fn().mockReturnThis(),
                toBuffer: vi
                    .fn()
                    .mockRejectedValue(new Error('Sharp processing failed'))
            }

            vi.mocked(sharp.default).mockReturnValue(mockSharpInstance as any)

            await expect(
                resizeImages([mockCardImages[0]], mockDimensions)
            ).rejects.toThrow('Sharp processing failed')
        })

        test('should apply rounded corners with default scale', async () => {
            const sharp = await import('sharp')
            const mockSharpInstance = {
                resize: vi.fn().mockReturnThis(),
                ensureAlpha: vi.fn().mockReturnThis(),
                composite: vi.fn().mockReturnThis(),
                png: vi.fn().mockReturnThis(),
                toBuffer: vi.fn().mockResolvedValue(Buffer.from('resized'))
            }

            vi.mocked(sharp.default).mockReturnValue(mockSharpInstance as any)

            await resizeImages([mockCardImages[0]], mockDimensions)

            // Verify composite was called with an SVG mask
            expect(mockSharpInstance.composite).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({
                        blend: 'dest-in'
                    })
                ])
            )
        })

        test('should scale corner radius proportionally with card dimensions', async () => {
            const sharp = await import('sharp')
            const mockSharpInstance = {
                resize: vi.fn().mockReturnThis(),
                ensureAlpha: vi.fn().mockReturnThis(),
                composite: vi.fn().mockReturnThis(),
                png: vi.fn().mockReturnThis(),
                toBuffer: vi.fn().mockResolvedValue(Buffer.from('resized')),
                toPng: vi.fn().mockReturnThis()
            }

            vi.mocked(sharp.default).mockReturnValue(mockSharpInstance as any)

            const scaledDimensions = {
                width: 200,
                height: 280,
                scale: 0.5 // 50% scale
            }

            await resizeImages([mockCardImages[0]], scaledDimensions)

            // Verify composite was called
            expect(mockSharpInstance.composite).toHaveBeenCalled()

            // Get the SVG that was passed to composite
            const compositeCall = mockSharpInstance.composite.mock.calls[0][0]
            const svgBuffer = compositeCall[0].input
            const svgString = svgBuffer.toString()

            // Verify the corner radius was scaled (35 * 0.5 = 17.5, rounds to 18)
            expect(svgString).toContain('rx="18"')
            expect(svgString).toContain('ry="18"')
        })

        test('should handle null buffers without applying rounded corners', async () => {
            const sharp = await import('sharp')

            // Clear previous mock calls
            vi.mocked(sharp.default).mockClear()

            const result = await resizeImages(
                [mockCardImages[2]], // Card with null buffer
                mockDimensions
            )

            // Sharp should not be called for null buffers
            expect(sharp.default).not.toHaveBeenCalled()
            expect(result[0].buffer).toBeNull()
        })
    })
})
