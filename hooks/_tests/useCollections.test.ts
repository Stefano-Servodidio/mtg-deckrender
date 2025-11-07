import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useCollections } from '../useCollections'

// Mock useFetchState
vi.mock('../useFetchState', () => ({
    useFetchState: vi.fn()
}))

// Mock global fetch
global.fetch = vi.fn()

describe('useCollections', () => {
    let mockSetData: ReturnType<typeof vi.fn>
    let mockSetError: ReturnType<typeof vi.fn>
    let mockSetIsLoading: ReturnType<typeof vi.fn>
    let mockSetProgress: ReturnType<typeof vi.fn>
    let mockReset: ReturnType<typeof vi.fn>

    beforeEach(async () => {
        vi.clearAllMocks()

        mockSetData = vi.fn()
        mockSetError = vi.fn()
        mockSetIsLoading = vi.fn()
        mockSetProgress = vi.fn()
        mockReset = vi.fn()

        const { useFetchState } = await import('../useFetchState')
        vi.mocked(useFetchState).mockReturnValue({
            data: null,
            setData: mockSetData,
            error: null,
            setError: mockSetError,
            isLoading: false,
            setIsLoading: mockSetIsLoading,
            reset: mockReset,
            progress: null,
            setProgress: mockSetProgress
        })
    })

    it('should initialize with default values from useFetchState', () => {
        const { result } = renderHook(() => useCollections())

        expect(result.current.data).toBeNull()
        expect(result.current.error).toBeNull()
        expect(result.current.isLoading).toBe(false)
        expect(result.current.progress).toBeNull()
    })

    it('should set error when decklist is empty', async () => {
        const { result } = renderHook(() => useCollections())

        await act(async () => {
            await result.current.fetchCollections('')
        })

        expect(mockSetError).toHaveBeenCalledWith(
            new Error('Decklist is required')
        )
        expect(mockSetIsLoading).not.toHaveBeenCalled()
    })

    it('should set error when decklist is whitespace only', async () => {
        const { result } = renderHook(() => useCollections())

        await act(async () => {
            await result.current.fetchCollections('   ')
        })

        expect(mockSetError).toHaveBeenCalledWith(
            new Error('Decklist is required')
        )
    })

    it('should reset and set loading when fetching collections', async () => {
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

        const { result } = renderHook(() => useCollections())

        await act(async () => {
            await result.current.fetchCollections('4 Lightning Bolt')
        })

        expect(mockReset).toHaveBeenCalled()
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

        const { result } = renderHook(() => useCollections())

        await act(async () => {
            await result.current.fetchCollections('4 Lightning Bolt')
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

        const { result } = renderHook(() => useCollections())

        await act(async () => {
            await result.current.fetchCollections('4 Lightning Bolt')
        })

        expect(mockSetError).toHaveBeenCalledWith(
            new Error('HTTP 404: Not Found')
        )
    })

    it('should handle streaming progress events', async () => {
        const encoder = new TextEncoder()
        const progressData = {
            type: 'progress',
            current: 1,
            total: 4,
            message: 'Fetching cards...'
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
            }
        } as any)

        const { result } = renderHook(() => useCollections())

        await act(async () => {
            await result.current.fetchCollections('4 Lightning Bolt')
        })

        expect(mockSetProgress).toHaveBeenCalledWith({
            current: 1,
            total: 4,
            message: 'Fetching cards...',
            percentage: 25
        })
    })

    it('should handle streaming complete event', async () => {
        const encoder = new TextEncoder()
        const completeData = {
            type: 'complete',
            result: {
                cards: [
                    {
                        id: '1',
                        name: 'Lightning Bolt',
                        cmc: 1,
                        quantity: 4
                    }
                ],
                errors: []
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
            }
        } as any)

        const { result } = renderHook(() => useCollections())

        await act(async () => {
            await result.current.fetchCollections('4 Lightning Bolt')
        })

        expect(mockSetData).toHaveBeenCalledWith(completeData.result)
        expect(mockSetProgress).toHaveBeenCalledWith({
            current: 1,
            total: 1,
            message: 'Complete',
            percentage: 100
        })
    })

    it('should handle streaming error event', async () => {
        const encoder = new TextEncoder()
        const errorData = {
            type: 'error',
            error: 'Stream processing error'
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
            }
        } as any)

        const consoleErrorSpy = vi
            .spyOn(console, 'error')
            .mockImplementation(() => {})

        const { result } = renderHook(() => useCollections())

        await act(async () => {
            await result.current.fetchCollections('4 Lightning Bolt')
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
        const responseData = {
            cards: [{ id: '1', name: 'Lightning Bolt', cmc: 1, quantity: 4 }],
            errors: []
        }

        vi.mocked(global.fetch).mockResolvedValueOnce({
            ok: true,
            body: null,
            json: vi.fn().mockResolvedValueOnce(responseData)
        } as any)

        const { result } = renderHook(() => useCollections())

        await act(async () => {
            await result.current.fetchCollections('4 Lightning Bolt')
        })

        expect(mockSetData).toHaveBeenCalledWith(responseData)
    })

    it('should handle network errors', async () => {
        vi.mocked(global.fetch).mockRejectedValueOnce(
            new Error('Network error')
        )

        const { result } = renderHook(() => useCollections())

        await act(async () => {
            await result.current.fetchCollections('4 Lightning Bolt')
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

        const { result } = renderHook(() => useCollections())

        await act(async () => {
            await result.current.fetchCollections('4 Lightning Bolt')
        })

        expect(consoleErrorSpy).toHaveBeenCalled()
        consoleErrorSpy.mockRestore()
    })

    it('should reset progress when calling reset', () => {
        const { result } = renderHook(() => useCollections())

        act(() => {
            result.current.reset()
        })

        expect(mockReset).toHaveBeenCalled()
        expect(mockSetProgress).toHaveBeenCalledWith(null)
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

        const { result } = renderHook(() => useCollections())
        const decklist = '4 Lightning Bolt\n2 Counterspell'

        await act(async () => {
            await result.current.fetchCollections(decklist)
        })

        expect(global.fetch).toHaveBeenCalledWith('/api/collections', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ decklist: decklist.trim() })
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

        const { result } = renderHook(() => useCollections())

        await act(async () => {
            await result.current.fetchCollections('4 Lightning Bolt')
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
            }
        } as any)

        const { result } = renderHook(() => useCollections())

        await act(async () => {
            await result.current.fetchCollections('4 Lightning Bolt')
        })

        expect(mockReader.releaseLock).toHaveBeenCalled()
    })
})
