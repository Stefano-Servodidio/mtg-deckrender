import { Box, Container, Heading, Text, VStack } from '@chakra-ui/react'
import { gradients } from '@/theme/gradients'
import WrenchIcon from '@/components/icons/WrenchIcon'

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
                    <WrenchIcon boxSize={12} color="gray.500" />
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
