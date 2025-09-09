'use client'

import {
    Box,
    Container,
    Text,
    VStack,
    HStack,
    Link,
    Divider,
    useColorModeValue
} from '@chakra-ui/react'
import { FaExternalLinkAlt } from 'react-icons/fa'

export function Footer() {
    const bg = useColorModeValue('gray.50', 'gray.900')
    const borderColor = useColorModeValue('gray.200', 'gray.700')
    const textColor = useColorModeValue('gray.600', 'gray.400')
    const linkColor = useColorModeValue('purple.600', 'purple.400')

    return (
        <Box bg={bg} borderTop="1px solid" borderColor={borderColor} mt="auto">
            <Container maxW="7xl" py={8}>
                <VStack spacing={6}>
                    <VStack spacing={4} textAlign="center">
                        <Text fontSize="sm" color={textColor} maxW="4xl">
                            <strong>Legal Disclaimer:</strong> All Magic: The
                            Gathering card images, names, and related
                            intellectual property are owned by{' '}
                            <Link
                                href="https://company.wizards.com/"
                                color={linkColor}
                                isExternal
                                _hover={{ textDecoration: 'underline' }}
                            >
                                Wizards of the Coast LLC
                            </Link>
                            . This application is not affiliated with or
                            endorsed by Wizards of the Coast LLC.
                        </Text>

                        <Text fontSize="sm" color={textColor}>
                            Card data and images are provided by the{' '}
                            <Link
                                href="https://scryfall.com/"
                                color={linkColor}
                                isExternal
                                _hover={{ textDecoration: 'underline' }}
                            >
                                Scryfall API
                            </Link>
                            . This tool is created for educational and personal
                            use only.
                        </Text>
                    </VStack>

                    <Divider />

                    <HStack spacing={8} justify="center" wrap="wrap">
                        <Text fontSize="xs" color={textColor}>
                            © 2024 MTG Deck to PNG
                        </Text>
                        <Text fontSize="xs" color={textColor}>
                            Made for the Magic: The Gathering community
                        </Text>
                    </HStack>
                </VStack>
            </Container>
        </Box>
    )
}
