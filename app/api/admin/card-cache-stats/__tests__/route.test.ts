import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '../route'
import { NextResponse } from 'next/server'

// Mock @netlify/blobs
vi.mock('@netlify/blobs', () => ({
    getStore: vi.fn()
}))

// Mock environment variables
const mockEnv = {
    NETLIFY_SITE_ID: 'test-site-id',
    NETLIFY_AUTH_TOKEN: 'test-auth-token'
}

describe('Card Cache Stats API Route', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // Set up environment variables
        process.env.NETLIFY_SITE_ID = mockEnv.NETLIFY_SITE_ID
        process.env.NETLIFY_AUTH_TOKEN = mockEnv.NETLIFY_AUTH_TOKEN
    })

    it('should return card cache statistics', async () => {
        const mockBlobs = [
            { key: 'card1', size: 1024 },
            { key: 'card2', size: 2048 },
            { key: 'card3', size: 3072 }
        ]

        const mockList = vi.fn().mockResolvedValue({ blobs: mockBlobs })
        const { getStore } = await import('@netlify/blobs')
        vi.mocked(getStore).mockReturnValue({
            list: mockList
        } as any)

        const response = await GET()
        const data = await response.json()

        expect(getStore).toHaveBeenCalledWith({
            name: 'card-images',
            siteID: mockEnv.NETLIFY_SITE_ID,
            token: mockEnv.NETLIFY_AUTH_TOKEN
        })
        expect(mockList).toHaveBeenCalled()
        expect(data.totalImages).toBe(3)
        expect(data.images).toHaveLength(3)
    })

    it('should return only first 10 images when more than 10 exist', async () => {
        const mockBlobs = Array.from({ length: 15 }, (_, i) => ({
            key: `card${i + 1}`,
            size: 1024 * (i + 1)
        }))

        const mockList = vi.fn().mockResolvedValue({ blobs: mockBlobs })
        const { getStore } = await import('@netlify/blobs')
        vi.mocked(getStore).mockReturnValue({
            list: mockList
        } as any)

        const response = await GET()
        const data = await response.json()

        expect(data.totalImages).toBe(15)
        expect(data.images).toHaveLength(10)
        expect(data.images[0]).toEqual(mockBlobs[0])
        expect(data.images[9]).toEqual(mockBlobs[9])
    })

    it('should return empty array when no images exist', async () => {
        const mockList = vi.fn().mockResolvedValue({ blobs: [] })
        const { getStore } = await import('@netlify/blobs')
        vi.mocked(getStore).mockReturnValue({
            list: mockList
        } as any)

        const response = await GET()
        const data = await response.json()

        expect(data.totalImages).toBe(0)
        expect(data.images).toHaveLength(0)
    })

    it('should return NextResponse with JSON content type', async () => {
        const mockBlobs = [{ key: 'card1', size: 1024 }]
        const mockList = vi.fn().mockResolvedValue({ blobs: mockBlobs })
        const { getStore } = await import('@netlify/blobs')
        vi.mocked(getStore).mockReturnValue({
            list: mockList
        } as any)

        const response = await GET()

        expect(response).toBeInstanceOf(NextResponse)
        expect(response.headers.get('content-type')).toContain(
            'application/json'
        )
    })

    it('should handle store initialization with correct parameters', async () => {
        const mockBlobs = [{ key: 'card1', size: 1024 }]
        const mockList = vi.fn().mockResolvedValue({ blobs: mockBlobs })
        const { getStore } = await import('@netlify/blobs')
        const mockGetStore = vi.mocked(getStore)
        mockGetStore.mockReturnValue({
            list: mockList
        } as any)

        await GET()

        expect(mockGetStore).toHaveBeenCalledTimes(1)
        expect(mockGetStore).toHaveBeenCalledWith({
            name: 'card-images',
            siteID: mockEnv.NETLIFY_SITE_ID,
            token: mockEnv.NETLIFY_AUTH_TOKEN
        })
    })
})
