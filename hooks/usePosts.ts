import { useCallback } from 'react'
import { useFetchState } from './useFetchState'
import { BlogPostsResponse } from '@/types/blog'

interface UsePostsReturn {
    data: BlogPostsResponse | null
    error: Error | null
    isLoading: boolean
    fetchPosts: (_maxPosts?: number) => Promise<void>
    reset: () => void
}

// Hook to fetch blog posts
export function usePosts(): UsePostsReturn {
    const { data, setData, error, setError, isLoading, setIsLoading, reset } =
        useFetchState<BlogPostsResponse>()

    const fetchPosts = useCallback(
        async (maxPosts = 3) => {
            setIsLoading(true)
            setError(null)
            try {
                const response = await fetch('/api/blog')
                if (!response.ok) {
                    throw new Error('Failed to fetch blog posts')
                }
                const data = await response.json()
                setData({
                    posts: data.posts.slice(0, maxPosts),
                    count: data.count
                })
            } catch (_err) {
                setError(new Error('Failed to load blog posts'))
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
        fetchPosts
    }
}
