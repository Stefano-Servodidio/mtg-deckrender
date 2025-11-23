// Configuration options for the create page

import { DeckPngOptions, ImageSize } from '@/types/api'
import { BackgroundImageUpload } from '@/components/BackgroundImageUpload'
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
import React, { useEffect } from 'react'
import { FaCogs, FaPen } from 'react-icons/fa'
import { HexColorInput, HexColorPicker } from 'react-colorful'
import { UseFormReturn } from 'react-hook-form'
export interface ConfigureOptionsProps {
    form: UseFormReturn<DeckPngOptions>
}

const ConfigureOptions: React.FC<ConfigureOptionsProps> = ({
    form: hookForm
}) => {
    const { control, watch, formState } = hookForm
    const [editing, setEditing] = React.useState(false)
    const form = watch()
    const [fileType, backgroundStyle] = watch(['fileType', 'backgroundStyle'])
    console.log('formState.errors', formState.errors)
    console.log('form values', hookForm.getValues())
    useEffect(() => {
        // If fileType is jpeg and backgroundStyle is transparent, change backgroundStyle to white
        if (fileType === 'jpeg' && backgroundStyle === 'transparent') {
            hookForm.setValue('backgroundStyle', 'custom_color')
            hookForm.setValue('customBackgroundColor', '#FFFFFF')
        }
    }, [fileType, backgroundStyle, hookForm])

    const imageSizes: { [_key in ImageSize]: string } = {
        ig_portrait: 'Instagram Post (1080x1350)',
        ig_story: 'Instagram Story (1080x1920)',
        ig_square: 'Instagram Square (1080x1080)',
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
                    data-testid="configure-options-button"
                    aria-label="Configure options"
                    isRound
                    variant={editing ? 'solid' : 'outline'}
                    colorScheme="blue"
                    icon={<FaPen />}
                    onClick={() => setEditing(!editing)}
                />
            </HStack>
            {!editing && (
                <Box>
                    <SimpleGrid
                        data-testid="configuration-summary"
                        columns={{ base: 1, md: 2 }}
                        spacing={{ base: 2, md: 4 }}
                    >
                        <Text fontSize="sm">
                            <strong>Sort by:</strong> {form.sortBy}
                        </Text>
                        <Text
                            fontSize="sm"
                            data-testid="configuration-image-size"
                            color={
                                !!formState.errors.imageSize
                                    ? 'red.600'
                                    : 'inherit'
                            }
                        >
                            <strong>Image size:</strong>{' '}
                            {form.imageSize
                                ? imageSizes[form.imageSize]
                                : 'N/A'}
                        </Text>
                        <Text fontSize="sm">
                            <strong>Resolution:</strong> {form.imageResolution}
                        </Text>
                        <Text fontSize="sm">
                            <strong>Variant:</strong> {form.imageVariant}
                        </Text>
                        <Text fontSize="sm">
                            <strong>File type:</strong> {form.fileType}
                        </Text>
                        <Text fontSize="sm">
                            <strong>Include card count:</strong>{' '}
                            {form.includeCardCount ? 'Yes' : 'No'}
                        </Text>
                        <Text fontSize="sm">
                            <strong>Background:</strong> {form.backgroundStyle}
                        </Text>
                    </SimpleGrid>
                    {formState.errors &&
                        Object.keys(formState.errors).length > 0 && (
                            <Text color="red.600" fontSize="sm" mt={4}>
                                Please fill all required fields.
                            </Text>
                        )}
                </Box>
            )}
            {!!editing && (
                <VStack spacing={4} w="full">
                    <SimpleGrid columns={[1, 1, 2]} spacing={[2, 2, 4]}>
                        <FilterItem.Wrapper label="Sort by">
                            <FilterItem.Radio
                                control={control}
                                name="sortBy"
                                colorScheme="blue"
                                options={[
                                    { label: 'Name', value: 'name' },
                                    { label: 'Mana value', value: 'cmc' },
                                    { label: 'Type', value: 'typeLine' },
                                    { label: 'Color', value: 'colors' },
                                    { label: 'Rarity', value: 'rarity' }
                                ]}
                            />
                        </FilterItem.Wrapper>

                        <FilterItem.Wrapper
                            label="Image size"
                            error={!!formState.errors.imageSize}
                        >
                            <FilterItem.Select
                                control={control}
                                name="imageSize"
                                colorScheme="blue"
                                isRequired
                                options={Object.entries(imageSizes).map(
                                    ([value, label]) => ({
                                        label,
                                        value
                                    })
                                )}
                            />
                        </FilterItem.Wrapper>

                        <FilterItem.Wrapper label="Resolution">
                            <FilterItem.Radio
                                control={control}
                                name="imageResolution"
                                colorScheme="blue"
                                options={[
                                    { label: 'Standard', value: 'standard' },
                                    { label: 'High', value: 'high' }
                                ]}
                            />
                        </FilterItem.Wrapper>

                        <FilterItem.Wrapper label="Image variant">
                            <FilterItem.Radio
                                control={control}
                                name="imageVariant"
                                colorScheme="blue"
                                options={[
                                    { label: 'Grid', value: 'grid' },
                                    { label: 'Spoiler', value: 'spoiler' },
                                    {
                                        label: 'Stacks',
                                        value: 'stacks',
                                        disabled: true
                                    }
                                ]}
                            />
                        </FilterItem.Wrapper>
                        <FilterItem.Wrapper label="File type">
                            <FilterItem.Radio
                                control={control}
                                name="fileType"
                                colorScheme="blue"
                                options={[
                                    { label: 'PNG', value: 'png' },
                                    { label: 'JPEG', value: 'jpeg' },
                                    { label: 'WebP', value: 'webp' }
                                ]}
                            />
                        </FilterItem.Wrapper>
                        <FilterItem.Wrapper label="Include card count">
                            <FilterItem.Toggle
                                control={control}
                                name="includeCardCount"
                                label="Show quantity on cards"
                            />
                        </FilterItem.Wrapper>
                        <FilterItem.Wrapper
                            label="Background"
                            justifyContent={'space-between'}
                        >
                            <FilterItem.Radio
                                control={control}
                                name="backgroundStyle"
                                colorScheme="blue"
                                options={[
                                    {
                                        label: 'Transparent',
                                        value: 'transparent',
                                        disabled: form.fileType === 'jpeg'
                                    },
                                    {
                                        label: 'Custom Color',
                                        value: 'custom_color'
                                    },
                                    {
                                        label: 'Custom Image',
                                        value: 'custom_image'
                                    }
                                ]}
                            />
                        </FilterItem.Wrapper>
                        <Box>
                            {form.backgroundStyle === 'custom_color' && (
                                <FilterItem.Wrapper label="Custom Background Color">
                                    <VStack
                                        spacing={2}
                                        align="flex-start"
                                        sx={{
                                            '.react-colorful': {
                                                height: '150px',
                                                borderRadius: '.25rem'
                                            }
                                        }}
                                    >
                                        <HexColorPicker
                                            color={form.customBackgroundColor}
                                            onChange={(color) =>
                                                hookForm.setValue(
                                                    'customBackgroundColor',
                                                    color
                                                )
                                            }
                                        />
                                        <HexColorInput
                                            color={form.customBackgroundColor}
                                            onChange={(color) =>
                                                hookForm.setValue(
                                                    'customBackgroundColor',
                                                    color
                                                )
                                            }
                                        />
                                    </VStack>
                                </FilterItem.Wrapper>
                            )}
                            {form.backgroundStyle === 'custom_image' && (
                                <FilterItem.Wrapper label="Custom Background Image">
                                    <BackgroundImageUpload
                                        onImageUpload={(imageData) =>
                                            hookForm.setValue(
                                                'customBackgroundImage',
                                                imageData || undefined
                                            )
                                        }
                                        colorScheme="blue"
                                        wrapperProps={{ mt: 4 }}
                                        maxSizeBytes={1024 * 1024}
                                    />
                                </FilterItem.Wrapper>
                            )}
                        </Box>
                    </SimpleGrid>
                    <HStack width={'100%'} justify="space-between">
                        <Box>
                            {formState.errors &&
                                Object.keys(formState.errors).length > 0 && (
                                    <Text color="red.600" fontSize="sm">
                                        Please fill all required fields.
                                    </Text>
                                )}
                        </Box>
                        <Button
                            colorScheme="blue"
                            alignSelf="flex-end"
                            minWidth={{ base: '100%', md: '120px' }}
                            onClick={() => setEditing(false)}
                        >
                            Done
                        </Button>
                    </HStack>
                </VStack>
            )}
        </Box>
    )
}

export default ConfigureOptions
