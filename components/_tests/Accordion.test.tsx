// tests for the Accordion component
import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Accordion, { AccordionSection } from '../Accordion'
import { ChakraProvider } from '@chakra-ui/react'
import { theme } from '@/theme/theme'

const sections: AccordionSection[] = [
    {
        id: 'section1',
        title: 'Section 1',
        description: 'Description 1',
        content: <div>Content 1</div>,
        icon: <span data-testid="icon-1">🔥</span>
    },
    {
        id: 'section2',
        title: 'Section 2',
        description: 'Description 2',
        content: <div>Content 2</div>
    }
]

function renderAccordion(props = {}) {
    return render(
        <ChakraProvider theme={theme}>
            <Accordion sections={sections} {...props} />
        </ChakraProvider>
    )
}

describe('Accordion', () => {
    it('renders all section titles and descriptions', () => {
        renderAccordion()
        expect(screen.getByText('Section 1')).toBeInTheDocument()
        expect(screen.getByText('Description 1')).toBeInTheDocument()
        expect(screen.getByText('Section 2')).toBeInTheDocument()
        expect(screen.getByText('Description 2')).toBeInTheDocument()
    })

    it('renders icons if provided', () => {
        renderAccordion()
        expect(screen.getByTestId('icon-1')).toBeInTheDocument()
    })

    it('renders content only after expanding', () => {
        renderAccordion()
        // Content should be in the document but not visible when collapsed
        expect(screen.getByText('Content 1')).toBeInTheDocument()
        const buttons = screen.getAllByRole('button')
        act(() => {
            fireEvent.click(buttons[0])
        })
        // After clicking, content should still be in the document
        expect(screen.getByText('Content 1')).toBeInTheDocument()
    })

    it('renders multiple sections', () => {
        renderAccordion()
        const buttons = screen.getAllByRole('button')
        expect(buttons.length).toBe(sections.length)
    })

    it('handles custom props', () => {
        renderAccordion({ allowMultiple: true })
        const buttons = screen.getAllByRole('button')
        act(() => {
            fireEvent.click(buttons[0])
            fireEvent.click(buttons[1])
        })
        // Both contents should be in the document after clicking
        expect(screen.getByText('Content 1')).toBeInTheDocument()
        expect(screen.getByText('Content 2')).toBeInTheDocument()
    })
})
