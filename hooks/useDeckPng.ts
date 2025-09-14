import { CardItem } from '@/app/api/cards/_types'
import React, { useState, useCallback } from 'react'
import { useFetchState } from './useFetchState'

interface DeckPngOptions {
    rowSize?: number
}

interface ProgressInfo {
    current: number
    total: number
    message: string
    percentage: number
}

interface UseDeckPngReturn {
    data: string | null
    error: Error | null
    isLoading: boolean
    progress: ProgressInfo | null
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
    const [progress, setProgress] = useState<ProgressInfo | null>(null)

    const generateImage = useCallback(
        async (cards: CardItem[], options: DeckPngOptions = { rowSize: 7 }) => {
            if (!cards || cards.length === 0) {
                setError(new Error('Cards are required'))
                return
            }

            setIsLoading(true)
            setError(null)
            setData(null)
            setProgress(null)

            try {
                if (process.env.NODE_ENV === 'development') {
                    console.log('POST /api/deck-png - Generating image (streaming)')
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

                // Handle streaming response
                if (response.body) {
                    const reader = response.body.getReader()
                    const decoder = new TextDecoder()
                    let buffer = ''

                    try {
                        while (true) {
                            const { done, value } = await reader.read()
                            if (done) break

                            buffer += decoder.decode(value, { stream: true })
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
                                                percentage: data.current // current is already a percentage for deck-png
                                            }
                                            setProgress(progressInfo)
                                        } else if (data.type === 'complete') {
                                            // Convert base64 image to blob URL
                                            const base64Data = data.result.imageData
                                            const binaryString = atob(base64Data)
                                            const bytes = new Uint8Array(binaryString.length)
                                            for (let i = 0; i < binaryString.length; i++) {
                                                bytes[i] = binaryString.charCodeAt(i)
                                            }
                                            const blob = new Blob([bytes], { type: 'image/png' })
                                            const imageUrl = URL.createObjectURL(blob)
                                            setData(imageUrl)
                                            setProgress({
                                                current: 100,
                                                total: 100,
                                                message: data.message,
                                                percentage: 100
                                            })
                                        } else if (data.type === 'error') {
                                            throw new Error(data.error || 'Stream error')
                                        }
                                    } catch (parseError) {
                                        console.error('Error parsing stream data:', parseError, line)
                                    }
                                }
                            }
                        }
                    } finally {
                        reader.releaseLock()
                    }
                } else {
                    // Fallback for non-streaming response (shouldn't happen with new implementation)
                    const arrayBuffer = await response.arrayBuffer()
                    const uint8Array = new Uint8Array(arrayBuffer)
                    const blob = new Blob([uint8Array], { type: 'image/png' })
                    const imageUrl = URL.createObjectURL(blob)
                    setData(imageUrl)
                }
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
        setProgress(null)
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
        progress,
        generateImage,
        reset
    }
}
