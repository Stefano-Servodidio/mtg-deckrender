'use client'
import {
    Card,
    CardBody,
    HStack,
    Radio as ChakraRadio,
    RadioGroup,
    CardHeader,
    Select as ChakraSelect,
    Switch,
    FormControl,
    FormLabel,
    SelectProps,
    SwitchProps,
    RadioGroupProps,
    Heading,
    Box,
    CardBodyProps
} from '@chakra-ui/react'
import React from 'react'
import { Control, Controller, FieldValues, Path } from 'react-hook-form'

export interface FilterItemProps {
    label?: string
    options?: { label: string; value: string; disabled?: boolean }[]
}

export interface ControlledFilterItemProps<T extends FieldValues> {
    control: Control<T>
    name: Path<T>
}

// Radio component with react-hook-form Controller
function Radio<T extends FieldValues>({
    control,
    name,
    options,
    colorScheme = 'purple'
}: ControlledFilterItemProps<T> &
    FilterItemProps &
    Pick<RadioGroupProps, 'colorScheme'>) {
    return (
        <Controller
            control={control}
            name={name}
            render={({ field }) => (
                <RadioGroup
                    data-testid={'filter-radio-group-' + name}
                    value={field.value}
                    onChange={field.onChange}
                >
                    <HStack flexWrap={'wrap'} spacing={2}>
                        {options?.map((option) => (
                            <Box
                                key={name + '-' + option.value}
                                border={'1px solid'}
                                borderRadius={'md'}
                                borderColor={'gray.200'}
                                {...(field.value === option.value && {
                                    bg: colorScheme + '.500',
                                    color: 'white'
                                })}
                                {...(option.disabled && {
                                    bg: 'gray.50',
                                    pointerEvents: 'none'
                                })}
                                _hover={
                                    !(field.value === option.value)
                                        ? {
                                              bg: colorScheme + '.50',
                                              borderColor: colorScheme + '.500'
                                          }
                                        : undefined
                                }
                            >
                                <ChakraRadio
                                    data-testid={
                                        'filter-radio-' +
                                        name +
                                        '-' +
                                        option.value
                                    }
                                    value={option.value}
                                    name={name + '-' + option.value}
                                    padding={2}
                                    colorScheme="white"
                                    _hover={{
                                        cursor: 'pointer',
                                        color: 'grey'
                                    }}
                                    disabled={option.disabled}
                                >
                                    {option.label}
                                </ChakraRadio>
                            </Box>
                        ))}
                    </HStack>
                </RadioGroup>
            )}
        />
    )
}

Radio.displayName = 'FilterItem.Radio'

// Select component with react-hook-form Controller
function Select<T extends FieldValues>({
    control,
    name,
    options,
    placeholder,
    colorScheme,
    isRequired
}: ControlledFilterItemProps<T> &
    FilterItemProps &
    Pick<SelectProps, 'placeholder' | 'colorScheme' | 'isRequired'>) {
    return (
        <Controller
            control={control}
            name={name}
            render={({ field, fieldState }) => (
                <ChakraSelect
                    data-testid={'filter-select-' + name}
                    placeholder={placeholder || 'Select option'}
                    colorScheme={colorScheme}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    isRequired={isRequired}
                    isInvalid={!!fieldState.error}
                >
                    {options?.map((option) => (
                        <option
                            key={option.value}
                            data-testid={
                                'filter-select-' + name + '-' + option.value
                            }
                            value={option.value}
                            disabled={option.disabled}
                        >
                            {option.label}
                        </option>
                    ))}
                </ChakraSelect>
            )}
        />
    )
}

Select.displayName = 'FilterItem.Select'

// Toggle component with react-hook-form Controller
function Toggle<T extends FieldValues>({
    control,
    name,
    label,
    colorScheme
}: ControlledFilterItemProps<T> &
    Pick<FilterItemProps, 'label'> &
    Pick<SwitchProps, 'colorScheme'>) {
    return (
        <Controller
            control={control}
            name={name}
            render={({ field }) => (
                <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor={'filter-toggle-' + name} mb="0">
                        {label || 'Toggle Option'}
                    </FormLabel>
                    <Switch
                        id={'filter-toggle-' + name}
                        data-testid={'filter-toggle-' + name}
                        colorScheme={colorScheme}
                        isChecked={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                    />
                </FormControl>
            )}
        />
    )
}

Toggle.displayName = 'FilterItem.Toggle'

interface FilterItemWrapperProps extends CardBodyProps {
    children: React.ReactNode
    label?: string
    error?: boolean
}
const Wrapper: React.FC<FilterItemWrapperProps> = ({
    children,
    label,
    error,
    ...props
}) => (
    <Card variant="outlined" size="sm">
        {label && (
            <CardHeader>
                <Heading size="sm" color={error ? 'red.600' : 'inherit'}>
                    {label}
                </Heading>
            </CardHeader>
        )}
        <CardBody
            paddingTop={0}
            gap={2}
            display="flex"
            flexDirection="column"
            {...props}
        >
            {children}
        </CardBody>
    </Card>
)

const FilterItem = {
    Radio,
    Select,
    Toggle,
    Wrapper
}

export default FilterItem
