import { beforeEach, describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChakraProvider } from '@chakra-ui/react'
import { DropZone } from '../DropZone'
import { DropzoneState } from 'react-dropzone'

// Mock react-dropzone
vi.mock('react-dropzone', () => ({
    useDropzone: vi.fn()
}))

// Wrapper component to provide Chakra context
const ChakraWrapper = ({ children }: { children: React.ReactNode }) => (
    <ChakraProvider>{children}</ChakraProvider>
)

describe('DropZone', () => {
    const mockOnFileUpload = vi.fn()

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
            open: vi.fn(),
            acceptedFiles: [],
            fileRejections: [],
            isFocused: false,
            isDragAccept: false,
            isDragReject: false,
            rootRef: { current: null },
            inputRef: { current: null }
        })
    })

    it('should render default state correctly', () => {
        render(
            <ChakraWrapper>
                <DropZone onFileUpload={mockOnFileUpload} />
            </ChakraWrapper>
        )

        expect(
            screen.getByText('Drag & drop a text file here')
        ).toBeInTheDocument()
        expect(screen.getByText('or click to browse files')).toBeInTheDocument()
        expect(screen.getByText('Supports .txt files only')).toBeInTheDocument()
    })

    it('should render drag active state', async () => {
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
            isDragActive: true,
            isFileDialogActive: false,
            open: vi.fn(),
            acceptedFiles: [],
            fileRejections: [],
            isFocused: false,
            isDragAccept: false,
            isDragReject: false,
            rootRef: { current: null },
            inputRef: { current: null }
        })

        render(
            <ChakraWrapper>
                <DropZone onFileUpload={mockOnFileUpload} />
            </ChakraWrapper>
        )

        expect(screen.getByText('Drop your file here...')).toBeInTheDocument()
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
                open: vi.fn(),
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
                <DropZone onFileUpload={mockOnFileUpload} />
            </ChakraWrapper>
        )

        expect(mockOnFileUpload).toHaveBeenCalledWith(mockFiles)
    })

    it('should configure dropzone with correct accept options', async () => {
        const { useDropzone } = await import('react-dropzone')
        const useDropzoneSpy = vi.mocked(useDropzone)

        render(
            <ChakraWrapper>
                <DropZone onFileUpload={mockOnFileUpload} />
            </ChakraWrapper>
        )

        expect(useDropzoneSpy).toHaveBeenCalledWith({
            onDrop: expect.any(Function),
            accept: {
                'text/plain': ['.txt']
            },
            multiple: false
        })
    })

    it('should have correct accessibility attributes', () => {
        render(
            <ChakraWrapper>
                <DropZone onFileUpload={mockOnFileUpload} />
            </ChakraWrapper>
        )

        const input = screen.getByTestId('dropzone-input')
        expect(input).toHaveAttribute('type', 'file')
    })
})
