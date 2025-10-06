# MTG Deck to PNG - Copilot Coding Agent Instructions

## Project Overview

A Next.js 14 web app that converts MTG decklists to PNG images using Scryfall API. Built with React 18, TypeScript, Chakra UI.

**Tech**: Next.js 14 App Router, React 18, TypeScript, Chakra UI, Vitest, Cypress  
**Size**: ~122 source files, ~1,540 lines  
**Node**: >= 22.0.0 (works with 20.x + warnings)  
**Package Manager**: npm

## Critical Build and Test Information

### Installation

**ALWAYS run:** `CYPRESS_INSTALL_BINARY=0 npm install`

**Why**: Cypress binary may fail in restricted networks. This skips binary but installs npm package. Use `npm run validate:e2e` without binary.

### Building

Build command: `npm run build` (~60-90s)

### Testing

**Unit Tests (Vitest)**:

- `npm run test:run` - Run once (~25-30s)
- `npm test` - Watch mode
- `npm run test:coverage` - With coverage

All tests pass.

**E2E (Cypress)**:

- `npm run validate:e2e` - Validate without binary (~2s)
- `npm run e2e` - Run tests (needs binary + dev server, 2-5min)

**Note**: Cypress binary may be unavailable. Validate with unit tests.

### Linting, Formatting, Dev

- `npm run lint` - May prompt for ESLint setup
- `npm run format` - Auto-fix (always before commit)
- `npm run format -- --check` - Check only
- `npm run dev` - Dev server at http://localhost:3000 (~5-10s)

**Git Hooks**: NOT auto-installed. Run `cp .githooks/* .git/hooks/` to enable lint-staged pre-commit.

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

- `next.config.js`: ESLint ignored during builds, images unoptimized
- `tsconfig.json`: Paths alias `@/*` → `./`
- `eslint.config.mjs`: Uses `unused-imports` plugin
- `vitest.config.ts`: jsdom environment, 60% coverage threshold
- `cypress.config.ts`: baseURL localhost:3000, no video
- `netlify.toml`: Node 22

### Key Source Files

- `app/create/page.tsx` (277 lines): Main deck creation UI
- `hooks/useCards.ts`, `useCollections.ts`, `useDeckPng.ts` (167-194 lines each): Core business logic
- `app/api/cards/route.ts`: Fetch 1-by-1 (max 75)
- `app/api/collections/route.ts`: Batch fetch (max 150, 24hr cache)
- `app/api/deck-png/route.ts`: Image generation (Sharp)
- `components/DropZone.tsx` (104 lines): Decklist input
- `components/FilterItem.tsx` (134 lines): Card filtering
- `components/Navbar.tsx` (149 lines): Navigation

## CI/CD

`.github/workflows/ci.yml`: Runs on push to `main` + PRs. Node 20 (not 22). Steps: `npm ci` → `npm run lint`. Tests disabled.

## Common Pitfalls

1. **Cypress Install**: Always use `CYPRESS_INSTALL_BINARY=0 npm install`
2. **Node Version**: Ignore EBADENGINE warning (package.json says >=22, CI uses 20, both work)
3. **Formatting**: Run `npm run format` before commit
4. **Lint Setup**: May prompt interactively - eslint.config.mjs exists but Next.js needs setup

## Validation Checklist

Before finalizing changes, **always** run these commands in order:

1. `npm run format` - Fix formatting
2. `npm run test:run` - Run unit tests (all should pass)
3. `npm run build` - Build the app
4. Manually test in browser with `npm run dev` if changing UI or API logic

## Additional Notes

- Scryfall API rate limit: 10 req/sec recommended
- Image generation: Sharp library
- Overlays: Regenerate with `npm run generate:overlays` (x2-x100)
- Caching: 24hr in-memory for Collections API
- TODO in DropZone.tsx: add .dek file support

## Trust These Instructions

Thoroughly validated through testing. Only search for more info if: instructions incomplete for your task, undocumented error, or need deeper implementation details.
