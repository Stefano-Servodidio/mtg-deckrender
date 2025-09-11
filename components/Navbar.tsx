'use client'

import {
    Box,
    Container,
    Flex,
    Heading,
    Button,
    useColorModeValue,
    HStack
} from '@chakra-ui/react'
import { FaHome, FaPlus } from 'react-icons/fa'
import Link from 'next/link'
import Image from 'next/image'

export function Navbar() {
    const bg = useColorModeValue('white', 'gray.800')
    const borderColor = useColorModeValue('gray.200', 'gray.700')

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
                        >
                            <Image
                                src="/icon.png"
                                alt="logo"
                                width={100}
                                height={100}
                                objectFit="scale-down"
                            />
                            <Heading
                                size="lg"
                                bgGradient="linear(to-r, purple.400, blue.400)"
                                bgClip="text"
                            >
                                MTG Deck to PNG
                            </Heading>
                        </HStack>
                    </Link>

                    <HStack spacing={4}>
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
                                colorScheme="purple"
                                leftIcon={<FaPlus />}
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
                </Flex>
            </Container>
        </Box>
    )
}
