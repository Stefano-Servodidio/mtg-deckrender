'use client'
import { Heading, HStack, Text, VStack } from '@chakra-ui/react'
import React from 'react'

export interface AccordionItemHeaderProps {
    title: string
    description: string
    icon: React.ReactNode
}
const AccordionItemHeader: React.FC<AccordionItemHeaderProps> = ({
    title,
    description,
    icon
}) => {
    return (
        <HStack flex="1" textAlign="left" spacing={3}>
            {icon}
            <VStack align="start" spacing={1}>
                <Heading size="md">{title}</Heading>
                <Text fontSize="sm" color="gray.600">
                    {description}
                </Text>
            </VStack>
        </HStack>
    )
}

export default AccordionItemHeader
