import React from 'react'
import {
    Accordion as ChakraAccordion,
    AccordionProps as ChakraAccordionProps,
    AccordionItem,
    AccordionButton,
    AccordionPanel,
    Heading,
    HStack,
    VStack,
    Text
} from '@chakra-ui/react'

export interface AccordionSection {
    id?: string
    title: React.ReactNode
    description: React.ReactNode
    icon?: React.ReactNode
    content: React.ReactNode
}

interface AccordionProps extends ChakraAccordionProps {
    sections: AccordionSection[]
}

const Accordion: React.FC<AccordionProps> = ({ sections, ...props }) => (
    <ChakraAccordion {...props}>
        {sections.map((section, idx) => (
            <AccordionItem key={'accordion-' + section.id}>
                <AccordionButton
                    data-testid={'accordion-' + section.id}
                    py={{ base: 3, md: 6 }}
                    px={{ base: 4, md: 8 }}
                >
                    <HStack flex="1" textAlign="left" spacing={3}>
                        {!!section.icon && section.icon}
                        <VStack align="start" spacing={1}>
                            <Heading size="md">{section.title}</Heading>
                            <Text fontSize="sm" color="gray.600">
                                {section.description}
                            </Text>
                        </VStack>
                    </HStack>
                </AccordionButton>
                <AccordionPanel pb={{ base: 4, md: 8 }} px={{ base: 4, md: 8 }}>
                    {section.content}
                </AccordionPanel>
            </AccordionItem>
        ))}
    </ChakraAccordion>
)

export default Accordion
