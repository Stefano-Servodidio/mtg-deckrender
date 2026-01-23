'use client'
import { Box, Button, Text, VStack } from '@chakra-ui/react'
import React, { useState } from 'react'
import { FaDownload } from 'react-icons/fa'
import Image from 'next/image'
import { useAnalytics } from '@/hooks/useAnalytics'
import { isIOS, isSafari } from 'react-device-detect'
import Link from 'next/link'

export interface DownloadSectionProps {
    generatedImage: string | null
    cardCount?: number
}
const DownloadSection: React.FC<DownloadSectionProps> = ({
    generatedImage,
    cardCount = 0
}) => {
    const kofiCtaBottomRef = React.useRef<HTMLDivElement>(null)
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
            setTimeout(
                () =>
                    kofiCtaBottomRef.current?.scrollIntoView({
                        behavior: 'smooth'
                    }),
                100
            )

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
            <VStack
                spacing={4}
                p={12}
                mt={12}
                w="full"
                data-testid="kofi-cta-section"
                borderRadius="md"
                background="orange.100"
                display={hasDownloaded ? 'flex' : 'none'}
            >
                <Text
                    fontSize="lg"
                    color="gray.700"
                    textAlign="center"
                    fontWeight="medium"
                >
                    Enjoying MTG DeckRender? Support this project!
                </Text>
                <Text fontSize="md" color="gray.600" textAlign="center">
                    Your support helps keep this tool free and constantly
                    improving
                </Text>
                <Link
                    href="https://ko-fi.com/N4N41SRXRV"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <Button
                        data-testid="kofi-button-placeholder"
                        colorScheme="orange"
                        size="md"
                        px={6}
                        rightIcon={
                            <Image
                                width={24}
                                height={24}
                                alt={'Ko-fi Logo'}
                                src="https://storage.ko-fi.com/cdn/brandasset/v2/kofi_symbol.png?_gl=1*q56s0b*_gcl_au*MjU2MzI4NTQuMTc2OTA4ODQzMA..*_ga*MTIxNjcwMzMzMS4xNzY5MDg4NDMw*_ga_M13FZ7VQ2C*czE3NjkxNzU5MzEkbzYkZzEkdDE3NjkxNzY2MTQkajYwJGwwJGgw"
                            />
                        }
                    >
                        Buy me a coffee
                    </Button>
                </Link>
            </VStack>
            {/* Scroll target / IntersectionObserver marker for the Ko-fi CTA section */}
            <div ref={kofiCtaBottomRef} id="kofi-cta-bottom-marker" aria-hidden="true" />
        </VStack>
    )
}

export default DownloadSection
