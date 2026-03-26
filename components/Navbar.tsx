'use client'

import {
    Box,
    Container,
    Flex,
    Heading,
    Button,
    HStack,
    MenuButton
} from '@chakra-ui/react'
import { FaHome, FaImage, FaBook } from 'react-icons/fa'
import Link from 'next/link'
import { Menu, IconButton, MenuList, MenuItem } from '@chakra-ui/react'
import { FaBars } from 'react-icons/fa'
import { useAnalytics } from '@/hooks/useAnalytics'

export function Navbar() {
    const analytics = useAnalytics()
    const bg = 'white'
    const borderColor = 'gray.200'

    return (
        <Box
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
                            minH="60px"
                        >
                            {/* <Box
                                position="relative"
                                width="60px"
                                height="60px"
                                flexShrink={0}
                            >
                                <Image
                                    src="/icon.png"
                                    alt="logo"
                                    fill
                                    sizes="60px"
                                    style={{ objectFit: 'scale-down' }}
                                    priority
                                />
                            </Box> */}
                            <Heading
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
                                leftIcon={<FaHome />}
                                size="md"
                                onClick={() =>
                                    analytics.trackLinkClick('Home', '/')
                                }
                                _hover={{
                                    bg: 'purple.50',
                                    color: 'purple.600'
                                }}
                            >
                                Home
                            </Button>
                        </Link>
                        <Link href="/create" style={{ textDecoration: 'none' }}>
                            <Button
                                variant="solid"
                                colorScheme="orange"
                                leftIcon={<FaImage />}
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
                                transition="all 0.2s"
                            >
                                Create
                            </Button>
                        </Link>
                        <Link href="/guide" style={{ textDecoration: 'none' }}>
                            <Button
                                variant="ghost"
                                leftIcon={<FaBook />}
                                size="md"
                                onClick={() =>
                                    analytics.trackLinkClick('Guide', '/guide')
                                }
                                _hover={{
                                    bg: 'purple.50',
                                    color: 'purple.600'
                                }}
                            >
                                Format Guide
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
                                icon={<FaBars />}
                                variant="outline"
                                aria-label="Open menu"
                                border={'none'}
                            />
                            <MenuList>
                                <Link href="/" passHref>
                                    <MenuItem
                                        icon={<FaHome />}
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
                                        icon={<FaImage />}
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
                                <Link href="/guide" passHref>
                                    <MenuItem
                                        icon={<FaBook />}
                                        fontWeight="bold"
                                        color={'purple.600'}
                                        onClick={() =>
                                            analytics.trackLinkClick(
                                                'Guide (Mobile)',
                                                '/guide'
                                            )
                                        }
                                        _hover={{ bg: 'purple.50' }}
                                    >
                                        Format Guide
                                    </MenuItem>
                                </Link>
                            </MenuList>
                        </Menu>
                    </Box>
                </Flex>
            </Container>
        </Box>
    )
}
