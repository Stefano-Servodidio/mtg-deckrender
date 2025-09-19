'use client'
import {
    CardsResponse,
    DeckPngOptions,
    ImageResolution,
    ImageSize,
    SortOption
} from '@/app/types/api'
import FilterItem from '@/components/FilterItem'
import {
    Box,
    Button,
    Heading,
    Text,
    VStack,
    Progress,
    HStack,
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
        fileType: 'png',
        imageSize: 'ig_square',
        imageVariant: 'grid',
        imageResolution: 'standard' as ImageResolution,
        backgroundStyle: 'transparent',
        includeCardCount: true
    })

    const isValid = React.useMemo(() => {
        return !!form.imageSize
    }, [form])

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
                                setForm((prev) => ({
                                    ...prev,
                                    sortBy: val as SortOption
                                }))
                            }
                        />
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
                                setForm((prev) => ({
                                    ...prev,
                                    fileType: val as 'png' | 'jpeg' | 'webp'
                                }))
                            }
                        />
                    </FilterItem.Wrapper>

                    <FilterItem.Wrapper label="Image size">
                        <FilterItem.Select
                            name="imageSize"
                            options={[
                                { label: 'IG Square', value: 'ig_square' },
                                { label: 'IG Story', value: 'ig_story' },
                                { label: 'IG Portrait', value: 'ig_portrait' },
                                {
                                    label: 'IG Landscape',
                                    value: 'ig_landscape'
                                },
                                {
                                    label: 'Facebook Post',
                                    value: 'facebook_post'
                                },
                                {
                                    label: 'Facebook Cover',
                                    value: 'facebook_cover'
                                },
                                {
                                    label: 'Twitter Post',
                                    value: 'twitter_post'
                                },
                                {
                                    label: 'Twitter Header',
                                    value: 'twitter_header'
                                },
                                { label: 'TikTok Post', value: 'tiktok_post' }
                            ]}
                            value={form.imageSize}
                            onChange={(e) => {
                                const value = e.target.value as ImageSize
                                setForm((prev) => ({
                                    ...prev,
                                    imageSize: value
                                }))
                            }}
                        />
                        {!!form.imageSize && (
                            <Text fontSize="xs" color="gray.600" mt={1}>
                                Image dimensions:{' '}
                                {
                                    {
                                        ig_square: '1080x1080px',
                                        ig_story: '1080x1920px',
                                        ig_portrait: '1080x1350px',
                                        ig_landscape: '1080x566px',
                                        facebook_post: '1200x630px',
                                        facebook_cover: '820x312px',
                                        twitter_post: '1200x675px',
                                        twitter_header: '1500x500px',
                                        tiktok_post: '1080x1920px'
                                    }[form.imageSize]
                                }
                            </Text>
                        )}
                    </FilterItem.Wrapper>

                    <FilterItem.Wrapper label="Resolution">
                        <FilterItem.Radio
                            name="imageResolution"
                            options={[
                                { label: 'Standard', value: 'standard' },
                                { label: 'High', value: 'high' }
                            ]}
                            value={form.imageResolution}
                            onChange={(val) =>
                                setForm((prev) => ({
                                    ...prev,
                                    imageResolution: val as ImageResolution
                                }))
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
                                setForm((prev) => ({
                                    ...prev,
                                    backgroundStyle: val as
                                        | 'transparent'
                                        | 'white'
                                        | 'custom'
                                }))
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
                                setForm((prev) => ({
                                    ...prev,
                                    imageVariant: val as
                                        | 'grid'
                                        | 'spoiler'
                                        | 'stacks'
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
