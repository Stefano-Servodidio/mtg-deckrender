'use client'

import {
    Box,
    VStack,
    Text,
    Icon,
    useColorModeValue,
    BoxProps,
    HStack,
    Button
} from '@chakra-ui/react'
import {
    useDropzone,
    DropzoneProps as ReactDropzoneProps
} from 'react-dropzone'
import { useCallback, useState } from 'react'
import { FaCloudUploadAlt, FaImage, FaTimes } from 'react-icons/fa'

interface BackgroundImageUploadProps
    extends Omit<ReactDropzoneProps, 'onDrop'> {
    onImageUpload: (_imageData: string | null) => void
    colorScheme?: string
    wrapperProps?: BoxProps
    maxSizeBytes?: number
}

export function BackgroundImageUpload({
    onImageUpload,
    colorScheme = 'blue',
    wrapperProps,
    maxSizeBytes = 1024 * 1024 // 1MB default
}: BackgroundImageUploadProps) {
    const [fileName, setFileName] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            setError(null)

            if (acceptedFiles.length === 0) return

            const file = acceptedFiles[0]

            // Read file as base64
            const reader = new FileReader()
            reader.onload = (e) => {
                const result = e.target?.result as string
                onImageUpload(result)
                setFileName(file.name)
            }
            reader.onerror = () => {
                setError('Failed to read image file')
            }
            reader.readAsDataURL(file)
        },
        [onImageUpload]
    )

    const handleClear = () => {
        setFileName(null)
        setError(null)
        onImageUpload(null)
    }

    const { getRootProps, getInputProps, isDragActive, fileRejections } =
        useDropzone({
            onDrop,
            accept: {
                'image/png': ['.png'],
                'image/jpeg': ['.jpg', '.jpeg'],
                'image/webp': ['.webp']
            },
            multiple: false,
            maxFiles: 1,
            maxSize: maxSizeBytes
        })

    const bg = useColorModeValue('gray.50', 'gray.700')
    const borderColor = isDragActive ? `${colorScheme}.400` : 'gray.300'
    const hoverBg = useColorModeValue(`${colorScheme}.50`, `${colorScheme}.900`)

    if (fileName) {
        return (
            <Box
                w="full"
                p={4}
                border="2px solid"
                borderColor={`${colorScheme}.300`}
                borderRadius="lg"
                bg={bg}
                {...wrapperProps}
            >
                <HStack justify="space-between">
                    <HStack spacing={2}>
                        <Icon as={FaImage} color={`${colorScheme}.500`} />
                        <Text fontSize="sm" fontWeight="medium">
                            {fileName}
                        </Text>
                    </HStack>
                    <Button
                        size="sm"
                        variant="ghost"
                        colorScheme="red"
                        leftIcon={<FaTimes />}
                        onClick={handleClear}
                    >
                        Remove
                    </Button>
                </HStack>
            </Box>
        )
    }

    return (
        <Box {...wrapperProps}>
            <Box
                {...getRootProps()}
                w="full"
                p={6}
                border="2px dashed"
                borderColor={error ? 'red.400' : borderColor}
                borderRadius="lg"
                bg={bg}
                cursor="pointer"
                transition="all 0.2s"
                _hover={{
                    bg: hoverBg,
                    borderColor: `${colorScheme}.300`,
                    transform: 'scale(1.01)'
                }}
                textAlign="center"
            >
                <input {...getInputProps()} />
                <VStack spacing={2}>
                    <Icon
                        as={isDragActive ? FaImage : FaCloudUploadAlt}
                        w={8}
                        h={8}
                        color={
                            error
                                ? 'red.500'
                                : isDragActive
                                  ? `${colorScheme}.500`
                                  : 'gray.400'
                        }
                        transition="color 0.2s"
                    />
                    {isDragActive ? (
                        <Text
                            fontSize="sm"
                            color={`${colorScheme}.500`}
                            fontWeight="medium"
                        >
                            Drop your image here...
                        </Text>
                    ) : (
                        <VStack spacing={1}>
                            <Text
                                fontSize="sm"
                                fontWeight="medium"
                                color="gray.600"
                            >
                                Upload background image
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                                PNG, JPEG, WebP (max 1MB)
                            </Text>
                        </VStack>
                    )}
                </VStack>
            </Box>
            {!!error ||
                (fileRejections.length > 0 && (
                    <Text mt={2} fontSize="sm" color="red.500">
                        {error || fileRejections[0].errors[0].message}
                    </Text>
                ))}
        </Box>
    )
}
