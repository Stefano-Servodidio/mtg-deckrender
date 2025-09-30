import {
    Box,
    Container,
    Heading,
    Text,
    Button,
    VStack,
    HStack,
    Flex
} from '@chakra-ui/react'
import Link from 'next/link'
import { Footer } from '@/components/Footer'
import { Navbar } from '@/components/Navbar'
import ImageIcon from '@/components/icons/ImageIcon'
import DownloadIcon from '@/components/icons/DownloadIcon'
import UploadIcon from '@/components/icons/UploadIcon'
import { gradients } from '@/theme/gradients'
import FeatureCard from '@/components/FeatureCard'

export default function Home() {
    return (
        <Box
            minH="100vh"
            bgGradient={gradients.background.purple}
            display="flex"
            flexDirection="column"
        >
            <Navbar />

            {/* Hero Section */}
            <Container maxW="7xl" pt={20} pb={16}>
                <VStack spacing={8} textAlign="center">
                    <VStack spacing={4}>
                        <Heading
                            size={{ base: '2xl', md: '3xl' }}
                            bgGradient={gradients.header.purple}
                            bgClip="text"
                            fontWeight="bold"
                        >
                            MTG Deck to PNG
                        </Heading>
                        <Text
                            fontSize={{ base: 'lg', md: 'xl' }}
                            color="gray.600"
                            maxW="2xl"
                        >
                            Transform your Magic: The Gathering decklists into
                            beautiful, shareable PNG images. Perfect for social
                            media, forums, or keeping visual records of your
                            favorite decks.
                        </Text>
                    </VStack>

                    {/* Hero - Steps */}
                    <HStack
                        spacing={8}
                        justify="center"
                        wrap="wrap"
                        display={{ base: 'none', md: 'flex' }}
                    >
                        <VStack flex={1}>
                            <UploadIcon />
                            <Text fontWeight="semibold">Upload or Paste</Text>
                            <Text
                                fontSize="sm"
                                color="gray.500"
                                textAlign="center"
                                minH="42px"
                            >
                                Import your decklist from text, or upload a file
                            </Text>
                        </VStack>
                        <VStack flex={1}>
                            <ImageIcon />
                            <Text fontWeight="semibold">Generate Image</Text>
                            <Text
                                fontSize="sm"
                                color="gray.500"
                                textAlign="center"
                                minH="42px"
                            >
                                Convert to a high-quality deck image
                            </Text>
                        </VStack>
                        <VStack flex={1}>
                            <DownloadIcon />
                            <Text fontWeight="semibold">Download & Share</Text>
                            <Text
                                fontSize="sm"
                                color="gray.500"
                                textAlign="center"
                                minH="42px"
                            >
                                Save and share your deck images
                            </Text>
                        </VStack>
                    </HStack>

                    <Link href="/create" style={{ textDecoration: 'none' }}>
                        <Button
                            size="xl"
                            colorScheme="orange"
                            px={8}
                            py={6}
                            fontSize="xl"
                            fontWeight={'bold'}
                            _hover={{
                                transform: 'translateY(-2px)',
                                boxShadow: 'xl'
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
                    <Heading size={{ base: 'lg', md: 'xl' }} textAlign="center">
                        A deck image generator for the Magic community
                    </Heading>

                    <Flex
                        direction={{ base: 'column', md: 'row' }}
                        gap={8}
                        w="full"
                    >
                        <FeatureCard
                            icon={<ImageIcon w={6} h={6} />}
                            title="Beautiful Formatting"
                            description="Clean, professional deck images with proper card categorization and formatting that's easy to read and share."
                        />

                        <FeatureCard
                            icon={<UploadIcon w={6} h={6} />}
                            title="Multiple Input Methods"
                            description="Paste your decklist directly or upload text files. Supports various decklist formats from popular platforms."
                        />

                        <FeatureCard
                            icon={<DownloadIcon w={6} h={6} />}
                            title="Instant Download"
                            description="Generate and download your deck images instantly. No registration required, completely free to use."
                        />
                    </Flex>
                </VStack>
            </Container>
            <Footer />
        </Box>
    )
}
