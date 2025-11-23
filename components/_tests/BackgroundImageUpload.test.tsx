import { render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { BackgroundImageUpload } from '../BackgroundImageUpload'
import { ChakraProvider } from '@chakra-ui/react'

// Wrapper for Chakra UI
const ChakraWrapper = ({ children }: { children: React.ReactNode }) => (
    <ChakraProvider>{children}</ChakraProvider>
)

describe('BackgroundImageUpload', () => {
    test('should render upload zone initially', () => {
        const mockOnImageUpload = vi.fn()

        render(
            <ChakraWrapper>
                <BackgroundImageUpload onImageUpload={mockOnImageUpload} />
            </ChakraWrapper>
        )

        expect(screen.getByText('Upload background image')).toBeInTheDocument()
        expect(
            screen.getByText('PNG, JPEG, WebP (max 1MB)')
        ).toBeInTheDocument()
    })

    test('should render with custom max size', () => {
        const mockOnImageUpload = vi.fn()

        render(
            <ChakraWrapper>
                <BackgroundImageUpload
                    onImageUpload={mockOnImageUpload}
                    maxSizeBytes={512 * 1024}
                />
            </ChakraWrapper>
        )

        expect(screen.getByText('Upload background image')).toBeInTheDocument()
    })

    test('should have correct file input attributes', () => {
        const mockOnImageUpload = vi.fn()

        render(
            <ChakraWrapper>
                <BackgroundImageUpload onImageUpload={mockOnImageUpload} />
            </ChakraWrapper>
        )

        const input = document.querySelector('input[type="file"]')
        expect(input).toBeInTheDocument()
        expect(input).toHaveAttribute('accept')
    })

    test('should render with custom color scheme', () => {
        const mockOnImageUpload = vi.fn()

        const { container } = render(
            <ChakraWrapper>
                <BackgroundImageUpload
                    onImageUpload={mockOnImageUpload}
                    colorScheme="purple"
                />
            </ChakraWrapper>
        )

        expect(container.firstChild).toBeInTheDocument()
    })
})
