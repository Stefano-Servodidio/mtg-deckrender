import { Box, Container, Heading, Text, VStack, Button } from '@chakra-ui/react'
import Link from 'next/link'
import { gradients } from '@/theme/gradients'

export default function NotFound() {
    return (
        <Box
            minH="100vh"
            bgGradient={gradients.background.purple}
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
        >
            <Container maxW="2xl" centerContent>
                <VStack spacing={6} textAlign="center">
                    <Heading
                        size="2xl"
                        bgGradient={gradients.header.purple}
                        bgClip="text"
                        fontWeight="bold"
                        lineHeight={{ base: '1.3', md: '1.4' }}
                    >
                        404 - Page Not Found
                    </Heading>
                    <Text fontSize="xl" color="gray.600" maxW="md">
                        The page you are looking for does not exist or has been
                        moved.
                    </Text>
                    <Link href="/" style={{ textDecoration: 'none' }}>
                        <Button
                            size="lg"
                            colorScheme="orange"
                            px={8}
                            py={6}
                            fontSize="lg"
                            fontWeight="bold"
                            _hover={{
                                transform: 'translateY(-2px)',
                                boxShadow: 'xl'
                            }}
                            transition="all 0.2s"
                        >
                            Go to Home
                        </Button>
                    </Link>
                </VStack>
            </Container>
        </Box>
    )
}
