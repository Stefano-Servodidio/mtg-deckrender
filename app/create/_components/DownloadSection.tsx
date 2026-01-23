'use client'
import { Box, Button, Text, VStack } from '@chakra-ui/react'
import React, { useState } from 'react'
import { FaDownload } from 'react-icons/fa'
import Image from 'next/image'
import { useAnalytics } from '@/hooks/useAnalytics'
import { isIOS, isSafari } from 'react-device-detect'

export interface DownloadSectionProps {
    generatedImage: string | null
    cardCount?: number
}
const DownloadSection: React.FC<DownloadSectionProps> = ({
    generatedImage,
    cardCount = 0
}) => {
    const analytics = useAnalytics()
    const [hasDownloaded, setHasDownloaded] = useState(false)

    if (!generatedImage) {
        return (
            <Text
                data-testid="no-image-text"
                color="gray.500"
                textAlign="center"
            >
                Generate your deck image first to download it.
            </Text>
        )
    }

    const handleDownload = async () => {
        try {
            // Mark that download has been initiated
            setHasDownloaded(true)

            // For iOS Safari, open in new tab instead of downloading
            // This avoids the unreliable download behavior in iOS Safari
            // IMPORTANT: window.open must be called synchronously to avoid popup blockers
            if (isIOS && isSafari) {
                // Open the blob URL directly in a new tab
                // This must be called synchronously from the click handler
                window.open(generatedImage!, '_blank')
                return
            }

            // For all other browsers, use programmatic download
            const response = await fetch(generatedImage!)
            const blob = await response.blob()

            // Infer file type from blob MIME type (e.g., 'image/png' -> 'png')
            const fileType = blob.type.split('/')[1] || 'png'
            analytics.trackImageDownload(fileType, cardCount)

            // Use data URL for download
            const reader = new FileReader()
            reader.onloadend = () => {
                const link = document.createElement('a')
                link.href = reader.result as string
                link.download = `mtg-deck-render-${Date.now()}.${fileType}`
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
            }
            reader.readAsDataURL(blob)
        } catch (error) {
            console.error('Download failed:', error)
        }
    }

    return (
        <VStack spacing={6}>
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
                // Add checkered background for transparency indication
                backgroundImage="repeating-conic-gradient(#f0f0f0 0% 25%, transparent 0% 50%)"
                backgroundSize="20px 20px"
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
                data-testid="download-button"
                size="lg"
                colorScheme="green"
                leftIcon={<FaDownload />}
                onClick={handleDownload}
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
                {isIOS && isSafari ? 'Open Image in New Tab' : 'Download Image'}
            </Button>

            {/* Ko-fi CTA - shown only after download */}
            {hasDownloaded && (
                <VStack
                    spacing={4}
                    pt={6}
                    borderTop="1px solid"
                    borderColor="gray.200"
                    w="full"
                    data-testid="kofi-cta-section"
                >
                    <Text
                        fontSize="md"
                        color="gray.700"
                        textAlign="center"
                        fontWeight="medium"
                    >
                        Enjoying MTG DeckRender? Support this project! ☕
                    </Text>
                    <Text fontSize="sm" color="gray.600" textAlign="center">
                        Your support helps keep this tool free and constantly
                        improving
                    </Text>
                    <Button
                        data-testid="kofi-button-placeholder"
                        colorScheme="orange"
                        size="md"
                        variant="outline"
                        px={6}
                        _hover={{
                            bg: 'orange.50'
                        }}
                    >
                        Support via Ko-fi (Coming Soon)
                    </Button>
                </VStack>
            )}
        </VStack>
    )
}

export default DownloadSection
