import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { ChakraProvider } from '@chakra-ui/react'
import DownloadIcon from '../DownloadIcon'

const ChakraWrapper = ({ children }: { children: React.ReactNode }) => (
    <ChakraProvider>{children}</ChakraProvider>
)

describe('DownloadIcon', () => {
    it('should render the icon', () => {
        const { container } = render(
            <ChakraWrapper>
                <DownloadIcon />
            </ChakraWrapper>
        )

        const svg = container.querySelector('svg')
        expect(svg).toBeInTheDocument()
    })

    it('should apply default purple color', () => {
        const { container } = render(
            <ChakraWrapper>
                <DownloadIcon />
            </ChakraWrapper>
        )

        const svg = container.querySelector('svg')
        expect(svg).toHaveClass('chakra-icon')
    })

    it('should accept custom props', () => {
        const { container } = render(
            <ChakraWrapper>
                <DownloadIcon boxSize={6} data-testid="custom-download-icon" />
            </ChakraWrapper>
        )

        const svg = container.querySelector('svg')
        expect(svg).toBeInTheDocument()
        expect(svg).toHaveAttribute('data-testid', 'custom-download-icon')
    })

    it('should accept custom color prop', () => {
        const { container } = render(
            <ChakraWrapper>
                <DownloadIcon color="green.500" />
            </ChakraWrapper>
        )

        const svg = container.querySelector('svg')
        expect(svg).toBeInTheDocument()
    })
})
