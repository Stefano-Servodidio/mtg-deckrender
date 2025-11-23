'use client'

import { Box, Button, Text, VStack, Progress, HStack } from '@chakra-ui/react'
import React from 'react'
import { FaImage } from 'react-icons/fa'
import ConfigureOptions from './ConfigureOptions'
import { DeckPngOptions, CardsResponse, ImageResolution } from '@/types/api'
import { useAnalytics } from '@/hooks/useAnalytics'

interface ProgressInfo {
    current: number
    total: number
    message: string
    percentage: number
}

export interface ConfigureSectionProps {
    handleGenerateImage: (_form: DeckPngOptions) => void
    isGenerating: boolean
    cardsData: CardsResponse | null
    progress?: ProgressInfo | null
}

const ConfigureSection: React.FC<ConfigureSectionProps> = ({
    handleGenerateImage,
    isGenerating,
    cardsData,
    progress
}) => {
    const analytics = useAnalytics()
    const [form, setForm] = React.useState<DeckPngOptions>({
        sortBy: 'name',
        sortDirection: 'asc',
        fileType: 'png',
        imageSize: 'ig_square',
        imageVariant: 'grid',
        imageResolution: 'standard' as ImageResolution,
        backgroundStyle: 'transparent',
        includeCardCount: true,
        customBackgroundColor: '#FFFFFF',
        customBackgroundImage: undefined
    })

    const updateForm = (
        id: string,
        value: string | number | boolean | null
    ) => {
        setForm((prev) => ({
            ...prev,
            [id]: value
        }))
    }

    const handleGenerate = () => {
        analytics.trackButtonClick('Generate Deck Image', {
            event_label: 'configure_section'
        })
        handleGenerateImage(form)
    }

    return (
        <VStack spacing={6}>
            {/* Configuration Form */}
            <ConfigureOptions form={form} updateForm={updateForm} />
            {/* Progress Section */}
            {isGenerating && progress && (
                <Box w="full">
                    <VStack spacing={3}>
                        <Box w="full">
                            <HStack justify="space-between" mb={2}>
                                <Text
                                    fontSize="sm"
                                    fontWeight="medium"
                                    color="gray.700"
                                >
                                    {progress.message}
                                </Text>
                                <Text
                                    fontSize="sm"
                                    fontWeight="medium"
                                    color="blue.600"
                                >
                                    {progress.percentage}%
                                </Text>
                            </HStack>
                            <Progress
                                value={progress.percentage}
                                colorScheme="blue"
                                size="md"
                                borderRadius="md"
                                bg="gray.100"
                            />
                        </Box>
                    </VStack>
                </Box>
            )}

            {/* Generate Button */}
            <Button
                data-testid="generate-button"
                size="lg"
                colorScheme="blue"
                leftIcon={<FaImage />}
                onClick={handleGenerate}
                isLoading={isGenerating}
                loadingText="Generating..."
                w={{ base: 'full', md: 'auto' }}
                px={8}
                _hover={{
                    transform: 'translateY(-2px)',
                    boxShadow: 'lg'
                }}
                transition="all 0.2s"
                disabled={!cardsData?.cards || cardsData.cards.length === 0}
            >
                Generate Deck Image
            </Button>
        </VStack>
    )
}

export default ConfigureSection
