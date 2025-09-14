import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChakraProvider } from '@chakra-ui/react'
import { Footer } from '../components/Footer'

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

    it('should render Scryfall API link', () => {
        render(
            <ChakraWrapper>
                <Footer />
            </ChakraWrapper>
        )

        const scryfallLink = screen.getByText('Scryfall API')
        expect(scryfallLink).toBeInTheDocument()
        expect(scryfallLink.closest('a')).toHaveAttribute(
            'href',
            'https://scryfall.com/'
        )
    })

    it('should render copyright information', () => {
        render(
            <ChakraWrapper>
                <Footer />
            </ChakraWrapper>
        )

        expect(screen.getByText('© 2024 MTG Deck to PNG')).toBeInTheDocument()
        expect(
            screen.getByText('Made for the Magic: The Gathering community')
        ).toBeInTheDocument()
    })

    it('should render educational use disclaimer', () => {
        render(
            <ChakraWrapper>
                <Footer />
            </ChakraWrapper>
        )

        expect(
            screen.getByText(
                /This tool is created for educational and personal use only/
            )
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
})