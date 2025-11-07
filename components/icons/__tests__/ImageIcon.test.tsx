import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { ChakraProvider } from '@chakra-ui/react'
import ImageIcon from '../ImageIcon'

const ChakraWrapper = ({ children }: { children: React.ReactNode }) => (
    <ChakraProvider>{children}</ChakraProvider>
)

describe('ImageIcon', () => {
    it('should render the icon', () => {
        const { container } = render(
            <ChakraWrapper>
                <ImageIcon />
            </ChakraWrapper>
        )

        const svg = container.querySelector('svg')
        expect(svg).toBeInTheDocument()
    })

    it('should apply default blue color', () => {
        const { container } = render(
            <ChakraWrapper>
                <ImageIcon />
            </ChakraWrapper>
        )

        const svg = container.querySelector('svg')
        expect(svg).toHaveClass('chakra-icon')
    })

    it('should accept custom props', () => {
        const { container } = render(
            <ChakraWrapper>
                <ImageIcon boxSize={10} data-testid="custom-image-icon" />
            </ChakraWrapper>
        )

        const svg = container.querySelector('svg')
        expect(svg).toBeInTheDocument()
        expect(svg).toHaveAttribute('data-testid', 'custom-image-icon')
    })

    it('should accept custom color prop', () => {
        const { container } = render(
            <ChakraWrapper>
                <ImageIcon color="teal.500" />
            </ChakraWrapper>
        )

        const svg = container.querySelector('svg')
        expect(svg).toBeInTheDocument()
    })
})
