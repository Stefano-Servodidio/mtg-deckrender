import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { scrollToAccordionButton } from './scrollToAccordionButton'

describe('scrollToAccordionButton', () => {
    let mockButton: HTMLButtonElement
    let mockNavbar: HTMLElement
    let mockScrollTo: ReturnType<typeof vi.fn>
    let mockGetBoundingClientRect: ReturnType<typeof vi.fn>

    beforeEach(() => {
        vi.useFakeTimers()

        // Create mock elements
        mockButton = document.createElement('button')
        mockNavbar = document.createElement('nav')
        mockNavbar.setAttribute('data-testid', 'navbar-container')

        // Mock getBoundingClientRect
        mockGetBoundingClientRect = vi.fn().mockReturnValue({
            top: 500
        })
        mockButton.getBoundingClientRect = mockGetBoundingClientRect

        // Mock navbar clientHeight
        Object.defineProperty(mockNavbar, 'clientHeight', {
            value: 80,
            writable: true,
            configurable: true
        })

        // Mock window.scrollTo
        mockScrollTo = vi.fn()
        window.scrollTo = mockScrollTo

        // Mock window.scrollY
        Object.defineProperty(window, 'scrollY', {
            value: 100,
            writable: true,
            configurable: true
        })

        // Mock querySelector for navbar
        vi.spyOn(document, 'querySelector').mockImplementation((selector) => {
            if (selector === '[data-testid="navbar-container"]') {
                return mockNavbar
            }
            return null
        })
    })

    afterEach(() => {
        vi.restoreAllMocks()
        vi.useRealTimers()
    })

    it('should scroll to the accordion button with correct offset after delay', () => {
        scrollToAccordionButton(mockButton)

        // Should not call scrollTo immediately
        expect(mockScrollTo).not.toHaveBeenCalled()

        // Fast-forward time by 150ms
        vi.advanceTimersByTime(150)

        // Should query for navbar
        expect(document.querySelector).toHaveBeenCalledWith(
            '[data-testid="navbar-container"]'
        )

        // Should calculate position correctly
        // elementPosition (500) + scrollY (100) - navbarHeight (80) - padding (20) = 500
        expect(mockScrollTo).toHaveBeenCalledWith({
            top: 500,
            behavior: 'smooth'
        })
    })

    it('should use default navbar height if navbar is not found', () => {
        vi.spyOn(document, 'querySelector').mockReturnValue(null)

        scrollToAccordionButton(mockButton)
        vi.advanceTimersByTime(150)

        // Should calculate with default navbar height of 80
        // elementPosition (500) + scrollY (100) - navbarHeight (80) - padding (20) = 500
        expect(mockScrollTo).toHaveBeenCalledWith({
            top: 500,
            behavior: 'smooth'
        })
    })

    it('should prevent negative scroll values', () => {
        // Set up scenario where calculated position would be negative
        mockGetBoundingClientRect.mockReturnValue({ top: 10 })
        Object.defineProperty(window, 'scrollY', {
            value: 0,
            writable: true,
            configurable: true
        })

        scrollToAccordionButton(mockButton)
        vi.advanceTimersByTime(150)

        // elementPosition (10) + scrollY (0) - navbarHeight (80) - padding (20) = -90
        // Should be clamped to 0
        expect(mockScrollTo).toHaveBeenCalledWith({
            top: 0,
            behavior: 'smooth'
        })
    })

    it('should not throw if button is null', () => {
        expect(() => scrollToAccordionButton(null)).not.toThrow()
        vi.advanceTimersByTime(150)
        expect(mockScrollTo).not.toHaveBeenCalled()
    })

    it('should not scroll if element is null after timeout', () => {
        scrollToAccordionButton(null)
        vi.advanceTimersByTime(150)
        expect(mockScrollTo).not.toHaveBeenCalled()
    })
})
