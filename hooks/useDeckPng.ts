import { CardItem, ScryfallCard } from '@/app/api/cards/_types'
import React, { useState, useCallback } from 'react'
import { useFetchState } from './useFetchState'

interface DeckPngOptions {
    rowSize?: number
}

interface UseDeckPngReturn {
    data: string | null
    error: Error | null
    isLoading: boolean
    generateImage: (
        cards: CardItem[],
        options?: DeckPngOptions
    ) => Promise<void>
    reset: () => void
}

// Hook to generate a deck PNG image from card data
export function useDeckPng(): UseDeckPngReturn {
    const {
        data,
        setData,
        error,
        setError,
        isLoading,
        setIsLoading,
        reset: resetState
    } = useFetchState<string>()

    const generateImage = useCallback(
        async (cards: CardItem[], options: DeckPngOptions = { rowSize: 7 }) => {
            if (!cards || cards.length === 0) {
                setError(new Error('Cards are required'))
                return
            }

            setIsLoading(true)
            setError(null)
            setData(null)

            try {
                if (process.env.NODE_ENV === 'development') {
                    console.log('POST /api/deck-png - Generating image')
                }
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
        [setData, setError, setIsLoading]
    )

    const reset = useCallback(() => {
        // Clean up any existing object URL
        if (data) {
            URL.revokeObjectURL(data)
        }
        resetState()
    }, [data, resetState])

    const revokeUrl = useCallback(() => {
        if (data) {
            URL.revokeObjectURL(data)
        }
    }, [data])

    React.useEffect(() => {
        return () => revokeUrl()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return {
        data,
        error,
        isLoading,
        generateImage,
        reset
    }
}
