'use client'

import {
    Box,
    Progress,
    Text,
    VStack,
    HStack,
    useColorModeValue
} from '@chakra-ui/react'

interface ProgressBarProps {
    current: number
    total: number
    percentage: number
    message: string
    isVisible: boolean
}

export function ProgressBar({
    current,
    total,
    percentage,
    message,
    isVisible
}: ProgressBarProps) {
    const textColor = useColorModeValue('gray.600', 'gray.400')
    const progressBg = useColorModeValue('gray.100', 'gray.700')

    if (!isVisible) return null

    return (
        <Box w="full" p={4} borderRadius="md" bg={useColorModeValue('blue.50', 'blue.900')}>
            <VStack spacing={3} align="stretch">
                <HStack justify="space-between">
                    <Text fontSize="sm" fontWeight="medium" color={textColor}>
                        {message}
                    </Text>
                    <Text fontSize="sm" fontWeight="medium" color={textColor}>
                        {current} / {total} ({percentage}%)
                    </Text>
                </HStack>
                
                <Progress
                    value={percentage}
                    size="lg"
                    colorScheme="blue"
                    bg={progressBg}
                    borderRadius="full"
                    hasStripe
                    isAnimated
                />
            </VStack>
        </Box>
    )
}