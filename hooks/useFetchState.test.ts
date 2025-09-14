import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFetchState } from '../hooks/useFetchState'

describe('useFetchState', () => {
    it('should initialize with default values', () => {
        const { result } = renderHook(() => useFetchState<string>())
        
        expect(result.current.data).toBeNull()
        expect(result.current.error).toBeNull()
        expect(result.current.isLoading).toBe(false)
    })

    it('should update data correctly', () => {
        const { result } = renderHook(() => useFetchState<string>())
        
        act(() => {
            result.current.setData('test data')
        })
        
        expect(result.current.data).toBe('test data')
    })

    it('should update error correctly', () => {
        const { result } = renderHook(() => useFetchState<string>())
        const testError = new Error('Test error')
        
        act(() => {
            result.current.setError(testError)
        })
        
        expect(result.current.error).toBe(testError)
    })

    it('should update loading state correctly', () => {
        const { result } = renderHook(() => useFetchState<string>())
        
        act(() => {
            result.current.setIsLoading(true)
        })
        
        expect(result.current.isLoading).toBe(true)
        
        act(() => {
            result.current.setIsLoading(false)
        })
        
        expect(result.current.isLoading).toBe(false)
    })

    it('should reset all state to initial values', () => {
        const { result } = renderHook(() => useFetchState<string>())
        
        // Set some state
        act(() => {
            result.current.setData('test data')
            result.current.setError(new Error('test error'))
            result.current.setIsLoading(true)
        })
        
        // Verify state is set
        expect(result.current.data).toBe('test data')
        expect(result.current.error).toBeInstanceOf(Error)
        expect(result.current.isLoading).toBe(true)
        
        // Reset
        act(() => {
            result.current.reset()
        })
        
        // Verify state is reset
        expect(result.current.data).toBeNull()
        expect(result.current.error).toBeNull()
        expect(result.current.isLoading).toBe(false)
    })

    it('should handle different data types', () => {
        interface TestData {
            id: number
            name: string
        }
        
        const { result } = renderHook(() => useFetchState<TestData>())
        const testData: TestData = { id: 1, name: 'test' }
        
        act(() => {
            result.current.setData(testData)
        })
        
        expect(result.current.data).toEqual(testData)
    })
})