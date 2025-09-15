import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFetchCache } from '../useFetchCache'

describe('useFetchCache', () => {
    it('should initialize empty cache', () => {
        const { result } = renderHook(() => useFetchCache<string>())

        expect(result.current.get('nonexistent')).toBeUndefined()
        expect(result.current.keys()).toEqual([])
    })

    it('should store and retrieve values', () => {
        const { result } = renderHook(() => useFetchCache<string>())

        act(() => {
            result.current.set('key1', 'value1')
        })

        expect(result.current.get('key1')).toBe('value1')
        expect(result.current.keys()).toEqual(['key1'])
    })

    it('should handle multiple entries', () => {
        const { result } = renderHook(() => useFetchCache<string>())

        act(() => {
            result.current.set('key1', 'value1')
            result.current.set('key2', 'value2')
            result.current.set('key3', 'value3')
        })

        expect(result.current.get('key1')).toBe('value1')
        expect(result.current.get('key2')).toBe('value2')
        expect(result.current.get('key3')).toBe('value3')
        expect(result.current.keys()).toEqual(['key1', 'key2', 'key3'])
    })

    it('should respect maxSize limit', () => {
        const { result } = renderHook(() => useFetchCache<string>(2))

        act(() => {
            result.current.set('key1', 'value1')
            result.current.set('key2', 'value2')
            result.current.set('key3', 'value3') // This should evict key1
        })

        expect(result.current.get('key1')).toBeUndefined()
        expect(result.current.get('key2')).toBe('value2')
        expect(result.current.get('key3')).toBe('value3')
        expect(result.current.keys()).toEqual(['key2', 'key3'])
    })

    it('should handle updating existing keys', () => {
        const { result } = renderHook(() => useFetchCache<string>(3))

        act(() => {
            result.current.set('key1', 'value1')
            result.current.set('key2', 'value2')
            result.current.set('key1', 'updated_value1') // Update existing key
        })

        expect(result.current.get('key1')).toBe('updated_value1')
        expect(result.current.keys()).toEqual(['key1', 'key2']) // Order should remain
    })

    it('should clear all cache entries', () => {
        const { result } = renderHook(() => useFetchCache<string>())

        act(() => {
            result.current.set('key1', 'value1')
            result.current.set('key2', 'value2')
        })

        expect(result.current.keys()).toEqual(['key1', 'key2'])

        act(() => {
            result.current.clear()
        })

        expect(result.current.get('key1')).toBeUndefined()
        expect(result.current.get('key2')).toBeUndefined()
        expect(result.current.keys()).toEqual([])
    })

    it('should handle complex data types', () => {
        interface TestData {
            id: number
            name: string
            items: string[]
        }

        const { result } = renderHook(() => useFetchCache<TestData>())
        const testData: TestData = {
            id: 1,
            name: 'test',
            items: ['a', 'b', 'c']
        }

        act(() => {
            result.current.set('complex', testData)
        })

        expect(result.current.get('complex')).toEqual(testData)
    })

    it('should maintain insertion order with LRU eviction', () => {
        const { result } = renderHook(() => useFetchCache<number>(3))

        act(() => {
            result.current.set('a', 1)
            result.current.set('b', 2)
            result.current.set('c', 3)
            result.current.set('d', 4) // Should evict 'a'
            result.current.set('e', 5) // Should evict 'b'
        })

        expect(result.current.get('a')).toBeUndefined()
        expect(result.current.get('b')).toBeUndefined()
        expect(result.current.get('c')).toBe(3)
        expect(result.current.get('d')).toBe(4)
        expect(result.current.get('e')).toBe(5)
        expect(result.current.keys()).toEqual(['c', 'd', 'e'])
    })

    it('should handle edge case of maxSize 1', () => {
        const { result } = renderHook(() => useFetchCache<string>(1))

        act(() => {
            result.current.set('key1', 'value1')
            result.current.set('key2', 'value2')
        })

        expect(result.current.get('key1')).toBeUndefined()
        expect(result.current.get('key2')).toBe('value2')
        expect(result.current.keys()).toEqual(['key2'])
    })

    it('should persist cache across re-renders', () => {
        const { result, rerender } = renderHook(() => useFetchCache<string>())

        act(() => {
            result.current.set('persistent', 'value')
        })

        rerender()

        expect(result.current.get('persistent')).toBe('value')
    })
})
