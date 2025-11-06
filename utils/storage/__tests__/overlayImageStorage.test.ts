import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the store using a factory to avoid hoisting issues
const mockStoreInstance = {
    get: vi.fn(),
    set: vi.fn(),
    list: vi.fn()
}

vi.mock('@netlify/blobs', () => ({
    getStore: vi.fn(() => mockStoreInstance)
}))

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

describe('overlayImageStorage', () => {
    const mockOverlayKey = 'x4'
    const mockBuffer = Buffer.from('test-overlay-data')

    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('getOverlayFromBlobs', () => {
        it('should return buffer when overlay exists', async () => {
            const mockArrayBuffer = new ArrayBuffer(16)
            mockStoreInstance.get.mockResolvedValueOnce(mockArrayBuffer)

            const result = await storage.getOverlayFromBlobs(mockOverlayKey)

            expect(result).toBeInstanceOf(Buffer)
            expect(mockStoreInstance.get).toHaveBeenCalledWith(mockOverlayKey, {
                type: 'arrayBuffer'
            })
        })

        it('should return null when overlay does not exist', async () => {
            mockStoreInstance.get.mockResolvedValueOnce(null)

            const result = await storage.getOverlayFromBlobs(mockOverlayKey)

            expect(result).toBeNull()
        })

        it('should return null on error', async () => {
            mockStoreInstance.get.mockRejectedValueOnce(
                new Error('Network error')
            )

            const result = await storage.getOverlayFromBlobs(mockOverlayKey)

            expect(result).toBeNull()
        })
    })
    describe('saveOverlayToBlobs', () => {
        it('should save overlay', async () => {
            mockStoreInstance.set.mockResolvedValueOnce({
                modified: true,
                etag: 'test-etag'
            })

            await storage.saveOverlayToBlobs(mockOverlayKey, mockBuffer)

            expect(mockStoreInstance.set).toHaveBeenCalledWith(
                mockOverlayKey,
                expect.any(Object)
            )
        })

        it('should handle errors gracefully', async () => {
            mockStoreInstance.set.mockRejectedValueOnce(
                new Error('Storage error')
            )

            await expect(
                storage.saveOverlayToBlobs(mockOverlayKey, mockBuffer)
            ).resolves.not.toThrow()
        })
    })

    describe('listStoredOverlays', () => {
        it('should return list of overlay keys', async () => {
            mockStoreInstance.list.mockResolvedValueOnce({
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
            mockStoreInstance.list.mockResolvedValueOnce({
                blobs: [],
                directories: []
            })

            const result = await storage.listStoredOverlays()

            expect(result).toEqual([])
        })
    })

    describe('Integration scenarios', () => {
        it('no-cache and no-store: should return null', async () => {
            mockStoreInstance.get.mockResolvedValueOnce(null)

            const result = await storage.getOverlayFromBlobs(mockOverlayKey)

            expect(result).toBeNull()
        })

        it('only-store: should retrieve from store', async () => {
            const mockArrayBuffer = new ArrayBuffer(16)
            mockStoreInstance.get.mockResolvedValueOnce(mockArrayBuffer)

            const result = await storage.getOverlayFromBlobs(mockOverlayKey)

            expect(result).toBeInstanceOf(Buffer)
        })

        it('save and retrieve workflow', async () => {
            // Save
            mockStoreInstance.set.mockResolvedValueOnce({ modified: true })
            await storage.saveOverlayToBlobs(mockOverlayKey, mockBuffer)
            expect(mockStoreInstance.set).toHaveBeenCalled()

            // Retrieve
            mockStoreInstance.get.mockResolvedValueOnce(mockBuffer.buffer)

            const result = await storage.getOverlayFromBlobs(mockOverlayKey)
            expect(result).toBeInstanceOf(Buffer)
        })
    })
})
