/**
 * Custom Hook for Google Analytics Tracking
 * Provides convenient methods for tracking events in React components
 */

import { useCallback } from 'react'
import { trackEvent, trackError, trackTiming } from '@/utils/analytics'
import {
    GA_EVENTS,
    GAClickEvent,
    GAFormEvent,
    GADeckEvent,
    GACardFetchEvent,
    GAImageGenerationEvent,
    GAAPIEvent
} from '@/types/analytics'

export function useAnalytics() {
    // Track button clicks
    const trackButtonClick = useCallback(
        (buttonText: string, additionalParams?: Partial<GAClickEvent>) => {
            trackEvent(GA_EVENTS.BUTTON_CLICK, {
                click_text: buttonText,
                element_type: 'button',
                event_category: 'engagement',
                ...additionalParams
            })
        },
        []
    )

    // Track link clicks
    const trackLinkClick = useCallback(
        (
            linkText: string,
            url: string,
            additionalParams?: Partial<GAClickEvent>
        ) => {
            trackEvent(GA_EVENTS.LINK_CLICK, {
                click_text: linkText,
                click_url: url,
                element_type: 'link',
                event_category: 'engagement',
                ...additionalParams
            })
        },
        []
    )

    // Track form submissions
    const trackFormSubmit = useCallback(
        (formName: string, additionalParams?: Partial<GAFormEvent>) => {
            trackEvent(GA_EVENTS.FORM_SUBMIT, {
                form_name: formName,
                event_category: 'engagement',
                ...additionalParams
            })
        },
        []
    )

    // Track file uploads
    const trackFileUpload = useCallback(
        (fileName: string, fileType: string) => {
            trackEvent(GA_EVENTS.FILE_UPLOAD, {
                event_category: 'engagement',
                event_label: fileName,
                file_type: fileType
            })
        },
        []
    )

    // Track deck upload
    const trackDeckUpload = useCallback(
        (cardCount: number, additionalParams?: Partial<GADeckEvent>) => {
            trackEvent(GA_EVENTS.DECK_UPLOAD, {
                deck_cards_count: cardCount,
                event_category: 'deck_action',
                ...additionalParams
            })
        },
        []
    )

    // Track card fetching
    const trackCardsFetch = useCallback((params: GACardFetchEvent) => {
        trackEvent(GA_EVENTS.CARDS_FETCH, {
            event_category: 'deck_action',
            ...params
        })
    }, [])

    // Track image generation
    const trackImageGeneration = useCallback(
        (params: GAImageGenerationEvent) => {
            trackEvent(GA_EVENTS.IMAGE_GENERATE, {
                event_category: 'deck_action',
                ...params
            })
        },
        []
    )

    // Track image download
    const trackImageDownload = useCallback(
        (imageFormat: string, cardCount: number) => {
            trackEvent(GA_EVENTS.IMAGE_DOWNLOAD, {
                event_category: 'deck_action',
                event_label: imageFormat,
                value: cardCount
            })
        },
        []
    )

    // Track API requests
    const trackAPIRequest = useCallback((params: GAAPIEvent) => {
        trackEvent(GA_EVENTS.API_REQUEST, {
            event_category: 'api',
            ...params
        })
    }, [])

    // Track API errors
    const trackAPIError = useCallback(
        (endpoint: string, status: number, errorMessage: string) => {
            trackEvent(GA_EVENTS.API_ERROR, {
                event_category: 'api',
                api_endpoint: endpoint,
                api_status: status,
                error_message: errorMessage
            })
        },
        []
    )

    // Track errors (wrapper around trackError utility)
    const trackErrorEvent = useCallback(
        (error: Error | string, fatal: boolean = false) => {
            trackError(error, fatal)
        },
        []
    )

    // Track timing/performance
    const trackTimingEvent = useCallback(
        (name: string, value: number, category?: string) => {
            trackTiming(name, value, category)
        },
        []
    )

    return {
        trackButtonClick,
        trackLinkClick,
        trackFormSubmit,
        trackFileUpload,
        trackDeckUpload,
        trackCardsFetch,
        trackImageGeneration,
        trackImageDownload,
        trackAPIRequest,
        trackAPIError,
        trackError: trackErrorEvent,
        trackTiming: trackTimingEvent
    }
}
