# Deck Format Detection Checklist

## 1) Contracts and Types ✅

- [x] Define matcher output type (`format`, `score`, `evidence`).
- [x] Define normalized parsed-card type (`quantity`, `groupId`, `rawLine`, `identifierCandidates`).
- [x] Define identifier candidate priority: `{mtgo_id}` (where valid) -> `{collector_number,set}` -> `{name,set}` -> `{name}`.

## 2) Matchers (Low False Positives) ✅

- [x] Implement matcher: MTGO `.dek` XML.
- [x] Implement matcher: MTGO `.csv`.
- [x] Implement matcher: Moxfield exact.
- [x] Implement matcher: Moxfield Arena copy.
- [x] Implement matcher: Arena default export.
- [x] Implement matcher: MTGGoldfish exact variants.
- [x] Implement matcher: MTGO/plain text.
- [x] Implement deterministic tie-break order: XML > CSV > Moxfield exact > Arena default > MTGGoldfish exact > plain text > heuristics.
- [x] Allow early stop only for deterministic signatures (XML prolog + `<Deck>`, exact CSV header).

## 3) Parsers and Identifier Extraction ✅

- [x] Create parser modules under `services/card-list/` (`listParsers.ts`, `identifierBuilders.ts`).
- [x] Parse section/group semantics (main, sideboard, commander) per format. Dynamic groupIds: 0=commander, 1/2/3/…=progressive.
- [x] Extract Moxfield exact identifiers from `name (SET) collector`.
- [x] Extract Arena default identifiers from `(SET) number`.
- [x] Extract MTGGoldfish exact identifiers from `name [SET]` with treatment/foil suffix trimming.
- [x] Parse MTGO `.dek` XML card rows and sideboard flags (MTGO ID constraint: 3–4 digit catId only).
- [x] Parse MTGO `.csv` rows and `Sideboarded` values (MTGO ID constraint: 3–4 digit mtgoId only).

## 4) Orchestration Integration ✅

- [x] Add a single orchestration entrypoint (`parseDecklistToRequests(decklist, format?)`).
- [x] Integrate entrypoint into `app/api/collections/route.ts`.
- [x] Integrate entrypoint into `app/api/cards/route.ts`.
- [x] Preserve route limits and existing SSE behavior.

## 5) Fetch/Fallback Logic ✅

- [x] In `/api/collections`, request using best candidate tier first.
- [x] Retry unresolved `not_found` entries once with next fallback tier only.
- [x] Use stable request tokens/mapping instead of positional assumptions.
- [x] Remove old mock fallback behavior that conflicts with candidate-based flow in `/api/collections`.
- [x] Remove old mock fallback behavior that conflicts with candidate-based flow in `/api/cards`.
- [x] Mark cards still unresolved after one retry as `not_found` without more retries.

## 6) Helper Extraction ✅

- [x] `identifierKey`, `getCardName`, `matchCardToRequest` moved to `services/card-list/collectionUtils.ts`.
- [x] `fetchBatch` extracted to `services/card-list/batchFetch.ts` as `fetchScryfallBatch()`.
- [x] Both exported from `services/card-list/index.ts`.

## 7) Tests ✅

- [x] Add matcher unit tests for all supported formats.
- [x] Add near-miss matcher tests to prevent false-positive wins.
- [x] Add parser unit tests for identifier extraction and candidate ordering.
- [x] Add parser unit tests for section/group assignment (main/sideboard/commander).
- [x] Add `collectionUtils` unit tests (16 tests).
- [x] Add `batchFetch` unit tests (6 tests).
- [x] Verify no regression in maintenance mode, validation, and SSE complete events.

## 8) Performance and Observability ✅

- [x] Bound matcher scan to sampled non-empty/header lines (first 40 lines).
- [x] Detection/parsing O(n); no backtracking regex.
- [x] Add non-prod logs: selected format, score, detection ms.

## 9) Documentation

- [ ] Update `DECK-FORMATS.MD` with implemented behavior: identifier preference order, tie-break rules, groupId convention, MTGO ID constraint.

## 10) UI Guide

- [ ] Create `/guide` route with supported format examples.
- [ ] Include examples: Moxfield exact, MTGO `.dek`, Arena default, MTGGoldfish exact, plain text.
- [ ] Highlight key parsing signals per format.
- [ ] Add guide link in upload section UI.
- [ ] Add guide link in Footer.
- [ ] Add guide link in Navbar (desktop + mobile).

## 11) Image Cache Rework (Phase 10 in prompt)

### Phase A — Types and key computation

- [ ] Add `set` and `collector_number` as required fields to `CardItem`.
- [ ] Update `createCardItem()` to populate from `ScryfallCard`.
- [ ] Add `exactVersionKey(card: CardItem): string` helper (`utils/cacheKeys.ts`).

### Phase B — In-memory cache

- [ ] Refactor `CircularCache` from FIFO to LRU (Map re-insertion on `get`).
- [ ] Remove `keys[]` array to eliminate drift risk.
- [ ] Add optional `maxAge` constructor parameter for TTL-based expiry.
- [ ] Add `peek()` (non-promoting read) helper.
- [ ] Update unit tests.

### Phase C — Image download utilities

- [ ] Replace UUID cache key with `exactVersionKey()` in `downloadCardImage`.
- [ ] Update `getImageFromBlobs` / `saveImageToBlobs` to use version key.
- [ ] Update `StoredImageMetadata` to record `set`, `collector_number`, `scryfallId`.
- [ ] Update `needsRevalidation` to use the same key.

### Phase D — API alignment

- [ ] Verify `collectionCardCache` key strategy consistent with `cardImageCache`.
- [ ] Document key format in a shared constant.

### Phase E — Tests

- [ ] Unit tests for `exactVersionKey()`.
- [ ] Unit tests for updated `CircularCache` (LRU eviction order, TTL expiry).
- [ ] Update `cardImageStorage` tests to use version keys.

## 12) Final Validation

- [ ] Run formatting.
- [ ] Run unit tests.
- [ ] Run build.
- [ ] Smoke-test key decklist inputs in dev UI/API.
