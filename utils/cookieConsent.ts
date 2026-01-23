/**
 * Cookie Consent Utilities
 * Manages user consent preferences for GDPR compliance
 */

// Cookie consent categories
export enum ConsentCategory {
    NECESSARY = 'necessary',
    ANALYTICS = 'analytics',
    MARKETING = 'marketing'
}

// Consent preferences interface
export interface ConsentPreferences {
    [ConsentCategory.NECESSARY]: boolean
    [ConsentCategory.ANALYTICS]: boolean
    [ConsentCategory.MARKETING]: boolean
    timestamp: number
}

// Default consent state (only necessary cookies allowed)
const DEFAULT_CONSENT: ConsentPreferences = {
    [ConsentCategory.NECESSARY]: true,
    [ConsentCategory.ANALYTICS]: false,
    [ConsentCategory.MARKETING]: false,
    timestamp: Date.now()
}

// Cookie name for storing consent
const CONSENT_COOKIE_NAME = 'mtg_deckrender_cookie_consent'
const CONSENT_COOKIE_EXPIRY_DAYS = 365

/**
 * Check if code is running in browser
 */
const isBrowser = (): boolean => typeof window !== 'undefined'

/**
 * Get a cookie value by name
 */
const getCookie = (name: string): string | null => {
    if (!isBrowser()) return null

    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) {
        return parts.pop()?.split(';').shift() || null
    }
    return null
}

/**
 * Set a cookie with expiry
 */
const setCookie = (
    name: string,
    value: string,
    days: number = CONSENT_COOKIE_EXPIRY_DAYS
): void => {
    if (!isBrowser()) return

    const expires = new Date()
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)

    // Only add Secure flag on HTTPS
    const isSecure = window.location.protocol === 'https:'
    const secureFlag = isSecure ? ';Secure' : ''

    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax${secureFlag}`
}

/**
 * Delete a cookie
 */
const deleteCookie = (name: string): void => {
    if (!isBrowser()) return
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`
}

/**
 * Get current consent preferences from cookie
 */
export const getConsentPreferences = (): ConsentPreferences | null => {
    if (!isBrowser()) return null

    const consentCookie = getCookie(CONSENT_COOKIE_NAME)
    if (!consentCookie) return null

    try {
        const preferences = JSON.parse(decodeURIComponent(consentCookie))
        // Validate the structure
        if (
            typeof preferences === 'object' &&
            typeof preferences.necessary === 'boolean' &&
            typeof preferences.analytics === 'boolean' &&
            typeof preferences.marketing === 'boolean' &&
            typeof preferences.timestamp === 'number'
        ) {
            return preferences as ConsentPreferences
        }
        return null
    } catch (error) {
        console.error('[Cookie Consent] Error parsing consent cookie:', error)
        return null
    }
}

/**
 * Save consent preferences to cookie
 */
export const saveConsentPreferences = (
    preferences: Partial<ConsentPreferences>
): void => {
    if (!isBrowser()) return

    const updatedPreferences: ConsentPreferences = {
        ...DEFAULT_CONSENT,
        ...preferences,
        necessary: true, // Always true for necessary cookies
        timestamp: Date.now()
    }

    const cookieValue = encodeURIComponent(JSON.stringify(updatedPreferences))
    setCookie(CONSENT_COOKIE_NAME, cookieValue)

    // Dispatch custom event for listeners
    window.dispatchEvent(
        new CustomEvent('consentUpdated', { detail: updatedPreferences })
    )
}

/**
 * Check if user has given consent for a specific category
 */
export const hasConsent = (category: ConsentCategory): boolean => {
    if (!isBrowser()) return false

    const preferences = getConsentPreferences()
    if (!preferences) {
        // No consent given yet - only necessary cookies allowed
        return category === ConsentCategory.NECESSARY
    }

    return preferences[category] === true
}

/**
 * Accept all cookies
 */
export const acceptAllCookies = (): void => {
    saveConsentPreferences({
        [ConsentCategory.NECESSARY]: true,
        [ConsentCategory.ANALYTICS]: true,
        [ConsentCategory.MARKETING]: true
    })
}

/**
 * Reject all non-necessary cookies
 */
export const rejectAllCookies = (): void => {
    saveConsentPreferences({
        [ConsentCategory.NECESSARY]: true,
        [ConsentCategory.ANALYTICS]: false,
        [ConsentCategory.MARKETING]: false
    })
}

/**
 * Clear all consent preferences
 */
export const clearConsent = (): void => {
    deleteCookie(CONSENT_COOKIE_NAME)
    window.dispatchEvent(new CustomEvent('consentUpdated', { detail: null }))
}

/**
 * Check if consent banner should be shown
 */
export const shouldShowConsentBanner = (): boolean => {
    if (!isBrowser()) return false
    return getConsentPreferences() === null
}

/**
 * Check if analytics cookies are allowed
 */
export const canUseAnalytics = (): boolean => {
    return hasConsent(ConsentCategory.ANALYTICS)
}

/**
 * Check if marketing cookies are allowed
 */
export const canUseMarketing = (): boolean => {
    return hasConsent(ConsentCategory.MARKETING)
}
