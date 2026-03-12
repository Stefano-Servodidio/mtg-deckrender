'use client'

import BlogFooter from '@/components/BlogFooter'
import BlogHeader from '@/components/BlogHeader'
import { Navbar } from '@/components/Navbar'
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
    VStack
} from '@chakra-ui/react'
import { useParams } from 'next/navigation'
import { useEffect } from 'react'

export default function Blog() {
    const cardBg = useColorModeValue('white', 'gray.800')

    const { slug } = useParams()
    const { data, fetchPostBySlug, isLoading } = usePostBySlug()
    const post = data?.post

    useEffect(() => {
        fetchPostBySlug(slug as string)
    }, [fetchPostBySlug, slug])

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
                {isLoading || !post ? (
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
                ) : (
                    <VStack spacing={8}>
                        <Card w="full" bg={cardBg} shadow="lg">
                            <CardHeader>
                                <BlogHeader
                                    title={post?.title}
                                    tags={post?.tags || []}
                                />
                            </CardHeader>
                            <CardBody>{post?.content}</CardBody>
                            <CardFooter>
                                <BlogFooter
                                    author={
                                        post?.author || {
                                            name: 'John Doe',
                                            avatar: 'https://i.pravatar.cc/150?img=3'
                                        }
                                    }
                                    createdAt={
                                        post?.createdAt ||
                                        new Date().toISOString()
                                    }
                                />
                            </CardFooter>
                        </Card>
                    </VStack>
                )}
            </Container>
        </Box>
    )
}
