'use client'
import {
    Card,
    CardBody,
    HStack,
    Radio as RadioInput,
    RadioGroup,
    Text,
    VStack,
    CardHeader,
    Select as SelectInput,
    Switch,
    FormControl,
    FormLabel,
    SelectProps,
    SwitchProps,
    RadioGroupProps,
    Heading
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
    ...props
}) => {
    return (
        <RadioGroup {...props}>
            <HStack flexWrap={'wrap'} spacing={4}>
                {options?.map((option) => (
                    <RadioInput
                        key={props.name + '-' + option.value}
                        value={option.value}
                        name={props.name + '-' + option.value}
                    >
                        {option.label}
                    </RadioInput>
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
        <SelectInput placeholder={placeholder || 'Select option'} {...props}>
            {options?.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </SelectInput>
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
        <CardBody>{children}</CardBody>
    </Card>
)

const FilterItem = {
    Radio,
    Select,
    Toggle,
    Wrapper
}

export default FilterItem
