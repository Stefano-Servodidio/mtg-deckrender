'use client'

import {
    Box,
    Container,
    Heading,
    Text,
    VStack,
    useColorModeValue,
    Card,
    CardBody,
    useToast
} from '@chakra-ui/react'
import { useCallback, useMemo, useState } from 'react'
import React from 'react'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
// import { useCards } from '@/hooks/useCards'
import { useDeckPng } from '@/hooks/useDeckPng'
import { useAnalytics } from '@/hooks/useAnalytics'
import { gradients } from '@/theme/gradients'
import UploadIcon from '@/components/icons/UploadIcon'
import ImageIcon from '@/components/icons/ImageIcon'
import DownloadIcon from '@/components/icons/DownloadIcon'
import UploadSection from './_components/UploadSection'
import ConfigureSection from './_components/ConfigureSection'
import DownloadSection from './_components/DownloadSection'
import Accordion, { AccordionSection } from '@/components/Accordion'
import { DeckPngOptions } from '../../types/api'
import { useCollections } from '@/hooks/useCollections'

export default function Create() {
    const [accordionIndex, setAccordionIndex] = useState<number[]>([0])
    const toast = useToast()
    const analytics = useAnalytics()

    const {
        data: cardsData,
        error: cardsError,
        isLoading: isLoadingCards,
        progress: cardsProgress,
        fetchCollections: fetchCards
    } = useCollections()

    const {
        data: generatedImage,
        error: imageError,
        isLoading: isGenerating,
        progress: imageProgress,
        generateImage
    } = useDeckPng()

    const cardBg = useColorModeValue('white', 'gray.800')

    /* lifecycle hooks */

    // Handle cards fetch completion
    React.useEffect(() => {
        if (cardsData && !isLoadingCards && !cardsError) {
            // Track successful card fetch
            analytics.trackCardsFetch({
                cards_requested: cardsData.cards?.length || 0,
                cards_found: cardsData.cards?.length || 0,
                cards_missing: cardsData.errors?.length || 0,
                fetch_method: 'collection'
            })

            if (cardsData?.errors?.length) {
                toast({
                    title: 'Some cards were not found',
                    description: `Fetched ${
                        cardsData.cards?.length || 0
                    } unique cards. ${cardsData.errors.length} cards could not be found:\n${cardsData.errors
                        .map((e: string) => `- ${e}`)
                        .join('\n')}`,
                    status: 'warning',
                    duration: 5000,
                    isClosable: true
                })
            } else {
                toast({
                    title: 'Decklist uploaded!',
                    description: `Cards fetched successfully. Found ${cardsData.cards?.length || 0} unique cards.`,
                    status: 'success',
                    duration: 3000,
                    isClosable: true
                })
                // Move to configure section after successful upload
            }
            setAccordionIndex([1])
        } else if (cardsError && !isLoadingCards) {
            // Track error
            analytics.trackError(
                cardsError.message || 'Card fetch failed',
                false
            )

            toast({
                title: 'Upload failed',
                description: cardsError.message || 'Failed to fetch card data.',
                status: 'error',
                duration: 3000,
                isClosable: true
            })
        }
    }, [cardsData, cardsError, isLoadingCards, toast, analytics])

    // Handle image generation completion
    React.useEffect(() => {
        if (generatedImage && !isGenerating && !imageError) {
            toast({
                title: 'Image generated successfully!',
                description: `Generated deck image with ${cardsData?.cards?.length || 0} unique cards.`,
                status: 'success',
                duration: 3000,
                isClosable: true
            })
            // Move to download section after successful generation
            setAccordionIndex([2])
        } else if (imageError && !isGenerating) {
            // Track error
            analytics.trackError(
                imageError.message || 'Image generation failed',
                false
            )

            toast({
                title: 'Generation failed',
                description:
                    imageError.message ||
                    'An error occurred while generating the image.',
                status: 'error',
                duration: 5000,
                isClosable: true
            })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [generatedImage, imageError, isGenerating, toast, analytics])

    /* Handlers */
    const handleGenerateImage = useCallback(
        async (options: DeckPngOptions) => {
            if (!cardsData?.cards || cardsData.cards.length === 0) {
                toast({
                    title: 'No cards available',
                    description: 'Please upload and fetch cards first.',
                    status: 'warning',
                    duration: 3000,
                    isClosable: true
                })
                return
            }
            // Track image generation
            analytics.trackImageGeneration({
                image_variant: options.imageVariant || 'grid',
                image_size: options.imageSize || 'ig_square',
                image_format: options.fileType || 'png',
                card_count: cardsData.cards.length,
                sort_by: options.sortBy
            })

            await generateImage(cardsData.cards, options)
        },
        [cardsData, toast, generateImage, analytics]
    )

    const sections: AccordionSection[] = useMemo(
        () => [
            {
                id: 'upload',
                title: 'Upload Decklist',
                description: 'Paste your decklist or upload a text file',
                icon: <UploadIcon w={6} h={6} />,
                content: (
                    <UploadSection
                        fetchCards={fetchCards}
                        isLoadingCards={isLoadingCards}
                        progress={cardsProgress}
                    />
                )
            },
            {
                id: 'configure',
                title: 'Configure Image',
                description: 'Adjust the settings for your deck image',
                icon: <ImageIcon w={6} h={6} />,
                content: (
                    <ConfigureSection
                        handleGenerateImage={handleGenerateImage}
                        isGenerating={isGenerating}
                        progress={imageProgress}
                        cardsData={cardsData}
                    />
                )
            },
            {
                id: 'download',
                title: 'Download Deck Image',
                description: 'Download your generated deck image',
                icon: <DownloadIcon w={6} h={6} />,
                content: (
                    <DownloadSection
                        generatedImage={generatedImage}
                        cardCount={cardsData?.cards?.length || 0}
                    />
                )
            }
        ],
        [
            fetchCards,
            isLoadingCards,
            cardsProgress,
            handleGenerateImage,
            isGenerating,
            imageProgress,
            cardsData,
            generatedImage
        ]
    )

    return (
        <Box
            minH="100vh"
            bgGradient={gradients.background.orange}
            display="flex"
            flexDirection="column"
        >
            <Navbar />

            <Container maxW="5xl" pt={20} pb={16} px={{ base: 4, md: 16 }}>
                <VStack spacing={8}>
                    <VStack spacing={4} textAlign="center">
                        <Heading
                            size="xl"
                            bgGradient={gradients.header.orange}
                            bgClip="text"
                        >
                            Create Your Deck Image
                        </Heading>
                        <Text fontSize="lg" color="gray.600" maxW="2xl">
                            Follow the steps below to generate a beautiful PNG
                            image from your decklist
                        </Text>
                    </VStack>

                    <Card w="full" bg={cardBg} shadow="lg">
                        <CardBody p={0}>
                            <Accordion
                                sections={sections}
                                index={accordionIndex}
                                onChange={(expandedIndex) =>
                                    setAccordionIndex(
                                        Array.isArray(expandedIndex)
                                            ? expandedIndex
                                            : [expandedIndex]
                                    )
                                }
                                allowMultiple
                                defaultIndex={0}
                            />
                        </CardBody>
                    </Card>
                </VStack>
            </Container>

            <Footer />
        </Box>
    )
}
