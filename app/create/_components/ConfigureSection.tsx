'use client'
import { CardsResponse } from '@/app/api/cards/_types'
import FilterItem from '@/components/FilterItem'
import {
    Box,
    Button,
    Heading,
    Text,
    VStack,
    Progress,
    HStack,
    RadioGroup,
    Radio,
    SimpleGrid
} from '@chakra-ui/react'
import React from 'react'
import { FaCogs, FaImage } from 'react-icons/fa'

interface ProgressInfo {
    current: number
    total: number
    message: string
    percentage: number
}

export interface ConfigureSectionProps {
    handleGenerateImage: (form: {
        sortBy: string
        sortDirection: string
    }) => void
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
    const [form, setForm] = React.useState({
        sortBy: 'name',
        sortDirection: 'asc'
    })

    return (
        <VStack spacing={6}>
            {/* Configuration Form */}
            <Box w="full" p={6} borderWidth={1} borderRadius="lg" bg="gray.50">
                <Heading
                    size="md"
                    mb={4}
                    display="flex"
                    alignItems="center"
                    gap={2}
                >
                    <FaCogs /> Configure Deck Image
                </Heading>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <FilterItem.Wrapper label="Sort by">
                        <FilterItem.Radio
                            name="sortBy"
                            options={[
                                { label: 'Name', value: 'name' },
                                { label: 'Mana value', value: 'cmc' },
                                { label: 'Type', value: 'typeLine' },
                                { label: 'Color', value: 'colors' },
                                { label: 'Rarity', value: 'rarity' }
                            ]}
                            value={form.sortBy}
                            onChange={(val) =>
                                setForm((prev) => ({ ...prev, sortBy: val }))
                            }
                        />
                    </FilterItem.Wrapper>
                    {/* Add more options as supported by api/deck-png */}
                </SimpleGrid>
            </Box>
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
                size="lg"
                colorScheme="blue"
                leftIcon={<FaImage />}
                onClick={() => handleGenerateImage(form)}
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
