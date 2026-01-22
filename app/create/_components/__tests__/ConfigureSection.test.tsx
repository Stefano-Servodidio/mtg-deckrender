import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChakraProvider } from '@chakra-ui/react'
import userEvent from '@testing-library/user-event'
import ConfigureSection from '../ConfigureSection'
import { CardsResponse } from '@/types/api'
import { ScryfallCard } from '@/types/scryfall'

// Mock analytics hook
vi.mock('@/hooks/useAnalytics', () => ({
    useAnalytics: vi.fn(() => ({
        trackButtonClick: vi.fn()
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

describe('ConfigureSection', () => {
    const mockCardsData: CardsResponse = {
        cards: [
            {
                id: '1',
                name: 'Lightning Bolt',
                cmc: 1,
                typeLine: 'Instant',
                rarity: 'common',
                image_uri: 'test.jpg',
                colors: ['R'],
                legalities: {} as ScryfallCard['legalities'],
                quantity: 4,
                groupId: 1
            }
        ],
        errors: []
    }

    const mockHandleGenerateImage = vi.fn()
    const mockProgress = {
        current: 50,
        total: 100,
        message: 'Generating...',
        percentage: 50
    }

    beforeEach(() => {
        vi.clearAllMocks()
        mockLoadFromLocalStorage.mockReturnValue({})
        mockSaveToLocalStorage.mockReturnValue(true)
        mockRemoveFromLocalStorage.mockReturnValue(true)
    })

    it('should render ConfigureOptions component', () => {
        render(
            <ChakraWrapper>
                <ConfigureSection
                    handleGenerateImage={mockHandleGenerateImage}
                    isGenerating={false}
                    cardsData={mockCardsData}
                />
            </ChakraWrapper>
        )

        expect(screen.getByText('Configuration')).toBeInTheDocument()
    })

    it('should render generate button', () => {
        render(
            <ChakraWrapper>
                <ConfigureSection
                    handleGenerateImage={mockHandleGenerateImage}
                    isGenerating={false}
                    cardsData={mockCardsData}
                />
            </ChakraWrapper>
        )

        expect(screen.getByTestId('generate-button')).toBeInTheDocument()
        expect(screen.getByText('Generate Deck Image')).toBeInTheDocument()
    })

    it('should disable generate button when cards array is empty', () => {
        render(
            <ChakraWrapper>
                <ConfigureSection
                    handleGenerateImage={mockHandleGenerateImage}
                    isGenerating={false}
                    cardsData={{ cards: [], errors: [] }}
                />
            </ChakraWrapper>
        )

        expect(screen.getByTestId('no-cards-text')).toBeInTheDocument()
        expect(screen.queryByTestId('generate-button')).not.toBeInTheDocument()
    })

    it('should call handleGenerateImage when button is clicked', async () => {
        const user = userEvent.setup()

        render(
            <ChakraWrapper>
                <ConfigureSection
                    handleGenerateImage={mockHandleGenerateImage}
                    isGenerating={false}
                    cardsData={mockCardsData}
                />
            </ChakraWrapper>
        )

        const button = screen.getByTestId('generate-button')
        await user.click(button)

        expect(mockHandleGenerateImage).toHaveBeenCalledWith(
            expect.objectContaining({
                sortBy: 'name',
                fileType: 'png',
                imageSize: 'ig_portrait'
            })
        )
    })

    it('should track button click', async () => {
        const mockTrackButtonClick = vi.fn()
        const { useAnalytics } = await import('@/hooks/useAnalytics')
        vi.mocked(useAnalytics).mockReturnValue({
            trackButtonClick: mockTrackButtonClick
        } as any)

        const user = userEvent.setup()

        render(
            <ChakraWrapper>
                <ConfigureSection
                    handleGenerateImage={mockHandleGenerateImage}
                    isGenerating={false}
                    cardsData={mockCardsData}
                />
            </ChakraWrapper>
        )

        const button = screen.getByTestId('generate-button')
        await user.click(button)

        expect(mockTrackButtonClick).toHaveBeenCalledWith(
            'Generate Deck Image',
            { event_label: 'configure_section' }
        )
    })

    it('should show loading state when generating', () => {
        render(
            <ChakraWrapper>
                <ConfigureSection
                    handleGenerateImage={mockHandleGenerateImage}
                    isGenerating={true}
                    cardsData={mockCardsData}
                />
            </ChakraWrapper>
        )

        const button = screen.getByTestId('generate-button')
        expect(button).toHaveAttribute('data-loading')
    })

    it('should show progress when generating', () => {
        render(
            <ChakraWrapper>
                <ConfigureSection
                    handleGenerateImage={mockHandleGenerateImage}
                    isGenerating={true}
                    cardsData={mockCardsData}
                    progress={mockProgress}
                />
            </ChakraWrapper>
        )

        // Both button text and progress message show "Generating..."
        const generatingElements = screen.getAllByText(mockProgress.message)
        expect(generatingElements.length).toBeGreaterThan(0)
        expect(screen.getByText('50%')).toBeInTheDocument()
    })

    it('should not show progress when not generating', () => {
        render(
            <ChakraWrapper>
                <ConfigureSection
                    handleGenerateImage={mockHandleGenerateImage}
                    isGenerating={false}
                    cardsData={mockCardsData}
                    progress={mockProgress}
                />
            </ChakraWrapper>
        )

        expect(screen.queryByText('Generating...')).not.toBeInTheDocument()
    })

    it('should not show progress section when progress is null', () => {
        render(
            <ChakraWrapper>
                <ConfigureSection
                    handleGenerateImage={mockHandleGenerateImage}
                    isGenerating={true}
                    cardsData={mockCardsData}
                    progress={null}
                />
            </ChakraWrapper>
        )

        // The button still shows "Generating..." text, but the progress bar is not shown
        expect(screen.queryByText(/50%/)).not.toBeInTheDocument()
    })

    it('should initialize form with default values', () => {
        render(
            <ChakraWrapper>
                <ConfigureSection
                    handleGenerateImage={mockHandleGenerateImage}
                    isGenerating={false}
                    cardsData={mockCardsData}
                />
            </ChakraWrapper>
        )

        // Verify default values are shown in the summary
        expect(screen.getByText(/name/)).toBeInTheDocument()
        expect(screen.getByText(/png/)).toBeInTheDocument()
        expect(screen.getByText(/transparent/)).toBeInTheDocument()
    })

    describe('localStorage persistence', () => {
        it('should load saved options from localStorage on mount', async () => {
            const savedOptions = {
                sortBy: 'cmc',
                fileType: 'jpeg',
                imageSize: 'ig_square',
                imageVariant: 'spoiler',
                imageResolution: 'high',
                backgroundStyle: 'custom_color',
                customBackgroundColor: '#FF0000',
                includeCardCount: false
            }

            mockLoadFromLocalStorage.mockReturnValueOnce(savedOptions)

            render(
                <ChakraWrapper>
                    <ConfigureSection
                        handleGenerateImage={mockHandleGenerateImage}
                        isGenerating={false}
                        cardsData={mockCardsData}
                    />
                </ChakraWrapper>
            )

            expect(mockLoadFromLocalStorage).toHaveBeenCalledWith(
                'mtg-deck-to-png:options',
                {}
            )
        })

        it('should use default values when localStorage is empty', async () => {
            mockLoadFromLocalStorage.mockReturnValueOnce({})

            render(
                <ChakraWrapper>
                    <ConfigureSection
                        handleGenerateImage={mockHandleGenerateImage}
                        isGenerating={false}
                        cardsData={mockCardsData}
                    />
                </ChakraWrapper>
            )

            // Verify default values are shown
            expect(screen.getByText(/name/)).toBeInTheDocument()
            expect(screen.getByText(/png/)).toBeInTheDocument()
            expect(screen.getByText(/transparent/)).toBeInTheDocument()
        })
    })
})
