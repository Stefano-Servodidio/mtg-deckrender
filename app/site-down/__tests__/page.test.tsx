import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChakraProvider } from '@chakra-ui/react'
import SiteDown from '../page'

// Wrapper component to provide Chakra context
const ChakraWrapper = ({ children }: { children: React.ReactNode }) => (
    <ChakraProvider>{children}</ChakraProvider>
)

describe('SiteDown', () => {
    it('should render maintenance heading', () => {
        render(
            <ChakraWrapper>
                <SiteDown />
            </ChakraWrapper>
        )

        expect(screen.getByText('Site Under Maintenance')).toBeInTheDocument()
    })

    it('should render maintenance message', () => {
        render(
            <ChakraWrapper>
                <SiteDown />
            </ChakraWrapper>
        )

        expect(
            screen.getByText(
                'The site is currently under maintenance. Please check back later.'
            )
        ).toBeInTheDocument()
    })

    it('should render apology message', () => {
        render(
            <ChakraWrapper>
                <SiteDown />
            </ChakraWrapper>
        )

        expect(
            screen.getByText('We apologize for any inconvenience.')
        ).toBeInTheDocument()
    })

    it('should render wrench icon', () => {
        const { container } = render(
            <ChakraWrapper>
                <SiteDown />
            </ChakraWrapper>
        )

        // Check if svg icon is rendered
        const svgElement = container.querySelector('svg')
        expect(svgElement).toBeInTheDocument()
    })

    it('should have proper layout structure', () => {
        const { container } = render(
            <ChakraWrapper>
                <SiteDown />
            </ChakraWrapper>
        )

        // Check for container structure
        expect(
            container.querySelector('[class*="chakra-container"]')
        ).toBeInTheDocument()
    })

    it('should center content vertically and horizontally', () => {
        const { container } = render(
            <ChakraWrapper>
                <SiteDown />
            </ChakraWrapper>
        )

        // The outer Box should have flex properties for centering
        const outerBox = container.firstChild
        expect(outerBox).toBeInTheDocument()
    })

    it('should display all text content in correct order', () => {
        render(
            <ChakraWrapper>
                <SiteDown />
            </ChakraWrapper>
        )

        const heading = screen.getByText('Site Under Maintenance')
        const message = screen.getByText(
            'The site is currently under maintenance. Please check back later.'
        )
        const apology = screen.getByText('We apologize for any inconvenience.')

        // Verify all elements exist
        expect(heading).toBeInTheDocument()
        expect(message).toBeInTheDocument()
        expect(apology).toBeInTheDocument()
    })

    it('should render with correct semantic structure', () => {
        const { container } = render(
            <ChakraWrapper>
                <SiteDown />
            </ChakraWrapper>
        )

        // Check for heading element
        const heading = container.querySelector('h2')
        expect(heading).toBeInTheDocument()
        expect(heading?.textContent).toBe('Site Under Maintenance')
    })
})
