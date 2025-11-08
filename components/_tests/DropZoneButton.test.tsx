import { beforeEach, describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ChakraProvider } from '@chakra-ui/react'
import { DropZoneButton } from '../DropZoneButton'
import { DropzoneState } from 'react-dropzone'

// Mock react-dropzone
vi.mock('react-dropzone', () => ({
    useDropzone: vi.fn()
}))

// Wrapper component to provide Chakra context
const ChakraWrapper = ({ children }: { children: React.ReactNode }) => (
    <ChakraProvider>{children}</ChakraProvider>
)

describe('DropZoneButton', () => {
    const mockOnFileUpload = vi.fn()
    const mockOpen = vi.fn()

    beforeEach(async () => {
        vi.clearAllMocks()
        // Setup default mock implementation
        const { useDropzone } = await import('react-dropzone')
        vi.mocked(useDropzone).mockReturnValue({
            getRootProps: () =>
                ({
                    onClick: vi.fn(),
                    onKeyDown: vi.fn(),
                    onFocus: vi.fn(),
                    onBlur: vi.fn(),
                    'data-testid': 'dropzone'
                }) as any,
            getInputProps: () =>
                ({
                    type: 'file',
                    'data-testid': 'dropzone-input'
                }) as any,
            isDragActive: false,
            isFileDialogActive: false,
            open: mockOpen,
            acceptedFiles: [],
            fileRejections: [],
            isFocused: false,
            isDragAccept: false,
            isDragReject: false,
            rootRef: { current: null },
            inputRef: { current: null }
        })
    })

    it('should render button with correct text', () => {
        render(
            <ChakraWrapper>
                <DropZoneButton onFileUpload={mockOnFileUpload} />
            </ChakraWrapper>
        )

        expect(screen.getByText('Upload Text File')).toBeInTheDocument()
    })

    it('should render upload icon', () => {
        render(
            <ChakraWrapper>
                <DropZoneButton onFileUpload={mockOnFileUpload} />
            </ChakraWrapper>
        )

        const button = screen.getByRole('button', { name: /upload text file/i })
        expect(button).toBeInTheDocument()
        // Check that the button has an svg icon
        const icon = button.querySelector('svg')
        expect(icon).toBeInTheDocument()
    })

    it('should open file dialog when button is clicked', () => {
        render(
            <ChakraWrapper>
                <DropZoneButton onFileUpload={mockOnFileUpload} />
            </ChakraWrapper>
        )

        const button = screen.getByRole('button', { name: /upload text file/i })
        fireEvent.click(button)

        expect(mockOpen).toHaveBeenCalled()
    })

    it('should call onFileUpload when files are dropped', async () => {
        const mockFiles = [
            new File(['test content'], 'test.txt', { type: 'text/plain' })
        ]

        const { useDropzone } = await import('react-dropzone')
        vi.mocked(useDropzone).mockImplementation((options) => {
            // Simulate file drop
            if (options?.onDrop) {
                options.onDrop(mockFiles, [], {} as any)
            }

            return {
                getRootProps: () => ({
                    onClick: vi.fn(),
                    onKeyDown: vi.fn(),
                    onFocus: vi.fn(),
                    onBlur: vi.fn(),
                    'data-testid': 'dropzone'
                }),
                getInputProps: () => ({
                    type: 'file',
                    'data-testid': 'dropzone-input'
                }),
                isDragActive: false,
                isFileDialogActive: false,
                open: mockOpen,
                acceptedFiles: mockFiles,
                fileRejections: [],
                isFocused: false,
                isDragAccept: false,
                isDragReject: false,
                rootRef: { current: null },
                inputRef: { current: null }
            } as DropzoneState
        })

        render(
            <ChakraWrapper>
                <DropZoneButton onFileUpload={mockOnFileUpload} />
            </ChakraWrapper>
        )

        expect(mockOnFileUpload).toHaveBeenCalledWith(mockFiles)
    })

    it('should configure dropzone with correct accept options', async () => {
        const { useDropzone } = await import('react-dropzone')
        const useDropzoneSpy = vi.mocked(useDropzone)

        render(
            <ChakraWrapper>
                <DropZoneButton onFileUpload={mockOnFileUpload} />
            </ChakraWrapper>
        )

        expect(useDropzoneSpy).toHaveBeenCalledWith({
            onDrop: expect.any(Function),
            accept: {
                'text/plain': ['.txt']
            },
            multiple: false,
            noClick: true,
            noKeyboard: true
        })
    })

    it('should apply custom color scheme', () => {
        render(
            <ChakraWrapper>
                <DropZoneButton
                    onFileUpload={mockOnFileUpload}
                    colorScheme="orange"
                />
            </ChakraWrapper>
        )

        const button = screen.getByRole('button', { name: /upload text file/i })
        expect(button).toBeInTheDocument()
    })

    it('should apply custom button props', () => {
        render(
            <ChakraWrapper>
                <DropZoneButton
                    onFileUpload={mockOnFileUpload}
                    buttonProps={{ isDisabled: true }}
                />
            </ChakraWrapper>
        )

        const button = screen.getByRole('button', { name: /upload text file/i })
        expect(button).toBeDisabled()
    })

    it('should have correct accessibility attributes', () => {
        render(
            <ChakraWrapper>
                <DropZoneButton onFileUpload={mockOnFileUpload} />
            </ChakraWrapper>
        )

        const input = screen.getByTestId('dropzone-input')
        expect(input).toHaveAttribute('type', 'file')
    })
})
