import { Box, Container, Heading, Text, VStack, Icon } from '@chakra-ui/react'
import { gradients } from '@/theme/gradients'

export default function SiteDown() {
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
                    <Icon viewBox="0 0 24 24" boxSize={20} color="orange.500">
                        <path
                            fill="currentColor"
                            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
                        />
                    </Icon>
                    <Heading
                        size="2xl"
                        bgGradient={gradients.header.purple}
                        bgClip="text"
                        fontWeight="bold"
                    >
                        Site Under Maintenance
                    </Heading>
                    <Text fontSize="xl" color="gray.600" maxW="md">
                        The site is currently under maintenance. Please check
                        back later.
                    </Text>
                    <Text fontSize="md" color="gray.500">
                        We apologize for any inconvenience.
                    </Text>
                </VStack>
            </Container>
        </Box>
    )
}
