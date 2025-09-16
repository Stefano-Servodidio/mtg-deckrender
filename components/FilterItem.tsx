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
    Box
} from '@chakra-ui/react'
import React from 'react'

export interface FilterItemProps {
    label?: string
    name: string
    options?: { label: string; value: string }[]
}

const Radio: React.FC<FilterItemProps & Omit<RadioGroupProps, 'children'>> = ({
    label,
    options,
    colorScheme = 'purple',
    ...props
}) => {
    return (
        <RadioGroup {...props}>
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
                            value={option.value}
                            name={props.name + '-' + option.value}
                            padding={2}
                            colorScheme="white"
                            _hover={{
                                cursor: 'pointer',
                                color: 'grey'
                            }}
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
    label,
    options,
    placeholder,
    ...props
}) => {
    return (
        <ChakraSelect placeholder={placeholder || 'Select option'} {...props}>
            {options?.map((option) => (
                <option key={option.value} value={option.value}>
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
            <FormLabel htmlFor="email-alerts" mb="0">
                {label || 'Toggle Option'}
            </FormLabel>
            <Switch id="email-alerts" {...props} />
        </FormControl>
    )
}

const Wrapper: React.FC<{
    children: React.ReactNode
    label?: string
}> = ({ children, label }) => (
    <Card variant="outlined" size="sm">
        {label && (
            <CardHeader>
                <Heading size="sm">{label}</Heading>
            </CardHeader>
        )}
        <CardBody paddingTop={0}>{children}</CardBody>
    </Card>
)

const FilterItem = {
    Radio,
    Select,
    Toggle,
    Wrapper
}

export default FilterItem
