import { describe, expect, test } from 'vitest'
import {
    calculateCardDimensions,
    calculateCanvasDimensions,
    calculateRowHeight
} from '../processing'
import { CANVAS_SIZE, DECK_LAYOUT_CONFIG } from '../config'

describe('Processing utility functions', () => {
    describe('calculateCardDimensions', () => {
        test('should calculate card dimensions based on canvas size and images', () => {
            const mockImages = [
                { name: 'Card1', groupId: 1, buffer: null, quantity: 4 },
                { name: 'Card2', groupId: 1, buffer: null, quantity: 2 }
            ]
            const canvasSize = { width: 1080, height: 1080 }

            const result = calculateCardDimensions(
                mockImages,
                canvasSize,
                'ig_square',
                'grid'
            )

            expect(result.width).toBeGreaterThan(0)
            expect(result.height).toBeGreaterThan(0)
            expect(result.scale).toBeDefined()
            expect(result.original).toBeDefined()
        })

        test('should handle different image variants', () => {
            const mockImages = [
                { name: 'Card1', groupId: 1, buffer: null, quantity: 4 }
            ]
            const canvasSize = { width: 1080, height: 1080 }

            const gridResult = calculateCardDimensions(
                mockImages,
                canvasSize,
                'ig_square',
                'grid'
            )
            const spoilerResult = calculateCardDimensions(
                mockImages,
                canvasSize,
                'ig_square',
                'spoiler'
            )

            // Both should produce valid dimensions
            expect(gridResult.width).toBeGreaterThan(0)
            expect(spoilerResult.width).toBeGreaterThan(0)
        })
    })

    describe('calculateCanvasDimensions', () => {
        test('should return correct dimensions for ig_square', () => {
            const result = calculateCanvasDimensions('ig_square', 'standard')

            expect(result.width).toBe(1080)
            expect(result.height).toBe(1080)
        })

        test('should return correct dimensions for ig_story', () => {
            const result = calculateCanvasDimensions('ig_story', 'standard')

            expect(result.width).toBe(1080)
            expect(result.height).toBe(1920)
        })

        test('should scale dimensions for high resolution', () => {
            const standardResult = calculateCanvasDimensions('ig_square', 'standard')
            const highResult = calculateCanvasDimensions('ig_square', 'high')

            expect(highResult.width).toBe(standardResult.width * 1.5)
            expect(highResult.height).toBe(standardResult.height * 1.5)
        })

        test('should throw error for invalid image size', () => {
            expect(() => {
                // @ts-ignore - Testing invalid input
                calculateCanvasDimensions('invalid_size', 'standard')
            }).toThrow('Invalid image size')
        })
    })

    describe('calculateRowHeight', () => {
        test('should calculate correct row height for grid variant', () => {
            const cardHeight = 1040
            const result = calculateRowHeight('grid', cardHeight)

            // Grid should use 0.4 multiplier according to config
            expect(result).toBe(416) // 1040 * 0.4
        })

        test('should calculate correct row height for spoiler variant', () => {
            const cardHeight = 1040
            const result = calculateRowHeight('spoiler', cardHeight)

            // Spoiler should use 1.0 multiplier (no overlap)
            expect(result).toBe(1040) // 1040 * 1.0
        })

        test('should calculate correct row height for stacks variant', () => {
            const cardHeight = 1040
            const result = calculateRowHeight('stacks', cardHeight)

            // Stacks should use 1.0 multiplier
            expect(result).toBe(1040) // 1040 * 1.0
        })

        test('should handle default variant', () => {
            const cardHeight = 1040
            const result = calculateRowHeight(undefined, cardHeight)

            // Default should use 1.0 multiplier
            expect(result).toBe(1040) // 1040 * 1.0
        })

        test('should return 0 for undefined card height', () => {
            const result = calculateRowHeight('grid', undefined)
            expect(result).toBe(0)
        })
    })

    describe('CANVAS_SIZE configuration', () => {
        test('should have correct canvas size values', () => {
            expect(CANVAS_SIZE.ig_square).toEqual({ width: 1080, height: 1080 })
            expect(CANVAS_SIZE.ig_story).toEqual({ width: 1080, height: 1920 })
            expect(CANVAS_SIZE.ig_portrait).toEqual({ width: 1080, height: 1350 })
            expect(CANVAS_SIZE.facebook_post).toEqual({ width: 1200, height: 630 })
            expect(CANVAS_SIZE.twitter_post).toEqual({ width: 1200, height: 675 })
        })
    })

    describe('DECK_LAYOUT_CONFIG configuration', () => {
        test('should have correct base card dimensions', () => {
            expect(DECK_LAYOUT_CONFIG.card.baseWidth).toBe(745)
            expect(DECK_LAYOUT_CONFIG.card.baseHeight).toBe(1040)
        })

        test('should have correct spacing values', () => {
            expect(DECK_LAYOUT_CONFIG.spacing.betweenCards).toBe(0)
            expect(DECK_LAYOUT_CONFIG.spacing.groupSeparator).toBe(70)
            expect(DECK_LAYOUT_CONFIG.spacing.canvasPadding).toBe(20)
        })

        test('should have correct row height multipliers', () => {
            expect(DECK_LAYOUT_CONFIG.row.heightMultiplier.default).toBe(1.0)
            expect(DECK_LAYOUT_CONFIG.row.heightMultiplier.grid).toBe(0.4)
            expect(DECK_LAYOUT_CONFIG.row.heightMultiplier.spoiler).toBe(1.0)
            expect(DECK_LAYOUT_CONFIG.row.heightMultiplier.stacks).toBe(1.0)
        })
    })
})
