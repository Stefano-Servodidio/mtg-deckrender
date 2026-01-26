'use client'

import { useEffect, useState } from 'react'
import {
    Box,
    Container,
    Heading,
    Text,
    VStack,
    Divider,
    Link,
    Spinner,
    Alert,
    AlertIcon,
    Badge,
    HStack
} from '@chakra-ui/react'
import { format } from 'date-fns'
import type { Release, ReleaseApiResponse } from '@/types/release'

export default function ReleaseNotesPage() {
    const [releases, setReleases] = useState<Release[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchReleases() {
            try {
                const response = await fetch('/api/releases')
                if (!response.ok) {
                    throw new Error('Failed to fetch releases')
                }

                const data: ReleaseApiResponse = await response.json()
                setReleases(data.releases)
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : 'An error occurred while fetching releases'
                )
            } finally {
                setLoading(false)
            }
        }

        fetchReleases()
    }, [])

    if (loading) {
        return (
            <Container maxW="container.lg" py={10}>
                <VStack spacing={4}>
                    <Spinner size="xl" color="blue.500" />
                    <Text>Loading release notes...</Text>
                </VStack>
            </Container>
        )
    }

    if (error) {
        return (
            <Container maxW="container.lg" py={10}>
                <Alert status="error">
                    <AlertIcon />
                    {error}
                </Alert>
            </Container>
        )
    }

    return (
        <Container maxW="container.lg" py={10}>
            <VStack spacing={8} align="stretch">
                <Box>
                    <Heading as="h1" size="2xl" mb={2}>
                        Release Notes
                    </Heading>
                    <Text color="gray.600" fontSize="lg">
                        Stay updated with the latest features, improvements, and
                        bug fixes.
                    </Text>
                </Box>

                <Divider />

                {releases.length === 0 ? (
                    <Alert status="info">
                        <AlertIcon />
                        No releases available yet.
                    </Alert>
                ) : (
                    <VStack spacing={8} align="stretch">
                        {releases.map((release, index) => (
                            <Box
                                key={release.id}
                                p={6}
                                borderWidth={1}
                                borderRadius="lg"
                                borderColor="gray.200"
                                bg={index === 0 ? 'blue.50' : 'white'}
                                position="relative"
                            >
                                <VStack align="stretch" spacing={4}>
                                    <HStack
                                        justify="space-between"
                                        flexWrap="wrap"
                                        gap={2}
                                    >
                                        <Heading as="h2" size="lg">
                                            {release.name}
                                        </Heading>
                                        {index === 0 && (
                                            <Badge
                                                colorScheme="blue"
                                                fontSize="sm"
                                                px={2}
                                                py={1}
                                            >
                                                Latest
                                            </Badge>
                                        )}
                                    </HStack>

                                    <HStack
                                        fontSize="sm"
                                        color="gray.600"
                                        spacing={4}
                                        flexWrap="wrap"
                                    >
                                        <Text>
                                            Released:{' '}
                                            {format(
                                                new Date(release.published_at),
                                                'MMMM d, yyyy'
                                            )}
                                        </Text>
                                        <Text>•</Text>
                                        <Link
                                            href={release.html_url}
                                            isExternal
                                            color="blue.600"
                                            _hover={{
                                                textDecoration: 'underline'
                                            }}
                                        >
                                            View on GitHub
                                        </Link>
                                    </HStack>

                                    <Divider />

                                    <Box
                                        className="release-body"
                                        fontSize="sm"
                                        sx={{
                                            '& h2': {
                                                fontSize: 'lg',
                                                fontWeight: 'bold',
                                                mt: 4,
                                                mb: 2
                                            },
                                            '& h3': {
                                                fontSize: 'md',
                                                fontWeight: 'semibold',
                                                mt: 3,
                                                mb: 2
                                            },
                                            '& ul': {
                                                pl: 6,
                                                my: 2
                                            },
                                            '& li': {
                                                my: 1
                                            },
                                            '& a': {
                                                color: 'blue.600',
                                                textDecoration: 'underline'
                                            },
                                            '& p': {
                                                my: 2
                                            },
                                            '& code': {
                                                bg: 'gray.100',
                                                px: 1,
                                                py: 0.5,
                                                borderRadius: 'sm',
                                                fontSize: 'sm'
                                            }
                                        }}
                                        dangerouslySetInnerHTML={{
                                            __html: formatReleaseBody(
                                                release.body
                                            )
                                        }}
                                    />
                                </VStack>
                            </Box>
                        ))}
                    </VStack>
                )}
            </VStack>
        </Container>
    )
}

// Simple markdown-like formatting for release body
function formatReleaseBody(body: string): string {
    // Convert markdown to HTML
    let html = body
        // Headers
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        // Bold
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Links
        .replace(
            /\[([^\]]+)\]\(([^)]+)\)/g,
            '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
        )
        // Bullet points - convert individual items
        .replace(/^\* (.*)$/gim, '<li>$1</li>')

    // Wrap consecutive <li> items in <ul>
    html = html.replace(/(<li>[\s\S]*?<\/li>)/g, (match) => {
        return `<ul>${match}</ul>`
    })

    // Line breaks
    html = html.replace(/\n/g, '<br />')

    return html
}
