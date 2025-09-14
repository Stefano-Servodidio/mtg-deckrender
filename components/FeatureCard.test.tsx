import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChakraProvider } from '@chakra-ui/react'
import FeatureCard from '../components/FeatureCard'
import React from 'react'

// Mock icon component for testing
const MockIcon = () => <div data-testid="mock-icon">Icon</div>

// Wrapper component to provide Chakra context
const ChakraWrapper = ({ children }: { children: React.ReactNode }) => (
    <ChakraProvider>{children}</ChakraProvider>
)

describe('FeatureCard', () => {
    it('should render title and description', () => {
        render(
            <ChakraWrapper>
                <FeatureCard
                    icon={<MockIcon />}
                    title="Test Title"
                    description="Test description content"
                />
            </ChakraWrapper>
        )

        expect(screen.getByText('Test Title')).toBeInTheDocument()
        expect(screen.getByText('Test description content')).toBeInTheDocument()
        expect(screen.getByTestId('mock-icon')).toBeInTheDocument()
    })

    it('should render with React node title', () => {
        const titleNode = (
            <span>
                Complex <strong>Title</strong>
            </span>
        )

        render(
            <ChakraWrapper>
                <FeatureCard
                    icon={<MockIcon />}
                    title={titleNode}
                    description="Test description"
                />
            </ChakraWrapper>
        )

        expect(screen.getByText('Complex')).toBeInTheDocument()
        expect(screen.getByText('Title')).toBeInTheDocument()
    })

    it('should render with React node description', () => {
        const descriptionNode = (
            <div>
                <p>First paragraph</p>
                <p>Second paragraph</p>
            </div>
        )

        render(
            <ChakraWrapper>
                <FeatureCard
                    icon={<MockIcon />}
                    title="Test Title"
                    description={descriptionNode}
                />
            </ChakraWrapper>
        )

        expect(screen.getByText('First paragraph')).toBeInTheDocument()
        expect(screen.getByText('Second paragraph')).toBeInTheDocument()
    })

    it('should render icon properly', () => {
        render(
            <ChakraWrapper>
                <FeatureCard
                    icon={<div data-testid="custom-icon">Custom Icon</div>}
                    title="Test Title"
                    description="Test description"
                />
            </ChakraWrapper>
        )

        expect(screen.getByTestId('custom-icon')).toBeInTheDocument()
        expect(screen.getByText('Custom Icon')).toBeInTheDocument()
    })
})