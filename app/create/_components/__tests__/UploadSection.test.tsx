import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { ChakraProvider } from '@chakra-ui/react'
import userEvent from '@testing-library/user-event'
import UploadSection from '../UploadSection'

// Mock analytics hook
vi.mock('@/hooks/useAnalytics', () => ({
    useAnalytics: vi.fn(() => ({
        trackButtonClick: vi.fn(),
        trackFileUpload: vi.fn(),
        trackDeckUpload: vi.fn()
    }))
}))

// Mock localStorage utilities
const mockSaveToLocalStorage = vi.fn()
const mockLoadFromLocalStorage = vi.fn()
const mockRemoveFromLocalStorage = vi.fn()

vi.mock('@/utils/storage/localStorage', () => ({
    STORAGE_KEYS: {
        DECKLIST: 'mtg-deck-to-png:decklist',
        OPTIONS: 'mtg-deck-to-png:options'
    },
    saveToLocalStorage: (...args: any[]) => mockSaveToLocalStorage(...args),
    loadFromLocalStorage: (...args: any[]) =>
        mockLoadFromLocalStorage(...args),
    removeFromLocalStorage: (...args: any[]) =>
        mockRemoveFromLocalStorage(...args)
}))

const ChakraWrapper = ({ children }: { children: React.ReactNode }) => (
    <ChakraProvider>{children}</ChakraProvider>
)

describe('UploadSection', () => {
    const mockFetchCards = vi.fn()
    const mockProgress = {
        current: 10,
        total: 60,
        message: 'Fetching cards...',
        percentage: 16
    }

    beforeEach(() => {
        vi.clearAllMocks()
        mockLoadFromLocalStorage.mockReturnValue('')
        mockSaveToLocalStorage.mockReturnValue(true)
        mockRemoveFromLocalStorage.mockReturnValue(true)
    })

    it('should render textarea for decklist input', () => {
        render(
            <ChakraWrapper>
                <UploadSection
                    fetchCards={mockFetchCards}
                    isLoadingCards={false}
                />
            </ChakraWrapper>
        )

        expect(screen.getByText('Paste Decklist Text')).toBeInTheDocument()
        expect(
            screen.getByPlaceholderText(/1x Lightning Bolt/)
        ).toBeInTheDocument()
    })

    it('should render file upload section', () => {
        render(
            <ChakraWrapper>
                <UploadSection
                    fetchCards={mockFetchCards}
                    isLoadingCards={false}
                />
            </ChakraWrapper>
        )

        // Should render both mobile and desktop versions
        const desktopUploadSection = screen.getByTestId(
            'file-upload-section-desktop'
        )
        const mobileUploadSection = screen.getByTestId(
            'file-upload-section-mobile'
        )

        expect(desktopUploadSection).toBeInTheDocument()
        expect(mobileUploadSection).toBeInTheDocument()
    })

    it('should render upload button', () => {
        render(
            <ChakraWrapper>
                <UploadSection
                    fetchCards={mockFetchCards}
                    isLoadingCards={false}
                />
            </ChakraWrapper>
        )

        expect(screen.getByTestId('upload-button')).toBeInTheDocument()
        expect(screen.getByText('Upload Decklist')).toBeInTheDocument()
    })

    it('should disable upload button when textarea is empty', () => {
        render(
            <ChakraWrapper>
                <UploadSection
                    fetchCards={mockFetchCards}
                    isLoadingCards={false}
                />
            </ChakraWrapper>
        )

        const button = screen.getByTestId('upload-button')
        expect(button).toBeDisabled()
    })

    it('should enable upload button when text is entered', async () => {
        const user = userEvent.setup()

        render(
            <ChakraWrapper>
                <UploadSection
                    fetchCards={mockFetchCards}
                    isLoadingCards={false}
                />
            </ChakraWrapper>
        )

        const textarea = screen.getByPlaceholderText(/1x Lightning Bolt/)
        await user.type(textarea, '4 Lightning Bolt')

        const button = screen.getByTestId('upload-button')
        expect(button).not.toBeDisabled()
    })

    it('should call fetchCards when upload button is clicked', async () => {
        const user = userEvent.setup()

        render(
            <ChakraWrapper>
                <UploadSection
                    fetchCards={mockFetchCards}
                    isLoadingCards={false}
                />
            </ChakraWrapper>
        )

        const textarea = screen.getByPlaceholderText(/1x Lightning Bolt/)
        await user.type(textarea, '4 Lightning Bolt')

        const button = screen.getByTestId('upload-button')
        await user.click(button)

        await waitFor(() => {
            expect(mockFetchCards).toHaveBeenCalledWith('4 Lightning Bolt')
        })
    })

    it('should track button click', async () => {
        const mockTrackButtonClick = vi.fn()
        const { useAnalytics } = await import('@/hooks/useAnalytics')
        vi.mocked(useAnalytics).mockReturnValue({
            trackButtonClick: mockTrackButtonClick,
            trackDeckUpload: vi.fn()
        } as any)

        const user = userEvent.setup()

        render(
            <ChakraWrapper>
                <UploadSection
                    fetchCards={mockFetchCards}
                    isLoadingCards={false}
                />
            </ChakraWrapper>
        )

        const textarea = screen.getByPlaceholderText(/1x Lightning Bolt/)
        await user.type(textarea, '4 Lightning Bolt')

        const button = screen.getByTestId('upload-button')
        await user.click(button)

        expect(mockTrackButtonClick).toHaveBeenCalledWith('Upload Decklist', {
            event_label: 'upload_section'
        })
    })

    it('should track deck upload with line count', async () => {
        const mockTrackDeckUpload = vi.fn()
        const { useAnalytics } = await import('@/hooks/useAnalytics')
        vi.mocked(useAnalytics).mockReturnValue({
            trackButtonClick: vi.fn(),
            trackDeckUpload: mockTrackDeckUpload
        } as any)

        const user = userEvent.setup()

        render(
            <ChakraWrapper>
                <UploadSection
                    fetchCards={mockFetchCards}
                    isLoadingCards={false}
                />
            </ChakraWrapper>
        )

        const textarea = screen.getByPlaceholderText(/1x Lightning Bolt/)
        await user.type(textarea, '4 Lightning Bolt\n2 Counterspell\n3 Island')

        const button = screen.getByTestId('upload-button')
        await user.click(button)

        expect(mockTrackDeckUpload).toHaveBeenCalledWith(3)
    })

    it('should show loading state when uploading', () => {
        render(
            <ChakraWrapper>
                <UploadSection
                    fetchCards={mockFetchCards}
                    isLoadingCards={true}
                />
            </ChakraWrapper>
        )

        const button = screen.getByTestId('upload-button')
        expect(button).toHaveAttribute('data-loading')
    })

    it('should show progress when loading', () => {
        render(
            <ChakraWrapper>
                <UploadSection
                    fetchCards={mockFetchCards}
                    isLoadingCards={true}
                    progress={mockProgress}
                />
            </ChakraWrapper>
        )

        expect(screen.getByText('Fetching cards...')).toBeInTheDocument()
        expect(screen.getByText('10/60 (16%)')).toBeInTheDocument()
        expect(screen.getByTestId('upload-progress')).toBeInTheDocument()
    })

    it('should not show progress when not loading', () => {
        render(
            <ChakraWrapper>
                <UploadSection
                    fetchCards={mockFetchCards}
                    isLoadingCards={false}
                    progress={mockProgress}
                />
            </ChakraWrapper>
        )

        expect(screen.queryByText('Fetching cards...')).not.toBeInTheDocument()
        expect(screen.queryByTestId('upload-progress')).not.toBeInTheDocument()
    })

    it('should disable button when loading', () => {
        render(
            <ChakraWrapper>
                <UploadSection
                    fetchCards={mockFetchCards}
                    isLoadingCards={true}
                />
            </ChakraWrapper>
        )

        const button = screen.getByTestId('upload-button')
        expect(button).toBeDisabled()
    })

    it('should trim whitespace from decklist before calling fetchCards', async () => {
        const user = userEvent.setup()

        render(
            <ChakraWrapper>
                <UploadSection
                    fetchCards={mockFetchCards}
                    isLoadingCards={false}
                />
            </ChakraWrapper>
        )

        const textarea = screen.getByPlaceholderText(/1x Lightning Bolt/)
        await user.type(textarea, '  4 Lightning Bolt  ')

        const button = screen.getByTestId('upload-button')
        await user.click(button)

        await waitFor(() => {
            expect(mockFetchCards).toHaveBeenCalledWith('4 Lightning Bolt')
        })
    })

    it('should update textarea value when typing', async () => {
        const user = userEvent.setup()

        render(
            <ChakraWrapper>
                <UploadSection
                    fetchCards={mockFetchCards}
                    isLoadingCards={false}
                />
            </ChakraWrapper>
        )

        const textarea = screen.getByPlaceholderText(/1x Lightning Bolt/)
        await user.type(textarea, 'Test decklist')

        expect(textarea).toHaveValue('Test decklist')
    })

    describe('localStorage persistence', () => {
        it('should load saved decklist from localStorage on mount', async () => {
            // Mock a saved decklist
            mockLoadFromLocalStorage.mockReturnValueOnce(
                '4 Lightning Bolt\n2 Mountain'
            )

            render(
                <ChakraWrapper>
                    <UploadSection
                        fetchCards={mockFetchCards}
                        isLoadingCards={false}
                    />
                </ChakraWrapper>
            )

            await waitFor(() => {
                const textarea = screen.getByPlaceholderText(/1x Lightning Bolt/)
                expect(textarea).toHaveValue('4 Lightning Bolt\n2 Mountain')
            })

            expect(mockLoadFromLocalStorage).toHaveBeenCalledWith(
                'mtg-deck-to-png:decklist',
                ''
            )
        })

        it('should save decklist to localStorage when typing', async () => {
            const user = userEvent.setup()

            render(
                <ChakraWrapper>
                    <UploadSection
                        fetchCards={mockFetchCards}
                        isLoadingCards={false}
                    />
                </ChakraWrapper>
            )

            const textarea = screen.getByPlaceholderText(/1x Lightning Bolt/)
            await user.type(textarea, '4 Lightning Bolt')

            await waitFor(() => {
                expect(mockSaveToLocalStorage).toHaveBeenCalledWith(
                    'mtg-deck-to-png:decklist',
                    expect.stringContaining('4 Lightning Bolt')
                )
            })
        })

        it('should persist empty decklist', async () => {
            const user = userEvent.setup()

            render(
                <ChakraWrapper>
                    <UploadSection
                        fetchCards={mockFetchCards}
                        isLoadingCards={false}
                    />
                </ChakraWrapper>
            )

            // Type and then clear
            const textarea = screen.getByPlaceholderText(/1x Lightning Bolt/)
            await user.type(textarea, 'test')
            await user.clear(textarea)

            await waitFor(() => {
                expect(mockSaveToLocalStorage).toHaveBeenCalledWith(
                    'mtg-deck-to-png:decklist',
                    ''
                )
            })
        })
    })
})
