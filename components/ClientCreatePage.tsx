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
    useToast
} from '@chakra-ui/react'
import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { FaUpload, FaImage, FaDownload } from 'react-icons/fa'
import { Navbar } from '@/components/Navbar'
import { DropZone } from '@/components/DropZone'
import { Footer } from '@/components/Footer'
import { useScryfallCardNamed } from '@/app/services/scryfall/api'

export function ClientCreatePage() {
    const [decklistText, setDecklistText] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [generatedImage, setGeneratedImage] = useState<string | null>(null)
    const toast = useToast()

    useScryfallCardNamed('Black Lotus')
    const bgGradient = useColorModeValue(
        'linear(to-br, purple.50, blue.50)',
        'linear(to-br, purple.900, blue.900)'
    )
    const cardBg = useColorModeValue('white', 'gray.800')

    const handleUpload = () => {
        console.log(decklistText)
        console.log(JSON.stringify(decklistText))
        console.log(decklistText.split('\n'))
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

        setIsGenerating(true)

        try {
            const response = await fetch('/api/deck-png', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    decklistText,
                    options: {
                        format: 'PNG',
                        width: 1080,
                        height: 1350
                    }
                })
            })

            const result = await response.json()

            if (response.ok && result.success) {
                setGeneratedImage(result.mockImageUrl)
                toast({
                    title: 'Image generated successfully!',
                    description: 'Your deck image is ready for download.',
                    status: 'success',
                    duration: 3000,
                    isClosable: true
                })
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
                            Paste your decklist or upload a text file to
                            generate a beautiful PNG image
                        </Text>
                    </VStack>

                    <Card w="full" bg={cardBg} shadow="lg">
                        <CardHeader>
                            <Heading size="md">Input Your Decklist</Heading>
                            <Text color="gray.600" fontSize="sm">
                                Choose one of the methods below to input your
                                Magic: The Gathering decklist
                            </Text>
                        </CardHeader>
                        <CardBody>
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
                                    <Text fontSize="sm" color="gray.500" mb={2}>
                                        Paste a list one card per line, with the
                                        quantity and cardname. An empty line
                                        should separate your main deck and
                                        sideboard, when applicable.
                                    </Text>
                                    <Textarea
                                        value={decklistText}
                                        onChange={(e) =>
                                            setDecklistText(e.target.value)
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
                                            borderColor: 'purple.300'
                                        }}
                                        _focus={{
                                            borderColor: 'purple.400',
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
                                    <DropZone onFileUpload={handleFileUpload} />
                                </Box>

                                {/* Upload Button */}
                                <Button
                                    size="lg"
                                    colorScheme="purple"
                                    leftIcon={<FaUpload />}
                                    onClick={handleUpload}
                                    isLoading={isUploading}
                                    loadingText="Uploading..."
                                    w={{ base: 'full', md: 'auto' }}
                                    px={8}
                                    _hover={{
                                        transform: 'translateY(-2px)',
                                        boxShadow: 'lg'
                                    }}
                                    transition="all 0.2s"
                                    disabled={
                                        !decklistText.trim() || isUploading
                                    }
                                >
                                    Upload Decklist
                                </Button>

                                {/* Generate Button */}
                                {/* <Button
                                    size="lg"
                                    colorScheme="purple"
                                    leftIcon={<FaImage />}
                                    onClick={handleGenerateImage}
                                    isLoading={isGenerating}
                                    loadingText="Generating..."
                                    w={{ base: 'full', md: 'auto' }}
                                    px={8}
                                    _hover={{
                                        transform: 'translateY(-2px)',
                                        boxShadow: 'lg'
                                    }}
                                    transition="all 0.2s"
                                >
                                    Generate Deck Image
                                </Button> */}

                                {/* Download Button */}
                                {generatedImage && (
                                    <Button
                                        as="a"
                                        href={generatedImage}
                                        download="mtg-deck.png"
                                        target="_blank"
                                        size="lg"
                                        colorScheme="green"
                                        leftIcon={<FaDownload />}
                                        w={{ base: 'full', md: 'auto' }}
                                        px={8}
                                        _hover={{
                                            transform: 'translateY(-2px)',
                                            boxShadow: 'lg'
                                        }}
                                        transition="all 0.2s"
                                    >
                                        Download PNG
                                    </Button>
                                )}
                            </VStack>
                        </CardBody>
                    </Card>

                    {/* Preview Section (placeholder for future implementation) */}
                    {/* {decklistText && (
                        <Card w="full" bg={cardBg} shadow="lg">
                            <CardHeader>
                                <Heading size="md">Preview</Heading>
                                <Text color="gray.600" fontSize="sm">
                                    This is how your decklist will appear in the
                                    generated image
                                </Text>
                            </CardHeader>
                            <CardBody>
                                <Box
                                    bg={useColorModeValue(
                                        'gray.50',
                                        'gray.700'
                                    )}
                                    p={6}
                                    borderRadius="md"
                                    border="1px solid"
                                    borderColor="gray.200"
                                >
                                    <Text
                                        fontFamily="mono"
                                        fontSize="sm"
                                        whiteSpace="pre-line"
                                    >
                                        {decklistText.substring(0, 300)}
                                        {decklistText.length > 300 && '...'}
                                    </Text>
                                </Box>
                            </CardBody>
                        </Card>
                    )} */}

                    {/* Generated Image Preview */}
                    {generatedImage && (
                        <Card w="full" bg={cardBg} shadow="lg">
                            <CardHeader>
                                <Heading size="md">Generated Image</Heading>
                                <Text color="gray.600" fontSize="sm">
                                    Your deck image is ready! Click download to
                                    save it.
                                </Text>
                            </CardHeader>
                            <CardBody>
                                <VStack spacing={4}>
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
                                </VStack>
                            </CardBody>
                        </Card>
                    )}
                </VStack>
            </Container>

            <Footer />
        </Box>
    )
}
