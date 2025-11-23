import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChakraProvider } from '@chakra-ui/react'
import userEvent from '@testing-library/user-event'
import ConfigureOptions from '../ConfigureOptions'
import { DeckPngOptions } from '@/types/api'
import { UseFormReturn } from 'react-hook-form'

const ChakraWrapper = ({ children }: { children: React.ReactNode }) => (
    <ChakraProvider>{children}</ChakraProvider>
)

describe('ConfigureOptions', () => {
    const defaultFormValues = {
        sortBy: 'name',
        sortDirection: 'asc',
        fileType: 'png',
        imageSize: 'ig_square',
        imageVariant: 'grid',
        imageResolution: 'standard',
        backgroundStyle: 'transparent',
        includeCardCount: true
    } as const

    const mockForm = (values: DeckPngOptions) =>
        ({
            watch: vi.fn((name?: any) => {
                // Handle different watch signatures
                if (name === undefined) {
                    // watch() - return all values
                    return values
                }
                if (typeof name === 'string') {
                    // watch('fieldName') - return single value
                    return values[name as keyof typeof values]
                }
                if (Array.isArray(name)) {
                    // watch(['field1', 'field2']) - return array of values
                    return name.map(
                        (field) => values[field as keyof typeof values]
                    )
                }
                return values
            }),
            getValues: vi.fn((name?: any) => {
                if (name === undefined) {
                    return values
                }
                if (typeof name === 'string') {
                    return values[name as keyof typeof values]
                }
                if (Array.isArray(name)) {
                    return name.map(
                        (field) => values[field as keyof typeof values]
                    )
                }
                return values
            }),
            setValue: vi.fn(),
            register: vi.fn(),
            handleSubmit: vi.fn((fn) => fn),
            formState: { errors: {}, isSubmitting: false }
        }) as unknown as UseFormReturn<DeckPngOptions>

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should render configuration summary by default', () => {
        render(
            <ChakraWrapper>
                <ConfigureOptions form={mockForm(defaultFormValues)} />
            </ChakraWrapper>
        )

        expect(screen.getByText('Configuration')).toBeInTheDocument()
        expect(screen.getByTestId('configuration-summary')).toBeInTheDocument()
    })

    it('should display form values in summary', () => {
        render(
            <ChakraWrapper>
                <ConfigureOptions form={mockForm(defaultFormValues)} />
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
                <ConfigureOptions form={mockForm(defaultFormValues)} />
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
                <ConfigureOptions form={mockForm(defaultFormValues)} />
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
                <ConfigureOptions form={mockForm(defaultFormValues)} />
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

    it.skip('should render Done button in edit mode', async () => {
        const user = userEvent.setup()

        render(
            <ChakraWrapper>
                <ConfigureOptions form={mockForm(defaultFormValues)} />
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
                <ConfigureOptions form={mockForm(defaultFormValues)} />
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
        const formWithStory = mockForm({
            ...defaultFormValues,
            imageSize: 'ig_story'
        })

        render(
            <ChakraWrapper>
                <ConfigureOptions form={formWithStory} />
            </ChakraWrapper>
        )

        expect(
            screen.getByText(/Instagram Story \(1080x1920\)/)
        ).toBeInTheDocument()
    })

    it('should show N/A when image size is not set', () => {
        const formWithoutSize = mockForm({
            ...defaultFormValues,
            imageSize: undefined
        })

        render(
            <ChakraWrapper>
                <ConfigureOptions form={formWithoutSize} />
            </ChakraWrapper>
        )

        const imageSizeElement = screen.getByTestId('configuration-image-size')
        expect(imageSizeElement).toHaveTextContent('N/A')
    })

    it.skip('should have disabled attribute for stacks variant and custom background', async () => {
        const user = userEvent.setup()

        render(
            <ChakraWrapper>
                <ConfigureOptions form={mockForm(defaultFormValues)} />
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
