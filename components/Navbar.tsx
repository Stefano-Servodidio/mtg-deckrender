'use client'

import {
    Box,
    Container,
    Flex,
    Heading,
    Button,
    useColorModeValue,
    useColorMode,
    HStack,
    MenuButton,
    IconButton
} from '@chakra-ui/react'
import { FaHome, FaImage, FaMoon, FaSun } from 'react-icons/fa'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, MenuList, MenuItem } from '@chakra-ui/react'
import { FaBars } from 'react-icons/fa'
import { useEffect } from 'react'

export function Navbar() {
    const { colorMode, toggleColorMode } = useColorMode()
    const bg = useColorModeValue('white', 'gray.800')
    const borderColor = useColorModeValue('gray.200', 'gray.700')

    // Sync color mode with our custom localStorage key
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('mtg-deck-theme-mode', colorMode)
        }
    }, [colorMode])

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
                            <Box
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
                            </Box>
                            <Heading
                                size="lg"
                                bgGradient="linear(to-r, purple.400, blue.400)"
                                bgClip="text"
                                whiteSpace={'nowrap'}
                            >
                                MTG Deck to PNG
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
                                _hover={{
                                    bg: useColorModeValue('purple.50', 'purple.900'),
                                    color: useColorModeValue('purple.600', 'purple.200')
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
                                _hover={{
                                    transform: 'translateY(-1px)',
                                    boxShadow: 'md'
                                }}
                                transition="all 0.2s"
                            >
                                Create
                            </Button>
                        </Link>
                        <IconButton
                            data-testid="theme-toggle-button"
                            aria-label="Toggle theme"
                            icon={colorMode === 'light' ? <FaMoon /> : <FaSun />}
                            onClick={toggleColorMode}
                            variant="ghost"
                            size="md"
                        />
                    </HStack>
                    <Box
                        data-testid="navbar-links-mobile"
                        display={{ base: 'block', md: 'none' }}
                    >
                        <HStack spacing={2}>
                            <IconButton
                                data-testid="theme-toggle-button-mobile"
                                aria-label="Toggle theme"
                                icon={colorMode === 'light' ? <FaMoon /> : <FaSun />}
                                onClick={toggleColorMode}
                                variant="ghost"
                                size="md"
                            />
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
                                            color={useColorModeValue('purple.600', 'purple.200')}
                                            _hover={{ bg: useColorModeValue('purple.50', 'purple.900') }}
                                        >
                                            Home
                                        </MenuItem>
                                    </Link>
                                    <Link href="/create" passHref>
                                        <MenuItem
                                            icon={<FaImage />}
                                            fontWeight="bold"
                                            color={useColorModeValue('orange.600', 'orange.200')}
                                            _hover={{ bg: useColorModeValue('orange.50', 'orange.900') }}
                                        >
                                            Create
                                        </MenuItem>
                                    </Link>
                                </MenuList>
                            </Menu>
                        </HStack>
                    </Box>
                </Flex>
            </Container>
        </Box>
    )
}
