// Configuration options for the create page

import { DeckPngOptions, ImageSize } from '@/app/types/api'
import { DropZone } from '@/components/DropZone'
import FilterItem from '@/components/FilterItem'
import {
    SimpleGrid,
    Box,
    Heading,
    Text,
    IconButton,
    HStack,
    VStack,
    Button
} from '@chakra-ui/react'
import React from 'react'
import { FaCogs, FaPen } from 'react-icons/fa'

export interface ConfigureOptionsProps {
    form: DeckPngOptions
    updateForm: (_id: string, _value: string | number | boolean | null) => void
}

const ConfigureOptions: React.FC<ConfigureOptionsProps> = ({
    form,
    updateForm
}) => {
    const [editing, setEditing] = React.useState(false)

    const imageSizes: { [_key in ImageSize]: string } = {
        ig_square: 'Instagram Square (1080x1080)',
        ig_story: 'Instagram Story (1080x1920)',
        ig_portrait: 'Instagram Portrait (1080x1350)',
        ig_landscape: 'Instagram Landscape (1080x566)',
        facebook_post: 'Facebook Post (1200x630)',
        facebook_cover: 'Facebook Cover (820x312)',
        twitter_post: 'Twitter Post (1024x512)',
        twitter_header: 'Twitter Header (1500x500)',
        tiktok_post: 'TikTok Post (1080x1920)'
    }

    return (
        <Box
            w="full"
            p={{ base: 4, md: 6 }}
            borderWidth={1}
            borderRadius="lg"
            bg="blue.50"
        >
            <HStack mb={4} justifyContent="space-between" gap={4}>
                <Heading size="md" display="flex" alignItems="center" gap={2}>
                    <FaCogs />
                    <Text>Configuration</Text>
                </Heading>
                <IconButton
                    aria-label="Configure options"
                    isRound
                    variant={editing ? 'solid' : 'outline'}
                    colorScheme="blue"
                    icon={<FaPen />}
                    onClick={() => setEditing(!editing)}
                />
            </HStack>
            {!editing && (
                <SimpleGrid
                    columns={{ base: 1, md: 2 }}
                    spacing={{ base: 2, md: 4 }}
                >
                    <Text fontSize="sm">
                        <strong>Sort by:</strong> {form.sortBy}
                    </Text>
                    <Text fontSize="sm">
                        <strong>Image size:</strong>{' '}
                        {form.imageSize ? imageSizes[form.imageSize] : 'N/A'}
                    </Text>
                    <Text fontSize="sm">
                        <strong>Resolution:</strong> {form.imageResolution}
                    </Text>
                    <Text fontSize="sm">
                        <strong>Variant:</strong> {form.imageVariant}
                    </Text>
                    <Text fontSize="sm">
                        <strong>Background:</strong> {form.backgroundStyle}
                    </Text>
                    <Text fontSize="sm">
                        <strong>Include card count:</strong>{' '}
                        {form.includeCardCount ? 'Yes' : 'No'}
                    </Text>
                    <Text fontSize="sm">
                        <strong>File type:</strong> {form.fileType}
                    </Text>
                </SimpleGrid>
            )}
            {!!editing && (
                <VStack spacing={4} w="full">
                    <SimpleGrid columns={[1, 1, 2]} spacing={[2, 2, 4]}>
                        <FilterItem.Wrapper label="Sort by">
                            <FilterItem.Radio
                                name="sortBy"
                                colorScheme="blue"
                                options={[
                                    { label: 'Name', value: 'name' },
                                    { label: 'Mana value', value: 'cmc' },
                                    { label: 'Type', value: 'typeLine' },
                                    { label: 'Color', value: 'colors' },
                                    { label: 'Rarity', value: 'rarity' }
                                ]}
                                value={form.sortBy}
                                onChange={(val) => updateForm('sortBy', val)}
                            />
                        </FilterItem.Wrapper>

                        <FilterItem.Wrapper label="Image size">
                            <FilterItem.Select
                                name="imageSize"
                                colorScheme="blue"
                                options={Object.entries(imageSizes).map(
                                    ([value, label]) => ({
                                        label,
                                        value
                                    })
                                )}
                                value={form.imageSize}
                                onChange={(e) => {
                                    updateForm('imageSize', e.target.value)
                                }}
                            />
                        </FilterItem.Wrapper>

                        <FilterItem.Wrapper label="Resolution">
                            <FilterItem.Radio
                                name="imageResolution"
                                colorScheme="blue"
                                options={[
                                    { label: 'Standard', value: 'standard' },
                                    { label: 'High', value: 'high' }
                                ]}
                                value={form.imageResolution}
                                onChange={(val) =>
                                    updateForm('imageResolution', val)
                                }
                            />
                        </FilterItem.Wrapper>

                        <FilterItem.Wrapper label="Image variant">
                            <FilterItem.Radio
                                name="imageVariant"
                                colorScheme="blue"
                                options={[
                                    { label: 'Grid', value: 'grid' },
                                    { label: 'Spoiler', value: 'spoiler' },
                                    { label: 'Stacks', value: 'stacks' }
                                ]}
                                value={form.imageVariant}
                                onChange={(val) =>
                                    updateForm('imageVariant', val)
                                }
                            />
                        </FilterItem.Wrapper>
                        <FilterItem.Wrapper label="Background">
                            <FilterItem.Radio
                                name="backgroundStyle"
                                colorScheme="blue"
                                options={[
                                    {
                                        label: 'Transparent',
                                        value: 'transparent'
                                    },
                                    { label: 'White', value: 'white' },
                                    { label: 'Custom', value: 'custom' }
                                ]}
                                value={form.backgroundStyle}
                                onChange={(val) =>
                                    updateForm('backgroundStyle', val)
                                }
                                mb={4}
                            />
                            {form.backgroundStyle === 'custom' && (
                                <DropZone
                                    onFileUpload={() => {}}
                                    colorScheme="blue"
                                />
                            )}
                        </FilterItem.Wrapper>

                        <FilterItem.Wrapper label="Include card count">
                            <FilterItem.Toggle
                                name="includeCardCount"
                                label="Show quantity on cards"
                                isChecked={form.includeCardCount ?? true}
                                onChange={(e) =>
                                    updateForm(
                                        'includeCardCount',
                                        e.target.checked
                                    )
                                }
                            />
                        </FilterItem.Wrapper>

                        <FilterItem.Wrapper label="File type">
                            <FilterItem.Radio
                                name="fileType"
                                colorScheme="blue"
                                options={[
                                    { label: 'PNG', value: 'png' },
                                    { label: 'JPEG', value: 'jpeg' },
                                    { label: 'WebP', value: 'webp' }
                                ]}
                                value={form.fileType}
                                onChange={(val) => {
                                    updateForm('fileType', val)
                                }}
                            />
                        </FilterItem.Wrapper>
                    </SimpleGrid>
                    <Button
                        colorScheme="blue"
                        alignSelf="flex-end"
                        minWidth={{ base: '100%', md: '120px' }}
                        onClick={() => setEditing(false)}
                    >
                        Done
                    </Button>
                </VStack>
            )}
        </Box>
    )
}

export default ConfigureOptions
