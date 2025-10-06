/**
 * Google Analytics 4 Event Types and Interfaces
 * Provides type-safe event tracking for the MTG Deck to PNG application
 */

// GA4 Global Type Declaration
declare global {
    interface Window {
        gtag?: (
            command: 'config' | 'event' | 'js' | 'set',
            targetIdOrDate: string | Date,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            config?: Record<string, any>
        ) => void
        dataLayer?: unknown[]
    }
}

// Base event parameters
export interface GAEventParams {
    event_category?: string
    event_label?: string
    value?: number
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any
}

// Page view event
export interface GAPageView {
    page_title: string
    page_location: string
    page_path: string
}

// User interaction events
export interface GAClickEvent extends GAEventParams {
    click_text: string
    click_url?: string
    element_type?: string
}

export interface GAFormEvent extends GAEventParams {
    form_id?: string
    form_name?: string
    form_destination?: string
}

// MTG Deck-specific events
export interface GADeckEvent extends GAEventParams {
    deck_cards_count?: number
    deck_format?: string
    has_sideboard?: boolean
}

export interface GACardFetchEvent extends GAEventParams {
    cards_requested: number
    cards_found: number
    cards_missing: number
    fetch_method: 'individual' | 'collection'
}

export interface GAImageGenerationEvent extends GAEventParams {
    image_variant: string
    image_size: string
    image_format: string
    card_count: number
    sort_by?: string
}

// API tracking events
export interface GAAPIEvent extends GAEventParams {
    api_endpoint: string
    api_method: string
    api_status: number
    api_duration_ms?: number
}

// Error tracking
export interface GAErrorEvent extends GAEventParams {
    error_message: string
    error_type: string
    error_fatal: boolean
}

// Event names as constants for type safety
export const GA_EVENTS = {
    // Page tracking
    PAGE_VIEW: 'page_view',

    // User interactions
    BUTTON_CLICK: 'button_click',
    LINK_CLICK: 'link_click',
    FORM_SUBMIT: 'form_submit',
    FILE_UPLOAD: 'file_upload',

    // MTG Deck actions
    DECK_UPLOAD: 'deck_upload',
    DECK_PARSE: 'deck_parse',
    CARDS_FETCH: 'cards_fetch',
    IMAGE_GENERATE: 'image_generate',
    IMAGE_DOWNLOAD: 'image_download',

    // API monitoring
    API_REQUEST: 'api_request',
    API_ERROR: 'api_error',

    // Performance
    TIMING_COMPLETE: 'timing_complete',

    // Errors
    ERROR: 'error'
} as const

export type GAEventName = (typeof GA_EVENTS)[keyof typeof GA_EVENTS]
