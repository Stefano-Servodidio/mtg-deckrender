'use client'

/**
 * GDPR-Compliant Cookie Banner Component
 * Displays a cookie consent banner and manages user preferences
 */

import { useEffect, useState } from 'react'
import {
    Box,
    Button,
    Flex,
    Text,
    HStack,
    VStack,
    Collapse,
    Switch,
    FormControl,
    FormLabel,
    useDisclosure
} from '@chakra-ui/react'
import {
    shouldShowConsentBanner,
    acceptAllCookies,
    rejectAllCookies,
    saveConsentPreferences,
    getConsentPreferences,
    ConsentCategory,
    type ConsentPreferences
} from '@/utils/cookieConsent'

export function CookieBanner() {
    const [showBanner, setShowBanner] = useState(false)
    const { isOpen: showSettings, onToggle: toggleSettings } = useDisclosure()
    const [preferences, setPreferences] = useState<Partial<ConsentPreferences>>(
        {
            [ConsentCategory.NECESSARY]: true,
            [ConsentCategory.ANALYTICS]: false,
            [ConsentCategory.MARKETING]: false
        }
    )

    // Check if banner should be shown on mount
    useEffect(() => {
        const shouldShow = shouldShowConsentBanner()
        setShowBanner(shouldShow)

        // Load existing preferences if they exist
        const existing = getConsentPreferences()
        if (existing) {
            setPreferences({
                [ConsentCategory.NECESSARY]: existing.necessary,
                [ConsentCategory.ANALYTICS]: existing.analytics,
                [ConsentCategory.MARKETING]: existing.marketing
            })
        }
    }, [])

    const handleAcceptAll = () => {
        acceptAllCookies()
        setShowBanner(false)
    }

    const handleRejectAll = () => {
        rejectAllCookies()
        setShowBanner(false)
    }

    const handleSavePreferences = () => {
        saveConsentPreferences(preferences)
        setShowBanner(false)
    }

    const handleTogglePreference = (category: ConsentCategory) => {
        if (category === ConsentCategory.NECESSARY) return // Can't disable necessary cookies
        setPreferences((prev) => ({
            ...prev,
            [category]: !prev[category]
        }))
    }

    if (!showBanner) return null

    return (
        <Box
            data-testid="cookie-banner"
            position="fixed"
            bottom={0}
            left={0}
            right={0}
            bg="gray.700"
            color="white"
            zIndex={9999}
            boxShadow="0 -2px 10px rgba(0,0,0,0.3)"
            borderTop="1px solid"
            borderColor="gray.700"
        >
            <Box maxW="1200px" mx="auto" p={4}>
                <VStack spacing={4} align="stretch">
                    {/* Main message */}
                    <Flex
                        direction={{ base: 'column', md: 'row' }}
                        gap={4}
                        align={{ base: 'start', md: 'center' }}
                        justify="space-between"
                    >
                        <Box flex={1}>
                            <Text fontSize="sm" mb={2}>
                                <strong>This website uses cookies</strong>
                            </Text>
                            <Text fontSize="xs" color="gray.300">
                                We use cookies to enhance your browsing
                                experience, analyze site traffic, and improve
                                our services. By clicking &quot;Accept
                                All&quot;, you consent to our use of cookies.{' '}
                                <Button
                                    data-testid="customize-preferences-button"
                                    variant="link"
                                    color="blue.300"
                                    textDecoration="underline"
                                    fontSize="xs"
                                    fontWeight="normal"
                                    minW="auto"
                                    h="auto"
                                    p={0}
                                    onClick={toggleSettings}
                                    verticalAlign="baseline"
                                >
                                    Customize your preferences
                                </Button>
                                .
                            </Text>
                        </Box>

                        {/* Action buttons */}
                        <HStack
                            spacing={2}
                            flexShrink={0}
                            flexWrap="wrap"
                            justify={{ base: 'flex-start', md: 'flex-end' }}
                        >
                            <Button
                                data-testid="reject-all-button"
                                size="sm"
                                variant="ghost"
                                colorScheme="white"
                                onClick={handleRejectAll}
                            >
                                Reject All
                            </Button>
                            <Button
                                data-testid="settings-button"
                                size="sm"
                                variant="outline"
                                colorScheme="white"
                                onClick={toggleSettings}
                            >
                                Settings
                            </Button>
                            <Button
                                data-testid="accept-all-button"
                                size="sm"
                                colorScheme="blue"
                                onClick={handleAcceptAll}
                            >
                                Accept All
                            </Button>
                        </HStack>
                    </Flex>

                    {/* Cookie settings */}
                    <Collapse in={showSettings}>
                        <Box
                            bg="gray.800"
                            p={4}
                            borderRadius="md"
                            borderWidth={1}
                            borderColor="gray.700"
                        >
                            <Text fontSize="sm" fontWeight="bold" mb={3}>
                                Cookie Preferences
                            </Text>
                            <VStack spacing={3} align="stretch">
                                {/* Necessary cookies - always on */}
                                <FormControl display="flex" alignItems="center">
                                    <Switch
                                        data-testid="necessary-cookies-switch"
                                        id="necessary-cookies"
                                        isChecked={true}
                                        isDisabled={true}
                                        colorScheme="blue"
                                    />
                                    <FormLabel
                                        htmlFor="necessary-cookies"
                                        mb={0}
                                        ml={3}
                                        fontSize="sm"
                                        flex={1}
                                    >
                                        <strong>Necessary Cookies</strong>
                                        <Text
                                            fontSize="xs"
                                            color="gray.400"
                                            mt={1}
                                        >
                                            Required for the website to function
                                            properly. Cannot be disabled.
                                        </Text>
                                    </FormLabel>
                                </FormControl>

                                {/* Analytics cookies */}
                                <FormControl display="flex" alignItems="center">
                                    <Switch
                                        data-testid="analytics-cookies-switch"
                                        isChecked={
                                            preferences[
                                                ConsentCategory.ANALYTICS
                                            ] || false
                                        }
                                        onChange={() =>
                                            handleTogglePreference(
                                                ConsentCategory.ANALYTICS
                                            )
                                        }
                                        colorScheme="blue"
                                    />
                                    <FormLabel
                                        htmlFor="analytics-cookies"
                                        mb={0}
                                        ml={3}
                                        fontSize="sm"
                                        flex={1}
                                    >
                                        <strong>Analytics Cookies</strong>
                                        <Text
                                            fontSize="xs"
                                            color="gray.400"
                                            mt={1}
                                        >
                                            Help us understand how visitors use
                                            our website (Google Analytics).
                                        </Text>
                                    </FormLabel>
                                </FormControl>

                                {/* Marketing cookies */}
                                <FormControl display="flex" alignItems="center">
                                    <Switch
                                        data-testid="marketing-cookies-switch"
                                        id="marketing-cookies"
                                        isChecked={
                                            preferences[
                                                ConsentCategory.MARKETING
                                            ] || false
                                        }
                                        onChange={() =>
                                            handleTogglePreference(
                                                ConsentCategory.MARKETING
                                            )
                                        }
                                        colorScheme="blue"
                                    />
                                    <FormLabel
                                        htmlFor="marketing-cookies"
                                        mb={0}
                                        ml={3}
                                        fontSize="sm"
                                        flex={1}
                                    >
                                        <strong>Marketing Cookies</strong>
                                        <Text
                                            fontSize="xs"
                                            color="gray.400"
                                            mt={1}
                                        >
                                            Used to track visitors across
                                            websites for advertising purposes.
                                        </Text>
                                    </FormLabel>
                                </FormControl>
                            </VStack>

                            {/* Save preferences button */}
                            <Flex justify="flex-end" mt={4}>
                                <Button
                                    data-testid="save-preferences-button"
                                    size="sm"
                                    colorScheme="blue"
                                    onClick={handleSavePreferences}
                                >
                                    Save Preferences
                                </Button>
                            </Flex>
                        </Box>
                    </Collapse>
                </VStack>
            </Box>
        </Box>
    )
}
