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
export interface FilterItemProps {
    label?: string
    name: string
    options?: { label: string; value: string; disabled?: boolean }[]
}

const Radio: React.FC<FilterItemProps & Omit<RadioGroupProps, 'children'>> = ({
    options,
    colorScheme = 'purple',
    ...props
}) => {
    return (
        <RadioGroup data-testid={'filter-radio-group-' + props.name} {...props}>
            <HStack flexWrap={'wrap'} spacing={2}>
                {options?.map((option) => (
                    <Box
                        key={props.name + '-' + option.value}
                        border={'1px solid'}
                        borderRadius={'md'}
                        borderColor={'gray.200'}
                        {...(props.value === option.value && {
                            bg: colorScheme + '.500',
                            color: 'white'
                        })}
                        {...(option.disabled && {
                            bg: 'gray.50',
                            pointerEvents: 'none'
                        })}
                        _hover={
                            !(props.value === option.value)
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
                                props.name +
                                '-' +
                                option.value
                            }
                            value={option.value}
                            name={props.name + '-' + option.value}
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
    )
}

const Select: React.FC<FilterItemProps & SelectProps> = ({
    options,
    placeholder,
    ...props
}) => {
    return (
        <ChakraSelect
            data-testid={'filter-select-' + props.name}
            placeholder={placeholder || 'Select option'}
            {...props}
        >
            {options?.map((option) => (
                <option
                    key={option.value}
                    data-testid={
                        'filter-select-' + props.name + '-' + option.value
                    }
                    value={option.value}
                    disabled={option.disabled}
                >
                    {option.label}
                </option>
            ))}
        </ChakraSelect>
    )
}

const Toggle: React.FC<FilterItemProps & SwitchProps> = ({
    label,
    ...props
}) => {
    return (
        <FormControl display="flex" alignItems="center">
            <FormLabel htmlFor={'filter-toggle-' + props.name} mb="0">
                {label || 'Toggle Option'}
            </FormLabel>
            <Switch
                id={'filter-toggle-' + props.name}
                data-testid={'filter-toggle-' + props.name}
                {...props}
            />
        </FormControl>
    )
}

interface FilterItemWrapperProps extends CardBodyProps {
    children: React.ReactNode
    label?: string
}
const Wrapper: React.FC<FilterItemWrapperProps> = ({
    children,
    label,
    ...props
}) => (
    <Card variant="outlined" size="sm">
        {label && (
            <CardHeader>
                <Heading size="sm">{label}</Heading>
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
