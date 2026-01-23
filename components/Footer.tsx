import { useAnalytics } from '@/hooks/useAnalytics'
import {
    Box,
    Container,
    Text,
    VStack,
    HStack,
    Link,
    Divider,
    Flex
} from '@chakra-ui/react'

export function Footer() {
    const bg = 'gray.50'
    const borderColor = 'gray.200'
    const textColor = 'gray.600'
    const linkColor = 'purple.600'

    const analytics = useAnalytics()

    return (
        <Box bg={bg} borderTop="1px solid" borderColor={borderColor} mt="auto">
            <Container data-testid="footer-container" maxW="7xl" py={6}>
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

                        <HStack
                            spacing={4}
                            justify={{ base: 'center', md: 'start' }}
                            wrap="wrap"
                        >
                            <Text fontSize="xs" color={textColor}>
                                © 2026 Stefano Servodidio
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
                        h="100%"
                        minH="80px"
                    />
                    <Divider display={{ base: 'block', md: 'none' }} />

                    {/* Right side: Links */}
                    <VStack
                        spacing={4}
                        align={{ base: 'center', md: 'start' }}
                        minW={{ base: 'full', md: '200px' }}
                    >
                        <Link
                            href="mailto:info@mtgdeckrender.com?subject=MTG%20DeckRender%20bug%20report"
                            color={linkColor}
                            fontSize="sm"
                            _hover={{ textDecoration: 'underline' }}
                            onClick={() =>
                                analytics.trackLinkClick(
                                    'Report a bug',
                                    'mailto:info@mtgdeckrender.com?subject=MTG%20DeckRender%20bug%20report'
                                )
                            }
                        >
                            Report a bug
                        </Link>
                        <Link
                            href="https://ko-fi.com/stefanoservodidio"
                            color={linkColor}
                            fontSize="sm"
                            isExternal
                            _hover={{ textDecoration: 'underline' }}
                            onClick={() =>
                                analytics.trackLinkClick(
                                    'Footer - Buy me a coffee',
                                    'https://ko-fi.com/stefanoservodidio'
                                )
                            }
                        >
                            Buy me a coffee
                        </Link>
                    </VStack>
                </Flex>
            </Container>
        </Box>
    )
}
