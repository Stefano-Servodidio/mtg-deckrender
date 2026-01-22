import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { CookieBanner } from '../CookieBanner'
import * as cookieConsent from '@/utils/cookieConsent'

// Mock the cookieConsent module
vi.mock('@/utils/cookieConsent', async () => {
    const actual = await vi.importActual('@/utils/cookieConsent')
    return {
        ...actual,
        shouldShowConsentBanner: vi.fn(),
        acceptAllCookies: vi.fn(),
        rejectAllCookies: vi.fn(),
        saveConsentPreferences: vi.fn(),
        getConsentPreferences: vi.fn()
    }
})

describe('CookieBanner', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should not render when consent is already given', async () => {
        vi.mocked(cookieConsent.shouldShowConsentBanner).mockReturnValue(false)

        const { container } = render(<CookieBanner />)

        await waitFor(() => {
            expect(container.firstChild).toBeNull()
        })
    })

    it('should render when consent is not given', async () => {
        vi.mocked(cookieConsent.shouldShowConsentBanner).mockReturnValue(true)
        vi.mocked(cookieConsent.getConsentPreferences).mockReturnValue(null)

        render(<CookieBanner />)

        await waitFor(() => {
            expect(
                screen.getByText('This website uses cookies')
            ).toBeInTheDocument()
        })
    })

    it('should have Accept All button', async () => {
        vi.mocked(cookieConsent.shouldShowConsentBanner).mockReturnValue(true)
        vi.mocked(cookieConsent.getConsentPreferences).mockReturnValue(null)

        render(<CookieBanner />)

        await waitFor(() => {
            expect(screen.getByText('Accept All')).toBeInTheDocument()
        })
    })

    it('should have Reject All button', async () => {
        vi.mocked(cookieConsent.shouldShowConsentBanner).mockReturnValue(true)
        vi.mocked(cookieConsent.getConsentPreferences).mockReturnValue(null)

        render(<CookieBanner />)

        await waitFor(() => {
            expect(screen.getByText('Reject All')).toBeInTheDocument()
        })
    })

    it('should have Settings button', async () => {
        vi.mocked(cookieConsent.shouldShowConsentBanner).mockReturnValue(true)
        vi.mocked(cookieConsent.getConsentPreferences).mockReturnValue(null)

        render(<CookieBanner />)

        await waitFor(() => {
            expect(screen.getByText('Settings')).toBeInTheDocument()
        })
    })

    it('should call acceptAllCookies when Accept All is clicked', async () => {
        vi.mocked(cookieConsent.shouldShowConsentBanner).mockReturnValue(true)
        vi.mocked(cookieConsent.getConsentPreferences).mockReturnValue(null)

        render(<CookieBanner />)

        await waitFor(() => {
            const acceptButton = screen.getByText('Accept All')
            fireEvent.click(acceptButton)
        })

        expect(cookieConsent.acceptAllCookies).toHaveBeenCalled()
    })

    it('should call rejectAllCookies when Reject All is clicked', async () => {
        vi.mocked(cookieConsent.shouldShowConsentBanner).mockReturnValue(true)
        vi.mocked(cookieConsent.getConsentPreferences).mockReturnValue(null)

        render(<CookieBanner />)

        await waitFor(() => {
            const rejectButton = screen.getByText('Reject All')
            fireEvent.click(rejectButton)
        })

        expect(cookieConsent.rejectAllCookies).toHaveBeenCalled()
    })

    it('should show settings when Settings button is clicked', async () => {
        vi.mocked(cookieConsent.shouldShowConsentBanner).mockReturnValue(true)
        vi.mocked(cookieConsent.getConsentPreferences).mockReturnValue(null)

        render(<CookieBanner />)

        await waitFor(() => {
            const settingsButton = screen.getByText('Settings')
            fireEvent.click(settingsButton)
        })

        await waitFor(() => {
            expect(screen.getByText('Cookie Preferences')).toBeInTheDocument()
        })
    })

    it('should display cookie categories in settings', async () => {
        vi.mocked(cookieConsent.shouldShowConsentBanner).mockReturnValue(true)
        vi.mocked(cookieConsent.getConsentPreferences).mockReturnValue(null)

        render(<CookieBanner />)

        await waitFor(() => {
            const settingsButton = screen.getByText('Settings')
            fireEvent.click(settingsButton)
        })

        await waitFor(() => {
            expect(screen.getByText('Necessary Cookies')).toBeInTheDocument()
            expect(screen.getByText('Analytics Cookies')).toBeInTheDocument()
            expect(screen.getByText('Marketing Cookies')).toBeInTheDocument()
        })
    })

    it('should have necessary cookies switch disabled', async () => {
        vi.mocked(cookieConsent.shouldShowConsentBanner).mockReturnValue(true)
        vi.mocked(cookieConsent.getConsentPreferences).mockReturnValue(null)

        render(<CookieBanner />)

        await waitFor(() => {
            const settingsButton = screen.getByText('Settings')
            fireEvent.click(settingsButton)
        })

        await waitFor(() => {
            const necessarySwitch = screen.getByRole('checkbox', {
                name: /necessary cookies/i
            })
            expect(necessarySwitch).toBeDisabled()
            expect(necessarySwitch).toBeChecked()
        })
    })

    it('should call saveConsentPreferences when Save Preferences is clicked', async () => {
        vi.mocked(cookieConsent.shouldShowConsentBanner).mockReturnValue(true)
        vi.mocked(cookieConsent.getConsentPreferences).mockReturnValue(null)

        render(<CookieBanner />)

        await waitFor(() => {
            const settingsButton = screen.getByText('Settings')
            fireEvent.click(settingsButton)
        })

        await waitFor(() => {
            const saveButton = screen.getByText('Save Preferences')
            fireEvent.click(saveButton)
        })

        expect(cookieConsent.saveConsentPreferences).toHaveBeenCalled()
    })

    it('should hide banner after accepting', async () => {
        vi.mocked(cookieConsent.shouldShowConsentBanner).mockReturnValue(true)
        vi.mocked(cookieConsent.getConsentPreferences).mockReturnValue(null)

        const { container } = render(<CookieBanner />)

        await waitFor(() => {
            const acceptButton = screen.getByText('Accept All')
            fireEvent.click(acceptButton)
        })

        await waitFor(() => {
            expect(container.firstChild).toBeNull()
        })
    })

    it('should hide banner after rejecting', async () => {
        vi.mocked(cookieConsent.shouldShowConsentBanner).mockReturnValue(true)
        vi.mocked(cookieConsent.getConsentPreferences).mockReturnValue(null)

        const { container } = render(<CookieBanner />)

        await waitFor(() => {
            const rejectButton = screen.getByText('Reject All')
            fireEvent.click(rejectButton)
        })

        await waitFor(() => {
            expect(container.firstChild).toBeNull()
        })
    })

    it('should load existing preferences', async () => {
        vi.mocked(cookieConsent.shouldShowConsentBanner).mockReturnValue(true)
        vi.mocked(cookieConsent.getConsentPreferences).mockReturnValue({
            necessary: true,
            analytics: true,
            marketing: false,
            timestamp: Date.now()
        })

        render(<CookieBanner />)

        await waitFor(() => {
            const settingsButton = screen.getByText('Settings')
            fireEvent.click(settingsButton)
        })

        await waitFor(() => {
            const analyticsSwitch = screen.getByRole('checkbox', {
                name: /analytics cookies/i
            })
            const marketingSwitch = screen.getByRole('checkbox', {
                name: /marketing cookies/i
            })

            expect(analyticsSwitch).toBeChecked()
            expect(marketingSwitch).not.toBeChecked()
        })
    })
})
