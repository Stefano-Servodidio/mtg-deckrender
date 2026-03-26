# Image Cache Rework — Plan

## Overview

Replace the current `card.id`-only cache key with **exact version identifiers**
(`set + collector_number`, or Scryfall UUID where exact version is confirmed).
This ensures that when a user requests "Archon of Cruelty (MH2) 342", the image
stored and retrieved corresponds to that specific printing — not an arbitrary
reprint.

---

## 1) Motivation

| Current behaviour                        | Target behaviour                              |
| ---------------------------------------- | --------------------------------------------- |
| Cache key = Scryfall UUID (`card.id`)    | Cache key = `${set}:${collector_number}`      |
| UUID carries no version semantics        | Exact-version key guarantees correct printing |
| Name-only lookup may return any printing | Key is deterministic and matches user request |
| No way to invalidate a specific printing | Cache key is meaningful and human-readable    |

---

## 2) Exact Version Key Design

### Proposed key format

```
${set.toLowerCase()}:${collector_number}
```

Examples:

- `mh2:342` for Archon of Cruelty (MH2) #342
- `eld:1` for a card at collector number 1 in Eldraine

### Key derivation

A card image only reaches the `deck-png` route after it has been successfully
resolved by `/api/cards` or `/api/collections`. Both routes return a `CardItem`
populated from a Scryfall response which **always** includes `set` and
`collector_number`. Therefore:

- Every `CardItem` that arrives at `downloadCardImage` is guaranteed to carry
  `set` and `collector_number`.
- The key is always `${set.toLowerCase()}:${collector_number}`.
- No UUID-based fallback is needed or supported. Cards that could not be
  resolved by the upstream APIs are excluded before reaching deck-png.

---

## 3) In-Memory Cache Improvements

### Current issues

| Issue                                                                                                                | Impact                                                       |
| -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `CircularCache` is FIFO (evicts oldest by insertion time)                                                            | Frequently-accessed images are evicted while stale ones stay |
| `keys` array + `Map` can drift if concurrent code mutates both                                                       | Memory-safety risk in high-concurrency environments          |
| No TTL support on individual entries                                                                                 | Images stored forever until evicted by size                  |
| `overlayCache`, `cardImageCache`, `cardCache`, `collectionCardCache` are all separate instances with different types | Inconsistent eviction behaviour across caches                |

### Proposed improvements

#### 3a) Upgrade `CircularCache` to LRU

Replace the FIFO `keys[]` queue with a proper LRU (Least Recently Used)
eviction strategy using a `Map` with insertion-order iteration (already O(1)
per move-to-end):

```typescript
// Move entry to end of Map on get → simulates LRU with Map iteration order
get(key: string): T | undefined {
    if (!this.cache.has(key)) return undefined
    const value = this.cache.get(key)!
    this.cache.delete(key)
    this.cache.set(key, value) // re-insert to make it "most recent"
    return value
}
```

This eliminates the separate `keys[]` array, removes the drift risk, and
reduces memory overhead.

#### 3b) Optional per-entry TTL

Add an optional `ttl` field to individual cache entries or a
`maxAge` constructor parameter, so image entries expire after 90 days
(matching Blobs revalidation period) without requiring manual eviction.

#### 3c) Typed wrapper for TTL-bearing entries

Keep the cache generic (`CircularCache<T>`) but provide a typed helper:

```typescript
interface Expirable<T> {
    data: T
    expires: number
}
const cardCache = new CircularCache<Expirable<CardItem>>(1000)
```

This is already the pattern for `cardCache` and `collectionCardCache`.
Apply the same pattern to `cardImageCache` so image entries also expire.

---

## 4) API Changes

### 4a) `CardItem` — add `set` and `collector_number`

To compute exact-version keys at cache lookup time without an extra Scryfall
call, add `set` and `collector_number` to `CardItem`:

```typescript
interface CardItem {
    // existing fields …
    set?: string // e.g. "mh2"
    collector_number?: string // e.g. "342"
}
```

Mark both as optional so existing code that constructs `CardItem` without
these fields continues to compile. Populate them from `ScryfallCard` in
`createCardItem()`.

### 4b) `downloadCardImage` — use exact-version key

```typescript
function exactVersionKey(card: CardItem): string {
    return `${card.set!.toLowerCase()}:${card.collector_number!}`
}
```

Replace `const cacheKey = \`${card.id}\``with`exactVersionKey(card)`in`utils/api.ts` for both memory cache and Blobs lookups. The non-null assertions
are safe because cards reaching this function have already passed through the
Scryfall lookup and are guaranteed to carry both fields.

### 4c) Netlify Blobs storage key

Replace `cardId` (UUID) with the exact-version key in `getImageFromBlobs` /
`saveImageToBlobs`. Update `StoredImageMetadata` to record `set`,
`collector_number`, and `scryfallId` for provenance.

> **Migration concern**: existing Blob entries keyed by UUID will not be
> found with the new key and will cause a re-download on first access.
> This is acceptable — the result is a one-time cache miss with a graceful
> fallback to Scryfall. No data loss occurs.

---

## 5) `deck-png` Route Changes

The `/api/deck-png` route calls `downloadAllCardImages(cards)` → `downloadCardImage(card)`.
No changes to the route itself are needed once `downloadCardImage` uses the
exact-version key internally.

---

## 6) Checklist

### Phase A — Types and key computation

- [ ] Add `set` and `collector_number` as **required** fields to `CardItem` (Scryfall always returns them; all existing callers already populate them via `createCardItem`).
- [ ] Update `createCardItem()` in `utils/decklist.ts` to populate them from `ScryfallCard`.
- [ ] Add `exactVersionKey(card: CardItem): string` helper (returns `${set}:${collector_number}`) to `utils/cacheKeys.ts`.

### Phase B — In-memory cache

- [ ] Refactor `CircularCache` to LRU using Map re-insertion on `get`.
- [ ] Remove the `keys[]` array to eliminate drift risk.
- [ ] Add optional `maxAge` constructor parameter for TTL-based expiry.
- [ ] Add `size()` and `peek()` (non-promoting read) helpers.
- [ ] Update unit tests in `utils/cache/__tests__/circularCache.test.ts`.

### Phase C — Image download utilities

- [ ] Replace UUID-only cache key with `exactVersionKey()` in `downloadCardImage`.
- [ ] Replace `cardId` param in `getImageFromBlobs` / `saveImageToBlobs` with the version key.
- [ ] Update `StoredImageMetadata` to record `set`, `collector_number`, `scryfallId`.
- [ ] Update `needsRevalidation` to use the same key.

### Phase D — Collections and cards API alignment

- [ ] Verify `collectionCardCache` key strategy is consistent with `cardImageCache` key strategy.
- [ ] Document the key format in a shared constant / enum.

### Phase E — Tests

- [ ] Unit tests for `exactVersionKey()` (with and without set/collector_number).
- [ ] Unit tests for updated `CircularCache` (LRU eviction order, TTL expiry).
- [ ] Update `cardImageStorage` tests to use version keys.
- [ ] Integration test: request same card twice; second request must hit memory cache.

### Phase F — Migration and rollout

- [ ] Document Blobs key change in a migration note (acceptable one-time re-download).
- [ ] Verify no production data loss (Blobs entries keyed by UUID become orphaned but not deleted).
- [ ] Run full build and test suite.
- [ ] Smoke-test in dev with `DEV_DEBUG_DISABLE_BLOBS=false` to confirm Blobs round-trip.

---

## 7) Performance Considerations

- LRU lookup remains O(1) (Map operations).
- Key computation is O(k) where k is key string length (~20 chars).
- No additional Scryfall calls required; `set` and `collector_number` are
  already present in the Scryfall response that populates `CardItem`.
- Blobs key change eliminates the need to store the UUID in the key, saving
  ~36 bytes per entry (minor).
- Adding TTL expiry to `cardImageCache` prevents unbounded memory growth in
  long-running serverless instances.
