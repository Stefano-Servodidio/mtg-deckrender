# mtg-deck-to-png

A simple decklist image creator built with Next.js and React. This app allows users to create images from Magic: The Gathering decklists, making it easy to share or print your decks.

## Features

- Upload and parse MTG decklists
- Generate PNG images of your deck
- Modern UI with Chakra UI

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

## Available Scripts

- `npm run dev` — Start the development server
- `npm run build` — Build the app for production
- `npm run start` — Start the production server
- `npm run lint` — Run ESLint to check for code issues
- `npm run format` — Format code using Prettier

## GIT Hooks

# To enable hooks, run:

cp .githooks/\* .git/hooks/

## Tech Stack

- Next.js
- React
- Chakra UI
- TypeScript

## API Endpoints

### POST /api/cards

Fetches card information using Scryfall's named card API (one request per card).

**Limits:** Maximum 75 unique cards

**Request:**

```json
{
    "decklist": "4x Lightning Bolt\n2x Counterspell\n1x Jace, the Mind Sculptor"
}
```

**Response:** Streaming text/plain with Server-Sent Events for progress updates

### POST /api/collections

Fetches card information using Scryfall's Collections API (batch requests).

**Limits:** Maximum 150 unique cards (2 batches × 75 cards)

**Request:**

```json
{
    "decklist": "4x Lightning Bolt\n2x Counterspell\n1x Jace, the Mind Sculptor"
}
```

**Features:**

- Batching: Automatically splits requests into batches of 75 cards
- Throttling: 50ms delay between batch requests
- Caching: 24-hour in-memory cache for fetched cards
- Streaming: Real-time progress updates via Server-Sent Events

**Response:** Streaming text/plain with Server-Sent Events for progress updates

## License

MIT

## Rights

All rights to Magic: The Gathering card images belong to Wizards of the Coast.
This app uses the Scryfall API for card data and images.
