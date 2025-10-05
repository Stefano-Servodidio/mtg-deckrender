import {
    Box,
    Heading,
    IconProps,
    Stack,
    Text,
    VStack,
    useColorModeValue
} from '@chakra-ui/react'
import React from 'react'

const FeatureCard: React.FC<{
    icon: React.ReactElement<IconProps>
    title: React.ReactNode
    description: React.ReactNode
}> = ({ icon, title, description }) => {
    const bg = useColorModeValue('white', 'gray.700')
    const textColor = useColorModeValue('gray.600', 'gray.300')
    const shadow = useColorModeValue('md', 'dark-lg')
    const hoverShadow = useColorModeValue('lg', 'dark-xl')

    return (
        <Box
            bg={bg}
            p={8}
            borderRadius="lg"
            shadow={shadow}
            flex={1}
            _hover={{ shadow: hoverShadow }}
            transition="shadow 0.2s"
        >
            <VStack spacing={4} align="start">
                <Stack
                    flexDirection={{ base: 'row', md: 'column' }}
                    spacing={4}
                    align={{ base: 'center', md: 'start' }}
                >
                    {icon}
                    <Heading size="md">{title}</Heading>
                </Stack>
                <Text color={textColor}>{description}</Text>
            </VStack>
        </Box>
    )
}

export default FeatureCard
