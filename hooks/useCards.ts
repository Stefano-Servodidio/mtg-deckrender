import { useState, useCallback } from 'react'
import { ScryfallCard } from '@/app/services/scryfall/types'
import { CardsResponse } from '@/app/services/serverless/types'

interface UseCardsReturn {
    data: CardsResponse | null
    error: Error | null
    isLoading: boolean
    fetchCards: (decklist: string) => Promise<void>
    reset: () => void
}

export function useCards(): UseCardsReturn {
    const [data, setData] = useState<CardsResponse | null>(null)
    const [error, setError] = useState<Error | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const fetchCards = useCallback(async (decklist: string) => {
        if (!decklist?.trim()) {
            setError(new Error('Decklist is required'))
            return
        }

        setIsLoading(true)
        setError(null)
        setData(null)

        try {
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
        } catch (err) {
            const error =
                err instanceof Error ? err : new Error('Failed to fetch cards')
            setError(error)
            console.error('Error fetching cards:', error)
        } finally {
            setIsLoading(false)
        }
    }, [])

    const reset = useCallback(() => {
        setData(null)
        setError(null)
        setIsLoading(false)
    }, [])

    return {
        data,
        error,
        isLoading,
        fetchCards,
        reset
    }
}
