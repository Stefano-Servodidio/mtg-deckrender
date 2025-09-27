import { useRef } from 'react'

interface FetchCache<T> {
    get: (_key: string) => T | undefined
    set: (_key: string, _value: T) => void
    clear: () => void
    keys: () => string[]
}

// Hook to manage a simple in-memory cache with a max size
export function useFetchCache<T>(maxSize = 100): FetchCache<T> {
    // Use a ref to persist cache across renders
    const cacheRef = useRef<Map<string, T>>(new Map())
    const orderRef = useRef<string[]>([])

    const get = (key: string): T | undefined => {
        return cacheRef.current.get(key)
    }

    const set = (key: string, value: T) => {
        if (!cacheRef.current.has(key)) {
            orderRef.current.push(key)
            if (orderRef.current.length > maxSize) {
                const oldestKey = orderRef.current.shift()
                if (oldestKey) cacheRef.current.delete(oldestKey)
            }
        }
        cacheRef.current.set(key, value)
    }

    const clear = () => {
        cacheRef.current.clear()
        orderRef.current = []
    }

    const keys = () => [...orderRef.current]

    return { get, set, clear, keys }
}
