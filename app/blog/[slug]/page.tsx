'use client'

import BlogFooter from '@/components/BlogFooter'
import BlogHeader from '@/components/BlogHeader'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { usePostBySlug } from '@/hooks/usePostBySlug'
import { gradients } from '@/theme/gradients'
import {
    Box,
    Card,
    CardBody,
    CardFooter,
    CardHeader,
    Container,
    Heading,
    HStack,
    Skeleton,
    SkeletonText,
    useColorModeValue,
    VStack,
    Text,
    Button
} from '@chakra-ui/react'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function Blog() {
    const cardBg = useColorModeValue('white', 'gray.800')
    const router = useRouter()

    const { slug } = useParams()
    const { data, error, fetchPostBySlug, isLoading } = usePostBySlug()
    const post = data?.post
    const hasFetched = useRef(false)

    useEffect(() => {
        // Only fetch once when slug changes
        if (slug && !hasFetched.current) {
            hasFetched.current = true
            fetchPostBySlug(slug as string)
        }
        // Reset flag when slug changes
        return () => {
            if (hasFetched.current) {
                hasFetched.current = false
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slug])

    return (
        <Box
            minH="100vh"
            bgGradient={gradients.background.purple}
            display="flex"
            flexDirection="column"
        >
            <Navbar />
            <Container maxW="5xl" pt={8} pb={16} px={{ base: 4, md: 16 }}>
                <Heading size="md" mb={4}>
                    Blog
                </Heading>
                {isLoading ? (
                    <Card>
                        <CardHeader>
                            <Skeleton height="60px" />
                        </CardHeader>
                        <CardBody>
                            <SkeletonText noOfLines={4} spacing={4} />
                            <HStack spacing={4} mt={4}>
                                <Skeleton variant="circle" size="40px" />
                                <Skeleton height="20px" width="100px" />
                            </HStack>
                        </CardBody>
                    </Card>
                ) : error || !post ? (
                    <Card w="full" bg={cardBg} shadow="lg">
                        <CardBody>
                            <VStack spacing={4} py={8}>
                                <Heading size="lg" color="gray.600">
                                    Post Not Found
                                </Heading>
                                <Text color="gray.500">
                                    The blog post you&apos;re looking for
                                    doesn&apos;t exist or has been removed.
                                </Text>
                                <Button
                                    colorScheme="purple"
                                    onClick={() => router.push('/')}
                                >
                                    Back to Home
                                </Button>
                            </VStack>
                        </CardBody>
                    </Card>
                ) : (
                    <VStack spacing={8}>
                        <Card w="full" bg={cardBg} shadow="lg">
                            <CardHeader>
                                <BlogHeader
                                    title={post.title}
                                    tags={post.tags}
                                />
                            </CardHeader>
                            <CardBody>
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        h1: ({ children }) => (
                                            <Heading size="xl" mb={4}>
                                                {children}
                                            </Heading>
                                        ),
                                        h2: ({ children }) => (
                                            <Heading size="lg" mb={3} mt={6}>
                                                {children}
                                            </Heading>
                                        ),
                                        h3: ({ children }) => (
                                            <Heading size="md" mb={2} mt={4}>
                                                {children}
                                            </Heading>
                                        ),
                                        p: ({ children }) => (
                                            <Text mb={4}>{children}</Text>
                                        ),
                                        ul: ({ children }) => (
                                            <Box as="ul" pl={6} mb={4}>
                                                {children}
                                            </Box>
                                        ),
                                        ol: ({ children }) => (
                                            <Box as="ol" pl={6} mb={4}>
                                                {children}
                                            </Box>
                                        ),
                                        li: ({ children }) => (
                                            <Box as="li" mb={1}>
                                                {children}
                                            </Box>
                                        ),
                                        code: ({ children, ...props }) => (
                                            <Box
                                                as="code"
                                                bg="gray.100"
                                                px={2}
                                                py={1}
                                                borderRadius="md"
                                                fontSize="sm"
                                                {...props}
                                            >
                                                {children}
                                            </Box>
                                        ),
                                        pre: ({ children }) => (
                                            <Box
                                                as="pre"
                                                bg="gray.100"
                                                p={4}
                                                borderRadius="md"
                                                overflowX="auto"
                                                mb={4}
                                            >
                                                {children}
                                            </Box>
                                        ),
                                        a: ({ children, href }) => (
                                            <Box
                                                as="a"
                                                href={href}
                                                color="purple.600"
                                                textDecoration="underline"
                                            >
                                                {children}
                                            </Box>
                                        ),
                                        blockquote: ({ children }) => (
                                            <Box
                                                as="blockquote"
                                                borderLeft="4px solid"
                                                borderColor="purple.500"
                                                pl={4}
                                                py={2}
                                                my={4}
                                                fontStyle="italic"
                                                color="gray.600"
                                            >
                                                {children}
                                            </Box>
                                        )
                                    }}
                                >
                                    {post.content}
                                </ReactMarkdown>
                            </CardBody>
                            <CardFooter>
                                <BlogFooter
                                    author={post.author}
                                    createdAt={post.createdAt}
                                />
                            </CardFooter>
                        </Card>
                    </VStack>
                )}
            </Container>
            <Footer />
        </Box>
    )
}
