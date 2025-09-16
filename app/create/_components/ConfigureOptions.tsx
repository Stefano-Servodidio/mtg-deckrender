// Configuration options for the create page

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

export interface ConfigureForm {
    sortBy?: 'name' | 'cmc' | 'typeLine' | 'colors' | 'rarity'
    sortDirection?: 'asc' | 'desc'
    rowSize?: number
    fileType?: 'png' | 'jpeg' | 'webp'
    imageSize?: 'small' | 'medium' | 'large'
    imageOrientation?: 'vertical' | 'horizontal'
    backgroundStyle?: 'transparent' | 'white' | 'custom'
    imageVariant?: 'grid' | 'spoiler' | 'stacks'
    mtgFormat?: string | null
    includeCardCount?: boolean | null
}
export interface ConfigureOptionsProps {
    form: ConfigureForm
    updateForm: (id: string, value: string | number | boolean | null) => void
}

const ConfigureOptions: React.FC<ConfigureOptionsProps> = ({
    form,
    updateForm
}) => {
    const [editing, setEditing] = React.useState(false)
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
                        <strong>File type:</strong> {form.fileType}
                    </Text>
                    <Text fontSize="sm">
                        <strong>Image size:</strong> {form.imageSize}
                    </Text>
                    <Text fontSize="sm">
                        <strong>Orientation:</strong> {form.imageOrientation}
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

                        <FilterItem.Wrapper label="Image size">
                            <FilterItem.Radio
                                name="imageSize"
                                colorScheme="blue"
                                options={[
                                    { label: 'Small', value: 'small' },
                                    { label: 'Medium', value: 'medium' }
                                    // { label: 'Large', value: 'large' }
                                ]}
                                value={form.imageSize}
                                onChange={(val) => {
                                    updateForm('imageSize', val)
                                }}
                            />
                        </FilterItem.Wrapper>

                        <FilterItem.Wrapper label="Orientation">
                            <FilterItem.Radio
                                name="imageOrientation"
                                colorScheme="blue"
                                options={[
                                    { label: 'Vertical', value: 'vertical' },
                                    { label: 'Horizontal', value: 'horizontal' }
                                ]}
                                value={form.imageOrientation}
                                onChange={(val) => {
                                    updateForm('imageOrientation', val)
                                }}
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

                        {/* <FilterItem.Wrapper label="MTG Format">
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
                        updateForm('mtgFormat', e.target.value || null)
                    }
                />
            </FilterItem.Wrapper> */}

                        {/* <FilterItem.Wrapper label="Include card count">
                <FilterItem.Toggle
                    name="includeCardCount"
                    label="Show quantity on cards"
                    isChecked={form.includeCardCount ?? true}
                    onChange={(e) =>
                        updateForm('includeCardCount', e.target.checked)
                    }
                />
            </FilterItem.Wrapper> */}
                        {/* <FilterItem.Wrapper label="Sort direction">
                <FilterItem.Radio
                    name="sortDirection"
                    options={[
                        { label: 'Ascending', value: 'asc' },
                        { label: 'Descending', value: 'desc' }
                    ]}
                    value={form.sortDirection}
                    onChange={(val) => updateForm('sortDirection', val)}
                />
            </FilterItem.Wrapper> */}
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
