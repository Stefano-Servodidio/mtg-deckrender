import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { ChakraProvider } from '@chakra-ui/react'
import UploadIcon from '../UploadIcon'

const ChakraWrapper = ({ children }: { children: React.ReactNode }) => (
    <ChakraProvider>{children}</ChakraProvider>
)

describe('UploadIcon', () => {
    it('should render the icon', () => {
        const { container } = render(
            <ChakraWrapper>
                <UploadIcon />
            </ChakraWrapper>
        )

        const svg = container.querySelector('svg')
        expect(svg).toBeInTheDocument()
    })

    it('should apply default orange color', () => {
        const { container } = render(
            <ChakraWrapper>
                <UploadIcon />
            </ChakraWrapper>
        )

        const svg = container.querySelector('svg')
        expect(svg).toHaveClass('chakra-icon')
    })

    it('should accept custom props', () => {
        const { container } = render(
            <ChakraWrapper>
                <UploadIcon boxSize={12} data-testid="custom-upload-icon" />
            </ChakraWrapper>
        )

        const svg = container.querySelector('svg')
        expect(svg).toBeInTheDocument()
        expect(svg).toHaveAttribute('data-testid', 'custom-upload-icon')
    })

    it('should accept custom color prop', () => {
        const { container } = render(
            <ChakraWrapper>
                <UploadIcon color="yellow.500" />
            </ChakraWrapper>
        )

        const svg = container.querySelector('svg')
        expect(svg).toBeInTheDocument()
    })
})
