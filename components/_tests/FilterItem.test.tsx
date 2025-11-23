import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChakraProvider } from '@chakra-ui/react'
import userEvent from '@testing-library/user-event'
import { useForm } from 'react-hook-form'
import FilterItem from '../FilterItem'

const ChakraWrapper = ({ children }: { children: React.ReactNode }) => (
    <ChakraProvider>{children}</ChakraProvider>
)

// Test wrapper component that sets up react-hook-form
interface TestFormProps {
    defaultValues?: any
    children: (_control: any) => React.ReactNode
}

const TestForm: React.FC<TestFormProps> = ({ defaultValues, children }) => {
    const { control } = useForm({ defaultValues })
    return <>{children(control)}</>
}

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
                    <TestForm defaultValues={{ testRadio: 'opt1' }}>
                        {(control) => (
                            <FilterItem.Radio
                                control={control}
                                name="testRadio"
                                options={options}
                            />
                        )}
                    </TestForm>
                </ChakraWrapper>
            )

            expect(screen.getByText('Option 1')).toBeInTheDocument()
            expect(screen.getByText('Option 2')).toBeInTheDocument()
            expect(screen.getByText('Option 3')).toBeInTheDocument()
        })

        it('should render with correct test ids', () => {
            render(
                <ChakraWrapper>
                    <TestForm defaultValues={{ testRadio: 'opt1' }}>
                        {(control) => (
                            <FilterItem.Radio
                                control={control}
                                name="testRadio"
                                options={options}
                            />
                        )}
                    </TestForm>
                </ChakraWrapper>
            )

            expect(
                screen.getByTestId('filter-radio-group-testRadio')
            ).toBeInTheDocument()
            expect(
                screen.getByTestId('filter-radio-testRadio-opt1')
            ).toBeInTheDocument()
        })

        it('should call onChange when option is clicked', async () => {
            const user = userEvent.setup()

            render(
                <ChakraWrapper>
                    <TestForm defaultValues={{ testRadio: 'opt1' }}>
                        {(control) => (
                            <FilterItem.Radio
                                control={control}
                                name="testRadio"
                                options={options}
                            />
                        )}
                    </TestForm>
                </ChakraWrapper>
            )

            const radio = screen.getByTestId('filter-radio-testRadio-opt2')
            await user.click(radio)

            // After clicking, the clicked radio should have aria-checked="true"
            expect(radio).toHaveAttribute('data-checked')
        })

        it('should have disabled attribute when disabled prop is true', () => {
            render(
                <ChakraWrapper>
                    <TestForm defaultValues={{ testRadio: 'opt1' }}>
                        {(control) => (
                            <FilterItem.Radio
                                control={control}
                                name="testRadio"
                                options={options}
                            />
                        )}
                    </TestForm>
                </ChakraWrapper>
            )

            const disabledRadio = screen.getByTestId(
                'filter-radio-testRadio-opt3'
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
                    <TestForm defaultValues={{ testSelect: 'sel1' }}>
                        {(control) => (
                            <FilterItem.Select
                                control={control}
                                name="testSelect"
                                options={options}
                            />
                        )}
                    </TestForm>
                </ChakraWrapper>
            )

            expect(screen.getByText('Select 1')).toBeInTheDocument()
            expect(screen.getByText('Select 2')).toBeInTheDocument()
            expect(screen.getByText('Select 3')).toBeInTheDocument()
        })

        it('should render with correct test id', () => {
            render(
                <ChakraWrapper>
                    <TestForm defaultValues={{ testSelect: 'sel1' }}>
                        {(control) => (
                            <FilterItem.Select
                                control={control}
                                name="testSelect"
                                options={options}
                            />
                        )}
                    </TestForm>
                </ChakraWrapper>
            )

            expect(
                screen.getByTestId('filter-select-testSelect')
            ).toBeInTheDocument()
        })

        it('should render with placeholder', () => {
            render(
                <ChakraWrapper>
                    <TestForm defaultValues={{ testSelect: '' }}>
                        {(control) => (
                            <FilterItem.Select
                                control={control}
                                name="testSelect"
                                options={options}
                                placeholder="Choose option"
                            />
                        )}
                    </TestForm>
                </ChakraWrapper>
            )

            expect(screen.getByText('Choose option')).toBeInTheDocument()
        })

        it('should call onChange when option is selected', async () => {
            const user = userEvent.setup()

            render(
                <ChakraWrapper>
                    <TestForm defaultValues={{ testSelect: 'sel1' }}>
                        {(control) => (
                            <FilterItem.Select
                                control={control}
                                name="testSelect"
                                options={options}
                            />
                        )}
                    </TestForm>
                </ChakraWrapper>
            )

            const select = screen.getByTestId('filter-select-testSelect')
            await user.selectOptions(select, 'sel2')

            // The select value should have changed
            expect(select).toHaveValue('sel2')
        })

        it('should disable option when disabled prop is true', () => {
            render(
                <ChakraWrapper>
                    <TestForm defaultValues={{ testSelect: 'sel1' }}>
                        {(control) => (
                            <FilterItem.Select
                                control={control}
                                name="testSelect"
                                options={options}
                            />
                        )}
                    </TestForm>
                </ChakraWrapper>
            )

            const disabledOption = screen.getByTestId(
                'filter-select-testSelect-sel3'
            )
            expect(disabledOption).toBeDisabled()
        })
    })

    describe('Toggle', () => {
        it('should render toggle with label', () => {
            render(
                <ChakraWrapper>
                    <TestForm defaultValues={{ testToggle: false }}>
                        {(control) => (
                            <FilterItem.Toggle
                                control={control}
                                name="testToggle"
                                label="Enable feature"
                            />
                        )}
                    </TestForm>
                </ChakraWrapper>
            )

            expect(screen.getByText('Enable feature')).toBeInTheDocument()
        })

        it('should render with correct test id', () => {
            render(
                <ChakraWrapper>
                    <TestForm defaultValues={{ testToggle: false }}>
                        {(control) => (
                            <FilterItem.Toggle
                                control={control}
                                name="testToggle"
                                label="Enable feature"
                            />
                        )}
                    </TestForm>
                </ChakraWrapper>
            )

            expect(
                screen.getByTestId('filter-toggle-testToggle')
            ).toBeInTheDocument()
        })

        it('should call onChange when toggled', async () => {
            const user = userEvent.setup()

            render(
                <ChakraWrapper>
                    <TestForm defaultValues={{ testToggle: false }}>
                        {(control) => (
                            <FilterItem.Toggle
                                control={control}
                                name="testToggle"
                                label="Enable feature"
                            />
                        )}
                    </TestForm>
                </ChakraWrapper>
            )

            const toggle = screen.getByRole('checkbox')
            await user.click(toggle)

            // Toggle should now be checked
            expect(toggle).toBeChecked()
        })

        it('should render checked state', () => {
            render(
                <ChakraWrapper>
                    <TestForm defaultValues={{ testToggle: true }}>
                        {(control) => (
                            <FilterItem.Toggle
                                control={control}
                                name="testToggle"
                                label="Enable feature"
                            />
                        )}
                    </TestForm>
                </ChakraWrapper>
            )

            const toggle = screen.getByRole('checkbox')
            expect(toggle).toBeChecked()
        })

        it('should render unchecked state', () => {
            render(
                <ChakraWrapper>
                    <TestForm defaultValues={{ testToggle: false }}>
                        {(control) => (
                            <FilterItem.Toggle
                                control={control}
                                name="testToggle"
                                label="Enable feature"
                            />
                        )}
                    </TestForm>
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
