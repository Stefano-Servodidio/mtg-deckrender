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
import { useState, useCallback } from 'react'
import React from 'react'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { useCards } from '@/hooks/useCards'
import { useDeckPng } from '@/hooks/useDeckPng'
import { gradients } from '@/theme/gradients'
import UploadIcon from '@/components/icons/UploadIcon'
import ImageIcon from '@/components/icons/ImageIcon'
import DownloadIcon from '@/components/icons/DownloadIcon'
import UploadSection from './_components/UploadSection'
import ConfigureSection from './_components/ConfigureSection'
import DownloadSection from './_components/DownloadSection'
import type { DeckPngOptions } from '@/hooks/useDeckPng'
import Accordion, { AccordionSection } from '@/components/Accordion'

export default function Create() {
    const [decklistText, setDecklistText] = useState('')
    const [accordionIndex, setAccordionIndex] = useState<number[]>([0])
    const toast = useToast()

    // Use the custom hooks
    const {
        data: cardsData,
        error: cardsError,
        isLoading: isLoadingCards,
        progress: cardsProgress,
        fetchCards
    } = useCards()

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
            toast({
                title: 'Decklist uploaded!',
                description: `Cards fetched successfully. Found ${cardsData.cards?.length || 0} unique cards.`,
                status: 'success',
                duration: 3000,
                isClosable: true
            })
            // Move to configure section after successful upload
            setAccordionIndex([1])
        } else if (cardsError && !isLoadingCards) {
            toast({
                title: 'Upload failed',
                description: cardsError.message || 'Failed to fetch card data.',
                status: 'error',
                duration: 3000,
                isClosable: true
            })
        }
    }, [cardsData, cardsError, isLoadingCards, toast])

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
    }, [generatedImage, imageError, isGenerating, toast])

    /* Handlers */
    const handleUpload = async () => {
        if (!decklistText.trim()) {
            toast({
                title: 'No decklist provided',
                description: 'Please paste or upload a decklist first.',
                status: 'warning',
                duration: 3000,
                isClosable: true
            })
            return
        }

        await fetchCards(decklistText.trim())
    }

    const handleFileUpload = useCallback(
        (files: File[]) => {
            const file = files[0]
            if (file && file.type === 'text/plain') {
                const reader = new FileReader()
                reader.onload = (e) => {
                    const content = e.target?.result as string
                    setDecklistText(content)
                    toast({
                        title: 'File uploaded successfully',
                        description: 'Your decklist has been loaded.',
                        status: 'success',
                        duration: 3000,
                        isClosable: true
                    })
                }
                reader.readAsText(file)
            } else {
                toast({
                    title: 'Invalid file type',
                    description: 'Please upload a text file (.txt).',
                    status: 'error',
                    duration: 3000,
                    isClosable: true
                })
            }
        },
        [toast]
    )

    const handleGenerateImage = async (options: DeckPngOptions) => {
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

        await generateImage(cardsData.cards, options)
    }

    const sections: AccordionSection[] = [
        {
            id: 'upload',
            title: 'Upload Decklist',
            description: 'Paste your decklist or upload a text file',
            icon: <UploadIcon w={6} h={6} />,
            content: (
                <UploadSection
                    decklistText={decklistText}
                    setDecklistText={setDecklistText}
                    handleUpload={handleUpload}
                    isLoadingCards={isLoadingCards}
                    handleFileUpload={handleFileUpload}
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
            content: <DownloadSection generatedImage={generatedImage} />
        }
    ]

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
