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
import * as storage from '../cardImageStorage'
import { getStore } from '@netlify/blobs'

describe('cardImageStorage', () => {
    const mockCardId = 'test-card-123'
    const mockBuffer = Buffer.from('test-image-data')
    const mockScryfallUri = 'https://example.com/card.jpg'
    const mockContentType = 'image/jpeg'

    let mockStore: any

    beforeEach(() => {
        vi.clearAllMocks()
        // Get the mock store instance
        mockStore = (getStore as any)()
    })

    describe('getImageFromBlobs', () => {
        it('should return buffer when image exists', async () => {
            const mockArrayBuffer = new ArrayBuffer(16)
            mockStore.getWithMetadata.mockResolvedValueOnce({
                data: mockArrayBuffer,
                metadata: {
                    scryfallUri: mockScryfallUri,
                    contentType: mockContentType,
                    storedAt: Date.now()
                }
            })

            const result = await storage.getImageFromBlobs(mockCardId)

            expect(result).toBeInstanceOf(Buffer)
            expect(mockStore.getWithMetadata).toHaveBeenCalledWith(mockCardId, {
                type: 'arrayBuffer'
            })
        })

        it('should return null when image does not exist', async () => {
            mockStore.getWithMetadata.mockResolvedValueOnce(null)

            const result = await storage.getImageFromBlobs(mockCardId)

            expect(result).toBeNull()
        })

        it('should return null on error', async () => {
            mockStore.getWithMetadata.mockRejectedValueOnce(
                new Error('Network error')
            )

            const result = await storage.getImageFromBlobs(mockCardId)

            expect(result).toBeNull()
        })
    })

    describe('saveImageToBlobs', () => {
        it('should save image with metadata', async () => {
            mockStore.set.mockResolvedValueOnce({
                modified: true,
                etag: 'test-etag'
            })

            await storage.saveImageToBlobs(
                mockCardId,
                mockBuffer,
                mockScryfallUri,
                mockContentType
            )

            expect(mockStore.set).toHaveBeenCalledWith(
                mockCardId,
                mockBuffer,
                expect.objectContaining({
                    metadata: expect.objectContaining({
                        scryfallUri: mockScryfallUri,
                        contentType: mockContentType,
                        storedAt: expect.any(Number)
                    })
                })
            )
        })

        it('should use default content type', async () => {
            mockStore.set.mockResolvedValueOnce({ modified: true })

            await storage.saveImageToBlobs(
                mockCardId,
                mockBuffer,
                mockScryfallUri
            )

            expect(mockStore.set).toHaveBeenCalledWith(
                mockCardId,
                mockBuffer,
                expect.objectContaining({
                    metadata: expect.objectContaining({
                        contentType: 'image/jpeg'
                    })
                })
            )
        })

        it('should handle errors gracefully', async () => {
            mockStore.set.mockRejectedValueOnce(new Error('Storage error'))

            await expect(
                storage.saveImageToBlobs(
                    mockCardId,
                    mockBuffer,
                    mockScryfallUri
                )
            ).resolves.not.toThrow()
        })
    })

    describe('needsRevalidation', () => {
        it('should return false for fresh image', async () => {
            const recentTime = Date.now() - 1000 * 60 * 60 // 1 hour ago
            mockStore.getMetadata.mockResolvedValueOnce({
                metadata: {
                    scryfallUri: mockScryfallUri,
                    contentType: mockContentType,
                    storedAt: recentTime
                }
            })

            const result = await storage.needsRevalidation(mockCardId)

            expect(result).toBe(false)
        })

        it('should return true for stale image (> 90 days)', async () => {
            const oldTime = Date.now() - 91 * 24 * 60 * 60 * 1000
            mockStore.getMetadata.mockResolvedValueOnce({
                metadata: {
                    scryfallUri: mockScryfallUri,
                    contentType: mockContentType,
                    storedAt: oldTime
                }
            })

            const result = await storage.needsRevalidation(mockCardId)

            expect(result).toBe(true)
        })

        it('should return true when metadata is missing', async () => {
            mockStore.getMetadata.mockResolvedValueOnce(null)

            const result = await storage.needsRevalidation(mockCardId)

            expect(result).toBe(true)
        })

        it('should return true on error', async () => {
            mockStore.getMetadata.mockRejectedValueOnce(
                new Error('Metadata error')
            )

            const result = await storage.needsRevalidation(mockCardId)

            expect(result).toBe(true)
        })
    })

    describe('listStoredCards', () => {
        it('should return list of card keys', async () => {
            mockStore.list.mockResolvedValueOnce({
                blobs: [
                    { key: 'card-1', etag: 'etag-1' },
                    { key: 'card-2', etag: 'etag-2' }
                ],
                directories: []
            })

            const result = await storage.listStoredCards()

            expect(result).toEqual(['card-1', 'card-2'])
        })

        it('should return empty array when no cards stored', async () => {
            mockStore.list.mockResolvedValueOnce({
                blobs: [],
                directories: []
            })

            const result = await storage.listStoredCards()

            expect(result).toEqual([])
        })
    })

    describe('Integration scenarios', () => {
        it('no-cache and no-store: should return null', async () => {
            mockStore.getWithMetadata.mockResolvedValueOnce(null)

            const result = await storage.getImageFromBlobs(mockCardId)

            expect(result).toBeNull()
        })

        it('only-store: should retrieve from store', async () => {
            const mockArrayBuffer = new ArrayBuffer(16)
            mockStore.getWithMetadata.mockResolvedValueOnce({
                data: mockArrayBuffer,
                metadata: {
                    scryfallUri: mockScryfallUri,
                    contentType: mockContentType,
                    storedAt: Date.now()
                }
            })

            const result = await storage.getImageFromBlobs(mockCardId)

            expect(result).toBeInstanceOf(Buffer)
        })

        it('save and retrieve workflow', async () => {
            // Save
            mockStore.set.mockResolvedValueOnce({ modified: true })
            await storage.saveImageToBlobs(
                mockCardId,
                mockBuffer,
                mockScryfallUri
            )
            expect(mockStore.set).toHaveBeenCalled()

            // Retrieve
            mockStore.getWithMetadata.mockResolvedValueOnce({
                data: mockBuffer.buffer,
                metadata: {
                    scryfallUri: mockScryfallUri,
                    contentType: mockContentType,
                    storedAt: Date.now()
                }
            })

            const result = await storage.getImageFromBlobs(mockCardId)
            expect(result).toBeInstanceOf(Buffer)
        })
    })
})
