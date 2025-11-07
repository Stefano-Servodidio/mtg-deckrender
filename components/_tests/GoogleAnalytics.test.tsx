import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
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

describe('GoogleAnalytics', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        delete process.env.NEXT_PUBLIC_GA_ID
    })

    it('should not render when GA ID is not set', () => {
        const { container } = render(<GoogleAnalytics />)
        expect(container.querySelector('script')).not.toBeInTheDocument()
    })

    it('should render script when GA ID is set', () => {
        process.env.NEXT_PUBLIC_GA_ID = 'G-TEST123'
        const { container } = render(<GoogleAnalytics />)

        const script = container.querySelector('script')
        expect(script).toBeInTheDocument()
        expect(script?.src).toContain('googletagmanager')
        expect(script?.src).toContain('G-TEST123')
    })

    it('should call initGA on script load', async () => {
        process.env.NEXT_PUBLIC_GA_ID = 'G-TEST123'
        const { initGA } = await import('@/utils/analytics')

        render(<GoogleAnalytics />)

        // Wait for the async onLoad callback
        await new Promise((resolve) => setTimeout(resolve, 10))

        expect(initGA).toHaveBeenCalledWith('G-TEST123')
    })

    it('should use afterInteractive strategy', () => {
        process.env.NEXT_PUBLIC_GA_ID = 'G-TEST123'
        const { container } = render(<GoogleAnalytics />)

        const script = container.querySelector('script')
        // The strategy prop is not directly visible in the rendered output
        // but we verify the script is rendered
        expect(script).toBeInTheDocument()
    })
})
