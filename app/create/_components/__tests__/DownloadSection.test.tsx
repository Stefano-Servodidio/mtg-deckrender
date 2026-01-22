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

// Mock react-device-detect
vi.mock('react-device-detect', () => ({
    isIOS: false,
    isSafari: false
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
        expect(screen.getByText('Download Image')).toBeInTheDocument()
    })

    it('should not have href or download attributes (programmatic download)', () => {
        render(
            <ChakraWrapper>
                <DownloadSection generatedImage="blob:test-image" />
            </ChakraWrapper>
        )

        const button = screen.getByTestId('download-button')
        expect(button).not.toHaveAttribute('href')
        expect(button).not.toHaveAttribute('download')
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

    it('should trigger programmatic download when button is clicked', async () => {
        // Mock fetch
        const mockBlob = new Blob(['test'], { type: 'image/png' })
        global.fetch = vi.fn().mockResolvedValue({
            blob: vi.fn().mockResolvedValue(mockBlob)
        })

        // Mock FileReader
        const mockFileReader = {
            readAsDataURL: vi.fn(),
            onloadend: null as any,
            result: 'data:image/png;base64,test'
        }
        global.FileReader = vi.fn(() => mockFileReader) as any

        // Create a real link element and spy on its methods
        const originalCreateElement = document.createElement.bind(document)
        const clickSpy = vi.fn()
        const createElementSpy = vi
            .spyOn(document, 'createElement')
            .mockImplementation((tagName: string) => {
                const element = originalCreateElement(tagName)
                if (tagName === 'a') {
                    element.click = clickSpy
                }
                return element
            })

        const user = userEvent.setup()

        render(
            <ChakraWrapper>
                <DownloadSection generatedImage="blob:test-image" />
            </ChakraWrapper>
        )

        const button = screen.getByTestId('download-button')
        await user.click(button)

        // Wait for async operations
        await new Promise((resolve) => setTimeout(resolve, 0))

        // Verify fetch was called
        expect(global.fetch).toHaveBeenCalledWith('blob:test-image')

        // Verify FileReader was created and readAsDataURL was called
        expect(mockFileReader.readAsDataURL).toHaveBeenCalledWith(mockBlob)

        // Simulate FileReader completion
        mockFileReader.onloadend()

        // Wait a tick for the onloadend to execute
        await new Promise((resolve) => setTimeout(resolve, 0))

        // Verify link was created and clicked
        expect(createElementSpy).toHaveBeenCalledWith('a')
        expect(clickSpy).toHaveBeenCalled()

        // Cleanup
        createElementSpy.mockRestore()
    })

    it('should handle download errors gracefully', async () => {
        // Mock fetch to fail
        global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

        // Mock console.error
        const consoleErrorSpy = vi
            .spyOn(console, 'error')
            .mockImplementation(() => {})

        const user = userEvent.setup()

        render(
            <ChakraWrapper>
                <DownloadSection generatedImage="blob:test-image" />
            </ChakraWrapper>
        )

        const button = screen.getByTestId('download-button')
        await user.click(button)

        // Wait for async operations to complete
        await new Promise((resolve) => setTimeout(resolve, 10))

        // Verify error was logged
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            'Download failed:',
            expect.any(Error)
        )

        // Cleanup
        consoleErrorSpy.mockRestore()
    })

    it('should open image in new tab on iOS Safari', async () => {
        // Mock react-device-detect for iOS Safari by re-mocking the module
        vi.doMock('react-device-detect', () => ({
            isIOS: true,
            isSafari: true
        }))

        // Re-import the component to pick up the mocked values
        vi.resetModules()

        // Re-import DownloadSection with the new mock
        const DownloadSectionModule = await import('../DownloadSection')
        const DownloadSection = DownloadSectionModule.default

        // Mock window.open
        const windowOpenSpy = vi
            .spyOn(window, 'open')
            .mockImplementation(() => null)

        const user = userEvent.setup()

        render(
            <ChakraWrapper>
                <DownloadSection generatedImage="blob:test-image" />
            </ChakraWrapper>
        )

        const button = screen.getByTestId('download-button')

        // Verify button text is different for iOS Safari
        expect(button).toHaveTextContent('Open Image in New Tab')

        await user.click(button)

        // Wait for async operations
        await new Promise((resolve) => setTimeout(resolve, 0))

        // Verify window.open was called with the blob URL directly
        expect(windowOpenSpy).toHaveBeenCalledWith('blob:test-image', '_blank')

        // Cleanup
        windowOpenSpy.mockRestore()

        // Reset modules back to original state
        vi.doUnmock('react-device-detect')
    })
})
