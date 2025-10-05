'use client'

import { useState, useEffect, useCallback } from 'react'

export type ThemeMode = 'light' | 'dark'

const THEME_STORAGE_KEY = 'mtg-deck-theme-mode'

export function useThemeMode() {
    const [themeMode, setThemeModeState] = useState<ThemeMode>('light')
    const [isLoaded, setIsLoaded] = useState(false)

    // Load theme from localStorage on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode
            if (savedTheme === 'light' || savedTheme === 'dark') {
                setThemeModeState(savedTheme)
            }
            setIsLoaded(true)
        }
    }, [])

    // Update theme and save to localStorage
    const setThemeMode = useCallback((mode: ThemeMode) => {
        setThemeModeState(mode)
        if (typeof window !== 'undefined') {
            localStorage.setItem(THEME_STORAGE_KEY, mode)
        }
    }, [])

    // Toggle between light and dark
    const toggleThemeMode = useCallback(() => {
        setThemeMode(themeMode === 'light' ? 'dark' : 'light')
    }, [themeMode, setThemeMode])

    return {
        themeMode,
        setThemeMode,
        toggleThemeMode,
        isLoaded
    }
}
