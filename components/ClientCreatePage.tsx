'use client'

import {
    Box,
    Container,
    Heading,
    Text,
    Button,
    VStack,
    HStack,
    Textarea,
    useColorModeValue,
    Card,
    CardBody,
    CardHeader,
    Divider,
    useToast,
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionPanel,
    AccordionIcon
} from '@chakra-ui/react'
import { useState, useCallback } from 'react'
import React from 'react'
import { useDropzone } from 'react-dropzone'
import { FaUpload, FaImage, FaDownload, FaCog, FaList } from 'react-icons/fa'
import { Navbar } from '@/components/Navbar'
import { DropZone } from '@/components/DropZone'
import { Footer } from '@/components/Footer'
import { useCards } from '@/hooks/useCards'
import { useDeckPng } from '@/hooks/useDeckPng'
import Image from 'next/image'

export function ClientCreatePage() {
    const [decklistText, setDecklistText] = useState('')
    const [accordionIndex, setAccordionIndex] = useState<number[]>([0])
    const toast = useToast()

    // Use the custom hooks
    const {
        data: cardsData,
        error: cardsError,
        isLoading: isLoadingCards,
        fetchCards
    } = useCards()

    const {
        data: generatedImage,
        error: imageError,
        isLoading: isGenerating,
        generateImage
    } = useDeckPng()

    const bgGradient = useColorModeValue(
        'linear(to-br, purple.50, blue.50)',
        'linear(to-br, purple.900, blue.900)'
    )
    const cardBg = useColorModeValue('white', 'gray.800')
    const previewBg = useColorModeValue('gray.50', 'gray.700')

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

    const handleGenerateImage = async () => {
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

        await generateImage(cardsData.cards)
    }

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
    }, [
        generatedImage,
        imageError,
        isGenerating,
        cardsData?.cards?.length,
        toast
    ])

    return (
        <Box
            minH="100vh"
            bgGradient={bgGradient}
            display="flex"
            flexDirection="column"
        >
            <Navbar />

            <Container maxW="5xl" pt={20} pb={16}>
                <VStack spacing={8}>
                    <VStack spacing={4} textAlign="center">
                        <Heading
                            size="xl"
                            bgGradient="linear(to-r, purple.400, blue.400)"
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
                            >
                                {/* Upload List Section */}
                                <AccordionItem>
                                    <AccordionButton py={6} px={8}>
                                        <HStack
                                            flex="1"
                                            textAlign="left"
                                            spacing={3}
                                        >
                                            <FaList color="purple" />
                                            <VStack align="start" spacing={1}>
                                                <Heading size="md">
                                                    Upload Decklist
                                                </Heading>
                                                <Text
                                                    fontSize="sm"
                                                    color="gray.600"
                                                >
                                                    Paste your decklist or
                                                    upload a text file
                                                </Text>
                                            </VStack>
                                        </HStack>
                                        <AccordionIcon />
                                    </AccordionButton>
                                    <AccordionPanel pb={8} px={8}>
                                        <VStack spacing={6}>
                                            {/* Textarea Section */}
                                            <Box w="full">
                                                <Text
                                                    fontWeight="semibold"
                                                    mb={3}
                                                    color="gray.700"
                                                >
                                                    Paste Decklist Text
                                                </Text>
                                                <Text
                                                    fontSize="sm"
                                                    color="gray.500"
                                                    mb={2}
                                                >
                                                    Paste a list one card per
                                                    line, with the quantity and
                                                    cardname.
                                                </Text>
                                                <Textarea
                                                    value={decklistText}
                                                    onChange={(e) =>
                                                        setDecklistText(
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="Paste your decklist here..."
                                                    size="lg"
                                                    minH="200px"
                                                    bg={useColorModeValue(
                                                        'gray.50',
                                                        'gray.700'
                                                    )}
                                                    border="2px dashed"
                                                    borderColor="gray.300"
                                                    _hover={{
                                                        borderColor:
                                                            'purple.300'
                                                    }}
                                                    _focus={{
                                                        borderColor:
                                                            'purple.400',
                                                        boxShadow:
                                                            '0 0 0 1px var(--chakra-colors-purple-400)'
                                                    }}
                                                />
                                            </Box>

                                            <HStack w="full" align="center">
                                                <Divider />
                                                <Text
                                                    color="gray.500"
                                                    fontWeight="medium"
                                                    px={4}
                                                >
                                                    OR
                                                </Text>
                                                <Divider />
                                            </HStack>

                                            {/* File Upload Section */}
                                            <Box w="full">
                                                <Text
                                                    fontWeight="semibold"
                                                    mb={3}
                                                    color="gray.700"
                                                >
                                                    Upload Text File
                                                </Text>
                                                <DropZone
                                                    onFileUpload={
                                                        handleFileUpload
                                                    }
                                                />
                                            </Box>

                                            {/* Upload Button */}
                                            <Button
                                                size="lg"
                                                colorScheme="purple"
                                                leftIcon={<FaUpload />}
                                                onClick={handleUpload}
                                                isLoading={isLoadingCards}
                                                loadingText="Uploading..."
                                                w={{ base: 'full', md: 'auto' }}
                                                px={8}
                                                _hover={{
                                                    transform:
                                                        'translateY(-2px)',
                                                    boxShadow: 'lg'
                                                }}
                                                transition="all 0.2s"
                                                disabled={
                                                    !decklistText.trim() ||
                                                    isLoadingCards
                                                }
                                            >
                                                Upload Decklist
                                            </Button>

                                            {/* Loading indicator */}
                                            {/* {isLoadingCards && (
                                                <Text
                                                    color="blue.500"
                                                    textAlign="center"
                                                >
                                                    Fetching card data...
                                                </Text>
                                            )} */}

                                            {/* Success indicator */}
                                            {/* {cardsData?.cards && (
                                                <Text
                                                    color="green.500"
                                                    textAlign="center"
                                                >
                                                    Successfully loaded{' '}
                                                    {cardsData.cards.length}{' '}
                                                    unique cards!
                                                </Text>
                                            )} */}
                                        </VStack>
                                    </AccordionPanel>
                                </AccordionItem>

                                {/* Configure Section */}
                                <AccordionItem>
                                    <AccordionButton
                                        py={6}
                                        px={8}
                                        disabled={!cardsData?.cards?.length}
                                    >
                                        <HStack
                                            flex="1"
                                            textAlign="left"
                                            spacing={3}
                                        >
                                            <FaCog color="blue" />
                                            <VStack align="start" spacing={1}>
                                                <Heading size="md">
                                                    Configure Image
                                                </Heading>
                                                <Text
                                                    fontSize="sm"
                                                    color="gray.600"
                                                >
                                                    Customize your deck image
                                                    settings
                                                </Text>
                                            </VStack>
                                        </HStack>
                                        <AccordionIcon />
                                    </AccordionButton>
                                    <AccordionPanel pb={8} px={8}>
                                        <VStack spacing={6}>
                                            <Text
                                                color="gray.600"
                                                textAlign="center"
                                            >
                                                Configuration options will be
                                                available here in future
                                                updates. For now, you can
                                                generate your deck image with
                                                default settings.
                                            </Text>

                                            {/* Preview Section */}
                                            {/* {decklistText && (
                                                <Box w="full">
                                                    <Text
                                                        fontWeight="semibold"
                                                        mb={3}
                                                        color="gray.700"
                                                    >
                                                        Decklist Preview
                                                    </Text>
                                                    <Box
                                                        bg={previewBg}
                                                        p={6}
                                                        borderRadius="md"
                                                        border="1px solid"
                                                        borderColor="gray.200"
                                                        maxH="300px"
                                                        overflowY="auto"
                                                    >
                                                        <Text
                                                            fontFamily="mono"
                                                            fontSize="sm"
                                                            whiteSpace="pre-line"
                                                        >
                                                            {decklistText}
                                                        </Text>
                                                    </Box>
                                                </Box>
                                            )} */}

                                            {/* Generate Button */}
                                            <Button
                                                size="lg"
                                                colorScheme="blue"
                                                leftIcon={<FaImage />}
                                                onClick={handleGenerateImage}
                                                isLoading={isGenerating}
                                                loadingText="Generating..."
                                                w={{ base: 'full', md: 'auto' }}
                                                px={8}
                                                _hover={{
                                                    transform:
                                                        'translateY(-2px)',
                                                    boxShadow: 'lg'
                                                }}
                                                transition="all 0.2s"
                                                disabled={
                                                    !cardsData?.cards ||
                                                    cardsData.cards.length === 0
                                                }
                                            >
                                                Generate Deck Image
                                            </Button>
                                        </VStack>
                                    </AccordionPanel>
                                </AccordionItem>

                                {/* Download Section */}
                                <AccordionItem>
                                    <AccordionButton
                                        py={6}
                                        px={8}
                                        disabled={!generatedImage}
                                    >
                                        <HStack
                                            flex="1"
                                            textAlign="left"
                                            spacing={3}
                                        >
                                            <FaDownload color="green" />
                                            <VStack align="start" spacing={1}>
                                                <Heading size="md">
                                                    Download Deck Image
                                                </Heading>
                                                <Text
                                                    fontSize="sm"
                                                    color="gray.600"
                                                >
                                                    Download your generated deck
                                                    image
                                                </Text>
                                            </VStack>
                                        </HStack>
                                        <AccordionIcon />
                                    </AccordionButton>
                                    <AccordionPanel pb={8} px={8}>
                                        <VStack spacing={6}>
                                            {generatedImage ? (
                                                <>
                                                    <Text
                                                        color="gray.600"
                                                        textAlign="center"
                                                    >
                                                        Your deck image has been
                                                        generated successfully!
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
                                                                objectFit:
                                                                    'scale-down'
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
                                                        leftIcon={
                                                            <FaDownload />
                                                        }
                                                        w={{
                                                            base: 'full',
                                                            md: 'auto'
                                                        }}
                                                        px={8}
                                                        _hover={{
                                                            transform:
                                                                'translateY(-2px)',
                                                            boxShadow: 'lg'
                                                        }}
                                                        transition="all 0.2s"
                                                    >
                                                        Download PNG
                                                    </Button>
                                                </>
                                            ) : (
                                                <Text
                                                    color="gray.500"
                                                    textAlign="center"
                                                >
                                                    Generate your deck image
                                                    first to download it.
                                                </Text>
                                            )}
                                        </VStack>
                                    </AccordionPanel>
                                </AccordionItem>
                            </Accordion>
                        </CardBody>
                    </Card>
                </VStack>
            </Container>

            <Footer />
        </Box>
    )
}
