'use client'

import { Box, Button, Text, VStack, Progress, HStack } from '@chakra-ui/react'
import React, { useEffect } from 'react'
import { FaImage } from 'react-icons/fa'
import ConfigureOptions from './ConfigureOptions'
import { DeckPngOptions, CardsResponse } from '@/types/api'
import { useAnalytics } from '@/hooks/useAnalytics'
import { Resolver, useForm, ResolverResult } from 'react-hook-form'
import {
    saveToLocalStorage,
    loadFromLocalStorage,
    STORAGE_KEYS
} from '@/utils/storage/localStorage'

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

    const resolver: Resolver<DeckPngOptions> = async (
        values
    ): Promise<ResolverResult<DeckPngOptions>> => {
        if (!values.imageSize) {
            return {
                values: {},
                errors: {
                    imageSize: {
                        type: 'required',
                        message: 'Image size is required'
                    }
                }
            }
        }

        return {
            values,
            errors: {}
        }
    }

    const form = useForm<DeckPngOptions>({
        mode: 'onChange',
        defaultValues: {
            sortBy: 'name',
            sortDirection: 'asc',
            fileType: 'png',
            imageSize: 'ig_portrait',
            imageVariant: 'grid',
            imageResolution: 'standard',
            backgroundStyle: 'transparent',
            includeCardCount: true,
            customBackgroundColor: '#FFFFFF',
            customBackgroundImage: undefined
        },
        resolver: resolver
    })
    const { getValues, formState, reset } = form

    // Load options from localStorage on mount
    useEffect(() => {
        const savedOptions = loadFromLocalStorage<DeckPngOptions>(
            STORAGE_KEYS.OPTIONS,
            {}
        )
        // Merge saved options with defaults
        if (Object.keys(savedOptions).length > 0) {
            reset({
                sortBy: savedOptions.sortBy ?? 'name',
                sortDirection: savedOptions.sortDirection ?? 'asc',
                fileType: savedOptions.fileType ?? 'png',
                imageSize: savedOptions.imageSize ?? 'ig_portrait',
                imageVariant: savedOptions.imageVariant ?? 'grid',
                imageResolution: savedOptions.imageResolution ?? 'standard',
                backgroundStyle: savedOptions.backgroundStyle ?? 'transparent',
                includeCardCount: savedOptions.includeCardCount ?? true,
                customBackgroundColor:
                    savedOptions.customBackgroundColor ?? '#FFFFFF',
                customBackgroundImage: savedOptions.customBackgroundImage
            })
        }
    }, [reset])

    // Save options to localStorage whenever form values change
    useEffect(() => {
        const subscription = form.watch((values) => {
            saveToLocalStorage(STORAGE_KEYS.OPTIONS, values)
        })
        return () => subscription.unsubscribe()
    }, [form])

    const handleGenerate = () => {
        analytics.trackButtonClick('Generate Deck Image', {
            event_label: 'configure_section'
        })
        handleGenerateImage(getValues())
    }

    if (!cardsData?.cards || cardsData.cards.length === 0) {
        return (
            <Text
                data-testid="no-cards-text"
                color="gray.500"
                textAlign="center"
            >
                Upload your decklist first to configure the image.
            </Text>
        )
    }

    return (
        <VStack spacing={6}>
            {/* Configuration Form */}
            <ConfigureOptions form={form} />
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
                disabled={
                    formState.errors.imageSize !== undefined || isGenerating
                }
            >
                Generate Deck Image
            </Button>
        </VStack>
    )
}

export default ConfigureSection
