import { useState, useCallback } from 'react'
import { ScryfallCard } from '@/app/services/scryfall/types'

interface DeckPngOptions {
    rowSize?: number
}

interface UseDeckPngReturn {
    data: string | null
    error: Error | null
    isLoading: boolean
    generateImage: (
        cards: { card: ScryfallCard; quantity: number }[],
        options?: DeckPngOptions
    ) => Promise<void>
    reset: () => void
}

export function useDeckPng(): UseDeckPngReturn {
    const [data, setData] = useState<string | null>(null)
    const [error, setError] = useState<Error | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const generateImage = useCallback(
        async (
            cards: { card: ScryfallCard; quantity: number }[],
            options: DeckPngOptions = { rowSize: 7 }
        ) => {
            if (!cards || cards.length === 0) {
                setError(new Error('Cards are required'))
                return
            }

            setIsLoading(true)
            setError(null)
            setData(null)

            try {
                const response = await fetch('/api/deck-png', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        cards,
                        options
                    })
                })

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}))
                    throw new Error(
                        errorData.error ||
                            `HTTP ${response.status}: ${response.statusText}`
                    )
                }

                const arrayBuffer = await response.arrayBuffer()
                const uint8Array = new Uint8Array(arrayBuffer)
                const blob = new Blob([uint8Array], { type: 'image/png' })
                const imageUrl = URL.createObjectURL(blob)
                setData(imageUrl)
            } catch (err) {
                const error =
                    err instanceof Error
                        ? err
                        : new Error('Failed to generate deck PNG')
                setError(error)
                console.error('Error generating deck PNG:', error)
            } finally {
                setIsLoading(false)
            }
        },
        []
    )

    const reset = useCallback(() => {
        // Clean up any existing object URL
        if (data) {
            URL.revokeObjectURL(data)
        }
        setData(null)
        setError(null)
        setIsLoading(false)
    }, [data])

    return {
        data,
        error,
        isLoading,
        generateImage,
        reset
    }
}
