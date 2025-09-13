import { useState, useCallback } from 'react'
import { CardsResponse } from '@/app/api/cards/_types'
import { useFetchState } from './useFetchState'
import { useFetchCache } from './useFetchCache'

interface UseCardsReturn {
    data: CardsResponse | null
    error: Error | null
    isLoading: boolean
    fetchCards: (decklist: string) => Promise<void>
    reset: () => void
}

// Hook to fetch cards based on a decklist
export function useCards(): UseCardsReturn {
    const { data, setData, error, setError, isLoading, setIsLoading, reset } =
        useFetchState<CardsResponse>()
    const cache = useFetchCache<CardsResponse>(2)

    const fetchCards = useCallback(
        async (decklist: string) => {
            if (!decklist?.trim()) {
                setError(new Error('Decklist is required'))
                return
            }

            setIsLoading(true)
            setError(null)
            setData(null)

            // TODO: store cache for every single card, not just full decklist
            //  so that if user fetches multiple times with overlapping cards
            //  we don't re-fetch the same cards again
            const cached = cache.get(decklist.trim())
            if (cached) {
                if (process.env.NODE_ENV === 'development') {
                    console.log('POST /api/cards - Cache hit')
                }
                setData(cached)
                setIsLoading(false)
                return
            }
            try {
                if (process.env.NODE_ENV === 'development') {
                    console.log('POST /api/cards - Fetching from API')
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

                const result = await response.json()
                setData(result)
                cache.set(decklist.trim(), result)
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
        [setData, setError, setIsLoading, cache]
    )

    return {
        data,
        error,
        isLoading,
        fetchCards,
        reset
    }
}
