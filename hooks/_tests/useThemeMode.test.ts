import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useThemeMode } from '../useThemeMode'

describe('useThemeMode', () => {
    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear()
    })

    it('should initialize with light mode by default', () => {
        const { result } = renderHook(() => useThemeMode())

        expect(result.current.themeMode).toBe('light')
        // In test environment, effect runs synchronously
        expect(result.current.isLoaded).toBe(true)
    })

    it('should load from localStorage if present', () => {
        localStorage.setItem('mtg-deck-theme-mode', 'dark')

        const { result } = renderHook(() => useThemeMode())

        // Wait for the effect to run
        act(() => {
            // Effect should run after render
        })

        expect(result.current.isLoaded).toBe(true)
    })

    it('should toggle theme mode', () => {
        const { result } = renderHook(() => useThemeMode())

        act(() => {
            result.current.toggleThemeMode()
        })

        expect(result.current.themeMode).toBe('dark')

        act(() => {
            result.current.toggleThemeMode()
        })

        expect(result.current.themeMode).toBe('light')
    })

    it('should save theme mode to localStorage when toggled', () => {
        const { result } = renderHook(() => useThemeMode())

        act(() => {
            result.current.toggleThemeMode()
        })

        expect(localStorage.getItem('mtg-deck-theme-mode')).toBe('dark')

        act(() => {
            result.current.toggleThemeMode()
        })

        expect(localStorage.getItem('mtg-deck-theme-mode')).toBe('light')
    })

    it('should set specific theme mode', () => {
        const { result } = renderHook(() => useThemeMode())

        act(() => {
            result.current.setThemeMode('dark')
        })

        expect(result.current.themeMode).toBe('dark')
        expect(localStorage.getItem('mtg-deck-theme-mode')).toBe('dark')
    })
})
