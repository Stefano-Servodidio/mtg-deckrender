# End-to-End Testing Guide

This document provides comprehensive instructions for writing, running, and maintaining E2E tests for the MTG Deck to PNG project using Cypress.

## Overview

The E2E testing setup uses Cypress to test the complete user workflows, from uploading decklists to generating and downloading PNG images. Tests are designed to validate the entire application stack including the frontend UI, API endpoints, and user interactions.

## Setup Instructions

### Prerequisites

- Node.js >= 22.0.0 (or the version specified in package.json)
- npm installed
- Project dependencies installed (`npm install`)

### Installation

E2E testing dependencies are already included in the project:

```bash
npm install --save-dev cypress @cypress/react cypress-file-upload start-server-and-test
```

### Configuration

The Cypress configuration is defined in `cypress.config.ts` with the following key settings:

- **Base URL**: `http://localhost:3000` (Next.js development server)
- **Viewport**: 1280x720 (desktop testing)
- **Timeouts**: 10 seconds for commands, requests, and page loads
- **Retries**: 2 retries in run mode, 0 in open mode
- **Screenshots**: Enabled on failure
- **Video**: Disabled (can be enabled for CI)

## Running Tests

### Development Mode (Interactive)

Run tests in interactive mode for development and debugging:

```bash
# Start the development server and open Cypress UI
npm run e2e:open

# Or manually start server and open Cypress separately
npm run dev  # In one terminal
npm run cypress:open  # In another terminal
```

### Headless Mode (CI/Production)

Run all E2E tests in headless mode:

```bash
# Start server and run all E2E tests
npm run e2e

# Or run tests against running server
npm run cypress:run
```

### Component Tests

Run component-specific tests:

```bash
npm run cypress:component
```

## Test Structure

### Directory Layout

```
cypress/
├── e2e/                           # End-to-end test files
│   ├── deck-to-png-flow.cy.ts     # Main user flow tests
│   └── navigation.cy.ts           # Navigation and UI tests
├── component/                     # Component-specific tests
├── fixtures/                     # Test data files
│   └── sample-decklists.json     # Sample MTG decklists
├── support/                      # Support files and utilities
│   ├── commands.ts               # Custom Cypress commands
│   ├── e2e.ts                   # E2E support file
│   ├── component.ts             # Component testing support
│   └── component-index.html     # Component test HTML template
└── cypress.config.ts            # Cypress configuration
```

### Test Files

#### Main Flow Tests (`deck-to-png-flow.cy.ts`)

Tests the complete user workflow:

1. Upload decklist (60x Island, 15x Plains)
2. Generate image with default options
3. Download generated image
4. Validate error handling and edge cases

#### Navigation Tests (`navigation.cy.ts`)

Tests UI navigation and responsive design:

- Page navigation
- Responsive behavior across viewports
- Keyboard navigation
- Footer information display

## Custom Commands

The project includes custom Cypress commands for common operations:

### `cy.uploadDecklist(decklistText)`

Uploads a decklist to the application:

```typescript
cy.uploadDecklist('60x Island\n15x Plains')
```

### `cy.generateImage()`

Generates a deck image with current settings:

```typescript
cy.generateImage()
```

### `cy.downloadImage()`

Verifies the download functionality:

```typescript
cy.downloadImage()
```

### `cy.waitForToast(message?)`

Waits for toast notifications:

```typescript
cy.waitForToast('Image generated successfully!')
```

## Writing E2E Tests

### Best Practices

#### 1. Test User Workflows, Not Implementation

Focus on testing complete user journeys rather than individual functions:

```typescript
// Good - tests complete workflow
it('should complete deck-to-PNG workflow', () => {
    cy.uploadDecklist('60x Island\n15x Plains')
    cy.generateImage()
    cy.downloadImage()
})

// Avoid - tests implementation details
it('should call generateImage API', () => {
    cy.intercept('POST', '/api/deck-png').as('generateAPI')
    // ...
})
```

#### 2. Use Descriptive Test Names

Write test names that clearly describe the expected behavior:

```typescript
// Good
it('should handle deck with sideboard cards')

// Avoid
it('test sideboard')
```

#### 3. Isolate Tests

Each test should be independent and not rely on previous test state:

```typescript
beforeEach(() => {
    cy.visit('/create')
    // Reset any necessary state
})
```

#### 4. Use Page Object Pattern for Complex Interactions

For complex pages, consider using page objects:

```typescript
class CreatePage {
    uploadDecklist(text: string) {
        cy.get('textarea[data-testid="upload-decklist-textarea"]').type(text)
        cy.get('button').contains('Upload Decklist').click()
    }
}
```

#### 5. Handle Async Operations Properly

Wait for dynamic content and API calls:

```typescript
// Wait for elements to appear
cy.get('button').contains('Generate Deck Image', { timeout: 10000 })

// Wait for API calls to complete
cy.intercept('POST', '/api/deck-png').as('generateImage')
cy.wait('@generateImage')
```

### Testing Different Scenarios

#### Basic Functionality

```typescript
it('should complete basic workflow', () => {
    cy.fixture('sample-decklists').then((decklists) => {
        cy.uploadDecklist(decklists.basicLands)
        cy.generateImage()
        cy.downloadImage()
    })
})
```

#### Error Handling

```typescript
it('should handle invalid decklist format', () => {
    cy.uploadDecklist('invalid format')
    cy.get('button').contains('Upload Decklist').click()
    cy.waitForToast('Invalid format')
})
```

#### Edge Cases

```typescript
it('should handle empty decklist', () => {
    cy.get('button').contains('Upload Decklist').should('be.disabled')
})
```

## Test Data Management

### Fixtures

Store test data in `cypress/fixtures/`:

```json
// cypress/fixtures/sample-decklists.json
{
    "basicLands": "60x Island\n15x Plains",
    "complexDeck": "4x Lightning Bolt\n4x Counterspell\n..."
}
```

Use fixtures in tests:

```typescript
cy.fixture('sample-decklists').then((decklists) => {
    cy.uploadDecklist(decklists.basicLands)
})
```

### Dynamic Data

For dynamic test data, generate it within tests:

```typescript
const generateRandomDecklist = () => {
    const cards = ['Lightning Bolt', 'Counterspell', 'Island']
    return cards.map((card) => `4x ${card}`).join('\n')
}
```

## Configuration and Environment

### Environment Variables

Set environment variables for different testing environments:

```bash
# cypress.env.json
{
  "baseUrl": "http://localhost:3000",
  "apiUrl": "http://localhost:3000/api"
}
```

### Viewport Testing

Test different screen sizes:

```typescript
it('should work on mobile', () => {
    cy.viewport(375, 667)
    cy.visit('/create')
    // Test mobile-specific behavior
})
```

## Debugging and Troubleshooting

### Common Issues

#### 1. Element Not Found

```typescript
// Solution: Use proper waits and timeouts
cy.get('button', { timeout: 10000 }).should('be.visible')
```

#### 2. API Timing Issues

```typescript
// Solution: Intercept and wait for API calls
cy.intercept('POST', '/api/cards').as('fetchCards')
cy.wait('@fetchCards')
```

#### 3. Flaky Tests

```typescript
// Solution: Add proper waits and assertions
cy.get('button').contains('Upload Decklist').should('not.be.disabled')
```

### Debugging Tools

1. **Cypress App**: Use `npm run cypress:open` for interactive debugging
2. **Screenshots**: Automatically taken on test failures
3. **Console Logs**: Available in Cypress app console
4. **Time Travel**: Step through test execution in Cypress app

### Browser Console Access

```typescript
cy.window().then((win) => {
    console.log(win.document.title)
})
```

## CI/CD Integration

### GitHub Actions Example

```yaml
# .github/workflows/e2e.yml
name: E2E Tests
on: [push, pull_request]

jobs:
    e2e:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v3
            - uses: actions/setup-node@v3
              with:
                  node-version: '22'
            - run: npm ci
            - run: npm run build
            - run: npm run e2e
```

### Test Reports

Configure test reporting for CI:

```typescript
// cypress.config.ts
export default defineConfig({
    e2e: {
        reporter: 'junit',
        reporterOptions: {
            mochaFile: 'cypress/results/test-results-[hash].xml'
        }
    }
})
```

## Project-Specific Guidelines

### MTG Deck Testing Considerations

#### 1. API Rate Limits

Be mindful of Scryfall API rate limits:

```typescript
// Mock API responses for faster, more reliable tests
cy.intercept('GET', '**/scryfall.com/**', { fixture: 'cards.json' })
```

#### 2. Image Generation Testing

Test image generation without actually downloading large files:

```typescript
cy.intercept('POST', '/api/deck-png', {
    statusCode: 200,
    headers: { 'content-type': 'image/png' },
    body: 'mock-image-data'
})
```

#### 3. Card Data Validation

Validate that card data is properly formatted:

```typescript
cy.window()
    .its('localStorage')
    .invoke('getItem', 'cardData')
    .should('contain', 'image_uris')
```

#### 4. Performance Testing

Monitor performance of large deck processing:

```typescript
cy.intercept('POST', '/api/cards').as('fetchCards')
cy.wait('@fetchCards').then((interception) => {
    expect(interception.response.duration).to.be.lessThan(5000)
})
```

### Accessibility Testing

Include accessibility checks in E2E tests:

```typescript
// Install cypress-axe for accessibility testing
cy.injectAxe()
cy.checkA11y()
```

### Error Boundary Testing

Test error boundaries and fallback UI:

```typescript
cy.window().then((win) => {
    win.onerror = cy.stub()
})
```

## Maintenance and Updates

### Updating Test Data

Regularly update test fixtures to reflect current card data:

```bash
# Update sample decklists with new cards
# Update API response fixtures
```

### Test Cleanup

Remove obsolete tests and update selectors as UI changes:

```typescript
// Update selectors when UI components change
cy.get('[data-testid="upload-button"]') // Preferred
cy.get('button').contains('Upload') // Acceptable
cy.get('.upload-btn') // Avoid - brittle
```

### Performance Monitoring

Monitor test execution time and optimize slow tests:

```bash
# Run with timing information
cypress run --reporter json | jq '.stats.duration'
```

## Resources

- [Cypress Documentation](https://docs.cypress.io/)
- [Best Practices Guide](https://docs.cypress.io/guides/references/best-practices)
- [Real World App Examples](https://github.com/cypress-io/cypress-realworld-app)
- [Cypress Testing Library](https://testing-library.com/docs/cypress-testing-library/intro)
- [MTG API Documentation](https://scryfall.com/docs/api)

## Getting Help

For project-specific E2E testing questions:

1. Check this documentation
2. Review existing test examples
3. Consult the main TESTING.md for general testing guidelines
4. Open an issue in the project repository
