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
    Skeleton,
    SkeletonText
} from '@chakra-ui/react'
import { useEffect } from 'react'
import Link from 'next/link'
import BlogHeader from './BlogHeader'
import BlogFooter from './BlogFooter'
import { usePosts } from '@/hooks/usePosts'

interface BlogSectionProps {
    maxPosts?: number
}

export default function BlogSection({ maxPosts = 3 }: BlogSectionProps) {
    const { data, isLoading, error, fetchPosts } = usePosts()
    const posts = data?.posts || []

    useEffect(() => {
        fetchPosts(maxPosts)
    }, [fetchPosts, maxPosts])

    if (error) {
        return null // Silently fail if blog posts can't be loaded
    }

    if (isLoading) {
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
                                    <BlogHeader
                                        title={post.title}
                                        tags={post.tags}
                                    />
                                </CardHeader>
                                <CardBody pt={2}>
                                    <VStack align="start" spacing={4}>
                                        <Text color="gray.600" noOfLines={3}>
                                            {post.excerpt}
                                        </Text>
                                        <BlogFooter
                                            author={post.author}
                                            createdAt={post.createdAt}
                                        />
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
