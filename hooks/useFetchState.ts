import { useState, useCallback } from 'react'

export interface FetchState<T> {
    data: T | null
    setData: (_data: T | null) => void
    error: Error | null
    setError: (_error: Error | null) => void
    isLoading: boolean
    setIsLoading: (_isLoading: boolean) => void
    reset: () => void
}

// hook to manage fetch state
export function useFetchState<T>(): FetchState<T> {
    const [data, setData] = useState<T | null>(null)
    const [error, setError] = useState<Error | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const reset = useCallback(() => {
        setData(null)
        setError(null)
        setIsLoading(false)
    }, [])

    return {
        data,
        setData,
        error,
        setError,
        isLoading,
        setIsLoading,
        reset
    }
}
