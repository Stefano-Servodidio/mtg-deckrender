import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChakraProvider } from '@chakra-ui/react'
import { Footer } from '../Footer'

// Wrapper component to provide Chakra context
const ChakraWrapper = ({ children }: { children: React.ReactNode }) => (
    <ChakraProvider>{children}</ChakraProvider>
)

describe('Footer', () => {
    it('should render legal disclaimer', () => {
        render(
            <ChakraWrapper>
                <Footer />
            </ChakraWrapper>
        )

        expect(screen.getByText(/Legal Disclaimer:/)).toBeInTheDocument()
        expect(
            screen.getByText(
                /All Magic: The Gathering card images, names, and related intellectual property/
            )
        ).toBeInTheDocument()
    })

    it('should render Wizards of the Coast link', () => {
        render(
            <ChakraWrapper>
                <Footer />
            </ChakraWrapper>
        )

        const wizardsLink = screen.getByText('Wizards of the Coast LLC')
        expect(wizardsLink).toBeInTheDocument()
        expect(wizardsLink.closest('a')).toHaveAttribute(
            'href',
            'https://company.wizards.com/'
        )
    })

    it('should render copyright information', () => {
        render(
            <ChakraWrapper>
                <Footer />
            </ChakraWrapper>
        )

        expect(
            screen.getByText('© 2026 Stefano Servodidio')
        ).toBeInTheDocument()
        expect(
            screen.getByText('Made for the Magic: The Gathering community')
        ).toBeInTheDocument()
    })

    it('should render not affiliated disclaimer', () => {
        render(
            <ChakraWrapper>
                <Footer />
            </ChakraWrapper>
        )

        expect(
            screen.getByText(
                /This application is not affiliated with or endorsed by Wizards of the Coast LLC/
            )
        ).toBeInTheDocument()
    })

    it('should render "Report a bug" link with correct mailto', () => {
        render(
            <ChakraWrapper>
                <Footer />
            </ChakraWrapper>
        )

        const reportBugLink = screen.getByText('Report a bug')
        expect(reportBugLink).toBeInTheDocument()
        expect(reportBugLink.closest('a')).toHaveAttribute(
            'href',
            'mailto:info@mtgdeckrender.com?subject=MTG%20DeckRender%20bug%20report'
        )
    })

    it('should render "Buy me a coffee" link', () => {
        render(
            <ChakraWrapper>
                <Footer />
            </ChakraWrapper>
        )

        const kofiLink = screen.getByText(/Buy me a coffee/)
        expect(kofiLink).toBeInTheDocument()
        expect(kofiLink.closest('a')).toHaveAttribute(
            'href',
            'https://ko-fi.com/stefanoservodidio'
        )
    })
})
