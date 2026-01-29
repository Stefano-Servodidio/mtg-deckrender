'use client'

import {
    Box,
    Container,
    Flex,
    Heading,
    Button,
    HStack,
    MenuButton,
    VisuallyHidden
} from '@chakra-ui/react'
import { FaHome, FaImage } from 'react-icons/fa'
import Link from 'next/link'
import { Menu, IconButton, MenuList, MenuItem } from '@chakra-ui/react'
import { FaBars } from 'react-icons/fa'
import { useAnalytics } from '@/hooks/useAnalytics'

export function Navbar() {
    const analytics = useAnalytics()
    const bg = 'white'
    const borderColor = 'gray.200'

    return (
        <>
            {/* Skip to main content link for keyboard navigation */}
            <VisuallyHidden>
                <Link href="#main-content">
                    <Box
                        as="button"
                        position="absolute"
                        top={0}
                        left={0}
                        p={4}
                        bg="purple.500"
                        color="white"
                        zIndex={9999}
                        _focus={{
                            clip: 'auto',
                            height: 'auto',
                            width: 'auto',
                            position: 'static'
                        }}
                    >
                        Skip to main content
                    </Box>
                </Link>
            </VisuallyHidden>
            <Box
                as="nav"
                role="navigation"
                aria-label="Main navigation"
                bg={bg}
                borderBottom="1px solid"
                borderColor={borderColor}
                shadow="sm"
                position="sticky"
                top={0}
                zIndex={10}
            >
                <Container data-testid="navbar-container" maxW="7xl" py={4}>
                    <Flex justify="space-between" align="center">
                        <Link href="/" style={{ textDecoration: 'none' }}>
                            <HStack
                                spacing={3}
                                align="center"
                                cursor="pointer"
                                transition="transform 0.2s"
                                _hover={{
                                    transform: 'scale(1.05)'
                                }}
                                _focusVisible={{
                                    outline: '2px solid',
                                    outlineColor: 'purple.500',
                                    outlineOffset: '2px'
                                }}
                                minH="60px"
                            >
                                <Heading
                                    as="h1"
                                    size="lg"
                                    bgGradient="linear(to-r, purple.400, blue.400)"
                                    bgClip="text"
                                    whiteSpace={'nowrap'}
                                >
                                    MTG DeckRender
                                </Heading>
                            </HStack>
                        </Link>

                        <HStack
                            data-testid="navbar-links-desktop"
                            spacing={4}
                            display={{ base: 'none', md: 'flex' }}
                        >
                            <Link href="/" style={{ textDecoration: 'none' }}>
                                <Button
                                    variant="ghost"
                                    leftIcon={<FaHome aria-hidden="true" />}
                                    size="md"
                                    onClick={() =>
                                        analytics.trackLinkClick('Home', '/')
                                    }
                                    _hover={{
                                        bg: 'purple.50',
                                        color: 'purple.600'
                                    }}
                                    _focusVisible={{
                                        outline: '2px solid',
                                        outlineColor: 'purple.500',
                                        outlineOffset: '2px'
                                    }}
                                    aria-label="Go to home page"
                                >
                                    Home
                                </Button>
                            </Link>
                            <Link
                                href="/create"
                                style={{ textDecoration: 'none' }}
                            >
                                <Button
                                    variant="solid"
                                    colorScheme="orange"
                                    leftIcon={<FaImage aria-hidden="true" />}
                                    size="md"
                                    onClick={() =>
                                        analytics.trackLinkClick(
                                            'Create',
                                            '/create'
                                        )
                                    }
                                    _hover={{
                                        transform: 'translateY(-1px)',
                                        boxShadow: 'md'
                                    }}
                                    _focusVisible={{
                                        outline: '2px solid',
                                        outlineColor: 'orange.500',
                                        outlineOffset: '2px'
                                    }}
                                    transition="all 0.2s"
                                    aria-label="Create deck image"
                                >
                                    Create
                                </Button>
                            </Link>
                        </HStack>
                        <Box
                            data-testid="navbar-links-mobile"
                            display={{ base: 'block', md: 'none' }}
                        >
                            <Menu autoSelect={false}>
                                <MenuButton
                                    data-testid="navbar-mobile-menu-button"
                                    as={IconButton}
                                    icon={<FaBars aria-hidden="true" />}
                                    variant="outline"
                                    aria-label="Open navigation menu"
                                    border={'none'}
                                    _focusVisible={{
                                        outline: '2px solid',
                                        outlineColor: 'purple.500',
                                        outlineOffset: '2px'
                                    }}
                                />
                                <MenuList>
                                    <Link href="/" passHref>
                                        <MenuItem
                                            icon={<FaHome aria-hidden="true" />}
                                            fontWeight="bold"
                                            color={'purple.600'}
                                            onClick={() =>
                                                analytics.trackLinkClick(
                                                    'Home (Mobile)',
                                                    '/'
                                                )
                                            }
                                            _hover={{ bg: 'purple.50' }}
                                        >
                                            Home
                                        </MenuItem>
                                    </Link>
                                    <Link href="/create" passHref>
                                        <MenuItem
                                            icon={
                                                <FaImage aria-hidden="true" />
                                            }
                                            fontWeight="bold"
                                            color={'orange.600'}
                                            onClick={() =>
                                                analytics.trackLinkClick(
                                                    'Create (Mobile)',
                                                    '/create'
                                                )
                                            }
                                            _hover={{ bg: 'orange.50' }}
                                        >
                                            Create
                                        </MenuItem>
                                    </Link>
                                </MenuList>
                            </Menu>
                        </Box>
                    </Flex>
                </Container>
            </Box>
        </>
    )
}
