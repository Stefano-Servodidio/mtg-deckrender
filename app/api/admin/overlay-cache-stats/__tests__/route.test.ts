import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '../route'
import { NextResponse } from 'next/server'

// Use vi.hoisted to avoid initialization-before-use issues with vi.mock hoisting
const mockOverlayCache = vi.hoisted(() => ({
    size: vi.fn(),
    getKeys: vi.fn()
}))

vi.mock('@/utils/cache', () => ({
    overlayCache: mockOverlayCache
}))

describe('Overlay Cache Stats API Route', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should return overlay cache statistics', async () => {
        mockOverlayCache.size.mockReturnValue(3)
        mockOverlayCache.getKeys.mockReturnValue(['x2_110', 'x3_110', 'x4_110'])

        const response = await GET()
        const data = await response.json()

        expect(data.totalImages).toBe(3)
        expect(data.images).toHaveLength(3)
        expect(data.images).toEqual(['x2_110', 'x3_110', 'x4_110'])
    })

    it('should return only first 10 overlays when more than 10 exist', async () => {
        const allKeys = Array.from({ length: 15 }, (_, i) => `x${i + 2}_110`)
        mockOverlayCache.size.mockReturnValue(15)
        mockOverlayCache.getKeys.mockReturnValue(allKeys)

        const response = await GET()
        const data = await response.json()

        expect(data.totalImages).toBe(15)
        expect(data.images).toHaveLength(10)
        expect(data.images[0]).toBe('x2_110')
        expect(data.images[9]).toBe('x11_110')
    })

    it('should return empty array when no overlays cached', async () => {
        mockOverlayCache.size.mockReturnValue(0)
        mockOverlayCache.getKeys.mockReturnValue([])

        const response = await GET()
        const data = await response.json()

        expect(data.totalImages).toBe(0)
        expect(data.images).toHaveLength(0)
    })

    it('should return NextResponse with JSON content type', async () => {
        mockOverlayCache.size.mockReturnValue(1)
        mockOverlayCache.getKeys.mockReturnValue(['x2_110'])

        const response = await GET()

        expect(response).toBeInstanceOf(NextResponse)
        expect(response.headers.get('content-type')).toContain(
            'application/json'
        )
    })
})
