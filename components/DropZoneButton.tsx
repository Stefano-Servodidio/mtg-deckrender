'use client'

import { Button, ButtonProps } from '@chakra-ui/react'
import {
    useDropzone,
    DropzoneProps as ReactDropzoneProps
} from 'react-dropzone'
import { useCallback } from 'react'

interface DropZoneButtonProps extends Omit<ReactDropzoneProps, 'onDrop'> {
    onFileUpload: (_files: File[]) => void
    colorScheme?: string
    buttonProps?: Omit<ButtonProps, 'onClick'>
}

export function DropZoneButton({
    onFileUpload,
    colorScheme = 'purple',
    buttonProps
}: DropZoneButtonProps) {
    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            onFileUpload(acceptedFiles)
        },
        [onFileUpload]
    )

    const { getRootProps, getInputProps, open } = useDropzone({
        onDrop,
        accept: {
            'text/plain': ['.txt'] // TODO: add support for .dek
        },
        multiple: false,
        noClick: true,
        noKeyboard: true
    })

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        open()
    }

    return (
        <div {...getRootProps()}>
            <input {...getInputProps()} />
            <Button
                data-testid="dropzone-button"
                onClick={handleClick}
                colorScheme={colorScheme}
                size="lg"
                w="full"
                variant={'outline'}
                {...buttonProps}
            >
                or Upload Text File
            </Button>
        </div>
    )
}
