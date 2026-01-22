import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
    isGAEnabled,
    shouldTrack,
    initGA,
    trackPageView,
    trackEvent,
    trackError,
    trackTiming
} from '../analytics'
import { GA_EVENTS } from '@/types/analytics'
import * as cookieConsent from '../cookieConsent'

// Mock cookieConsent module
vi.mock('../cookieConsent', () => ({
    canUseAnalytics: vi.fn(() => true)
}))

describe('Analytics Utilities', () => {
    let originalWindow: Window & typeof globalThis
    let originalEnv: NodeJS.ProcessEnv
    let originalNavigator: Navigator

    beforeEach(() => {
        originalWindow = global.window
        originalEnv = process.env
        originalNavigator = global.navigator

        // Mock navigator
        Object.defineProperty(global, 'navigator', {
            value: {
                doNotTrack: '0'
            },
            writable: true,
            configurable: true
        })

        // Mock window object
        global.window = {
            gtag: vi.fn(),
            dataLayer: [],
            location: {
                href: 'http://localhost:3000/test'
            }
        } as unknown as Window & typeof globalThis

        // Mock process.env
        process.env = {
            ...originalEnv,
            NEXT_PUBLIC_GA_ID: 'G-TEST123456',
            NODE_ENV: 'test'
        }

        // Mock document
        global.document = {
            title: 'Test Page'
        } as unknown as Document
    })

    afterEach(() => {
        global.window = originalWindow
        global.navigator = originalNavigator
        process.env = originalEnv
        vi.clearAllMocks()
    })

    describe('isGAEnabled', () => {
        it('should return true when GA is available', () => {
            expect(isGAEnabled()).toBe(true)
        })

        it('should return false when window is undefined', () => {
            // @ts-expect-error - Testing invalid state
            global.window = undefined
            expect(isGAEnabled()).toBe(false)
        })

        it('should return false when GA_ID is not set', () => {
            delete process.env.NEXT_PUBLIC_GA_ID
            expect(isGAEnabled()).toBe(false)
        })

        it('should return false when gtag is not available', () => {
            delete window.gtag
            expect(isGAEnabled()).toBe(false)
        })
    })

    describe('shouldTrack', () => {
        it('should return true when conditions are met', () => {
            vi.mocked(cookieConsent.canUseAnalytics).mockReturnValue(true)
            expect(shouldTrack()).toBe(true)
        })

        it('should return false when user has not consented to analytics', () => {
            vi.mocked(cookieConsent.canUseAnalytics).mockReturnValue(false)
            expect(shouldTrack()).toBe(false)
        })

        it('should return false when GA_ID is not set', () => {
            vi.mocked(cookieConsent.canUseAnalytics).mockReturnValue(true)
            delete process.env.NEXT_PUBLIC_GA_ID
            expect(shouldTrack()).toBe(false)
        })

        it('should return false when Do Not Track is enabled', () => {
            vi.mocked(cookieConsent.canUseAnalytics).mockReturnValue(true)
            // Mock navigator with DNT enabled
            Object.defineProperty(global, 'navigator', {
                value: {
                    doNotTrack: '1'
                },
                writable: true,
                configurable: true
            })

            expect(shouldTrack()).toBe(false)
        })

        it('should return false when window is undefined', () => {
            // @ts-expect-error - Testing invalid state
            global.window = undefined
            expect(shouldTrack()).toBe(false)
        })
    })

    describe('initGA', () => {
        it('should initialize GA with correct config', () => {
            const measurementId = 'G-TEST123456'

            // Delete existing gtag to test initialization
            delete window.gtag
            delete window.dataLayer

            initGA(measurementId)

            // Check that dataLayer and gtag are created
            expect(window.dataLayer).toBeDefined()
            expect(window.gtag).toBeDefined()
            expect(typeof window.gtag).toBe('function')

            // The dataLayer should contain the initialization calls
            expect(
                (window.dataLayer as unknown as Array<unknown>)?.length
            ).toBeGreaterThan(0)
        })

        it('should not throw when window is undefined', () => {
            // @ts-expect-error - Testing invalid state
            global.window = undefined
            expect(() => initGA('G-TEST')).not.toThrow()
        })

        it('should create dataLayer if it does not exist', () => {
            delete window.dataLayer
            initGA('G-TEST123456')
            expect(window.dataLayer).toBeDefined()
        })
    })

    describe('trackPageView', () => {
        it('should track page view with correct parameters', () => {
            vi.mocked(cookieConsent.canUseAnalytics).mockReturnValue(true)
            const url = '/test-page'
            const title = 'Test Page Title'

            trackPageView(url, title)

            expect(window.gtag).toHaveBeenCalledWith(
                'event',
                GA_EVENTS.PAGE_VIEW,
                {
                    page_title: title,
                    page_location: 'http://localhost:3000/test',
                    page_path: url
                }
            )
        })

        it('should use document title if no title provided', () => {
            vi.mocked(cookieConsent.canUseAnalytics).mockReturnValue(true)
            const url = '/test-page'
            trackPageView(url)

            expect(window.gtag).toHaveBeenCalledWith(
                'event',
                GA_EVENTS.PAGE_VIEW,
                expect.objectContaining({
                    page_title: 'Test Page'
                })
            )
        })

        it('should not track when shouldTrack returns false', () => {
            vi.mocked(cookieConsent.canUseAnalytics).mockReturnValue(true)
            delete process.env.NEXT_PUBLIC_GA_ID
            trackPageView('/test')
            expect(window.gtag).not.toHaveBeenCalled()
        })

        it('should not track when user has not consented', () => {
            vi.mocked(cookieConsent.canUseAnalytics).mockReturnValue(false)
            trackPageView('/test')
            expect(window.gtag).not.toHaveBeenCalled()
        })

        it('should handle errors gracefully', () => {
            vi.mocked(cookieConsent.canUseAnalytics).mockReturnValue(true)
            window.gtag = vi.fn(() => {
                throw new Error('GA Error')
            })

            // Should not throw
            expect(() => trackPageView('/test')).not.toThrow()
        })
    })

    describe('trackEvent', () => {
        it('should track event with parameters', () => {
            vi.mocked(cookieConsent.canUseAnalytics).mockReturnValue(true)
            const eventName = GA_EVENTS.BUTTON_CLICK
            const params = {
                click_text: 'Test Button',
                event_category: 'engagement'
            }

            trackEvent(eventName, params)

            expect(window.gtag).toHaveBeenCalledWith('event', eventName, params)
        })

        it('should track event without parameters', () => {
            vi.mocked(cookieConsent.canUseAnalytics).mockReturnValue(true)
            const eventName = GA_EVENTS.BUTTON_CLICK
            trackEvent(eventName)

            expect(window.gtag).toHaveBeenCalledWith(
                'event',
                eventName,
                undefined
            )
        })

        it('should not track when shouldTrack returns false', () => {
            vi.mocked(cookieConsent.canUseAnalytics).mockReturnValue(true)
            // Mock navigator with DNT enabled
            Object.defineProperty(global, 'navigator', {
                value: {
                    doNotTrack: '1'
                },
                writable: true,
                configurable: true
            })

            trackEvent(GA_EVENTS.BUTTON_CLICK)
            expect(window.gtag).not.toHaveBeenCalled()
        })

        it('should not track when user has not consented', () => {
            vi.mocked(cookieConsent.canUseAnalytics).mockReturnValue(false)
            trackEvent(GA_EVENTS.BUTTON_CLICK)
            expect(window.gtag).not.toHaveBeenCalled()
        })

        it('should handle errors gracefully', () => {
            vi.mocked(cookieConsent.canUseAnalytics).mockReturnValue(true)
            window.gtag = vi.fn(() => {
                throw new Error('GA Error')
            })

            expect(() => trackEvent(GA_EVENTS.BUTTON_CLICK)).not.toThrow()
        })
    })

    describe('trackError', () => {
        it('should track error with Error object', () => {
            const error = new Error('Test error')
            trackError(error, true)

            expect(window.gtag).toHaveBeenCalledWith(
                'event',
                GA_EVENTS.ERROR,
                expect.objectContaining({
                    error_message: 'Test error',
                    error_type: 'Error',
                    error_fatal: true,
                    event_category: 'error'
                })
            )
        })

        it('should track error with string message', () => {
            trackError('Test error string', false)

            expect(window.gtag).toHaveBeenCalledWith(
                'event',
                GA_EVENTS.ERROR,
                expect.objectContaining({
                    error_message: 'Test error string',
                    error_type: 'Error',
                    error_fatal: false,
                    event_category: 'error'
                })
            )
        })

        it('should default fatal to false', () => {
            trackError('Test error')

            expect(window.gtag).toHaveBeenCalledWith(
                'event',
                GA_EVENTS.ERROR,
                expect.objectContaining({
                    error_fatal: false
                })
            )
        })
    })

    describe('trackTiming', () => {
        it('should track timing with all parameters', () => {
            trackTiming('api_call', 1234, 'api')

            expect(window.gtag).toHaveBeenCalledWith(
                'event',
                GA_EVENTS.TIMING_COMPLETE,
                {
                    name: 'api_call',
                    value: 1234,
                    event_category: 'api'
                }
            )
        })

        it('should use default category when not provided', () => {
            trackTiming('page_load', 500)

            expect(window.gtag).toHaveBeenCalledWith(
                'event',
                GA_EVENTS.TIMING_COMPLETE,
                {
                    name: 'page_load',
                    value: 500,
                    event_category: 'performance'
                }
            )
        })
    })
})
