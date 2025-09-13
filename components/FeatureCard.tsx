import { Box, Heading, IconProps, Stack, Text, VStack } from '@chakra-ui/react'
import React from 'react'

const FeatureCard: React.FC<{
    icon: React.ReactElement<IconProps>
    title: React.ReactNode
    description: React.ReactNode
}> = ({ icon, title, description }) => {
    return (
        <Box
            bg="white"
            p={8}
            borderRadius="lg"
            shadow="md"
            flex={1}
            _hover={{ shadow: 'lg' }}
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
                <Text color="gray.600">{description}</Text>
            </VStack>
        </Box>
    )
}

export default FeatureCard
