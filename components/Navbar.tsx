import {
    Box,
    Container,
    Flex,
    Heading,
    Button,
    // useColorModeValue,
    HStack,
    MenuButton
} from '@chakra-ui/react'
import { FaHome, FaImage, FaPlus } from 'react-icons/fa'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, IconButton, MenuList, MenuItem } from '@chakra-ui/react'
import { FaBars } from 'react-icons/fa'

export function Navbar() {
    // const pathname = window?.location?.pathname
    // const bg = useColorModeValue('white', 'gray.800')
    // const borderColor = useColorModeValue('gray.200', 'gray.700')
    // const menuHighlightBg = useColorModeValue('purple.50', 'purple.900')
    const bg = 'white'
    const borderColor = 'gray.200'
    const menuHighlightBg = 'purple.50'

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
            <Container maxW="7xl" py={4}>
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

                    <HStack spacing={4} display={{ base: 'none', md: 'flex' }}>
                        <Link href="/" style={{ textDecoration: 'none' }}>
                            <Button
                                variant="ghost"
                                leftIcon={<FaHome />}
                                size="md"
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
                                _hover={{
                                    transform: 'translateY(-1px)',
                                    boxShadow: 'md'
                                }}
                                transition="all 0.2s"
                            >
                                Create
                            </Button>
                        </Link>
                    </HStack>
                    <Box display={{ base: 'block', md: 'none' }}>
                        <Menu autoSelect={false}>
                            <MenuButton
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
    )
}
