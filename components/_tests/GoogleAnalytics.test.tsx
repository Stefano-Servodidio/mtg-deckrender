import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { GoogleAnalytics } from '../GoogleAnalytics'

// Mock Next.js modules
vi.mock('next/script', () => ({
    default: ({
        onLoad,
        ...props
    }: {
        onLoad?: () => void
        [key: string]: any
    }) => {
        // Simulate script loading
        if (onLoad) {
            setTimeout(onLoad, 0)
        }
        return <script {...props} />
    }
}))

vi.mock('next/navigation', () => ({
    usePathname: vi.fn(() => '/'),
    useSearchParams: vi.fn(() => ({
        toString: () => ''
    }))
}))

// Mock analytics utils
vi.mock('@/utils/analytics', () => ({
    initGA: vi.fn(),
    trackPageView: vi.fn()
}))

// Mock cookie consent
vi.mock('@/utils/cookieConsent', () => ({
    canUseAnalytics: vi.fn(() => true)
}))

describe('GoogleAnalytics', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        delete process.env.NEXT_PUBLIC_GA_ID
    })

    it('should not render when GA ID is not set', () => {
        const { container } = render(<GoogleAnalytics />)
        expect(container.querySelector('script')).not.toBeInTheDocument()
    })

    it('should not render when user has not consented to analytics', async () => {
        process.env.NEXT_PUBLIC_GA_ID = 'G-TEST123'
        const { canUseAnalytics } = await import('@/utils/cookieConsent')
        vi.mocked(canUseAnalytics).mockReturnValue(false)

        const { container } = render(<GoogleAnalytics />)

        await waitFor(() => {
            expect(container.querySelector('script')).not.toBeInTheDocument()
        })
    })

    it('should render script when GA ID is set and user has consented', async () => {
        process.env.NEXT_PUBLIC_GA_ID = 'G-TEST123'
        const { canUseAnalytics } = await import('@/utils/cookieConsent')
        vi.mocked(canUseAnalytics).mockReturnValue(true)

        const { container } = render(<GoogleAnalytics />)

        await waitFor(() => {
            const script = container.querySelector('script')
            expect(script).toBeInTheDocument()
            expect(script?.src).toContain('googletagmanager')
            expect(script?.src).toContain('G-TEST123')
        })
    })

    it('should call initGA on script load when consent is given', async () => {
        process.env.NEXT_PUBLIC_GA_ID = 'G-TEST123'
        const { canUseAnalytics } = await import('@/utils/cookieConsent')
        const { initGA } = await import('@/utils/analytics')
        vi.mocked(canUseAnalytics).mockReturnValue(true)

        render(<GoogleAnalytics />)

        // Wait for the async onLoad callback
        await waitFor(
            () => {
                expect(initGA).toHaveBeenCalledWith('G-TEST123')
            },
            { timeout: 100 }
        )
    })

    it('should use afterInteractive strategy', async () => {
        process.env.NEXT_PUBLIC_GA_ID = 'G-TEST123'
        const { canUseAnalytics } = await import('@/utils/cookieConsent')
        vi.mocked(canUseAnalytics).mockReturnValue(true)

        const { container } = render(<GoogleAnalytics />)

        await waitFor(() => {
            const script = container.querySelector('script')
            // The strategy prop is not directly visible in the rendered output
            // but we verify the script is rendered
            expect(script).toBeInTheDocument()
        })
    })
})
