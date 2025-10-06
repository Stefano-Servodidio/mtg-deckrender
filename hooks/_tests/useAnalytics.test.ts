import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAnalytics } from '../useAnalytics'
import * as analyticsUtils from '@/utils/analytics'

// Mock the analytics utilities
vi.mock('@/utils/analytics', () => ({
    trackEvent: vi.fn(),
    trackError: vi.fn(),
    trackTiming: vi.fn()
}))

describe('useAnalytics', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should track button click', () => {
        const { result } = renderHook(() => useAnalytics())

        act(() => {
            result.current.trackButtonClick('Test Button')
        })

        expect(analyticsUtils.trackEvent).toHaveBeenCalledWith(
            'button_click',
            expect.objectContaining({
                click_text: 'Test Button',
                element_type: 'button',
                event_category: 'engagement'
            })
        )
    })

    it('should track button click with additional parameters', () => {
        const { result } = renderHook(() => useAnalytics())

        act(() => {
            result.current.trackButtonClick('Test Button', {
                click_url: '/test'
            })
        })

        expect(analyticsUtils.trackEvent).toHaveBeenCalledWith(
            'button_click',
            expect.objectContaining({
                click_text: 'Test Button',
                click_url: '/test'
            })
        )
    })

    it('should track link click', () => {
        const { result } = renderHook(() => useAnalytics())

        act(() => {
            result.current.trackLinkClick('Home', '/home')
        })

        expect(analyticsUtils.trackEvent).toHaveBeenCalledWith(
            'link_click',
            expect.objectContaining({
                click_text: 'Home',
                click_url: '/home',
                element_type: 'link',
                event_category: 'engagement'
            })
        )
    })

    it('should track form submit', () => {
        const { result } = renderHook(() => useAnalytics())

        act(() => {
            result.current.trackFormSubmit('Contact Form')
        })

        expect(analyticsUtils.trackEvent).toHaveBeenCalledWith(
            'form_submit',
            expect.objectContaining({
                form_name: 'Contact Form',
                event_category: 'engagement'
            })
        )
    })

    it('should track file upload', () => {
        const { result } = renderHook(() => useAnalytics())

        act(() => {
            result.current.trackFileUpload('decklist.txt', 'text/plain')
        })

        expect(analyticsUtils.trackEvent).toHaveBeenCalledWith(
            'file_upload',
            expect.objectContaining({
                event_category: 'engagement',
                event_label: 'decklist.txt',
                file_type: 'text/plain'
            })
        )
    })

    it('should track deck upload', () => {
        const { result } = renderHook(() => useAnalytics())

        act(() => {
            result.current.trackDeckUpload(60, {
                has_sideboard: true
            })
        })

        expect(analyticsUtils.trackEvent).toHaveBeenCalledWith(
            'deck_upload',
            expect.objectContaining({
                deck_cards_count: 60,
                has_sideboard: true,
                event_category: 'deck_action'
            })
        )
    })

    it('should track cards fetch', () => {
        const { result } = renderHook(() => useAnalytics())

        act(() => {
            result.current.trackCardsFetch({
                cards_requested: 60,
                cards_found: 58,
                cards_missing: 2,
                fetch_method: 'collection'
            })
        })

        expect(analyticsUtils.trackEvent).toHaveBeenCalledWith(
            'cards_fetch',
            expect.objectContaining({
                cards_requested: 60,
                cards_found: 58,
                cards_missing: 2,
                fetch_method: 'collection',
                event_category: 'deck_action'
            })
        )
    })

    it('should track image generation', () => {
        const { result } = renderHook(() => useAnalytics())

        act(() => {
            result.current.trackImageGeneration({
                image_variant: 'grid',
                image_size: 'ig_square',
                image_format: 'png',
                card_count: 60,
                sort_by: 'cmc'
            })
        })

        expect(analyticsUtils.trackEvent).toHaveBeenCalledWith(
            'image_generate',
            expect.objectContaining({
                image_variant: 'grid',
                image_size: 'ig_square',
                image_format: 'png',
                card_count: 60,
                sort_by: 'cmc',
                event_category: 'deck_action'
            })
        )
    })

    it('should track image download', () => {
        const { result } = renderHook(() => useAnalytics())

        act(() => {
            result.current.trackImageDownload('png', 60)
        })

        expect(analyticsUtils.trackEvent).toHaveBeenCalledWith(
            'image_download',
            expect.objectContaining({
                event_category: 'deck_action',
                event_label: 'png',
                value: 60
            })
        )
    })

    it('should track API request', () => {
        const { result } = renderHook(() => useAnalytics())

        act(() => {
            result.current.trackAPIRequest({
                api_endpoint: '/api/cards',
                api_method: 'POST',
                api_status: 200,
                api_duration_ms: 1234
            })
        })

        expect(analyticsUtils.trackEvent).toHaveBeenCalledWith(
            'api_request',
            expect.objectContaining({
                api_endpoint: '/api/cards',
                api_method: 'POST',
                api_status: 200,
                api_duration_ms: 1234,
                event_category: 'api'
            })
        )
    })

    it('should track API error', () => {
        const { result } = renderHook(() => useAnalytics())

        act(() => {
            result.current.trackAPIError('/api/cards', 500, 'Server error')
        })

        expect(analyticsUtils.trackEvent).toHaveBeenCalledWith(
            'api_error',
            expect.objectContaining({
                event_category: 'api',
                api_endpoint: '/api/cards',
                api_status: 500,
                error_message: 'Server error'
            })
        )
    })

    it('should track error with Error object', () => {
        const { result } = renderHook(() => useAnalytics())
        const error = new Error('Test error')

        act(() => {
            result.current.trackError(error, true)
        })

        expect(analyticsUtils.trackError).toHaveBeenCalledWith(error, true)
    })

    it('should track error with string', () => {
        const { result } = renderHook(() => useAnalytics())

        act(() => {
            result.current.trackError('Test error')
        })

        expect(analyticsUtils.trackError).toHaveBeenCalledWith(
            'Test error',
            false
        )
    })

    it('should track timing', () => {
        const { result } = renderHook(() => useAnalytics())

        act(() => {
            result.current.trackTiming('api_call', 1234, 'api')
        })

        expect(analyticsUtils.trackTiming).toHaveBeenCalledWith(
            'api_call',
            1234,
            'api'
        )
    })

    it('should maintain stable references for callbacks', () => {
        const { result, rerender } = renderHook(() => useAnalytics())

        const firstRender = result.current
        rerender()
        const secondRender = result.current

        // All methods should have stable references
        expect(firstRender.trackButtonClick).toBe(secondRender.trackButtonClick)
        expect(firstRender.trackLinkClick).toBe(secondRender.trackLinkClick)
        expect(firstRender.trackFormSubmit).toBe(secondRender.trackFormSubmit)
        expect(firstRender.trackFileUpload).toBe(secondRender.trackFileUpload)
        expect(firstRender.trackDeckUpload).toBe(secondRender.trackDeckUpload)
        expect(firstRender.trackCardsFetch).toBe(secondRender.trackCardsFetch)
        expect(firstRender.trackImageGeneration).toBe(
            secondRender.trackImageGeneration
        )
        expect(firstRender.trackImageDownload).toBe(
            secondRender.trackImageDownload
        )
        expect(firstRender.trackAPIRequest).toBe(secondRender.trackAPIRequest)
        expect(firstRender.trackAPIError).toBe(secondRender.trackAPIError)
        expect(firstRender.trackError).toBe(secondRender.trackError)
        expect(firstRender.trackTiming).toBe(secondRender.trackTiming)
    })
})
