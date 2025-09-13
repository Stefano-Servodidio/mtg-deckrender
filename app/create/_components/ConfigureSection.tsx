'use client'
import { CardsResponse } from '@/app/api/cards/_types'
import { Box, Button, Heading, Text, VStack } from '@chakra-ui/react'
import React from 'react'
import { FaCogs, FaImage } from 'react-icons/fa'

export interface ConfigureSectionProps {
    handleGenerateImage: () => void
    isGenerating: boolean
    cardsData: CardsResponse | null
}

const ConfigureSection: React.FC<ConfigureSectionProps> = ({
    handleGenerateImage,
    isGenerating,
    cardsData
}) => {
    return (
        <VStack spacing={6}>
            <Text color="gray.600" textAlign="center">
                Configuration options will be available here in future updates.
                For now, you can generate your deck image with default settings.
            </Text>

            {/* Generate Button */}
            <Button
                size="lg"
                colorScheme="blue"
                leftIcon={<FaImage />}
                onClick={handleGenerateImage}
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
