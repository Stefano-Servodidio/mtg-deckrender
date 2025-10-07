/**
 * Google Analytics 4 Utility Functions
 * Provides helper functions for tracking events and page views
 */

import {
    GAEventParams,
    GAPageView,
    GAEventName,
    GA_EVENTS
} from '@/types/analytics'

// Check if GA is available and enabled
export const isGAEnabled = (): boolean => {
    if (typeof window === 'undefined') return false
    if (!process.env.NEXT_PUBLIC_GA_ID) return false
    return !!window.gtag
}

// Check if we're in production or if debug mode is enabled
export const shouldTrack = (): boolean => {
    if (typeof window === 'undefined') return false

    // Always allow tracking if GA_ID is set (including development with dummy ID)
    const gaId = process.env.NEXT_PUBLIC_GA_ID
    if (!gaId) return false

    // Don't track if user has Do Not Track enabled
    if (navigator.doNotTrack === '1') return false

    return true
}

/**
 * Initialize Google Analytics
 * @param measurementId - GA4 Measurement ID
 */
export const initGA = (measurementId: string): void => {
    if (typeof window === 'undefined') return

    // Create dataLayer if it doesn't exist
    window.dataLayer = window.dataLayer || []

    // Define gtag function
    window.gtag = function gtag() {
        // eslint-disable-next-line prefer-rest-params
        window.dataLayer?.push(arguments)
    }

    // Initialize with current timestamp
    window.gtag('js', new Date())

    // Configure GA4
    window.gtag('config', measurementId, {
        send_page_view: true, // Let GA handle the initial page view
        cookie_flags: 'SameSite=None;Secure', // GDPR consideration
        anonymize_ip: true // GDPR compliance
    })

    // Log initialization in development
    if (process.env.NODE_ENV === 'development') {
        console.log('[GA4] Initialized with ID:', measurementId)
    }
}

/**
 * Track a page view
 * @param url - Page URL
 * @param title - Page title
 */
export const trackPageView = (url: string, title?: string): void => {
    if (!shouldTrack() || !isGAEnabled()) {
        if (process.env.NODE_ENV === 'development') {
            console.log('[GA4] Page View (not tracked):', { url, title })
        }
        return
    }

    const pageView: GAPageView = {
        page_title: title || document.title,
        page_location: window.location.href,
        page_path: url
    }

    try {
        window.gtag?.('event', GA_EVENTS.PAGE_VIEW, pageView)

        if (process.env.NODE_ENV === 'development') {
            console.log('[GA4] Page View:', pageView)
        }
    } catch (error) {
        console.error('[GA4] Error tracking page view:', error)
    }
}

/**
 * Track a custom event
 * @param eventName - Name of the event
 * @param params - Event parameters
 */
export const trackEvent = (
    eventName: GAEventName,
    params?: GAEventParams
): void => {
    if (!shouldTrack() || !isGAEnabled()) {
        if (process.env.NODE_ENV === 'development') {
            console.log('[GA4] Event (not tracked):', eventName, params)
        }
        return
    }

    try {
        window.gtag?.('event', eventName, params)

        if (process.env.NODE_ENV === 'development') {
            console.log('[GA4] Event:', eventName, params)
        }
    } catch (error) {
        console.error('[GA4] Error tracking event:', error)
    }
}

/**
 * Track an error
 * @param error - Error object or message
 * @param fatal - Whether the error is fatal
 */
export const trackError = (
    error: Error | string,
    fatal: boolean = false
): void => {
    const errorMessage = error instanceof Error ? error.message : error
    const errorType = error instanceof Error ? error.constructor.name : 'Error'

    trackEvent(GA_EVENTS.ERROR, {
        error_message: errorMessage,
        error_type: errorType,
        error_fatal: fatal,
        event_category: 'error'
    })
}

/**
 * Track timing/performance metrics
 * @param name - Name of the timing metric
 * @param value - Time value in milliseconds
 * @param category - Category of the timing
 */
export const trackTiming = (
    name: string,
    value: number,
    category?: string
): void => {
    trackEvent(GA_EVENTS.TIMING_COMPLETE, {
        name,
        value,
        event_category: category || 'performance'
    })
}

/**
 * Set user properties (for GDPR-compliant user tracking)
 * @param properties - User properties object
 */
export const setUserProperties = (
    properties: Record<string, string | number | boolean>
): void => {
    if (!shouldTrack() || !isGAEnabled()) return

    try {
        window.gtag?.('set', 'user_properties', properties)

        if (process.env.NODE_ENV === 'development') {
            console.log('[GA4] User Properties:', properties)
        }
    } catch (error) {
        console.error('[GA4] Error setting user properties:', error)
    }
}
