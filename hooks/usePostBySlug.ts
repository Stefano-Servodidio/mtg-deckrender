import { useCallback } from 'react'
import { useFetchState } from './useFetchState'
import { BlogPostBySlugResponse } from '@/types/blog'

interface UsePostBySlugReturn {
    data: BlogPostBySlugResponse | null
    error: Error | null
    isLoading: boolean
    fetchPostBySlug: (_slug: string) => Promise<void>
    reset: () => void
}

// Hook to fetch blog posts, optionally by slug
export function usePostBySlug(): UsePostBySlugReturn {
    const { data, setData, error, setError, isLoading, setIsLoading, reset } =
        useFetchState<BlogPostBySlugResponse>()

    const fetchPostBySlug = useCallback(
        async (slug: string) => {
            setIsLoading(true)
            setError(null)
            try {
                const response = await fetch(`/api/blog?slug=${slug}`)
                if (!response.ok) {
                    throw new Error('Failed to fetch blog posts')
                }
                const data = await response.json()
                setData(data)
            } catch (error) {
                setError(
                    error instanceof Error
                        ? error
                        : new Error('Failed to load blog posts')
                )
            } finally {
                setIsLoading(false)
            }
        },
        [setData, setError, setIsLoading]
    )

    return {
        data,
        error,
        isLoading,
        reset,
        fetchPostBySlug
    }
}
