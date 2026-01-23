import {
    Box,
    Container,
    Text,
    VStack,
    HStack,
    Link,
    Divider,
    Flex
    // useColorModeValue
} from '@chakra-ui/react'

export function Footer() {
    // const bg = useColorModeValue('gray.50', 'gray.900')
    // const borderColor = useColorModeValue('gray.200', 'gray.700')
    // const textColor = useColorModeValue('gray.600', 'gray.400')
    // const linkColor = useColorModeValue('purple.600', 'purple.400')
    const bg = 'gray.50'
    const borderColor = 'gray.200'
    const textColor = 'gray.600'
    const linkColor = 'purple.600'

    return (
        <Box bg={bg} borderTop="1px solid" borderColor={borderColor} mt="auto">
            <Container data-testid="footer-container" maxW="7xl" py={8}>
                <Flex
                    direction={{ base: 'column', md: 'row' }}
                    gap={8}
                    align="start"
                    justify="space-between"
                >
                    {/* Left side: Disclaimers */}
                    <VStack
                        spacing={4}
                        align={{ base: 'center', md: 'start' }}
                        textAlign={{ base: 'center', md: 'left' }}
                        flex={1}
                    >
                        <Text fontSize="sm" color={textColor}>
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

                        <HStack
                            spacing={4}
                            justify={{ base: 'center', md: 'start' }}
                            wrap="wrap"
                        >
                            <Text fontSize="xs" color={textColor}>
                                © 2024 MTG Deck to PNG
                            </Text>
                            <Text fontSize="xs" color={textColor}>
                                Made for the Magic: The Gathering community
                            </Text>
                        </HStack>
                    </VStack>

                    {/* Vertical separator */}
                    <Divider
                        orientation="vertical"
                        display={{ base: 'none', md: 'block' }}
                        h="auto"
                        minH="120px"
                    />
                    <Divider display={{ base: 'block', md: 'none' }} />

                    {/* Right side: Links */}
                    <VStack
                        spacing={4}
                        align={{ base: 'center', md: 'start' }}
                        minW={{ base: 'full', md: '200px' }}
                    >
                        <Text
                            fontSize="sm"
                            fontWeight="bold"
                            color={textColor}
                            mb={2}
                        >
                            Quick Links
                        </Text>
                        <Link
                            href="mailto:info@mtgdeckrender.com?subject=MTG%20DeckRender%20bug%20report"
                            color={linkColor}
                            fontSize="sm"
                            _hover={{ textDecoration: 'underline' }}
                        >
                            Report a bug
                        </Link>
                        <Link
                            href="https://ko-fi.com/stefanoservodidio"
                            color={linkColor}
                            fontSize="sm"
                            isExternal
                            _hover={{ textDecoration: 'underline' }}
                        >
                            Buy me a coffee ☕
                        </Link>
                    </VStack>
                </Flex>
            </Container>
        </Box>
    )
}
