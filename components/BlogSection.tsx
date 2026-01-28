'use client'

import {
    Container,
    Heading,
    Text,
    VStack,
    SimpleGrid,
    Card,
    CardBody,
    CardHeader,
    Image,
    Badge,
    HStack,
    Avatar,
    Skeleton,
    SkeletonText
} from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { BlogPostMetadata } from '@/types/blog'
import Link from 'next/link'

interface BlogSectionProps {
    maxPosts?: number
}

export default function BlogSection({ maxPosts = 3 }: BlogSectionProps) {
    const [posts, setPosts] = useState<BlogPostMetadata[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchPosts() {
            try {
                const response = await fetch('/api/blog')
                if (!response.ok) {
                    throw new Error('Failed to fetch blog posts')
                }
                const data = await response.json()
                setPosts(data.posts.slice(0, maxPosts))
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Failed to load blog posts'
                )
            } finally {
                setLoading(false)
            }
        }

        fetchPosts()
    }, [maxPosts])

    if (error) {
        return null // Silently fail if blog posts can't be loaded
    }

    if (loading) {
        return (
            <Container maxW="7xl" py={16}>
                <VStack spacing={8}>
                    <Heading size={{ base: 'lg', md: 'xl' }} textAlign="center">
                        Latest from our Blog
                    </Heading>
                    <SimpleGrid
                        columns={{ base: 1, md: 2, lg: 3 }}
                        spacing={8}
                        w="full"
                    >
                        {[1, 2, 3].map((i) => (
                            <Card key={i}>
                                <Skeleton height="200px" />
                                <CardBody>
                                    <SkeletonText noOfLines={4} spacing={4} />
                                </CardBody>
                            </Card>
                        ))}
                    </SimpleGrid>
                </VStack>
            </Container>
        )
    }

    if (posts.length === 0) {
        return null // Don't show section if no posts
    }

    return (
        <Container maxW="7xl" py={16}>
            <VStack spacing={8}>
                <Heading size={{ base: 'lg', md: 'xl' }} textAlign="center">
                    Latest from our Blog
                </Heading>

                <SimpleGrid
                    columns={{ base: 1, md: 2, lg: 3 }}
                    spacing={8}
                    w="full"
                >
                    {posts.map((post) => (
                        <Link
                            key={post.id}
                            href={`/blog/${post.slug}`}
                            style={{ textDecoration: 'none' }}
                        >
                            <Card
                                h="full"
                                _hover={{
                                    transform: 'translateY(-4px)',
                                    boxShadow: 'xl'
                                }}
                                _focusWithin={{
                                    outline: '2px solid',
                                    outlineColor: 'purple.500',
                                    outlineOffset: '2px'
                                }}
                                transition="all 0.2s"
                                cursor="pointer"
                            >
                                {post.coverImage && (
                                    <Image
                                        src={post.coverImage}
                                        alt={post.title}
                                        objectFit="cover"
                                        height="200px"
                                        width="100%"
                                    />
                                )}
                                <CardHeader pb={2}>
                                    <VStack align="start" spacing={2}>
                                        <Heading size="md">
                                            {post.title}
                                        </Heading>
                                        <HStack spacing={2} flexWrap="wrap">
                                            {post.tags
                                                .slice(0, 3)
                                                .map((tag) => (
                                                    <Badge
                                                        key={tag}
                                                        colorScheme="purple"
                                                        fontSize="xs"
                                                    >
                                                        {tag}
                                                    </Badge>
                                                ))}
                                        </HStack>
                                    </VStack>
                                </CardHeader>
                                <CardBody pt={2}>
                                    <VStack align="start" spacing={4}>
                                        <Text color="gray.600" noOfLines={3}>
                                            {post.excerpt}
                                        </Text>
                                        <HStack spacing={3}>
                                            <Avatar
                                                size="sm"
                                                name={post.author.name}
                                                src={post.author.avatar}
                                            />
                                            <VStack align="start" spacing={0}>
                                                <Text
                                                    fontSize="sm"
                                                    fontWeight="semibold"
                                                >
                                                    {post.author.name}
                                                </Text>
                                                <Text
                                                    fontSize="xs"
                                                    color="gray.500"
                                                >
                                                    {new Date(
                                                        post.createdAt
                                                    ).toLocaleDateString(
                                                        'en-US',
                                                        {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric'
                                                        }
                                                    )}
                                                </Text>
                                            </VStack>
                                        </HStack>
                                    </VStack>
                                </CardBody>
                            </Card>
                        </Link>
                    ))}
                </SimpleGrid>
            </VStack>
        </Container>
    )
}
