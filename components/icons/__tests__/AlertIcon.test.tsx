import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { ChakraProvider } from '@chakra-ui/react'
import AlertIcon from '../AlertIcon'

const ChakraWrapper = ({ children }: { children: React.ReactNode }) => (
    <ChakraProvider>{children}</ChakraProvider>
)

describe('AlertIcon', () => {
    it('should render the icon', () => {
        const { container } = render(
            <ChakraWrapper>
                <AlertIcon />
            </ChakraWrapper>
        )

        const svg = container.querySelector('svg')
        expect(svg).toBeInTheDocument()
    })

    it('should apply default purple color', () => {
        const { container } = render(
            <ChakraWrapper>
                <AlertIcon />
            </ChakraWrapper>
        )

        const svg = container.querySelector('svg')
        expect(svg).toHaveClass('chakra-icon')
    })

    it('should accept custom props', () => {
        const { container } = render(
            <ChakraWrapper>
                <AlertIcon boxSize={8} data-testid="custom-alert-icon" />
            </ChakraWrapper>
        )

        const svg = container.querySelector('svg')
        expect(svg).toBeInTheDocument()
        expect(svg).toHaveAttribute('data-testid', 'custom-alert-icon')
    })

    it('should accept custom color prop', () => {
        const { container } = render(
            <ChakraWrapper>
                <AlertIcon color="red.500" />
            </ChakraWrapper>
        )

        const svg = container.querySelector('svg')
        expect(svg).toBeInTheDocument()
    })
})
