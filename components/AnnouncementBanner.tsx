'use client'

/**
 * Reusable Announcement Banner Component
 * Displays dismissible banners at the top of the page
 */

import { Box, Button, Flex, Text, CloseButton } from '@chakra-ui/react'
import { ReactNode } from 'react'

export interface AnnouncementBannerProps {
    /** Banner content */
    children: ReactNode
    /** Whether the banner is visible */
    isVisible: boolean
    /** Callback when banner is dismissed */
    onDismiss: () => void
    /** Background color scheme */
    colorScheme?: 'blue' | 'green' | 'yellow' | 'red' | 'purple'
    /** Optional action button */
    actionButton?: {
        label: string
        onClick: () => void
    }
}

export function AnnouncementBanner({
    children,
    isVisible,
    onDismiss,
    colorScheme = 'blue',
    actionButton
}: AnnouncementBannerProps) {
    if (!isVisible) return null

    const colorMap = {
        blue: {
            bg: 'blue.500',
            hoverBg: 'blue.600'
        },
        green: {
            bg: 'green.500',
            hoverBg: 'green.600'
        },
        yellow: {
            bg: 'yellow.500',
            hoverBg: 'yellow.600'
        },
        red: {
            bg: 'red.500',
            hoverBg: 'red.600'
        },
        purple: {
            bg: 'purple.500',
            hoverBg: 'purple.600'
        }
    }

    const colors = colorMap[colorScheme]

    return (
        <Box
            bg={colors.bg}
            color="white"
            py={3}
            px={4}
            position="relative"
            zIndex={1000}
        >
            <Flex
                maxW="1200px"
                mx="auto"
                align="center"
                justify="space-between"
                gap={4}
                flexWrap="wrap"
            >
                <Box flex={1} minW="200px">
                    <Text fontSize="sm">{children}</Text>
                </Box>

                <Flex gap={2} align="center" flexShrink={0}>
                    {actionButton && (
                        <Button
                            size="sm"
                            variant="solid"
                            bg="whiteAlpha.300"
                            color="white"
                            _hover={{ bg: 'whiteAlpha.400' }}
                            onClick={actionButton.onClick}
                        >
                            {actionButton.label}
                        </Button>
                    )}
                    <CloseButton
                        size="sm"
                        onClick={onDismiss}
                        _hover={{ bg: colors.hoverBg }}
                    />
                </Flex>
            </Flex>
        </Box>
    )
}
