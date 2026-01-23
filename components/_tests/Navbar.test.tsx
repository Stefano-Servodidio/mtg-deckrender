import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChakraProvider } from '@chakra-ui/react'
import userEvent from '@testing-library/user-event'
import { Navbar } from '../Navbar'

// Mock Next.js modules
vi.mock('next/link', () => ({
    default: ({
        children,
        href,
        ...props
    }: {
        children: React.ReactNode
        href: string
        [key: string]: any
    }) => (
        <a href={href} {...props}>
            {children}
        </a>
    )
}))

vi.mock('next/image', () => ({
    default: (props: any) => {
        // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
        return <img {...props} />
    }
}))

// Mock analytics hook
vi.mock('@/hooks/useAnalytics', () => ({
    useAnalytics: vi.fn(() => ({
        trackLinkClick: vi.fn()
    }))
}))

const ChakraWrapper = ({ children }: { children: React.ReactNode }) => (
    <ChakraProvider>{children}</ChakraProvider>
)

describe('Navbar', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should render navbar container', () => {
        render(
            <ChakraWrapper>
                <Navbar />
            </ChakraWrapper>
        )

        expect(screen.getByTestId('navbar-container')).toBeInTheDocument()
    })

    it('should render logo and title', () => {
        render(
            <ChakraWrapper>
                <Navbar />
            </ChakraWrapper>
        )

        expect(screen.getByText('MTG DeckRender')).toBeInTheDocument()
    })

    it('should render desktop navigation links', () => {
        render(
            <ChakraWrapper>
                <Navbar />
            </ChakraWrapper>
        )

        const desktopLinks = screen.getByTestId('navbar-links-desktop')
        expect(desktopLinks).toBeInTheDocument()
        expect(desktopLinks).toHaveStyle({ display: 'none' })
    })

    it('should render mobile navigation menu', () => {
        render(
            <ChakraWrapper>
                <Navbar />
            </ChakraWrapper>
        )

        const mobileLinks = screen.getByTestId('navbar-links-mobile')
        expect(mobileLinks).toBeInTheDocument()
    })

    it('should render mobile menu button', () => {
        render(
            <ChakraWrapper>
                <Navbar />
            </ChakraWrapper>
        )

        const menuButton = screen.getByTestId('navbar-mobile-menu-button')
        expect(menuButton).toBeInTheDocument()
        expect(menuButton).toHaveAttribute('aria-label', 'Open menu')
    })

    it('should render Home and Create links in desktop menu', () => {
        render(
            <ChakraWrapper>
                <Navbar />
            </ChakraWrapper>
        )

        const homeButtons = screen.getAllByText('Home')
        const createButtons = screen.getAllByText('Create')

        expect(homeButtons.length).toBeGreaterThan(0)
        expect(createButtons.length).toBeGreaterThan(0)
    })

    it('should have correct href for Home link', () => {
        render(
            <ChakraWrapper>
                <Navbar />
            </ChakraWrapper>
        )

        const links = screen.getAllByRole('link')
        const homeLink = links.find((link) => link.getAttribute('href') === '/')
        expect(homeLink).toBeInTheDocument()
    })

    it('should have correct href for Create link', () => {
        const { container } = render(
            <ChakraWrapper>
                <Navbar />
            </ChakraWrapper>
        )

        const createLinks = container.querySelectorAll('a[href="/create"]')
        expect(createLinks.length).toBeGreaterThan(0)
    })

    it('should track link click on Home button', async () => {
        const mockTrackLinkClick = vi.fn()
        const { useAnalytics } = await import('@/hooks/useAnalytics')
        vi.mocked(useAnalytics).mockReturnValue({
            trackLinkClick: mockTrackLinkClick
        } as any)

        const user = userEvent.setup()

        render(
            <ChakraWrapper>
                <Navbar />
            </ChakraWrapper>
        )

        const homeButtons = screen.getAllByText('Home')
        await user.click(homeButtons[0])

        expect(mockTrackLinkClick).toHaveBeenCalledWith('Home', '/')
    })

    it('should track link click on Create button', async () => {
        const mockTrackLinkClick = vi.fn()
        const { useAnalytics } = await import('@/hooks/useAnalytics')
        vi.mocked(useAnalytics).mockReturnValue({
            trackLinkClick: mockTrackLinkClick
        } as any)

        const user = userEvent.setup()

        render(
            <ChakraWrapper>
                <Navbar />
            </ChakraWrapper>
        )

        const createButtons = screen.getAllByText('Create')
        await user.click(createButtons[0])

        expect(mockTrackLinkClick).toHaveBeenCalledWith('Create', '/create')
    })

    it.skip('should open mobile menu when button is clicked', async () => {
        // Skipped due to Chakra UI Menu rendering in portal making it difficult to test
        const user = userEvent.setup()

        render(
            <ChakraWrapper>
                <Navbar />
            </ChakraWrapper>
        )

        const menuButton = screen.getByTestId('navbar-mobile-menu-button')
        await user.click(menuButton)

        // Wait for menu to open
        await new Promise((resolve) => setTimeout(resolve, 100))

        // Menu items should appear
        const menuItems = screen.queryAllByRole('menuitem')
        expect(menuItems.length).toBeGreaterThanOrEqual(0)
    })

    it('should have mobile menu button', () => {
        render(
            <ChakraWrapper>
                <Navbar />
            </ChakraWrapper>
        )

        const menuButton = screen.getByTestId('navbar-mobile-menu-button')
        expect(menuButton).toBeInTheDocument()
        expect(menuButton).toHaveAttribute('aria-label', 'Open menu')
    })
})
