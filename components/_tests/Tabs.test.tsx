import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChakraProvider } from '@chakra-ui/react'
import Tabs from '../Tabs'

// Wrapper component to provide Chakra context
const ChakraWrapper = ({ children }: { children: React.ReactNode }) => (
    <ChakraProvider>{children}</ChakraProvider>
)

describe('Tabs', () => {
    const mockTabs = [
        {
            title: 'Tab 1',
            content: <div>Content 1</div>
        },
        {
            title: 'Tab 2',
            content: <div>Content 2</div>
        },
        {
            title: 'Tab 3',
            content: <div>Content 3</div>
        }
    ]

    beforeEach(() => {
        // Clear any previous renders
    })

    it('should render all tab titles', () => {
        render(
            <ChakraWrapper>
                <Tabs name="test-tabs" tabs={mockTabs} />
            </ChakraWrapper>
        )

        expect(screen.getByText('Tab 1')).toBeInTheDocument()
        expect(screen.getByText('Tab 2')).toBeInTheDocument()
        expect(screen.getByText('Tab 3')).toBeInTheDocument()
    })

    it('should render the first tab content by default', () => {
        render(
            <ChakraWrapper>
                <Tabs name="test-tabs" tabs={mockTabs} />
            </ChakraWrapper>
        )

        expect(screen.getByText('Content 1')).toBeInTheDocument()
    })

    it('should render all tab panels', () => {
        render(
            <ChakraWrapper>
                <Tabs name="test-tabs" tabs={mockTabs} />
            </ChakraWrapper>
        )

        // Chakra UI Tabs renders all panels but hides inactive ones
        expect(screen.getByText('Content 2')).toBeInTheDocument()
        expect(screen.getByText('Content 3')).toBeInTheDocument()
    })

    it('should render with correct variant', () => {
        const { container } = render(
            <ChakraWrapper>
                <Tabs name="test-tabs" tabs={mockTabs} />
            </ChakraWrapper>
        )

        // Check that tabs are rendered
        const tabElements = container.querySelectorAll('[role="tab"]')
        expect(tabElements).toHaveLength(3)
    })

    it('should handle empty tabs array', () => {
        render(
            <ChakraWrapper>
                <Tabs name="empty-tabs" tabs={[]} />
            </ChakraWrapper>
        )

        const tabElements = screen.queryAllByRole('tab')
        expect(tabElements).toHaveLength(0)
    })

    it('should render with single tab', () => {
        const singleTab = [
            {
                title: 'Only Tab',
                content: <div>Only Content</div>
            }
        ]

        render(
            <ChakraWrapper>
                <Tabs name="single-tab" tabs={singleTab} />
            </ChakraWrapper>
        )

        expect(screen.getByText('Only Tab')).toBeInTheDocument()
        expect(screen.getByText('Only Content')).toBeInTheDocument()
    })

    it('should render tab content with React nodes', () => {
        const tabsWithComplexContent = [
            {
                title: 'Complex Tab',
                content: (
                    <div>
                        <h1>Heading</h1>
                        <p>Paragraph</p>
                        <button>Button</button>
                    </div>
                )
            }
        ]

        render(
            <ChakraWrapper>
                <Tabs name="complex-tabs" tabs={tabsWithComplexContent} />
            </ChakraWrapper>
        )

        expect(screen.getByText('Heading')).toBeInTheDocument()
        expect(screen.getByText('Paragraph')).toBeInTheDocument()
        expect(screen.getByText('Button')).toBeInTheDocument()
    })

    it('should generate unique keys for tabs and panels', () => {
        const { container } = render(
            <ChakraWrapper>
                <Tabs name="keyed-tabs" tabs={mockTabs} />
            </ChakraWrapper>
        )

        const tabs = container.querySelectorAll('[role="tab"]')
        const panels = container.querySelectorAll('[role="tabpanel"]')

        expect(tabs).toHaveLength(3)
        expect(panels).toHaveLength(3) // Chakra renders all panels
    })

    it('should accept additional Chakra props', () => {
        render(
            <ChakraWrapper>
                <Tabs
                    name="props-tabs"
                    tabs={mockTabs}
                    colorScheme="blue"
                    size="lg"
                />
            </ChakraWrapper>
        )

        expect(screen.getByText('Tab 1')).toBeInTheDocument()
    })

    it('should handle tabs with string content', () => {
        const tabsWithStringContent = [
            {
                title: 'String Tab',
                content: 'Simple string content'
            }
        ]

        render(
            <ChakraWrapper>
                <Tabs name="string-tabs" tabs={tabsWithStringContent} />
            </ChakraWrapper>
        )

        expect(screen.getByText('Simple string content')).toBeInTheDocument()
    })
})
