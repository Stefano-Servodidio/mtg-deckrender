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
    FormLabel
} from '@chakra-ui/react'
import { on } from 'events'
import React from 'react'

export interface FilterItemProps {
    label?: string
    name?: string
    placeholder?: string
    options?: { label: string; value: string }[]
    onChange: (value: string | boolean) => void
    value: string
}

const FilterItemWrapper: React.FC<{
    children: React.ReactNode
    label?: string
}> = ({ children, label }) => (
    <Card>
        {label && (
            <CardHeader>
                <Text>{label}</Text>
            </CardHeader>
        )}
        <CardBody>{children}</CardBody>
    </Card>
)

const Radio: React.FC<FilterItemProps> = ({
    label,
    name,
    options,
    value,
    onChange
}) => {
    return (
        <FilterItemWrapper label={label || ''}>
            <RadioGroup
                defaultValue={options?.[0].value}
                value={value}
                onChange={onChange}
            >
                <HStack>
                    {options?.map((option) => (
                        <RadioInput key={name + '-' + option.value}>
                            {option.label}
                        </RadioInput>
                    ))}
                </HStack>
            </RadioGroup>
        </FilterItemWrapper>
    )
}

const Select: React.FC<FilterItemProps> = ({
    label,
    options,
    placeholder,
    value,
    onChange
}) => {
    return (
        <FilterItemWrapper label={label || ''}>
            <SelectInput
                placeholder={placeholder || 'Select option'}
                onChange={(e) => onChange(e.target.value)}
                value={value}
            >
                {options?.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </SelectInput>
        </FilterItemWrapper>
    )
}

const Toggle: React.FC<FilterItemProps> = ({ label }) => {
    return (
        <FilterItemWrapper>
            <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="email-alerts" mb="0">
                    {label || 'Toggle Option'}
                </FormLabel>
                <Switch id="email-alerts" />
            </FormControl>
        </FilterItemWrapper>
    )
}

const FilterItem = {
    Radio,
    Select,
    Toggle
}

export default FilterItem
