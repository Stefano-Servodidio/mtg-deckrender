import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the store using a factory to avoid hoisting issues
vi.mock('@netlify/blobs', () => {
    const createMockStore = () => ({
        getWithMetadata: vi.fn(),
        set: vi.fn(),
        getMetadata: vi.fn(),
        list: vi.fn()
    })

    return {
        getStore: vi.fn(() => createMockStore())
    }
})

// Mock chalk to suppress console logs in tests
vi.mock('chalk', () => ({
    default: {
        yellow: vi.fn((msg: string) => msg),
        green: vi.fn((msg: string) => msg),
        red: vi.fn((msg: string) => msg),
        cyan: vi.fn((msg: string) => msg)
    }
}))

// Import after mocks are set up
import * as storage from '../overlayImageStorage'
import { getStore } from '@netlify/blobs'

describe('overlayImageStorage', () => {
    const mockOverlayKey = 'x4'
    const mockBuffer = Buffer.from('test-overlay-data')
    const mockQuantity = 4
    const mockSvgSource = '<svg>...</svg>'

    let mockStore: any

    beforeEach(() => {
        vi.clearAllMocks()
        process.env.NODE_ENV = 'test'
        // Get the mock store instance
        mockStore = (getStore as any)()
    })

    describe('getOverlayFromBlobs', () => {
        it('should return buffer when overlay exists', async () => {
            const mockArrayBuffer = new ArrayBuffer(16)
            mockStore.getWithMetadata.mockResolvedValueOnce({
                data: mockArrayBuffer,
                metadata: {
                    quantity: mockQuantity,
                    svgSource: mockSvgSource,
                    storedAt: Date.now()
                }
            })

            const result = await storage.getOverlayFromBlobs(mockOverlayKey)

            expect(result).toBeInstanceOf(Buffer)
            expect(mockStore.getWithMetadata).toHaveBeenCalledWith(
                mockOverlayKey,
                {
                    type: 'arrayBuffer'
                }
            )
        })

        it('should return null when overlay does not exist', async () => {
            mockStore.getWithMetadata.mockResolvedValueOnce(null)

            const result = await storage.getOverlayFromBlobs(mockOverlayKey)

            expect(result).toBeNull()
        })

        it('should return null on error', async () => {
            mockStore.getWithMetadata.mockRejectedValueOnce(
                new Error('Network error')
            )

            const result = await storage.getOverlayFromBlobs(mockOverlayKey)

            expect(result).toBeNull()
        })
    })

    describe('saveOverlayToBlobs', () => {
        it('should save overlay with metadata', async () => {
            mockStore.set.mockResolvedValueOnce({
                modified: true,
                etag: 'test-etag'
            })

            await storage.saveOverlayToBlobs(
                mockOverlayKey,
                mockBuffer,
                mockQuantity,
                mockSvgSource
            )

            expect(mockStore.set).toHaveBeenCalledWith(
                mockOverlayKey,
                mockBuffer,
                expect.objectContaining({
                    metadata: expect.objectContaining({
                        quantity: mockQuantity,
                        svgSource: mockSvgSource,
                        storedAt: expect.any(Number)
                    })
                })
            )
        })

        it('should handle errors gracefully', async () => {
            mockStore.set.mockRejectedValueOnce(new Error('Storage error'))

            await expect(
                storage.saveOverlayToBlobs(
                    mockOverlayKey,
                    mockBuffer,
                    mockQuantity,
                    mockSvgSource
                )
            ).resolves.not.toThrow()
        })
    })

    describe('needsRevalidation', () => {
        it('should return false for fresh overlay', async () => {
            const recentTime = Date.now() - 1000 * 60 * 60 // 1 hour ago
            mockStore.getMetadata.mockResolvedValueOnce({
                metadata: {
                    quantity: mockQuantity,
                    svgSource: mockSvgSource,
                    storedAt: recentTime
                }
            })

            const result = await storage.needsRevalidation(mockOverlayKey)

            expect(result).toBe(false)
        })

        it('should return true for stale overlay (> 90 days)', async () => {
            const oldTime = Date.now() - 91 * 24 * 60 * 60 * 1000
            mockStore.getMetadata.mockResolvedValueOnce({
                metadata: {
                    quantity: mockQuantity,
                    svgSource: mockSvgSource,
                    storedAt: oldTime
                }
            })

            const result = await storage.needsRevalidation(mockOverlayKey)

            expect(result).toBe(true)
        })

        it('should return true when metadata is missing', async () => {
            mockStore.getMetadata.mockResolvedValueOnce(null)

            const result = await storage.needsRevalidation(mockOverlayKey)

            expect(result).toBe(true)
        })

        it('should return true on error', async () => {
            mockStore.getMetadata.mockRejectedValueOnce(
                new Error('Metadata error')
            )

            const result = await storage.needsRevalidation(mockOverlayKey)

            expect(result).toBe(true)
        })
    })

    describe('listStoredOverlays', () => {
        it('should return list of overlay keys', async () => {
            mockStore.list.mockResolvedValueOnce({
                blobs: [
                    { key: 'x2', etag: 'etag-1' },
                    { key: 'x3', etag: 'etag-2' }
                ],
                directories: []
            })

            const result = await storage.listStoredOverlays()

            expect(result).toEqual(['x2', 'x3'])
        })

        it('should return empty array when no overlays stored', async () => {
            mockStore.list.mockResolvedValueOnce({
                blobs: [],
                directories: []
            })

            const result = await storage.listStoredOverlays()

            expect(result).toEqual([])
        })
    })

    describe('Integration scenarios', () => {
        it('no-cache and no-store: should return null', async () => {
            mockStore.getWithMetadata.mockResolvedValueOnce(null)

            const result = await storage.getOverlayFromBlobs(mockOverlayKey)

            expect(result).toBeNull()
        })

        it('only-store: should retrieve from store', async () => {
            const mockArrayBuffer = new ArrayBuffer(16)
            mockStore.getWithMetadata.mockResolvedValueOnce({
                data: mockArrayBuffer,
                metadata: {
                    quantity: mockQuantity,
                    svgSource: mockSvgSource,
                    storedAt: Date.now()
                }
            })

            const result = await storage.getOverlayFromBlobs(mockOverlayKey)

            expect(result).toBeInstanceOf(Buffer)
        })

        it('save and retrieve workflow', async () => {
            // Save
            mockStore.set.mockResolvedValueOnce({ modified: true })
            await storage.saveOverlayToBlobs(
                mockOverlayKey,
                mockBuffer,
                mockQuantity,
                mockSvgSource
            )
            expect(mockStore.set).toHaveBeenCalled()

            // Retrieve
            mockStore.getWithMetadata.mockResolvedValueOnce({
                data: mockBuffer.buffer,
                metadata: {
                    quantity: mockQuantity,
                    svgSource: mockSvgSource,
                    storedAt: Date.now()
                }
            })

            const result = await storage.getOverlayFromBlobs(mockOverlayKey)
            expect(result).toBeInstanceOf(Buffer)
        })
    })
})
