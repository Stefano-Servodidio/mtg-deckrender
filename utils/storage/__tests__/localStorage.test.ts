import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
    saveToLocalStorage,
    loadFromLocalStorage,
    removeFromLocalStorage,
    STORAGE_KEYS
} from '../localStorage'

describe('localStorage utilities', () => {
    // Mock localStorage
    let localStorageMock: { [key: string]: string }

    beforeEach(() => {
        localStorageMock = {}

        const mockLocalStorage = {
            getItem: vi.fn((key: string) => localStorageMock[key] || null),
            setItem: vi.fn((key: string, value: string) => {
                localStorageMock[key] = value
            }),
            removeItem: vi.fn((key: string) => {
                delete localStorageMock[key]
            }),
            clear: vi.fn(() => {
                localStorageMock = {}
            }),
            key: vi.fn((index: number) => {
                const keys = Object.keys(localStorageMock)
                return keys[index] || null
            }),
            get length() {
                return Object.keys(localStorageMock).length
            }
        }

        Object.defineProperty(window, 'localStorage', {
            value: mockLocalStorage,
            writable: true
        })
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    describe('saveToLocalStorage', () => {
        it('should save string value to localStorage', () => {
            const result = saveToLocalStorage('test-key', 'test-value')

            expect(result).toBe(true)
            expect(window.localStorage.setItem).toHaveBeenCalledWith(
                'test-key',
                '"test-value"'
            )
        })

        it('should save object value to localStorage', () => {
            const testObj = { name: 'test', count: 42 }
            const result = saveToLocalStorage('test-key', testObj)

            expect(result).toBe(true)
            expect(window.localStorage.setItem).toHaveBeenCalledWith(
                'test-key',
                JSON.stringify(testObj)
            )
        })

        it('should save array value to localStorage', () => {
            const testArray = ['a', 'b', 'c']
            const result = saveToLocalStorage('test-key', testArray)

            expect(result).toBe(true)
            expect(window.localStorage.setItem).toHaveBeenCalledWith(
                'test-key',
                JSON.stringify(testArray)
            )
        })

        it('should return false on error', () => {
            // Mock setItem to throw an error
            vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
                throw new Error('Storage error')
            })

            const result = saveToLocalStorage('test-key', 'test-value')

            expect(result).toBe(false)
        })
    })

    describe('loadFromLocalStorage', () => {
        it('should load string value from localStorage', () => {
            localStorageMock['test-key'] = '"test-value"'

            const result = loadFromLocalStorage('test-key', '')

            expect(result).toBe('test-value')
        })

        it('should load object value from localStorage', () => {
            const testObj = { name: 'test', count: 42 }
            localStorageMock['test-key'] = JSON.stringify(testObj)

            const result = loadFromLocalStorage('test-key', {})

            expect(result).toEqual(testObj)
        })

        it('should load array value from localStorage', () => {
            const testArray = ['a', 'b', 'c']
            localStorageMock['test-key'] = JSON.stringify(testArray)

            const result = loadFromLocalStorage('test-key', [])

            expect(result).toEqual(testArray)
        })

        it('should return default value when key does not exist', () => {
            const defaultValue = { default: true }
            const result = loadFromLocalStorage(
                'non-existent-key',
                defaultValue
            )

            expect(result).toEqual(defaultValue)
        })

        it('should return default value on parsing error', () => {
            localStorageMock['test-key'] = 'invalid-json{'
            const defaultValue = { default: true }

            const result = loadFromLocalStorage('test-key', defaultValue)

            expect(result).toEqual(defaultValue)
        })

        it('should return default value when getItem throws error', () => {
            vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
                throw new Error('Storage error')
            })
            const defaultValue = { default: true }

            const result = loadFromLocalStorage('test-key', defaultValue)

            expect(result).toEqual(defaultValue)
        })
    })

    describe('removeFromLocalStorage', () => {
        it('should remove value from localStorage', () => {
            localStorageMock['test-key'] = '"test-value"'

            const result = removeFromLocalStorage('test-key')

            expect(result).toBe(true)
            expect(window.localStorage.removeItem).toHaveBeenCalledWith(
                'test-key'
            )
            expect(localStorageMock['test-key']).toBeUndefined()
        })

        it('should return false on error', () => {
            vi.spyOn(window.localStorage, 'removeItem').mockImplementation(
                () => {
                    throw new Error('Storage error')
                }
            )

            const result = removeFromLocalStorage('test-key')

            expect(result).toBe(false)
        })
    })

    describe('STORAGE_KEYS', () => {
        it('should have correct storage keys', () => {
            expect(STORAGE_KEYS.DECKLIST).toBe('mtg-deck-to-png:decklist')
            expect(STORAGE_KEYS.OPTIONS).toBe('mtg-deck-to-png:options')
        })
    })
})
