# Testing Guide

This document provides comprehensive instructions for writing and running tests in the MTG Deck to PNG project.

## Overview

This project uses [Vitest](https://vitest.dev/) as the testing framework along with [Chai](https://www.chaijs.com/) for assertions and [Testing Library](https://testing-library.com/) for React component testing.

## Setup

The testing environment is already configured with:

- **Vitest**: Fast unit test framework with native TypeScript support
- **Chai**: Assertion library (via @testing-library/jest-dom matchers)
- **@testing-library/react**: React component testing utilities
- **@testing-library/jest-dom**: Custom DOM matchers
- **jsdom**: DOM environment for testing
- **@vitejs/plugin-react**: React support for Vite/Vitest

## Running Tests

```bash
# Run tests in watch mode (interactive)
npm test

# Run tests once and exit
npm run test:run

# Run tests with UI (opens browser interface)
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

## Project Structure

Tests are located alongside their corresponding source files:

```
/
├── utils/
│   ├── api.ts
│   └── api.test.ts
├── hooks/
│   ├── useCards.ts
│   ├── useCards.test.ts
│   └── ...
├── components/
│   ├── DropZone.tsx
│   ├── DropZone.test.tsx
│   └── ...
└── test-setup.ts (global test configuration)
```

## Writing Tests

### Utility Functions

For pure functions and utilities, write straightforward unit tests:

```typescript
import { describe, it, expect } from 'vitest'
import { getUniqueCards } from '../utils/api'

describe('getUniqueCards', () => {
    it('should parse a simple decklist correctly', () => {
        const decklist = '4 Lightning Bolt\n2 Counterspell'
        const result = getUniqueCards(decklist, 'main')

        expect(result).toHaveLength(2)
        expect(result[0]).toEqual({
            name: 'Lightning Bolt',
            quantity: 4,
            type: 'main'
        })
    })

    it('should handle edge cases', () => {
        const result = getUniqueCards('', 'main')
        expect(result).toHaveLength(0)
    })
})
```

### React Hooks

For custom hooks, use `renderHook` from Testing Library:

```typescript
import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFetchState } from '../hooks/useFetchState'

describe('useFetchState', () => {
    it('should initialize with default values', () => {
        const { result } = renderHook(() => useFetchState<string>())

        expect(result.current.data).toBeNull()
        expect(result.current.isLoading).toBe(false)
    })

    it('should update state correctly', () => {
        const { result } = renderHook(() => useFetchState<string>())

        act(() => {
            result.current.setData('test')
        })

        expect(result.current.data).toBe('test')
    })
})
```

### React Components

For React components, use Testing Library's `render` function with Chakra UI provider:

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChakraProvider } from '@chakra-ui/react'
import FeatureCard from '../components/FeatureCard'

// Wrapper for Chakra UI context
const ChakraWrapper = ({ children }: { children: React.ReactNode }) => (
    <ChakraProvider>{children}</ChakraProvider>
)

describe('FeatureCard', () => {
    it('should render title and description', () => {
        render(
            <ChakraWrapper>
                <FeatureCard
                    icon={<div data-testid="icon">Icon</div>}
                    title="Test Title"
                    description="Test description"
                />
            </ChakraWrapper>
        )

        expect(screen.getByText('Test Title')).toBeInTheDocument()
        expect(screen.getByText('Test description')).toBeInTheDocument()
    })
})
```

### Mocking

#### External Libraries

Use `vi.mock()` for mocking external dependencies:

```typescript
import { vi } from 'vitest'

// Mock react-dropzone
vi.mock('react-dropzone', () => ({
    useDropzone: vi.fn()
}))

// In your test
const { useDropzone } = await import('react-dropzone')
vi.mocked(useDropzone).mockReturnValue({
    // mock implementation
})
```

#### Timers

For testing time-dependent code:

```typescript
import { vi, beforeEach, afterEach } from 'vitest'

beforeEach(() => {
    vi.useFakeTimers()
})

afterEach(() => {
    vi.useRealTimers()
})

it('should handle timeouts', async () => {
    const promise = sleep(100)
    vi.advanceTimersByTime(100)
    await promise
    // assertions
})
```

## Best Practices

### 1. Test Structure

- Use descriptive test names that explain the expected behavior
- Group related tests using `describe` blocks
- Follow the Arrange-Act-Assert pattern

### 2. Test Coverage

Focus on testing:

- **Critical paths**: Core functionality like deck parsing and image generation
- **Edge cases**: Empty inputs, invalid data, error conditions
- **User interactions**: Button clicks, form submissions, file uploads
- **State changes**: Hook state updates, component props changes

### 3. Mocking Guidelines

- Mock external dependencies (APIs, file system, third-party libraries)
- Don't mock the code you're testing
- Use real implementations for simple utilities when possible
- Mock complex or unreliable dependencies

### 4. Component Testing

- Test behavior, not implementation details
- Use `screen.getByRole()` and `screen.getByText()` over `querySelector`
- Test user interactions with `fireEvent` or `userEvent`
- Verify accessible content and ARIA attributes

### 5. Async Testing

- Use `async/await` for asynchronous operations
- Use `waitFor()` for elements that appear after async operations
- Mock fetch requests and API calls appropriately

### 6. Error Handling

Test error scenarios:

```typescript
it('should handle API errors gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    // trigger error condition

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Error'))
    consoleSpy.mockRestore()
})
```

## Configuration Files

### vitest.config.ts

Main configuration for Vitest with React support and path aliases.

### test-setup.ts

Global test setup including jest-dom matchers and cleanup configuration.

## Continuous Integration

Tests run automatically on:

- Every commit to any branch
- Pull request creation and updates
- Before deployment

Ensure all tests pass before submitting pull requests.

## Troubleshooting

### Common Issues

1. **Import errors**: Ensure proper path aliases are configured in `vitest.config.ts`
2. **DOM not available**: Verify `environment: 'jsdom'` is set in config
3. **Chakra UI components not rendering**: Use the `ChakraWrapper` in component tests
4. **Async operations not completing**: Use `waitFor()` or proper async/await patterns

### Debugging Tests

- Use `console.log()` in tests for debugging (remove before committing)
- Use `screen.debug()` to see rendered DOM structure
- Run single test files: `npm test -- filename.test.ts`
- Use `--reporter=verbose` for detailed output

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Docs](https://testing-library.com/docs/)
- [Chakra UI Testing](https://chakra-ui.com/getting-started/comparison#testing)
- [React Testing Patterns](https://reactjs.org/docs/testing.html)
