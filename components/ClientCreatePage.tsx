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
import { useState, useCallback, useEffect, use } from 'react'
import { useDropzone } from 'react-dropzone'
import { FaUpload, FaImage, FaDownload, FaCog, FaList } from 'react-icons/fa'
import { Navbar } from '@/components/Navbar'
import { DropZone } from '@/components/DropZone'
import { Footer } from '@/components/Footer'
import { useCards } from '@/app/services/serverless/api'
import { ScryfallCard } from '@/app/services/scryfall/types'

export function ClientCreatePage() {
    const [decklistText, setDecklistText] = useState('')
    const [decklist, setDecklist] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)
    const [generatedImage, setGeneratedImage] = useState<string | null>(null)
    const [accordionIndex, setAccordionIndex] = useState<number[]>([0])
    const [cards, setCards] = useState<ScryfallCard[]>([])
    const toast = useToast()

    const { isLoading: isLoadingCards } = useCards(decklist, {
        onSuccess: ({ cards, errors }) => {
            if (cards.length > 0) {
                setCards(cards)
                toast({
                    title: 'Decklist uploaded!',
                    description: 'Cards fetched successfully.',
                    status: 'success',
                    duration: 3000,
                    isClosable: true
                })
            }
            if (errors.length > 0) {
                toast({
                    title: 'Some cards were not found',
                    description: `The following cards could not be found: ${errors.join(
                        ', '
                    )}`,
                    status: 'warning',
                    duration: 7000,
                    isClosable: true
                })
            }
            setDecklist('')
            if (!errors?.length) setAccordionIndex([1]) // Move to next section
            // You can add other logic here, e.g. set state
            return { cards, errors }
        },
        onError: (err) => {
            toast({
                title: 'Error fetching cards',
                description:
                    err instanceof Error
                        ? err.message
                        : 'An unknown error occurred.',
                status: 'error',
                duration: 5000,
                isClosable: true
            })
            return err
        }
    })
    console.log('Fetched cards:', cards)

    const bgGradient = useColorModeValue(
        'linear(to-br, purple.50, blue.50)',
        'linear(to-br, purple.900, blue.900)'
    )
    const cardBg = useColorModeValue('white', 'gray.800')

    const previewBg = useColorModeValue('gray.50', 'gray.700')

    const handleUpload = () => {
        setDecklist(decklistText)
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

    const handleGenerateImage = async () => {
        setIsGenerating(true)

        try {
            const response = await fetch('/api/deck-png', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    cards,
                    options: {
                        format: 'PNG',
                        width: 800,
                        height: 1000
                    }
                })
            })

            const result = await response.json()

            if (response.ok && result.success) {
                // For now, we'll use a placeholder image since we're not generating actual images yet
                // In a real implementation, you would create an actual image from the card data
                setGeneratedImage(
                    'https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg?auto=compress&cs=tinysrgb&w=800&h=1000'
                )
                toast({
                    title: 'Image generated successfully!',
                    description: `Processed ${result.data.totalUniqueCards} unique cards (${result.data.totalCards} total).`,
                    status: 'success',
                    duration: 3000,
                    isClosable: true
                })
                // Move to download section after successful generation
                setAccordionIndex([2])
            } else {
                throw new Error(result.error || 'Failed to generate image')
            }
        } catch (error) {
            console.error('Error generating image:', error)
            toast({
                title: 'Generation failed',
                description:
                    error instanceof Error
                        ? error.message
                        : 'An error occurred while generating the image.',
                status: 'error',
                duration: 5000,
                isClosable: true
            })
        } finally {
            setIsGenerating(false)
        }
    }

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
                                                    cardname. An empty line
                                                    should separate your main
                                                    deck and sideboard, when
                                                    applicable.
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

                                            {/* Progress Bar */}
                                            {/* <ProgressBar
                                                current={progress.current}
                                                total={progress.total}
                                                percentage={progress.percentage}
                                                message={progress.message}
                                                isVisible={isLoadingCards}
                                            /> */}
                                        </VStack>
                                    </AccordionPanel>
                                </AccordionItem>

                                {/* Configure Section */}
                                <AccordionItem>
                                    <AccordionButton py={6} px={8}>
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
                                            {decklistText && (
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
                                            )}

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
                                                disabled={!cards?.length}
                                            >
                                                Generate Deck Image
                                            </Button>
                                        </VStack>
                                    </AccordionPanel>
                                </AccordionItem>

                                {/* Download Section */}
                                <AccordionItem>
                                    <AccordionButton py={6} px={8}>
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
                                                        <img
                                                            src={generatedImage}
                                                            alt="Generated deck image"
                                                            style={{
                                                                width: '100%',
                                                                height: 'auto',
                                                                display: 'block'
                                                            }}
                                                        />
                                                    </Box>

                                                    {/* Download Button */}
                                                    <Button
                                                        as="a"
                                                        href={generatedImage}
                                                        download="mtg-deck.png"
                                                        target="_blank"
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
