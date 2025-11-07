import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChakraProvider } from '@chakra-ui/react'
import userEvent from '@testing-library/user-event'
import FilterItem from '../FilterItem'

const ChakraWrapper = ({ children }: { children: React.ReactNode }) => (
    <ChakraProvider>{children}</ChakraProvider>
)

describe('FilterItem', () => {
    describe('Radio', () => {
        const options = [
            { label: 'Option 1', value: 'opt1' },
            { label: 'Option 2', value: 'opt2' },
            { label: 'Option 3', value: 'opt3', disabled: true }
        ]

        it('should render radio group with options', () => {
            render(
                <ChakraWrapper>
                    <FilterItem.Radio
                        name="test-radio"
                        options={options}
                        value="opt1"
                        onChange={vi.fn()}
                    />
                </ChakraWrapper>
            )

            expect(screen.getByText('Option 1')).toBeInTheDocument()
            expect(screen.getByText('Option 2')).toBeInTheDocument()
            expect(screen.getByText('Option 3')).toBeInTheDocument()
        })

        it('should render with correct test ids', () => {
            render(
                <ChakraWrapper>
                    <FilterItem.Radio
                        name="test-radio"
                        options={options}
                        value="opt1"
                        onChange={vi.fn()}
                    />
                </ChakraWrapper>
            )

            expect(
                screen.getByTestId('filter-radio-group-test-radio')
            ).toBeInTheDocument()
            expect(
                screen.getByTestId('filter-radio-test-radio-opt1')
            ).toBeInTheDocument()
        })

        it('should call onChange when option is clicked', async () => {
            const handleChange = vi.fn()
            const user = userEvent.setup()

            render(
                <ChakraWrapper>
                    <FilterItem.Radio
                        name="test-radio"
                        options={options}
                        value="opt1"
                        onChange={handleChange}
                    />
                </ChakraWrapper>
            )

            const radio = screen.getByTestId('filter-radio-test-radio-opt2')
            await user.click(radio)

            expect(handleChange).toHaveBeenCalled()
        })

        it('should have disabled attribute when disabled prop is true', () => {
            render(
                <ChakraWrapper>
                    <FilterItem.Radio
                        name="test-radio"
                        options={options}
                        value="opt1"
                        onChange={vi.fn()}
                    />
                </ChakraWrapper>
            )

            const disabledRadio = screen.getByTestId(
                'filter-radio-test-radio-opt3'
            )
            expect(disabledRadio).toHaveAttribute('disabled')
        })
    })

    describe('Select', () => {
        const options = [
            { label: 'Select 1', value: 'sel1' },
            { label: 'Select 2', value: 'sel2' },
            { label: 'Select 3', value: 'sel3', disabled: true }
        ]

        it('should render select with options', () => {
            render(
                <ChakraWrapper>
                    <FilterItem.Select
                        name="test-select"
                        options={options}
                        value="sel1"
                        onChange={vi.fn()}
                    />
                </ChakraWrapper>
            )

            expect(screen.getByText('Select 1')).toBeInTheDocument()
            expect(screen.getByText('Select 2')).toBeInTheDocument()
            expect(screen.getByText('Select 3')).toBeInTheDocument()
        })

        it('should render with correct test id', () => {
            render(
                <ChakraWrapper>
                    <FilterItem.Select
                        name="test-select"
                        options={options}
                        value="sel1"
                        onChange={vi.fn()}
                    />
                </ChakraWrapper>
            )

            expect(
                screen.getByTestId('filter-select-test-select')
            ).toBeInTheDocument()
        })

        it('should render with placeholder', () => {
            render(
                <ChakraWrapper>
                    <FilterItem.Select
                        name="test-select"
                        options={options}
                        placeholder="Choose option"
                        onChange={vi.fn()}
                    />
                </ChakraWrapper>
            )

            expect(screen.getByText('Choose option')).toBeInTheDocument()
        })

        it('should call onChange when option is selected', async () => {
            const handleChange = vi.fn()
            const user = userEvent.setup()

            render(
                <ChakraWrapper>
                    <FilterItem.Select
                        name="test-select"
                        options={options}
                        value="sel1"
                        onChange={handleChange}
                    />
                </ChakraWrapper>
            )

            const select = screen.getByTestId('filter-select-test-select')
            await user.selectOptions(select, 'sel2')

            expect(handleChange).toHaveBeenCalled()
        })

        it('should disable option when disabled prop is true', () => {
            render(
                <ChakraWrapper>
                    <FilterItem.Select
                        name="test-select"
                        options={options}
                        value="sel1"
                        onChange={vi.fn()}
                    />
                </ChakraWrapper>
            )

            const disabledOption = screen.getByTestId(
                'filter-select-test-select-sel3'
            )
            expect(disabledOption).toBeDisabled()
        })
    })

    describe('Toggle', () => {
        it('should render toggle with label', () => {
            render(
                <ChakraWrapper>
                    <FilterItem.Toggle
                        name="test-toggle"
                        label="Enable feature"
                        isChecked={false}
                        onChange={vi.fn()}
                    />
                </ChakraWrapper>
            )

            expect(screen.getByText('Enable feature')).toBeInTheDocument()
        })

        it('should render with correct test id', () => {
            render(
                <ChakraWrapper>
                    <FilterItem.Toggle
                        name="test-toggle"
                        label="Enable feature"
                        isChecked={false}
                        onChange={vi.fn()}
                    />
                </ChakraWrapper>
            )

            expect(
                screen.getByTestId('filter-toggle-test-toggle')
            ).toBeInTheDocument()
        })

        it('should call onChange when toggled', async () => {
            const handleChange = vi.fn()
            const user = userEvent.setup()

            render(
                <ChakraWrapper>
                    <FilterItem.Toggle
                        name="test-toggle"
                        label="Enable feature"
                        isChecked={false}
                        onChange={handleChange}
                    />
                </ChakraWrapper>
            )

            const toggle = screen.getByTestId('filter-toggle-test-toggle')
            await user.click(toggle)

            expect(handleChange).toHaveBeenCalled()
        })

        it('should render checked state', () => {
            render(
                <ChakraWrapper>
                    <FilterItem.Toggle
                        name="test-toggle"
                        label="Enable feature"
                        isChecked={true}
                        onChange={vi.fn()}
                    />
                </ChakraWrapper>
            )

            const toggle = screen.getByRole('checkbox')
            expect(toggle).toBeChecked()
        })

        it('should render unchecked state', () => {
            render(
                <ChakraWrapper>
                    <FilterItem.Toggle
                        name="test-toggle"
                        label="Enable feature"
                        isChecked={false}
                        onChange={vi.fn()}
                    />
                </ChakraWrapper>
            )

            const toggle = screen.getByRole('checkbox')
            expect(toggle).not.toBeChecked()
        })
    })

    describe('Wrapper', () => {
        it('should render children', () => {
            render(
                <ChakraWrapper>
                    <FilterItem.Wrapper label="Test Label">
                        <div>Test Content</div>
                    </FilterItem.Wrapper>
                </ChakraWrapper>
            )

            expect(screen.getByText('Test Content')).toBeInTheDocument()
        })

        it('should render label when provided', () => {
            render(
                <ChakraWrapper>
                    <FilterItem.Wrapper label="Test Label">
                        <div>Test Content</div>
                    </FilterItem.Wrapper>
                </ChakraWrapper>
            )

            expect(screen.getByText('Test Label')).toBeInTheDocument()
        })

        it('should render without label', () => {
            render(
                <ChakraWrapper>
                    <FilterItem.Wrapper>
                        <div>Test Content</div>
                    </FilterItem.Wrapper>
                </ChakraWrapper>
            )

            expect(screen.getByText('Test Content')).toBeInTheDocument()
        })
    })
})
