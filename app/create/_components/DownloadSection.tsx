'use client'
import { Box, Button, Text, VStack } from '@chakra-ui/react'
import React from 'react'
import { FaDownload } from 'react-icons/fa'
import Image from 'next/image'

export interface DownloadSectionProps {
    generatedImage: string | null
}
const DownloadSection: React.FC<DownloadSectionProps> = ({
    generatedImage
}) => {
    return (
        <VStack spacing={6}>
            {generatedImage ? (
                <>
                    <Text color="gray.600" textAlign="center">
                        Your deck image has been generated successfully!
                    </Text>

                    {/* Generated Image Preview */}
                    <Box
                        borderRadius="md"
                        overflow="hidden"
                        border="1px solid"
                        borderColor="gray.200"
                        maxW="400px"
                    >
                        <Image
                            src={generatedImage}
                            alt="Generated deck image"
                            width={400}
                            height={500}
                            style={{
                                objectFit: 'scale-down'
                            }}
                        />
                    </Box>

                    {/* Download Button */}
                    <Button
                        as="a"
                        href={generatedImage}
                        download="mtg-deck.png"
                        size="lg"
                        colorScheme="green"
                        leftIcon={<FaDownload />}
                        w={{
                            base: 'full',
                            md: 'auto'
                        }}
                        px={8}
                        _hover={{
                            transform: 'translateY(-2px)',
                            boxShadow: 'lg'
                        }}
                        transition="all 0.2s"
                    >
                        Download PNG
                    </Button>
                </>
            ) : (
                <Text color="gray.500" textAlign="center">
                    Generate your deck image first to download it.
                </Text>
            )}
        </VStack>
    )
}

export default DownloadSection
