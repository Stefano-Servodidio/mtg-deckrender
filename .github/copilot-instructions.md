# MTG Deck to PNG - Copilot Coding Agent Instructions

## Project Overview

**Purpose**: A Next.js web application that converts Magic: The Gathering decklists to PNG images. Users can paste a decklist, the app fetches card images from the Scryfall API, and generates a composite PNG image for sharing or printing.

**Tech Stack**: Next.js 14 (App Router), React 18, TypeScript, Chakra UI, Vitest (unit tests), Cypress (E2E tests)  
**Repository Size**: ~122 source files, ~1,540 lines of core application code  
**Node Version**: >= 22.0.0 required (package.json), though Node 20.x works with warnings  
**Package Manager**: npm (lock file present)

## Critical Build and Test Information

### Installation

**ALWAYS run this first:**

```bash
CYPRESS_INSTALL_BINARY=0 npm install
```

**Why**: The Cypress binary download may fail in restricted network environments. Setting `CYPRESS_INSTALL_BINARY=0` skips the binary installation while still installing the npm package. E2E tests can still be validated via the `validate:e2e` script which doesn't require the binary.

### Building the Application

**Known Issue**: TypeScript compilation fails during `npm run build` because Cypress test files are inadvertently included in the TypeScript compilation.

**Error**: `Type error: Augmentations for the global scope can only be directly nested in external modules or ambient module declarations.` in `cypress/support/commands.ts`

**Workaround**: The `tsconfig.json` needs to exclude Cypress files but currently doesn't. If you need to build:

1. Temporarily add `"exclude": ["node_modules", "cypress"]` to `tsconfig.json`, OR
2. Add `export {}` at the top of `cypress/support/commands.ts` to make it a module

**Build command** (after fix):

```bash
npm run build  # Takes ~60-90 seconds
```

### Running Tests

**Unit Tests** (Vitest):

```bash
npm run test:run  # Run all tests once (~25-30 seconds)
npm test          # Run in watch mode
npm run test:coverage  # With coverage report
```

**Current Status**: 3 tests are failing (known issues in Accordion.test.tsx and decklist.test.ts). These are pre-existing failures - do not fix them unless your task requires it.

**E2E Tests** (Cypress):

```bash
npm run validate:e2e  # Validates Cypress setup without binary (~2 seconds)
npm run e2e           # Runs E2E tests (requires Cypress binary + dev server)
npm run e2e:open      # Opens Cypress UI (requires Cypress binary + dev server)
```

**Note**: E2E tests require the Cypress binary which may not be available. Always validate your changes with unit tests. E2E tests take 2-5 minutes to run.

### Linting and Formatting

**Lint**:

```bash
npm run lint  # May prompt for interactive ESLint setup on first run
```

**Format** (Prettier):

```bash
npm run format        # Auto-fix formatting
npm run format -- --check  # Check only (won't modify files)
```

**Note**: Many files currently have formatting issues. Always run `npm run format` before committing.

### Development Server

```bash
npm run dev  # Starts on http://localhost:3000
```

**Startup time**: ~5-10 seconds

### Git Hooks

**Important**: Git hooks are NOT automatically installed. To enable pre-commit hooks:

```bash
cp .githooks/* .git/hooks/
```

The pre-commit hook runs `npx lint-staged` which lints and formats staged files.

## Project Architecture

### Directory Structure

```
/app                    # Next.js App Router (pages and API routes)
  /api
    /cards             # POST endpoint: Fetch cards one-by-one (max 75 cards)
    /collections       # POST endpoint: Fetch cards in batches (max 150 cards, uses Scryfall Collections API)
    /deck-png          # POST endpoint: Generate PNG from card data
  /create              # Main page: deck creation UI
  layout.tsx           # Root layout with providers
  page.tsx             # Home page
  providers.tsx        # Chakra UI provider setup
/components             # Reusable React components
  Accordion.tsx
  DropZone.tsx         # File upload and decklist input
  FilterItem.tsx       # Card filtering/selection
  Navbar.tsx, Footer.tsx
  QuantityOverlay.tsx  # Overlay for card quantities
  /icons              # Custom icon components
  /_tests             # Component unit tests
/hooks                  # Custom React hooks
  useCards.ts          # Fetch cards via /api/cards
  useCollections.ts    # Fetch cards via /api/collections (batched)
  useDeckPng.ts        # Generate deck image
  useFetchState.ts     # Generic fetch state management
  /_tests             # Hook unit tests
/utils                  # Utility functions
  assets.ts            # Asset path helpers
  /cache              # In-memory caching for API responses
/cypress                # E2E tests (Cypress)
  /e2e                 # E2E test specs
  /fixtures            # Test data (sample-decklists.json)
  /support             # Custom commands and setup
/scripts                # Build and utility scripts
  generate-overlays.js  # Generate quantity overlay PNGs (x2-x100)
  cleanup-overlays.js   # Remove generated overlays
  validate-cypress.js   # Validate E2E setup without Cypress binary
/public                 # Static assets
  /overlays           # Generated quantity overlays (x2.png - x100.png)
/theme                  # Chakra UI theme customization
/types                  # TypeScript type definitions
```

### Configuration Files

- `next.config.js`: Next.js config (ESLint ignored during builds, images unoptimized)
- `tsconfig.json`: TypeScript config (paths alias `@/*` → `./`)
- `eslint.config.mjs`: ESLint config (uses `unused-imports` plugin)
- `vitest.config.ts`: Vitest config (jsdom environment, coverage thresholds: 60%)
- `cypress.config.ts`: Cypress config (baseURL: localhost:3000, no video recording)
- `.prettierrc`: Prettier config
- `netlify.toml`: Netlify deployment config (Node 22)

### Key Source Files

**Main Application Entry**:

- `app/create/page.tsx` (277 lines): Main UI for deck creation - handles decklist upload, card fetching, image generation, and download

**Custom Hooks** (core business logic):

- `hooks/useCards.ts` (167 lines): Fetches cards one-by-one via `/api/cards`
- `hooks/useCollections.ts` (167 lines): Fetches cards in batches via `/api/collections`
- `hooks/useDeckPng.ts` (194 lines): Generates deck image via `/api/deck-png`

**API Routes**:

- `app/api/cards/route.ts`: Named card API (max 75 cards)
- `app/api/collections/route.ts`: Collections API with batching (max 150 cards, 24hr cache)
- `app/api/deck-png/route.ts`: Image generation with Sharp library

**Components**:

- `components/DropZone.tsx` (104 lines): Drag-drop file upload and textarea for decklist input
- `components/FilterItem.tsx` (134 lines): Card filtering and selection UI
- `components/Navbar.tsx` (149 lines): Navigation with responsive design

## CI/CD Pipeline

**GitHub Actions** (`.github/workflows/ci.yml`):

- Triggers: Push to `main`, all pull requests
- Node version: 20 (not 22 as specified in package.json - known discrepancy)
- Steps: `npm ci` → `npm run lint`
- **Tests are commented out** in CI (`npm run test:coverage` is disabled)

## Common Pitfalls and Workarounds

1. **Build Failure**: If `npm run build` fails with TypeScript error about Cypress files, exclude cypress from `tsconfig.json` or add `export {}` to `cypress/support/commands.ts`

2. **Cypress Install Failure**: Always use `CYPRESS_INSTALL_BINARY=0 npm install` in restricted environments

3. **Node Version Warning**: Package.json requires Node >=22 but CI uses Node 20. Both work, ignore the EBADENGINE warning

4. **Formatting Issues**: Run `npm run format` before committing - many files have existing formatting issues

5. **Failing Tests**: 3 tests currently fail (Accordion component, decklist parsing). These are pre-existing - don't fix unless your task requires it

6. **Lint Interactive Setup**: If `npm run lint` prompts for configuration, it means ESLint isn't fully configured. The eslint.config.mjs exists but Next.js may need additional setup

## Validation Checklist

Before finalizing changes, **always** run these commands in order:

1. `npm run format` - Fix formatting
2. `npm run test:run` - Run unit tests (expect 3 pre-existing failures)
3. `npm run build` - Build the app (may fail due to Cypress - see workaround above)
4. Manually test in browser with `npm run dev` if changing UI or API logic

## Additional Notes

- **Scryfall API**: The app uses Scryfall's API for card data. Rate limits apply (10 requests/sec recommended)
- **Image Generation**: Uses Sharp library for compositing card images into a deck image
- **Overlays**: Quantity overlays (x2-x100) can be regenerated with `npm run generate:overlays`
- **Caching**: Collections API caches responses for 24 hours in memory
- **TODO**: DropZone.tsx has a TODO to add .dek file format support

## Trust These Instructions

These instructions are the result of thorough exploration and validation. Trust them and only search for additional information if:

- The instructions are incomplete for your specific task
- You encounter an error not documented here
- You need to understand implementation details beyond what's provided
