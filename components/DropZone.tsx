'use client'

import { Box, VStack, Text, Icon, useColorModeValue } from '@chakra-ui/react'
import { useDropzone } from 'react-dropzone'
import { useCallback } from 'react'
import { FaCloudUploadAlt, FaFileAlt } from 'react-icons/fa'

interface DropZoneProps {
    onFileUpload: (files: File[]) => void
}

export function DropZone({ onFileUpload }: DropZoneProps) {
    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            onFileUpload(acceptedFiles)
        },
        [onFileUpload]
    )

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'text/plain': ['.txt']
        },
        multiple: false
    })

    const bg = useColorModeValue('gray.50', 'gray.700')
    const borderColor = isDragActive ? 'purple.400' : 'gray.300'
    const hoverBg = useColorModeValue('purple.50', 'purple.900')

    return (
        <Box
            {...getRootProps()}
            w="full"
            p={12}
            border="2px dashed"
            borderColor={borderColor}
            borderRadius="lg"
            bg={bg}
            cursor="pointer"
            transition="all 0.2s"
            _hover={{
                bg: hoverBg,
                borderColor: 'purple.300',
                transform: 'scale(1.01)'
            }}
            textAlign="center"
        >
            <input {...getInputProps()} />
            <VStack spacing={4}>
                <Icon
                    as={isDragActive ? FaFileAlt : FaCloudUploadAlt}
                    w={12}
                    h={12}
                    color={isDragActive ? 'purple.500' : 'gray.400'}
                    transition="color 0.2s"
                />
                {isDragActive ? (
                    <Text fontSize="lg" color="purple.500" fontWeight="medium">
                        Drop your file here...
                    </Text>
                ) : (
                    <VStack spacing={2}>
                        <Text
                            fontSize="lg"
                            fontWeight="medium"
                            color="gray.600"
                        >
                            Drag & drop a text file here
                        </Text>
                        <Text fontSize="sm" color="gray.500">
                            or click to browse files
                        </Text>
                        <Text fontSize="xs" color="gray.400">
                            Supports .txt files only
                        </Text>
                    </VStack>
                )}
            </VStack>
        </Box>
    )
}
