import { useState, useCallback, useEffect } from 'react'
import { ScryfallCard } from '@/app/services/scryfall/types'

interface UseScryfallCardReturn {
    card: ScryfallCard | null
    error: Error | null
    isLoading: boolean
    fetchCard: (name: string) => Promise<void>
    reset: () => void
}

export function useScryfallCard(cardName?: string): UseScryfallCardReturn {
    const [card, setCard] = useState<ScryfallCard | null>(null)
    const [error, setError] = useState<Error | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const fetchCard = useCallback(async (name: string) => {
        if (!name?.trim()) {
            setError(new Error('Card name is required'))
            return
        }

        setIsLoading(true)
        setError(null)
        setCard(null)

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL_SCRYFALL}cards/named?fuzzy=${encodeURIComponent(name)}`,
                {
                    headers: {
                        'User-Agent': process.env.NEXT_PUBLIC_API_USER_AGENT || 'mtg-deck-to-png/1.0',
                        'Accept': 'application/json;q=0.9,*/*;q=0.8'
                    }
                }
            )

            if (!response.ok) {
                throw new Error(`Failed to fetch card: ${response.status} ${response.statusText}`)
            }

            const cardData = await response.json()
            setCard(cardData)
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to fetch card')
            setError(error)
            console.error('Error fetching card:', error)
        } finally {
            setIsLoading(false)
        }
    }, [])

    const reset = useCallback(() => {
        setCard(null)
        setError(null)
        setIsLoading(false)
    }, [])

    // Auto-fetch if cardName is provided
    useEffect(() => {
        if (cardName) {
            fetchCard(cardName)
        }
    }, [cardName, fetchCard])

    return {
        card,
        error,
        isLoading,
        fetchCard,
        reset
    }
}