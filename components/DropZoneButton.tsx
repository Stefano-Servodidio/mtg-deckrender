'use client'

import { Button, ButtonProps, Icon, useColorModeValue } from '@chakra-ui/react'
import {
    useDropzone,
    DropzoneProps as ReactDropzoneProps
} from 'react-dropzone'
import { useCallback } from 'react'
import { FaCloudUploadAlt } from 'react-icons/fa'

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
                leftIcon={<Icon as={FaCloudUploadAlt} />}
                onClick={handleClick}
                colorScheme={colorScheme}
                size="lg"
                w="full"
                {...buttonProps}
            >
                Upload Text File
            </Button>
        </div>
    )
}
