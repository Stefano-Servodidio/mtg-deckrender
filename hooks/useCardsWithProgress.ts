import { useState, useCallback } from 'react'
import { ScryfallCard } from '@/app/services/scryfall/types'

interface ProgressData {
    type: 'progress' | 'complete'
    current?: number
    total?: number
    percentage?: number
    message?: string
    cards?: { card: ScryfallCard; quantity: number }[]
    errors?: string[]
}

interface UseCardsWithProgressReturn {
    fetchCards: (decklist: string) => Promise<void>
    progress: {
        current: number
        total: number
        percentage: number
        message: string
    }
    cards: { card: ScryfallCard; quantity: number }[] | null
    errors: string[]
    isLoading: boolean
    isComplete: boolean
}

export function useCardsWithProgress(): UseCardsWithProgressReturn {
    const [progress, setProgress] = useState({
        current: 0,
        total: 0,
        percentage: 0,
        message: ''
    })
    const [cards, setCards] = useState<{ card: ScryfallCard; quantity: number }[] | null>(null)
    const [errors, setErrors] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isComplete, setIsComplete] = useState(false)

    const fetchCards = useCallback(async (decklist: string) => {
        if (!decklist.trim()) return

        setIsLoading(true)
        setIsComplete(false)
        setCards(null)
        setErrors([])
        setProgress({ current: 0, total: 0, percentage: 0, message: '' })

        try {
            const response = await fetch('/api/cards/progress', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ decklist })
            })

            if (!response.ok) {
                throw new Error('Failed to fetch cards')
            }

            const reader = response.body?.getReader()
            const decoder = new TextDecoder()

            if (!reader) {
                throw new Error('No response body')
            }

            while (true) {
                const { done, value } = await reader.read()
                
                if (done) break

                const chunk = decoder.decode(value)
                const lines = chunk.split('\n')

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data: ProgressData = JSON.parse(line.slice(6))
                            
                            if (data.type === 'progress') {
                                setProgress({
                                    current: data.current || 0,
                                    total: data.total || 0,
                                    percentage: data.percentage || 0,
                                    message: data.message || ''
                                })
                            } else if (data.type === 'complete') {
                                setCards(data.cards || [])
                                setErrors(data.errors || [])
                                setIsComplete(true)
                                setProgress(prev => ({
                                    ...prev,
                                    message: data.message || 'Complete!'
                                }))
                            }
                        } catch (parseError) {
                            console.error('Error parsing SSE data:', parseError)
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching cards with progress:', error)
            setErrors(['Failed to fetch cards'])
        } finally {
            setIsLoading(false)
        }
    }, [])

    return {
        fetchCards,
        progress,
        cards,
        errors,
        isLoading,
        isComplete
    }
}