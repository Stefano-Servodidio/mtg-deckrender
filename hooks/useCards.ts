import { useState, useCallback } from 'react'
import { CardsResponse, CardItem } from '@/app/api/cards/_types'
import { useFetchState } from './useFetchState'
import { useFetchCache } from './useFetchCache'

interface ProgressInfo {
    current: number
    total: number
    message: string
    percentage: number
}

interface UseCardsReturn {
    data: CardsResponse | null
    error: Error | null
    isLoading: boolean
    progress: ProgressInfo | null
    fetchCards: (decklist: string) => Promise<void>
    reset: () => void
}

// Hook to fetch cards based on a decklist
export function useCards(): UseCardsReturn {
    const { data, setData, error, setError, isLoading, setIsLoading, reset } =
        useFetchState<CardsResponse>()
    const [progress, setProgress] = useState<ProgressInfo | null>(null)

    const fetchCards = useCallback(
        async (decklist: string) => {
            if (!decklist?.trim()) {
                setError(new Error('Decklist is required'))
                return
            }

            setIsLoading(true)
            setError(null)
            setData(null)
            setProgress(null)

            try {
                if (process.env.NODE_ENV === 'development') {
                    console.log(
                        'POST /api/cards - Fetching from API (streaming)'
                    )
                }

                const response = await fetch('/api/cards', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ decklist: decklist.trim() })
                })

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}))
                    throw new Error(
                        errorData.error ||
                            `HTTP ${response.status}: ${response.statusText}`
                    )
                }

                // Handle streaming response
                if (response.body) {
                    const reader = response.body.getReader()
                    const decoder = new TextDecoder()
                    let buffer = ''
                    const cards: CardItem[] = []
                    const errors: string[] = []

                    try {
                        while (true) {
                            const { done, value } = await reader.read()
                            if (done) break

                            buffer += decoder.decode(value, { stream: true })
                            console.log('Value:', value)
                            console.log('Buffer:', buffer)

                            const lines = buffer.split('\n\n')

                            // Keep the last incomplete line in the buffer
                            buffer = lines.pop() || ''

                            for (const line of lines) {
                                if (line.startsWith('data: ')) {
                                    try {
                                        const data = JSON.parse(line.slice(6))

                                        if (data.type === 'progress') {
                                            const progressInfo: ProgressInfo = {
                                                current: data.current,
                                                total: data.total,
                                                message: data.message,
                                                percentage: Math.round(
                                                    (data.current /
                                                        data.total) *
                                                        100
                                                )
                                            }
                                            setProgress(progressInfo)

                                            // Add card to our accumulating list if provided
                                            if (data.card) {
                                                cards.push(data.card)
                                            }

                                            // Add error to our list if provided
                                            if (data.error) {
                                                errors.push(data.error)
                                            }
                                        } else if (data.type === 'complete') {
                                            // Final result
                                            const result = data.result
                                            setData(result)
                                            setProgress({
                                                current: result.cards.length,
                                                total: result.cards.length,
                                                message: data.message,
                                                percentage: 100
                                            })
                                        } else if (data.type === 'error') {
                                            throw new Error(
                                                data.error || 'Stream error'
                                            )
                                        }
                                    } catch (parseError) {
                                        console.error(
                                            'Error parsing stream data:',
                                            parseError,
                                            line
                                        )
                                    }
                                }
                            }
                        }
                    } finally {
                        reader.releaseLock()
                    }
                } else {
                    // Fallback to regular JSON response
                    const result = await response.json()
                    setData(result)
                }
            } catch (err) {
                const error =
                    err instanceof Error
                        ? err
                        : new Error('Failed to fetch cards')
                setError(error)
                console.error('Error fetching cards:', error)
            } finally {
                setIsLoading(false)
            }
        },
        [setData, setError, setIsLoading]
    )

    const resetWithProgress = useCallback(() => {
        reset()
        setProgress(null)
    }, [reset])

    return {
        data,
        error,
        isLoading,
        progress,
        fetchCards,
        reset: resetWithProgress
    }
}
