import {
    Box,
    Container,
    Heading,
    Text,
    Button,
    VStack,
    HStack,
    Icon,
    useColorModeValue,
    Flex
} from '@chakra-ui/react'
import { FaImage, FaDownload, FaUpload } from 'react-icons/fa'
import Link from 'next/link'
import { ClientHomePage } from '@/components/ClientHomePage'

// This page is now statically generated
export default function Home() {
    return <ClientHomePage />
}

// Enable static generation
export const dynamic = 'force-static'
export const revalidate = false
