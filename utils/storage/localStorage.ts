/**
 * Utility functions for persisting data to localStorage
 * Provides type-safe storage and retrieval with error handling
 */

const STORAGE_KEYS = {
    DECKLIST: 'mtg-deck-to-png:decklist',
    OPTIONS: 'mtg-deck-to-png:options'
} as const

/**
 * Save data to localStorage with error handling
 * @param key - The localStorage key
 * @param value - The value to store (will be JSON stringified)
 * @returns true if successful, false otherwise
 */
export function saveToLocalStorage<T>(key: string, value: T): boolean {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || !window.localStorage) {
        return false
    }

    try {
        const serialized = JSON.stringify(value)
        window.localStorage.setItem(key, serialized)
        return true
    } catch (error) {
        console.error('Error saving to localStorage:', error)
        return false
    }
}

/**
 * Load data from localStorage with error handling
 * @param key - The localStorage key
 * @param defaultValue - Default value to return if key doesn't exist or parsing fails
 * @returns The stored value or the default value
 */
export function loadFromLocalStorage<T>(key: string, defaultValue: T): T {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || !window.localStorage) {
        return defaultValue
    }

    try {
        const serialized = window.localStorage.getItem(key)
        if (serialized === null) {
            return defaultValue
        }
        return JSON.parse(serialized) as T
    } catch (error) {
        console.error('Error loading from localStorage:', error)
        return defaultValue
    }
}

/**
 * Remove data from localStorage
 * @param key - The localStorage key
 * @returns true if successful, false otherwise
 */
export function removeFromLocalStorage(key: string): boolean {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || !window.localStorage) {
        return false
    }

    try {
        window.localStorage.removeItem(key)
        return true
    } catch (error) {
        console.error('Error removing from localStorage:', error)
        return false
    }
}

export { STORAGE_KEYS }
