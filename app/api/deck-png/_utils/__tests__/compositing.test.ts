import { describe, expect, test, vi } from 'vitest'
import {
    prepareCardOperations,
    createCanvas,
    createCompositeImage
} from '../compositing'
import { CardImageBuffer, Dimensions } from '../_types'

// Mock dependencies
vi.mock('sharp', () => {
    const mockSharp = {
        composite: vi.fn().mockReturnThis(),
        png: vi.fn().mockReturnThis(),
        jpeg: vi.fn().mockReturnThis(),
        webp: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockResolvedValue(Buffer.from('composite-result'))
    }
    const mockSharpFunction = vi.fn((options?: any) => {
        if (options?.create) {
            return mockSharp
        }
        return mockSharp
    })
    return {
        default: mockSharpFunction
    }
})

vi.mock('@/utils/cache', () => ({
    overlayCache: {
        get: vi.fn(),
        set: vi.fn()
    }
}))

vi.mock('@/utils/assets', () => ({
    getAssetBuffer: vi.fn().mockResolvedValue(Buffer.from('overlay-asset'))
}))

describe('Compositing utility functions', () => {
    describe('prepareCardOperations', () => {
        const mockImages: CardImageBuffer[] = [
            {
                name: 'Card 1',
                groupId: 0,
                buffer: Buffer.from('image1'),
                quantity: 4
            },
            {
                name: 'Card 2',
                groupId: 0,
                buffer: Buffer.from('image2'),
                quantity: 2
            },
            {
                name: 'Card 3',
                groupId: 1,
                buffer: Buffer.from('image3'),
                quantity: 1
            }
        ]

        const mockCardDimensions: Dimensions = {
            width: 100,
            height: 140
        }

        test('should prepare card operations for grid layout', () => {
            const result = prepareCardOperations(
                mockImages,
                mockCardDimensions,
                'grid',
                'ig_square'
            )

            expect(result).toHaveLength(3)
            expect(result[0]).toHaveProperty('input')
            expect(result[0]).toHaveProperty('left')
            expect(result[0]).toHaveProperty('top')
            expect(result[0].input).toEqual(Buffer.from('image1'))
        })

        test('should prepare card operations for spoiler layout', () => {
            const result = prepareCardOperations(
                mockImages,
                mockCardDimensions,
                'spoiler',
                'ig_square'
            )

            expect(result).toHaveLength(3)
            // Spoiler layout should have different positioning than grid
            expect(result[0]).toHaveProperty('input')
            expect(result[0]).toHaveProperty('left')
            expect(result[0]).toHaveProperty('top')
        })

        test('should handle images with different group IDs', () => {
            const result = prepareCardOperations(
                mockImages,
                mockCardDimensions,
                'grid',
                'ig_square'
            )

            expect(result).toHaveLength(3)
            // Should handle group separation properly
            expect(result[2].top).toBeGreaterThan(result[1].top || 0)
        })

        test('should handle empty images array', () => {
            const result = prepareCardOperations(
                [],
                mockCardDimensions,
                'grid',
                'ig_square'
            )

            expect(result).toHaveLength(0)
        })

        test('should handle different image sizes', () => {
            const resultSquare = prepareCardOperations(
                mockImages,
                mockCardDimensions,
                'grid',
                'ig_square'
            )

            const resultStory = prepareCardOperations(
                mockImages,
                mockCardDimensions,
                'grid',
                'ig_story'
            )

            expect(resultSquare).toHaveLength(3)
            expect(resultStory).toHaveLength(3)
            // Both should have valid positioning regardless of being the same
            expect(resultSquare[0].left).toBeGreaterThanOrEqual(0)
            expect(resultStory[0].left).toBeGreaterThanOrEqual(0)
        })

        test('should skip images with null buffers', () => {
            const imagesWithNull: CardImageBuffer[] = [
                ...mockImages,
                {
                    name: 'Card 4',
                    groupId: 0,
                    buffer: null,
                    quantity: 1
                }
            ]

            const result = prepareCardOperations(
                imagesWithNull,
                mockCardDimensions,
                'grid',
                'ig_square'
            )

            // Should only include images with valid buffers
            expect(result).toHaveLength(3)
        })
    })

    describe('createCanvas', () => {
        const mockDimensions: Dimensions = {
            width: 1080,
            height: 1080
        }

        test('should create canvas with transparent background by default', () => {
            const result = createCanvas(mockDimensions)
            expect(result).toBeDefined()
        })

        test('should create canvas with black background', () => {
            const result = createCanvas(mockDimensions, 'black')
            expect(result).toBeDefined()
        })

        test('should create canvas with white background', () => {
            const result = createCanvas(mockDimensions, 'white')
            expect(result).toBeDefined()
        })

        test('should create canvas with custom background', () => {
            const result = createCanvas(mockDimensions, 'custom', '#FF0000')
            expect(result).toBeDefined()
        })

        test('should handle custom background without color value', () => {
            const result = createCanvas(mockDimensions, 'custom')
            expect(result).toBeDefined()
        })
    })

    describe('createCompositeImage', () => {
        const mockCanvas = {
            composite: vi.fn().mockReturnThis(),
            png: vi.fn().mockReturnThis(),
            jpeg: vi.fn().mockReturnThis(),
            webp: vi.fn().mockReturnThis(),
            toBuffer: vi.fn().mockResolvedValue(Buffer.from('composite-result'))
        } as any

        const mockCardOperations = [
            { input: Buffer.from('card1'), left: 0, top: 0 },
            { input: Buffer.from('card2'), left: 100, top: 0 }
        ]

        const mockOverlayOperations = [
            { input: Buffer.from('overlay1'), left: 10, top: 10 }
        ]

        beforeEach(() => {
            vi.clearAllMocks()
        })

        test('should create composite image with PNG format by default', async () => {
            const result = await createCompositeImage(
                mockCanvas,
                mockCardOperations,
                mockOverlayOperations
            )

            expect(mockCanvas.composite).toHaveBeenCalledWith([
                ...mockCardOperations,
                ...mockOverlayOperations
            ])
            expect(mockCanvas.png).toHaveBeenCalled()
            expect(mockCanvas.toBuffer).toHaveBeenCalled()
            expect(result).toEqual(Buffer.from('composite-result'))
        })

        test('should create composite image with JPEG format', async () => {
            const result = await createCompositeImage(
                mockCanvas,
                mockCardOperations,
                mockOverlayOperations,
                'jpeg'
            )

            expect(mockCanvas.composite).toHaveBeenCalledWith([
                ...mockCardOperations,
                ...mockOverlayOperations
            ])
            expect(mockCanvas.jpeg).toHaveBeenCalledWith({ quality: 90 })
            expect(result).toEqual(Buffer.from('composite-result'))
        })

        test('should create composite image with WebP format', async () => {
            const result = await createCompositeImage(
                mockCanvas,
                mockCardOperations,
                mockOverlayOperations,
                'webp'
            )

            expect(mockCanvas.composite).toHaveBeenCalledWith([
                ...mockCardOperations,
                ...mockOverlayOperations
            ])
            expect(mockCanvas.webp).toHaveBeenCalledWith({ quality: 90 })
            expect(result).toEqual(Buffer.from('composite-result'))
        })

        test('should handle empty operations arrays', async () => {
            const result = await createCompositeImage(
                mockCanvas,
                [],
                []
            )

            expect(mockCanvas.composite).toHaveBeenCalledWith([])
            expect(result).toEqual(Buffer.from('composite-result'))
        })

        test('should handle only card operations', async () => {
            const result = await createCompositeImage(
                mockCanvas,
                mockCardOperations,
                []
            )

            expect(mockCanvas.composite).toHaveBeenCalledWith([
                ...mockCardOperations
            ])
            expect(result).toEqual(Buffer.from('composite-result'))
        })

        test('should handle only overlay operations', async () => {
            const result = await createCompositeImage(
                mockCanvas,
                [],
                mockOverlayOperations
            )

            expect(mockCanvas.composite).toHaveBeenCalledWith([
                ...mockOverlayOperations
            ])
            expect(result).toEqual(Buffer.from('composite-result'))
        })

        test('should handle errors during compositing', async () => {
            const errorCanvas = {
                composite: vi.fn().mockReturnThis(),
                png: vi.fn().mockReturnThis(),
                toBuffer: vi.fn().mockRejectedValue(new Error('Compositing failed'))
            } as any

            await expect(createCompositeImage(
                errorCanvas,
                mockCardOperations,
                mockOverlayOperations
            )).rejects.toThrow('Compositing failed')
        })
    })
})