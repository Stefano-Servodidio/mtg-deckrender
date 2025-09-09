'use client'

import {
    Box,
    Container,
    Heading,
    Text,
    Button,
    VStack,
    HStack,
    Icon,
    useColorModeValue,
    Flex
} from '@chakra-ui/react'
import { FaImage, FaDownload, FaUpload } from 'react-icons/fa'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'

export function ClientHomePage() {
    const bgGradient = useColorModeValue(
        'linear(to-br, purple.50, blue.50)',
        'linear(to-br, purple.900, blue.900)'
    )
    const cardBg = useColorModeValue('white', 'gray.800')

    return (
        <Box
            minH="100vh"
            bgGradient={bgGradient}
            display="flex"
            flexDirection="column"
        >
            <Navbar />

            {/* Hero Section */}
            <Container maxW="7xl" pt={20} pb={16}>
                <VStack spacing={8} textAlign="center">
                    <VStack spacing={4}>
                        <Heading
                            size="2xl"
                            bgGradient="linear(to-r, purple.400, blue.400)"
                            bgClip="text"
                            fontWeight="bold"
                        >
                            MTG Deck to PNG
                        </Heading>
                        <Text fontSize="xl" color="gray.600" maxW="2xl">
                            Transform your Magic: The Gathering decklists into
                            beautiful, shareable PNG images. Perfect for social
                            media, forums, or keeping visual records of your
                            favorite decks.
                        </Text>
                    </VStack>

                    <HStack spacing={8} justify="center" wrap="wrap">
                        <VStack>
                            <Icon
                                as={FaUpload}
                                w={8}
                                h={8}
                                color="purple.500"
                            />
                            <Text fontWeight="semibold">Upload or Paste</Text>
                            <Text
                                fontSize="sm"
                                color="gray.500"
                                textAlign="center"
                            >
                                Import your decklist from text or file
                            </Text>
                        </VStack>
                        <VStack>
                            <Icon as={FaImage} w={8} h={8} color="blue.500" />
                            <Text fontWeight="semibold">Generate Image</Text>
                            <Text
                                fontSize="sm"
                                color="gray.500"
                                textAlign="center"
                            >
                                Convert to a beautiful PNG format
                            </Text>
                        </VStack>
                        <VStack>
                            <Icon
                                as={FaDownload}
                                w={8}
                                h={8}
                                color="green.500"
                            />
                            <Text fontWeight="semibold">Download & Share</Text>
                            <Text
                                fontSize="sm"
                                color="gray.500"
                                textAlign="center"
                            >
                                Save and share your deck images
                            </Text>
                        </VStack>
                    </HStack>

                    <Link href="/create" style={{ textDecoration: 'none' }}>
                        <Button
                            size="lg"
                            colorScheme="purple"
                            px={8}
                            py={6}
                            fontSize="lg"
                            _hover={{
                                transform: 'translateY(-2px)',
                                boxShadow: 'lg'
                            }}
                            transition="all 0.2s"
                        >
                            Create Deck Image
                        </Button>
                    </Link>
                </VStack>
            </Container>

            {/* Features Section */}
            <Container maxW="7xl" py={16}>
                <VStack spacing={12}>
                    <Heading size="xl" textAlign="center">
                        Why Choose MTG Deck to PNG?
                    </Heading>

                    <Flex
                        direction={{ base: 'column', md: 'row' }}
                        gap={8}
                        w="full"
                    >
                        <Box
                            bg={cardBg}
                            p={8}
                            borderRadius="lg"
                            shadow="md"
                            flex={1}
                            _hover={{ shadow: 'lg' }}
                            transition="shadow 0.2s"
                        >
                            <VStack spacing={4} align="start">
                                <Icon
                                    as={FaImage}
                                    w={6}
                                    h={6}
                                    color="purple.500"
                                />
                                <Heading size="md">
                                    Beautiful Formatting
                                </Heading>
                                <Text color="gray.600">
                                    Clean, professional deck images with proper
                                    card categorization and formatting that's
                                    easy to read and share.
                                </Text>
                            </VStack>
                        </Box>

                        <Box
                            bg={cardBg}
                            p={8}
                            borderRadius="lg"
                            shadow="md"
                            flex={1}
                            _hover={{ shadow: 'lg' }}
                            transition="shadow 0.2s"
                        >
                            <VStack spacing={4} align="start">
                                <Icon
                                    as={FaUpload}
                                    w={6}
                                    h={6}
                                    color="blue.500"
                                />
                                <Heading size="md">
                                    Multiple Input Methods
                                </Heading>
                                <Text color="gray.600">
                                    Paste your decklist directly or upload text
                                    files. Supports various decklist formats
                                    from popular platforms.
                                </Text>
                            </VStack>
                        </Box>

                        <Box
                            bg={cardBg}
                            p={8}
                            borderRadius="lg"
                            shadow="md"
                            flex={1}
                            _hover={{ shadow: 'lg' }}
                            transition="shadow 0.2s"
                        >
                            <VStack spacing={4} align="start">
                                <Icon
                                    as={FaDownload}
                                    w={6}
                                    h={6}
                                    color="green.500"
                                />
                                <Heading size="md">Instant Download</Heading>
                                <Text color="gray.600">
                                    Generate and download your deck images
                                    instantly. No registration required,
                                    completely free to use.
                                </Text>
                            </VStack>
                        </Box>
                    </Flex>
                </VStack>
            </Container>

            <Footer />
        </Box>
    )
}
