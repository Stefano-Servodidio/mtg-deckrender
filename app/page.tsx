'use client'

import {
    Box,
    Container,
    Heading,
    Text,
    Button,
    VStack,
    HStack
} from '@chakra-ui/react'
import Link from 'next/link'
import { Footer } from '@/components/Footer'
import { Navbar } from '@/components/Navbar'
import ImageIcon from '@/components/icons/ImageIcon'
import DownloadIcon from '@/components/icons/DownloadIcon'
import UploadIcon from '@/components/icons/UploadIcon'
import { gradients } from '@/theme/gradients'
import { useAnalytics } from '@/hooks/useAnalytics'
import BlogSection from '@/components/BlogSection'

export default function Home() {
    const analytics = useAnalytics()

    return (
        <Box
            minH="100vh"
            bgGradient={gradients.background.purple}
            display="flex"
            flexDirection="column"
        >
            <Navbar />

            {/* Hero Section */}
            <Container
                data-testid="home-page-content"
                maxW="7xl"
                pt={20}
                pb={16}
            >
                <VStack spacing={8} textAlign="center">
                    <VStack spacing={4}>
                        <Heading
                            size={{ base: '2xl', md: '3xl' }}
                            bgGradient={gradients.header.purple}
                            bgClip="text"
                            fontWeight="bold"
                        >
                            MTG DeckRender
                        </Heading>
                        <Text
                            fontSize={{ base: 'lg', md: 'xl' }}
                            color="gray.600"
                            maxW="2xl"
                        >
                            Transform your Magic: The Gathering decklists into
                            beautiful, shareable images. Perfect for social
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
                            data-testid="hero-cta-button"
                            size="xl"
                            colorScheme="orange"
                            px={8}
                            py={6}
                            fontSize="xl"
                            fontWeight={'bold'}
                            onClick={() =>
                                analytics.trackButtonClick(
                                    'Create Deck Image (Hero CTA)',
                                    {
                                        click_url: '/create',
                                        event_label: 'hero_cta'
                                    }
                                )
                            }
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

            {/* Blog Section */}
            <BlogSection maxPosts={3} />

            <Footer />
        </Box>
    )
}
