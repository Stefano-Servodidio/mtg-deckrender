import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChakraProvider } from '@chakra-ui/react'
import userEvent from '@testing-library/user-event'
import DownloadSection from '../DownloadSection'

// Mock Next.js Image component
vi.mock('next/image', () => ({
    default: (props: any) => {
        // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
        return <img {...props} />
    }
}))

// Mock analytics hook
vi.mock('@/hooks/useAnalytics', () => ({
    useAnalytics: vi.fn(() => ({
        trackImageDownload: vi.fn()
    }))
}))

const ChakraWrapper = ({ children }: { children: React.ReactNode }) => (
    <ChakraProvider>{children}</ChakraProvider>
)

describe('DownloadSection', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should show placeholder message when no image is generated', () => {
        render(
            <ChakraWrapper>
                <DownloadSection generatedImage={null} />
            </ChakraWrapper>
        )

        expect(
            screen.getByText('Generate your deck image first to download it.')
        ).toBeInTheDocument()
    })

    it('should not show download button when no image', () => {
        render(
            <ChakraWrapper>
                <DownloadSection generatedImage={null} />
            </ChakraWrapper>
        )

        expect(screen.queryByTestId('download-button')).not.toBeInTheDocument()
    })

    it('should show success message when image is generated', () => {
        render(
            <ChakraWrapper>
                <DownloadSection generatedImage="blob:test-image" />
            </ChakraWrapper>
        )

        expect(
            screen.getByText('Your deck image has been generated successfully!')
        ).toBeInTheDocument()
    })

    it('should render generated image', () => {
        const { container } = render(
            <ChakraWrapper>
                <DownloadSection generatedImage="blob:test-image" />
            </ChakraWrapper>
        )

        const image = container.querySelector('img[alt="Generated deck image"]')
        expect(image).toBeInTheDocument()
        expect(image).toHaveAttribute('src', 'blob:test-image')
    })

    it('should render download button when image exists', () => {
        render(
            <ChakraWrapper>
                <DownloadSection generatedImage="blob:test-image" />
            </ChakraWrapper>
        )

        const button = screen.getByTestId('download-button')
        expect(button).toBeInTheDocument()
        expect(screen.getByText('Download PNG')).toBeInTheDocument()
    })

    it('should have correct download attributes', () => {
        render(
            <ChakraWrapper>
                <DownloadSection generatedImage="blob:test-image" />
            </ChakraWrapper>
        )

        const button = screen.getByTestId('download-button')
        expect(button).toHaveAttribute('href', 'blob:test-image')
        expect(button).toHaveAttribute('download')
        expect(button.getAttribute('download')).toMatch(/^mtg-deck-\d+\.png$/)
    })

    it('should track download when button is clicked', async () => {
        const mockTrackImageDownload = vi.fn()
        const { useAnalytics } = await import('@/hooks/useAnalytics')
        vi.mocked(useAnalytics).mockReturnValue({
            trackImageDownload: mockTrackImageDownload
        } as any)

        const user = userEvent.setup()

        render(
            <ChakraWrapper>
                <DownloadSection
                    generatedImage="blob:test-image"
                    cardCount={60}
                />
            </ChakraWrapper>
        )

        const button = screen.getByTestId('download-button')
        await user.click(button)

        expect(mockTrackImageDownload).toHaveBeenCalledWith('png', 60)
    })

    it('should track download with default card count of 0', async () => {
        const mockTrackImageDownload = vi.fn()
        const { useAnalytics } = await import('@/hooks/useAnalytics')
        vi.mocked(useAnalytics).mockReturnValue({
            trackImageDownload: mockTrackImageDownload
        } as any)

        const user = userEvent.setup()

        render(
            <ChakraWrapper>
                <DownloadSection generatedImage="blob:test-image" />
            </ChakraWrapper>
        )

        const button = screen.getByTestId('download-button')
        await user.click(button)

        expect(mockTrackImageDownload).toHaveBeenCalledWith('png', 0)
    })

    it('should render image container', () => {
        const { container } = render(
            <ChakraWrapper>
                <DownloadSection generatedImage="blob:test-image" />
            </ChakraWrapper>
        )

        // Check for the image element
        const image = container.querySelector('img')
        expect(image).toBeInTheDocument()
    })
})
