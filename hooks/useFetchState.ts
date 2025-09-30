import { ProgressInfo } from '@/types/api'
import { useState, useCallback } from 'react'

export interface FetchState<T> {
    data: T | null
    setData: (_data: T | null) => void
    error: Error | null
    setError: (_error: Error | null) => void
    isLoading: boolean
    setIsLoading: (_isLoading: boolean) => void
    progress: ProgressInfo | null
    setProgress: (_progress: ProgressInfo | null) => void
    reset: () => void
}

// hook to manage fetch state
export function useFetchState<T>(): FetchState<T> {
    const [data, setData] = useState<T | null>(null)
    const [error, setError] = useState<Error | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [progress, setProgress] = useState<ProgressInfo | null>(null)

    const updateData = useCallback((newData: T | null) => {
        setData(newData)
    }, [])

    const updateError = useCallback((newError: Error | null) => {
        setError(newError)
    }, [])
    const updateIsLoading = useCallback((loading: boolean) => {
        setIsLoading(loading)
    }, [])
    const updateProgress = useCallback((newProgress: ProgressInfo | null) => {
        setProgress(newProgress)
    }, [])

    const reset = useCallback(() => {
        setData(null)
        setError(null)
        setIsLoading(false)
        setProgress(null)
    }, [])

    return {
        data,
        setData: updateData,
        error,
        setError: updateError,
        isLoading,
        setIsLoading: updateIsLoading,
        progress,
        setProgress: updateProgress,
        reset
    }
}
