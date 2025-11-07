import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChakraProvider } from '@chakra-ui/react'
import userEvent from '@testing-library/user-event'
import ConfigureOptions from '../ConfigureOptions'
import { DeckPngOptions } from '@/types/api'

const ChakraWrapper = ({ children }: { children: React.ReactNode }) => (
    <ChakraProvider>{children}</ChakraProvider>
)

describe('ConfigureOptions', () => {
    const mockForm: DeckPngOptions = {
        sortBy: 'name',
        sortDirection: 'asc',
        fileType: 'png',
        imageSize: 'ig_square',
        imageVariant: 'grid',
        imageResolution: 'standard',
        backgroundStyle: 'transparent',
        includeCardCount: true
    }

    const mockUpdateForm = vi.fn()

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should render configuration summary by default', () => {
        render(
            <ChakraWrapper>
                <ConfigureOptions form={mockForm} updateForm={mockUpdateForm} />
            </ChakraWrapper>
        )

        expect(screen.getByText('Configuration')).toBeInTheDocument()
        expect(screen.getByTestId('configuration-summary')).toBeInTheDocument()
    })

    it('should display form values in summary', () => {
        render(
            <ChakraWrapper>
                <ConfigureOptions form={mockForm} updateForm={mockUpdateForm} />
            </ChakraWrapper>
        )

        expect(screen.getByText(/Sort by:/)).toBeInTheDocument()
        expect(screen.getByText(/name/)).toBeInTheDocument()
        expect(screen.getByText(/Image size:/)).toBeInTheDocument()
        expect(
            screen.getByText(/Instagram Square \(1080x1080\)/)
        ).toBeInTheDocument()
    })

    it('should render edit button', () => {
        render(
            <ChakraWrapper>
                <ConfigureOptions form={mockForm} updateForm={mockUpdateForm} />
            </ChakraWrapper>
        )

        const editButton = screen.getByTestId('configure-options-button')
        expect(editButton).toBeInTheDocument()
        expect(editButton).toHaveAttribute('aria-label', 'Configure options')
    })

    // Note: Tests involving edit mode with Radio components are skipped due to
    // @zag-js/focus-visible compatibility issues with vitest test environment
    it.skip('should toggle edit mode when button is clicked', async () => {
        const user = userEvent.setup()

        render(
            <ChakraWrapper>
                <ConfigureOptions form={mockForm} updateForm={mockUpdateForm} />
            </ChakraWrapper>
        )

        const editButton = screen.getByTestId('configure-options-button')
        await user.click(editButton)

        // Wait for state update
        await screen.findByText('Sort by')

        // Should show form inputs instead of summary
        expect(
            screen.queryByTestId('configuration-summary')
        ).not.toBeInTheDocument()
        expect(screen.getByText('Sort by')).toBeInTheDocument()
    })

    it.skip('should render all filter options in edit mode', async () => {
        const user = userEvent.setup()

        render(
            <ChakraWrapper>
                <ConfigureOptions form={mockForm} updateForm={mockUpdateForm} />
            </ChakraWrapper>
        )

        const editButton = screen.getByTestId('configure-options-button')
        await user.click(editButton)

        // Wait for the form to render
        await screen.findByText('Sort by')

        expect(screen.getByText('Sort by')).toBeInTheDocument()
        expect(screen.getByText('Image size')).toBeInTheDocument()
        expect(screen.getByText('Resolution')).toBeInTheDocument()
        expect(screen.getByText('Image variant')).toBeInTheDocument()
        expect(screen.getByText('Background')).toBeInTheDocument()
        expect(screen.getByText('Include card count')).toBeInTheDocument()
        expect(screen.getByText('File type')).toBeInTheDocument()
    })

    it.skip('should call updateForm when sort option changes', async () => {
        const user = userEvent.setup()

        render(
            <ChakraWrapper>
                <ConfigureOptions form={mockForm} updateForm={mockUpdateForm} />
            </ChakraWrapper>
        )

        const editButton = screen.getByTestId('configure-options-button')
        await user.click(editButton)

        await screen.findByText('Sort by')

        const cmcRadio = screen.getByTestId('filter-radio-sortBy-cmc')
        await user.click(cmcRadio)

        expect(mockUpdateForm).toHaveBeenCalledWith('sortBy', 'cmc')
    })

    it.skip('should call updateForm when image size changes', async () => {
        const user = userEvent.setup()

        render(
            <ChakraWrapper>
                <ConfigureOptions form={mockForm} updateForm={mockUpdateForm} />
            </ChakraWrapper>
        )

        const editButton = screen.getByTestId('configure-options-button')
        await user.click(editButton)

        await screen.findByText('Image size')

        const select = screen.getByTestId('filter-select-imageSize')
        await user.selectOptions(select, 'ig_story')

        expect(mockUpdateForm).toHaveBeenCalledWith(
            'imageSize',
            expect.any(String)
        )
    })

    it.skip('should call updateForm when resolution changes', async () => {
        const user = userEvent.setup()

        render(
            <ChakraWrapper>
                <ConfigureOptions form={mockForm} updateForm={mockUpdateForm} />
            </ChakraWrapper>
        )

        const editButton = screen.getByTestId('configure-options-button')
        await user.click(editButton)

        await screen.findByText('Resolution')

        const highResRadio = screen.getByTestId(
            'filter-radio-imageResolution-high'
        )
        await user.click(highResRadio)

        expect(mockUpdateForm).toHaveBeenCalledWith('imageResolution', 'high')
    })

    it.skip('should call updateForm when card count toggle changes', async () => {
        const user = userEvent.setup()

        render(
            <ChakraWrapper>
                <ConfigureOptions form={mockForm} updateForm={mockUpdateForm} />
            </ChakraWrapper>
        )

        const editButton = screen.getByTestId('configure-options-button')
        await user.click(editButton)

        await screen.findByText('Include card count')

        const toggle = screen.getByTestId('filter-toggle-includeCardCount')
        await user.click(toggle)

        expect(mockUpdateForm).toHaveBeenCalledWith(
            'includeCardCount',
            expect.any(Boolean)
        )
    })

    it.skip('should render Done button in edit mode', async () => {
        const user = userEvent.setup()

        render(
            <ChakraWrapper>
                <ConfigureOptions form={mockForm} updateForm={mockUpdateForm} />
            </ChakraWrapper>
        )

        const editButton = screen.getByTestId('configure-options-button')
        await user.click(editButton)

        await screen.findByText('Done')

        expect(screen.getByText('Done')).toBeInTheDocument()
    })

    it.skip('should close edit mode when Done is clicked', async () => {
        const user = userEvent.setup()

        render(
            <ChakraWrapper>
                <ConfigureOptions form={mockForm} updateForm={mockUpdateForm} />
            </ChakraWrapper>
        )

        const editButton = screen.getByTestId('configure-options-button')
        await user.click(editButton)

        const doneButton = await screen.findByText('Done')
        await user.click(doneButton)

        // Wait for summary to appear again
        await screen.findByTestId('configuration-summary')

        // Should show summary again
        expect(screen.getByTestId('configuration-summary')).toBeInTheDocument()
    })

    it('should display correct image size label', () => {
        const formWithStory = {
            ...mockForm,
            imageSize: 'ig_story' as const
        }

        render(
            <ChakraWrapper>
                <ConfigureOptions
                    form={formWithStory}
                    updateForm={mockUpdateForm}
                />
            </ChakraWrapper>
        )

        expect(
            screen.getByText(/Instagram Story \(1080x1920\)/)
        ).toBeInTheDocument()
    })

    it('should show N/A when image size is not set', () => {
        const formWithoutSize = {
            ...mockForm,
            imageSize: undefined
        }

        render(
            <ChakraWrapper>
                <ConfigureOptions
                    form={formWithoutSize}
                    updateForm={mockUpdateForm}
                />
            </ChakraWrapper>
        )

        const imageSizeElement = screen.getByTestId('configuration-image-size')
        expect(imageSizeElement).toHaveTextContent('N/A')
    })

    it.skip('should have disabled attribute for stacks variant and custom background', async () => {
        const user = userEvent.setup()

        render(
            <ChakraWrapper>
                <ConfigureOptions form={mockForm} updateForm={mockUpdateForm} />
            </ChakraWrapper>
        )

        const editButton = screen.getByTestId('configure-options-button')
        await user.click(editButton)

        await screen.findByText('Image variant')

        const stacksRadio = screen.getByTestId(
            'filter-radio-imageVariant-stacks'
        )
        const customBgRadio = screen.getByTestId(
            'filter-radio-backgroundStyle-custom'
        )

        expect(stacksRadio).toHaveAttribute('disabled')
        expect(customBgRadio).toHaveAttribute('disabled')
    })
})
