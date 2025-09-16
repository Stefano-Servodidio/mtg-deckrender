import { describe, expect, test } from 'vitest'
import { 
    calculateCardDimensions, 
    calculateCanvasDimensions, 
    calculateRowHeight,
    IMAGE_SIZE_CONFIG 
} from '../config'

describe('Config utility functions', () => {
    describe('calculateCardDimensions', () => {
        test('should calculate correct dimensions for vertical orientation', () => {
            const result = calculateCardDimensions('medium', 'vertical')
            
            // For vertical, width should be constrained to cross-axis (1440px)
            expect(result.width).toBe(1440)
            // Height should be scaled proportionally: 1440 * (204/146) ≈ 2012.05
            expect(result.height).toBeCloseTo(2012.05, 1)
        })

        test('should calculate correct dimensions for horizontal orientation', () => {
            const result = calculateCardDimensions('medium', 'horizontal')
            
            // For horizontal, height should be constrained to cross-axis (1440px)
            expect(result.height).toBe(1440)
            // Width should be scaled proportionally: 1440 * (146/204) ≈ 1030.59
            expect(result.width).toBeCloseTo(1030.59, 1)
        })

        test('should handle different image sizes', () => {
            const small = calculateCardDimensions('small', 'vertical')
            const medium = calculateCardDimensions('medium', 'vertical')
            const large = calculateCardDimensions('large', 'vertical')

            expect(small.width).toBe(1080)
            expect(medium.width).toBe(1440)
            expect(large.width).toBe(1920)

            // Heights should scale proportionally
            expect(small.height).toBeCloseTo(1509.04, 1) // 1080 * (204/146)
            expect(medium.height).toBeCloseTo(2012.05, 1) // 1440 * (204/146)
            expect(large.height).toBeCloseTo(2682.74, 1) // 1920 * (204/146)
        })
    })

    describe('calculateRowHeight', () => {
        test('should calculate correct row height for grid variant', () => {
            const cardHeight = 204
            const result = calculateRowHeight('grid', cardHeight)
            
            // Grid should use 50% overlap (0.5 multiplier)
            expect(result).toBe(102) // 204 * 0.5
        })

        test('should calculate correct row height for spoiler variant', () => {
            const cardHeight = 204
            const result = calculateRowHeight('spoiler', cardHeight)
            
            // Spoiler should use no overlap (1.0 multiplier)
            expect(result).toBe(204) // 204 * 1.0
        })

        test('should handle stacks variant like grid', () => {
            const cardHeight = 204
            const result = calculateRowHeight('stacks', cardHeight)
            
            // Stacks should use same as grid (0.5 multiplier)
            expect(result).toBe(102) // 204 * 0.5
        })
    })

    describe('calculateCanvasDimensions', () => {
        test('should calculate canvas dimensions correctly', () => {
            const result = calculateCanvasDimensions(
                3, // cardsPerRow
                2, // totalRows
                false, // hasSideboard
                'small', // imageSize
                'vertical', // imageOrientation  
                'grid' // imageVariant
            )

            // For vertical small (1080px width cards), 3 cards per row:
            // width = 1080 * 3 + 4 * (3-1) + 4 * 2 = 3240 + 8 + 8 = 3256
            expect(result.width).toBe(3256)
            
            // For grid variant with card height ≈ 1509.04:
            // rowHeight = 1509.04 * 0.5 = 754.52
            // height = 754.52 * 2 + 4 * (2-1) + 4 * 2 = 1509.04 + 4 + 8 = 1521.04
            expect(result.height).toBeCloseTo(1521.04, 1)
        })

        test('should add sideboard spacing when sideboard is present', () => {
            const withoutSideboard = calculateCanvasDimensions(
                3, 2, false, 'small', 'vertical', 'grid'
            )
            const withSideboard = calculateCanvasDimensions(
                3, 2, true, 'small', 'vertical', 'grid'
            )

            // With sideboard should be taller
            expect(withSideboard.height).toBeGreaterThan(withoutSideboard.height)
        })
    })

    describe('IMAGE_SIZE_CONFIG', () => {
        test('should have correct configuration values', () => {
            expect(IMAGE_SIZE_CONFIG.small.crossAxis).toBe(1080)
            expect(IMAGE_SIZE_CONFIG.medium.crossAxis).toBe(1440)
            expect(IMAGE_SIZE_CONFIG.large.crossAxis).toBe(1920)

            expect(IMAGE_SIZE_CONFIG.small.cardScale).toBe(0.6)
            expect(IMAGE_SIZE_CONFIG.medium.cardScale).toBe(0.8)
            expect(IMAGE_SIZE_CONFIG.large.cardScale).toBe(1.0)
        })
    })
})