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
    SimpleGrid,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper
} from '@chakra-ui/react'
import React from 'react'
import { FaCogs, FaImage } from 'react-icons/fa'
import { DeckPngOptions } from '@/hooks/useDeckPng'

interface ProgressInfo {
    current: number
    total: number
    message: string
    percentage: number
}

export interface ConfigureSectionProps {
    handleGenerateImage: (form: DeckPngOptions) => void
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
    const [form, setForm] = React.useState<DeckPngOptions>({
        sortBy: 'name',
        sortDirection: 'asc',
        rowSize: 7,
        fileType: 'png',
        imageSize: 'medium',
        imageVariant: 'grid',
        imageOrientation: 'vertical',
        backgroundStyle: 'transparent',
        mtgFormat: null,
        includeCardCount: true
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
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
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

                    <FilterItem.Wrapper label="Sort direction">
                        <FilterItem.Radio
                            name="sortDirection"
                            options={[
                                { label: 'Ascending', value: 'asc' },
                                { label: 'Descending', value: 'desc' }
                            ]}
                            value={form.sortDirection}
                            onChange={(val) =>
                                setForm((prev) => ({ ...prev, sortDirection: val }))
                            }
                        />
                    </FilterItem.Wrapper>

                    <FilterItem.Wrapper label="Cards per row">
                        <NumberInput
                            value={form.rowSize}
                            onChange={(val) =>
                                setForm((prev) => ({ ...prev, rowSize: parseInt(val) || 7 }))
                            }
                            min={1}
                            max={12}
                            size="sm"
                        >
                            <NumberInputField />
                            <NumberInputStepper>
                                <NumberIncrementStepper />
                                <NumberDecrementStepper />
                            </NumberInputStepper>
                        </NumberInput>
                    </FilterItem.Wrapper>

                    <FilterItem.Wrapper label="File type">
                        <FilterItem.Radio
                            name="fileType"
                            options={[
                                { label: 'PNG', value: 'png' },
                                { label: 'JPEG', value: 'jpeg' },
                                { label: 'WebP', value: 'webp' }
                            ]}
                            value={form.fileType}
                            onChange={(val) =>
                                setForm((prev) => ({ ...prev, fileType: val as 'png' | 'jpeg' | 'webp' }))
                            }
                        />
                    </FilterItem.Wrapper>

                    <FilterItem.Wrapper label="Image size">
                        <FilterItem.Radio
                            name="imageSize"
                            options={[
                                { label: 'Small', value: 'small' },
                                { label: 'Medium', value: 'medium' },
                                { label: 'Large', value: 'large' }
                            ]}
                            value={form.imageSize}
                            onChange={(val) =>
                                setForm((prev) => ({ ...prev, imageSize: val as 'small' | 'medium' | 'large' }))
                            }
                        />
                    </FilterItem.Wrapper>

                    <FilterItem.Wrapper label="Orientation">
                        <FilterItem.Radio
                            name="imageOrientation"
                            options={[
                                { label: 'Vertical', value: 'vertical' },
                                { label: 'Horizontal', value: 'horizontal' }
                            ]}
                            value={form.imageOrientation}
                            onChange={(val) =>
                                setForm((prev) => ({ ...prev, imageOrientation: val as 'vertical' | 'horizontal' }))
                            }
                        />
                    </FilterItem.Wrapper>

                    <FilterItem.Wrapper label="Background">
                        <FilterItem.Radio
                            name="backgroundStyle"
                            options={[
                                { label: 'Transparent', value: 'transparent' },
                                { label: 'White', value: 'white' },
                                { label: 'Custom', value: 'custom' }
                            ]}
                            value={form.backgroundStyle}
                            onChange={(val) =>
                                setForm((prev) => ({ ...prev, backgroundStyle: val as 'transparent' | 'white' | 'custom' }))
                            }
                        />
                    </FilterItem.Wrapper>

                    <FilterItem.Wrapper label="Image variant">
                        <FilterItem.Radio
                            name="imageVariant"
                            options={[
                                { label: 'Grid', value: 'grid' },
                                { label: 'Spoiler', value: 'spoiler' },
                                { label: 'Stacks', value: 'stacks' }
                            ]}
                            value={form.imageVariant}
                            onChange={(val) =>
                                setForm((prev) => ({ ...prev, imageVariant: val as 'grid' | 'spoiler' | 'stacks' }))
                            }
                        />
                    </FilterItem.Wrapper>

                    <FilterItem.Wrapper label="MTG Format">
                        <FilterItem.Select
                            name="mtgFormat"
                            placeholder="Select format (optional)"
                            options={[
                                { label: 'Standard', value: 'standard' },
                                { label: 'Historic', value: 'historic' },
                                { label: 'Timeless', value: 'timeless' },
                                { label: 'Gladiator', value: 'gladiator' },
                                { label: 'Pioneer', value: 'pioneer' },
                                { label: 'Modern', value: 'modern' },
                                { label: 'Legacy', value: 'legacy' },
                                { label: 'Pauper', value: 'pauper' },
                                { label: 'Vintage', value: 'vintage' },
                                { label: 'Commander', value: 'commander' },
                                { label: 'Standard Brawl', value: 'standardbrawl' },
                                { label: 'Brawl', value: 'brawl' },
                                { label: 'Alchemy', value: 'alchemy' },
                                { label: 'Pauper Commander', value: 'paupercommander' },
                                { label: 'Duel', value: 'duel' },
                                { label: 'Old School', value: 'oldschool' },
                                { label: 'Premodern', value: 'premodern' },
                                { label: 'PreDH', value: 'predh' }
                            ]}
                            value={form.mtgFormat || ''}
                            onChange={(e) =>
                                setForm((prev) => ({ 
                                    ...prev, 
                                    mtgFormat: e.target.value || null 
                                }))
                            }
                        />
                    </FilterItem.Wrapper>

                    <FilterItem.Wrapper label="Include card count">
                        <FilterItem.Toggle
                            name="includeCardCount"
                            label="Show quantity on cards"
                            isChecked={form.includeCardCount ?? true}
                            onChange={(e) =>
                                setForm((prev) => ({ 
                                    ...prev, 
                                    includeCardCount: e.target.checked 
                                }))
                            }
                        />
                    </FilterItem.Wrapper>
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
