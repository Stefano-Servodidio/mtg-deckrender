import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateOverlaySvg, svgToBuffer, generateOverlayBuffer } from '../svg'

// Mock sharp for unit tests – we don't need actual image conversion
vi.mock('sharp', () => {
    const mockSharp = {
        png: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockResolvedValue(Buffer.from('png-output'))
    }
    return {
        default: vi.fn(() => mockSharp)
    }
})

describe('SVG utilities', () => {
    describe('generateOverlaySvg', () => {
        it('should throw for zero or negative count', () => {
            expect(() => generateOverlaySvg(0, 110)).toThrow(
                'count must be a positive integer'
            )
            expect(() => generateOverlaySvg(-1, 110)).toThrow(
                'count must be a positive integer'
            )
        })

        it('should throw for non-integer count', () => {
            expect(() => generateOverlaySvg(2.5, 110)).toThrow(
                'count must be a positive integer'
            )
        })

        it('should throw for zero or negative size', () => {
            expect(() => generateOverlaySvg(4, 0)).toThrow(
                'size must be a positive number'
            )
            expect(() => generateOverlaySvg(4, -10)).toThrow(
                'size must be a positive number'
            )
        })

        it('should return a valid SVG string', () => {
            const svg = generateOverlaySvg(4, 110)
            expect(svg).toContain('<svg')
            expect(svg).toContain('</svg>')
            expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"')
        })

        it('should embed the quantity text', () => {
            const svg = generateOverlaySvg(4, 110)
            expect(svg).toContain('x4')
        })

        it('should use the specified size for width and height', () => {
            const svg = generateOverlaySvg(2, 88)
            expect(svg).toContain('width="88"')
            expect(svg).toContain('height="88"')
            expect(svg).toContain('viewBox="0 0 88 88"')
        })

        it('should embed the font as a data URL', () => {
            const svg = generateOverlaySvg(3, 110)
            expect(svg).toContain('@font-face')
            expect(svg).toContain("src: url('data:font/woff2;base64,")
            expect(svg).toContain("format('woff2')")
        })

        it('should use a large font size for single-digit counts', () => {
            const svg = generateOverlaySvg(2, 110)
            // scale = 1, large font = floor(64 * 1) = 64
            expect(svg).toContain('font-size="64"')
        })

        it('should use a medium font size for two-digit counts (10–99)', () => {
            const svg = generateOverlaySvg(10, 110)
            // scale = 1, medium font = floor(52 * 1) = 52
            expect(svg).toContain('font-size="52"')
        })

        it('should use a small font size for three-digit counts (100+)', () => {
            const svg = generateOverlaySvg(100, 110)
            // scale = 1, small font = floor(40 * 1) = 40
            expect(svg).toContain('font-size="40"')
        })

        it('should scale font sizes proportionally with the overlay size', () => {
            // size 55 = half of default 110, so scale = 0.5
            const svg = generateOverlaySvg(4, 55)
            // large font = floor(64 * 0.5) = 32
            expect(svg).toContain('font-size="32"')
        })

        it('should include a dark background rect', () => {
            const svg = generateOverlaySvg(4, 110)
            expect(svg).toContain('fill="#000000"')
            expect(svg).toContain('<rect')
        })

        it('should render text in white', () => {
            const svg = generateOverlaySvg(4, 110)
            expect(svg).toContain('fill="#FFFFFF"')
        })

        it('should center the text', () => {
            const svg = generateOverlaySvg(4, 110)
            expect(svg).toContain('text-anchor="middle"')
            expect(svg).toContain('dominant-baseline="middle"')
        })
    })

    describe('svgToBuffer', () => {
        beforeEach(() => {
            vi.clearAllMocks()
        })

        it('should call sharp with the SVG as a Buffer', async () => {
            const sharp = (await import('sharp')).default
            const svg = '<svg xmlns="http://www.w3.org/2000/svg"></svg>'

            await svgToBuffer(svg)

            expect(sharp).toHaveBeenCalledWith(Buffer.from(svg))
        })

        it('should return a Buffer', async () => {
            const svg = '<svg xmlns="http://www.w3.org/2000/svg"></svg>'
            const result = await svgToBuffer(svg)
            expect(result).toBeInstanceOf(Buffer)
        })
    })

    describe('generateOverlayBuffer', () => {
        beforeEach(() => {
            vi.clearAllMocks()
        })

        it('should return a Buffer', async () => {
            const result = await generateOverlayBuffer(4, 110)
            expect(result).toBeInstanceOf(Buffer)
        })

        it('should pass the correct SVG to sharp', async () => {
            const sharp = (await import('sharp')).default
            const count = 3
            const size = 110
            const expectedSvg = generateOverlaySvg(count, size)

            await generateOverlayBuffer(count, size)

            expect(sharp).toHaveBeenCalledWith(Buffer.from(expectedSvg))
        })
    })
})
