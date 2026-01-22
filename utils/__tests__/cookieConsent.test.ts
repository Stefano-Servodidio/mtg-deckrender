import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
    ConsentCategory,
    getConsentPreferences,
    saveConsentPreferences,
    hasConsent,
    acceptAllCookies,
    rejectAllCookies,
    clearConsent,
    shouldShowConsentBanner,
    canUseAnalytics,
    canUseMarketing
} from '../cookieConsent'

// Mock document.cookie
let cookieStore: Record<string, string> = {}

beforeEach(() => {
    cookieStore = {}

    // Mock document.cookie getter/setter
    Object.defineProperty(document, 'cookie', {
        get: vi.fn(() => {
            return Object.entries(cookieStore)
                .map(([key, value]) => `${key}=${value}`)
                .join('; ')
        }),
        set: vi.fn((value: string) => {
            const [cookieStr] = value.split(';')
            const [key, val] = cookieStr.split('=')
            if (
                value.includes('expires=Thu, 01 Jan 1970') ||
                value.includes('max-age=0')
            ) {
                delete cookieStore[key]
            } else {
                cookieStore[key] = val
            }
        }),
        configurable: true
    })

    // Mock window.dispatchEvent
    vi.spyOn(window, 'dispatchEvent').mockImplementation(() => true)
})

afterEach(() => {
    vi.restoreAllMocks()
})

describe('cookieConsent utilities', () => {
    describe('getConsentPreferences', () => {
        it('should return null when no consent cookie exists', () => {
            const preferences = getConsentPreferences()
            expect(preferences).toBeNull()
        })

        it('should parse and return valid consent preferences', () => {
            const mockPreferences = {
                necessary: true,
                analytics: true,
                marketing: false,
                timestamp: Date.now()
            }
            cookieStore['mtg_deck_cookie_consent'] = encodeURIComponent(
                JSON.stringify(mockPreferences)
            )

            const preferences = getConsentPreferences()
            expect(preferences).toEqual(mockPreferences)
        })

        it('should return null for invalid consent data', () => {
            cookieStore['mtg_deck_cookie_consent'] = 'invalid-json'

            const preferences = getConsentPreferences()
            expect(preferences).toBeNull()
        })

        it('should return null for malformed consent structure', () => {
            cookieStore['mtg_deck_cookie_consent'] = encodeURIComponent(
                JSON.stringify({ foo: 'bar' })
            )

            const preferences = getConsentPreferences()
            expect(preferences).toBeNull()
        })
    })

    describe('saveConsentPreferences', () => {
        it('should save consent preferences to cookie', () => {
            saveConsentPreferences({
                [ConsentCategory.ANALYTICS]: true,
                [ConsentCategory.MARKETING]: false
            })

            expect(cookieStore['mtg_deck_cookie_consent']).toBeDefined()
            const saved = JSON.parse(
                decodeURIComponent(cookieStore['mtg_deck_cookie_consent'])
            )
            expect(saved.analytics).toBe(true)
            expect(saved.marketing).toBe(false)
            expect(saved.necessary).toBe(true) // Always true
            expect(saved.timestamp).toBeDefined()
        })

        it('should always set necessary to true', () => {
            saveConsentPreferences({
                [ConsentCategory.NECESSARY]: false,
                [ConsentCategory.ANALYTICS]: true
            })

            const saved = JSON.parse(
                decodeURIComponent(cookieStore['mtg_deck_cookie_consent'])
            )
            expect(saved.necessary).toBe(true)
        })

        it('should dispatch consentUpdated event', () => {
            saveConsentPreferences({
                [ConsentCategory.ANALYTICS]: true
            })

            expect(window.dispatchEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'consentUpdated'
                })
            )
        })
    })

    describe('hasConsent', () => {
        it('should return true for necessary cookies by default', () => {
            expect(hasConsent(ConsentCategory.NECESSARY)).toBe(true)
        })

        it('should return false for analytics cookies by default', () => {
            expect(hasConsent(ConsentCategory.ANALYTICS)).toBe(false)
        })

        it('should return true when consent is given', () => {
            saveConsentPreferences({
                [ConsentCategory.ANALYTICS]: true
            })

            expect(hasConsent(ConsentCategory.ANALYTICS)).toBe(true)
        })

        it('should return false when consent is not given', () => {
            saveConsentPreferences({
                [ConsentCategory.ANALYTICS]: false
            })

            expect(hasConsent(ConsentCategory.ANALYTICS)).toBe(false)
        })
    })

    describe('acceptAllCookies', () => {
        it('should accept all cookie categories', () => {
            acceptAllCookies()

            expect(hasConsent(ConsentCategory.NECESSARY)).toBe(true)
            expect(hasConsent(ConsentCategory.ANALYTICS)).toBe(true)
            expect(hasConsent(ConsentCategory.MARKETING)).toBe(true)
        })
    })

    describe('rejectAllCookies', () => {
        it('should reject all non-necessary cookies', () => {
            rejectAllCookies()

            expect(hasConsent(ConsentCategory.NECESSARY)).toBe(true)
            expect(hasConsent(ConsentCategory.ANALYTICS)).toBe(false)
            expect(hasConsent(ConsentCategory.MARKETING)).toBe(false)
        })
    })

    describe('clearConsent', () => {
        it('should clear consent preferences', () => {
            acceptAllCookies()
            expect(getConsentPreferences()).not.toBeNull()

            clearConsent()
            expect(getConsentPreferences()).toBeNull()
        })

        it('should dispatch consentUpdated event', () => {
            clearConsent()

            expect(window.dispatchEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'consentUpdated'
                })
            )
        })
    })

    describe('shouldShowConsentBanner', () => {
        it('should return true when no consent is given', () => {
            expect(shouldShowConsentBanner()).toBe(true)
        })

        it('should return false when consent is given', () => {
            acceptAllCookies()
            expect(shouldShowConsentBanner()).toBe(false)
        })
    })

    describe('canUseAnalytics', () => {
        it('should return false by default', () => {
            expect(canUseAnalytics()).toBe(false)
        })

        it('should return true when analytics consent is given', () => {
            acceptAllCookies()
            expect(canUseAnalytics()).toBe(true)
        })

        it('should return false when analytics consent is rejected', () => {
            rejectAllCookies()
            expect(canUseAnalytics()).toBe(false)
        })
    })

    describe('canUseMarketing', () => {
        it('should return false by default', () => {
            expect(canUseMarketing()).toBe(false)
        })

        it('should return true when marketing consent is given', () => {
            acceptAllCookies()
            expect(canUseMarketing()).toBe(true)
        })

        it('should return false when marketing consent is rejected', () => {
            rejectAllCookies()
            expect(canUseMarketing()).toBe(false)
        })
    })
})
