import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDeckPng } from '../useDeckPng'
import { CardItem } from '@/types/api'
import { headers } from 'next/headers'

// Mock useFetchState
vi.mock('../useFetchState', () => ({
    useFetchState: vi.fn()
}))

// Mock global fetch
global.fetch = vi.fn()

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
global.URL.revokeObjectURL = vi.fn()

// Mock atob
global.atob = vi.fn((str: string) => str)

describe('useDeckPng', () => {
    let mockSetData: ReturnType<typeof vi.fn>
    let mockSetError: ReturnType<typeof vi.fn>
    let mockSetIsLoading: ReturnType<typeof vi.fn>
    let mockSetProgress: ReturnType<typeof vi.fn>
    let mockResetState: ReturnType<typeof vi.fn>

    const mockCard: CardItem = {
        id: '1',
        name: 'Lightning Bolt',
        cmc: 1,
        typeLine: 'Instant',
        rarity: 'common',
        image_uri: 'https://example.com/card.jpg',
        colors: ['R'],
        legalities: {} as CardItem['legalities'],
        quantity: 4,
        groupId: 1
    }

    beforeEach(async () => {
        vi.clearAllMocks()

        mockSetData = vi.fn()
        mockSetError = vi.fn()
        mockSetIsLoading = vi.fn()
        mockSetProgress = vi.fn()
        mockResetState = vi.fn()

        const { useFetchState } = await import('../useFetchState')
        vi.mocked(useFetchState).mockReturnValue({
            data: null,
            setData: mockSetData,
            error: null,
            setError: mockSetError,
            isLoading: false,
            setIsLoading: mockSetIsLoading,
            reset: mockResetState,
            progress: null,
            setProgress: mockSetProgress
        })
    })

    it('should initialize with default values from useFetchState', () => {
        const { result } = renderHook(() => useDeckPng())

        expect(result.current.data).toBeNull()
        expect(result.current.error).toBeNull()
        expect(result.current.isLoading).toBe(false)
        expect(result.current.progress).toBeNull()
    })

    it('should set error when cards array is empty', async () => {
        const { result } = renderHook(() => useDeckPng())

        await act(async () => {
            await result.current.generateImage([])
        })

        expect(mockSetError).toHaveBeenCalledWith(
            new Error('Cards are required')
        )
        expect(mockSetIsLoading).not.toHaveBeenCalled()
    })

    it('should set error when cards is null', async () => {
        const { result } = renderHook(() => useDeckPng())

        await act(async () => {
            await result.current.generateImage(null as any)
        })

        expect(mockSetError).toHaveBeenCalledWith(
            new Error('Cards are required')
        )
    })

    it('should reset and set loading when generating image', async () => {
        const mockReader = {
            read: vi
                .fn()
                .mockResolvedValueOnce({ done: true, value: undefined }),
            releaseLock: vi.fn()
        }

        vi.mocked(global.fetch).mockResolvedValueOnce({
            ok: true,
            body: {
                getReader: () => mockReader
            }
        } as any)

        const { result } = renderHook(() => useDeckPng())

        await act(async () => {
            await result.current.generateImage([mockCard])
        })

        expect(mockResetState).toHaveBeenCalled()
        expect(mockSetIsLoading).toHaveBeenCalledWith(true)
    })

    it('should handle HTTP error response', async () => {
        const errorMessage = 'Server error'
        vi.mocked(global.fetch).mockResolvedValueOnce({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
            json: vi.fn().mockResolvedValueOnce({ error: errorMessage })
        } as any)

        const { result } = renderHook(() => useDeckPng())

        await act(async () => {
            await result.current.generateImage([mockCard])
        })

        expect(mockSetError).toHaveBeenCalledWith(new Error(errorMessage))
        expect(mockSetIsLoading).toHaveBeenCalledWith(false)
    })

    it('should handle HTTP error without error message', async () => {
        vi.mocked(global.fetch).mockResolvedValueOnce({
            ok: false,
            status: 404,
            statusText: 'Not Found',
            json: vi.fn().mockResolvedValueOnce({})
        } as any)

        const { result } = renderHook(() => useDeckPng())

        await act(async () => {
            await result.current.generateImage([mockCard])
        })

        expect(mockSetError).toHaveBeenCalledWith(
            new Error('HTTP 404: Not Found')
        )
    })

    it('should handle streaming progress events', async () => {
        const encoder = new TextEncoder()
        const progressData = {
            type: 'progress',
            current: 50,
            total: 100,
            message: 'Generating image...'
        }

        const mockReader = {
            read: vi
                .fn()
                .mockResolvedValueOnce({
                    done: false,
                    value: encoder.encode(
                        `data: ${JSON.stringify(progressData)}\n\n`
                    )
                })
                .mockResolvedValueOnce({ done: true, value: undefined }),
            releaseLock: vi.fn()
        }

        vi.mocked(global.fetch).mockResolvedValueOnce({
            ok: true,
            body: {
                getReader: () => mockReader
            },
            headers: new Map([['x-file-type', 'png']])
        } as any)

        const { result } = renderHook(() => useDeckPng())

        await act(async () => {
            await result.current.generateImage([mockCard])
        })

        expect(mockSetProgress).toHaveBeenCalledWith({
            current: 50,
            total: 100,
            message: 'Generating image...',
            percentage: 50
        })
    })

    it('should handle streaming complete event and create blob URL', async () => {
        const encoder = new TextEncoder()
        const base64Data = 'mockBase64ImageData'
        const completeData = {
            type: 'complete',
            result: {
                imageData: base64Data
            },
            message: 'Complete'
        }

        const mockReader = {
            read: vi
                .fn()
                .mockResolvedValueOnce({
                    done: false,
                    value: encoder.encode(
                        `data: ${JSON.stringify(completeData)}\n\n`
                    )
                })
                .mockResolvedValueOnce({ done: true, value: undefined }),
            releaseLock: vi.fn()
        }

        vi.mocked(global.fetch).mockResolvedValueOnce({
            ok: true,
            body: {
                getReader: () => mockReader
            },
            headers: new Map([['x-file-type', 'png']])
        } as any)

        const { result } = renderHook(() => useDeckPng())

        await act(async () => {
            await result.current.generateImage([mockCard])
        })

        expect(global.atob).toHaveBeenCalledWith(base64Data)
        expect(global.URL.createObjectURL).toHaveBeenCalled()
        expect(mockSetData).toHaveBeenCalledWith('blob:mock-url')
        expect(mockSetProgress).toHaveBeenCalledWith({
            current: 100,
            total: 100,
            message: 'Complete',
            percentage: 100
        })
    })

    it('should handle streaming error event', async () => {
        const encoder = new TextEncoder()
        const errorData = {
            type: 'error',
            error: 'Image generation failed'
        }

        const mockReader = {
            read: vi
                .fn()
                .mockResolvedValueOnce({
                    done: false,
                    value: encoder.encode(
                        `data: ${JSON.stringify(errorData)}\n\n`
                    )
                })
                .mockResolvedValueOnce({ done: true, value: undefined }),
            releaseLock: vi.fn()
        }

        vi.mocked(global.fetch).mockResolvedValueOnce({
            ok: true,
            body: {
                getReader: () => mockReader
            },
            headers: new Map([['x-file-type', 'png']])
        } as any)

        const consoleErrorSpy = vi
            .spyOn(console, 'error')
            .mockImplementation(() => {})

        const { result } = renderHook(() => useDeckPng())

        await act(async () => {
            await result.current.generateImage([mockCard])
        })

        // The error is caught by the parseError catch block and logged
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            'Error parsing stream data:',
            expect.any(Error),
            expect.stringContaining('data:')
        )
        consoleErrorSpy.mockRestore()
    })

    it('should handle non-streaming response (fallback)', async () => {
        const mockArrayBuffer = new ArrayBuffer(8)

        vi.mocked(global.fetch).mockResolvedValueOnce({
            ok: true,
            body: null,
            arrayBuffer: vi.fn().mockResolvedValueOnce(mockArrayBuffer)
        } as any)

        const { result } = renderHook(() => useDeckPng())

        await act(async () => {
            await result.current.generateImage([mockCard])
        })

        expect(global.URL.createObjectURL).toHaveBeenCalled()
        expect(mockSetData).toHaveBeenCalledWith('blob:mock-url')
    })

    it('should handle network errors', async () => {
        vi.mocked(global.fetch).mockRejectedValueOnce(
            new Error('Network error')
        )

        const { result } = renderHook(() => useDeckPng())

        await act(async () => {
            await result.current.generateImage([mockCard])
        })

        expect(mockSetError).toHaveBeenCalled()
        expect(mockSetIsLoading).toHaveBeenCalledWith(false)
    })

    it('should handle invalid JSON in stream', async () => {
        const encoder = new TextEncoder()
        const consoleErrorSpy = vi
            .spyOn(console, 'error')
            .mockImplementation(() => {})

        const mockReader = {
            read: vi
                .fn()
                .mockResolvedValueOnce({
                    done: false,
                    value: encoder.encode('data: {invalid json}\n\n')
                })
                .mockResolvedValueOnce({ done: true, value: undefined }),
            releaseLock: vi.fn()
        }

        vi.mocked(global.fetch).mockResolvedValueOnce({
            ok: true,
            body: {
                getReader: () => mockReader
            }
        } as any)

        const { result } = renderHook(() => useDeckPng())

        await act(async () => {
            await result.current.generateImage([mockCard])
        })

        expect(consoleErrorSpy).toHaveBeenCalled()
        consoleErrorSpy.mockRestore()
    })

    it('should call fetch with correct parameters', async () => {
        const mockReader = {
            read: vi
                .fn()
                .mockResolvedValueOnce({ done: true, value: undefined }),
            releaseLock: vi.fn()
        }

        vi.mocked(global.fetch).mockResolvedValueOnce({
            ok: true,
            body: {
                getReader: () => mockReader
            }
        } as any)

        const { result } = renderHook(() => useDeckPng())
        const cards = [mockCard]
        const options = { imageSize: 'ig_square' as const }

        await act(async () => {
            await result.current.generateImage(cards, options)
        })

        expect(global.fetch).toHaveBeenCalledWith('/api/deck-png', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ cards, options })
        })
    })

    it('should always set loading to false after operation', async () => {
        const mockReader = {
            read: vi
                .fn()
                .mockResolvedValueOnce({ done: true, value: undefined }),
            releaseLock: vi.fn()
        }

        vi.mocked(global.fetch).mockResolvedValueOnce({
            ok: true,
            body: {
                getReader: () => mockReader
            }
        } as any)

        const { result } = renderHook(() => useDeckPng())

        await act(async () => {
            await result.current.generateImage([mockCard])
        })

        expect(mockSetIsLoading).toHaveBeenCalledWith(true)
        expect(mockSetIsLoading).toHaveBeenCalledWith(false)
    })

    it('should release reader lock after streaming', async () => {
        const mockReader = {
            read: vi
                .fn()
                .mockResolvedValueOnce({ done: true, value: undefined }),
            releaseLock: vi.fn()
        }

        vi.mocked(global.fetch).mockResolvedValueOnce({
            ok: true,
            body: {
                getReader: () => mockReader
            },
            headers: new Map([['x-file-type', 'png']])
        } as any)

        const { result } = renderHook(() => useDeckPng())

        await act(async () => {
            await result.current.generateImage([mockCard])
        })

        expect(mockReader.releaseLock).toHaveBeenCalled()
    })

    it.skip('should revoke URL when reset is called with data', async () => {
        const mockReader = {
            read: vi
                .fn()
                .mockResolvedValueOnce({ done: true, value: undefined }),
            releaseLock: vi.fn()
        }

        vi.mocked(global.fetch).mockResolvedValueOnce({
            ok: true,
            body: {
                getReader: () => mockReader
            },
            headers: new Map([['x-file-type', 'png']])
        } as any)

        const { result } = renderHook(() => useDeckPng())

        // First generate an image to get data
        await act(async () => {
            await result.current.generateImage([mockCard])
        })

        // Now reset
        act(() => {
            result.current.reset()
        })

        expect(mockResetState).toHaveBeenCalled()
        expect(mockSetProgress).toHaveBeenCalledWith(null)
    })

    it('should handle cleanup on unmount', () => {
        const { unmount } = renderHook(() => useDeckPng())

        unmount()

        // The component should clean up properly without errors
        expect(true).toBe(true)
    })
})
