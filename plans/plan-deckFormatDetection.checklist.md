# Deck Format Detection Checklist

## 1) Contracts and Types

- [ ] Define matcher output type (`format`, `score`, `evidence`).
- [ ] Define normalized parsed-card type (`quantity`, `groupId`, `rawLine`, `identifierCandidates`).
- [ ] Define identifier candidate priority: `{mtgo_id}` (where valid) -> `{collector_number,set}` -> `{name,set}` -> `{name}`.

## 2) Matchers (Low False Positives)

- [ ] Implement matcher: MTGO `.dek` XML.
- [ ] Implement matcher: MTGO `.csv`.
- [ ] Implement matcher: Moxfield exact.
- [ ] Implement matcher: Moxfield Arena copy.
- [ ] Implement matcher: Arena default export.
- [ ] Implement matcher: MTGGoldfish exact variants.
- [ ] Implement matcher: MTGO/plain text.
- [ ] Implement deterministic tie-break order: XML > CSV > Moxfield exact > Arena default > MTGGoldfish exact > plain text > heuristics.
- [ ] Allow early stop only for deterministic signatures (XML prolog + `<Deck>`, exact CSV header).

## 3) Parsers and Identifier Extraction

- [ ] Create parser modules under `services/card-list/` (e.g., `listParsers.ts`, `identifierBuilders.ts`).
- [ ] Parse section/group semantics (main, sideboard, commander) per format.
- [ ] Extract Moxfield exact identifiers from `name (SET) collector`.
- [ ] Extract Arena default identifiers from `(SET) number`.
- [ ] Extract MTGGoldfish exact identifiers from `name [SET]` with treatment/foil suffix trimming.
- [ ] Parse MTGO `.dek` XML card rows and sideboard flags.
- [ ] Parse MTGO `.csv` rows and `Sideboarded` values.

## 4) Orchestration Integration

- [ ] Add a single orchestration entrypoint (e.g., `parseDecklistToRequests(decklist)`).
- [ ] Integrate entrypoint into `app/api/collections/route.ts`.
- [ ] Integrate entrypoint into `app/api/cards/route.ts`.
- [ ] Preserve route limits and existing SSE behavior.

## 5) Fetch/Fallback Logic

- [ ] In `/api/collections`, request using best candidate tier first.
- [ ] Retry unresolved `not_found` entries once with next fallback tier only.
- [ ] Use stable request tokens/mapping instead of positional assumptions.
- [ ] Remove old mock fallback behavior that conflicts with candidate-based flow in `/api/collections`.
- [ ] Remove old mock fallback behavior that conflicts with candidate-based flow in `/api/cards`.
- [ ] Mark cards still unresolved after one retry as `not_found` without more retries.

## 6) Tests

- [ ] Add matcher unit tests for all supported formats.
- [ ] Add near-miss matcher tests to prevent false-positive wins.
- [ ] Add parser unit tests for identifier extraction and candidate ordering.
- [ ] Add parser unit tests for section/group assignment (main/sideboard/commander).
- [ ] Add `/api/collections` integration tests for candidate fallback pass.
- [ ] Add `/api/cards` integration tests for final name fallback path.
- [ ] Verify no regression in maintenance mode, validation, and SSE complete events.

## 7) Performance and Observability

- [ ] Bound matcher scan to sampled non-empty/header lines.
- [ ] Ensure detection/parsing remains O(n) and avoids regex backtracking traps.
- [ ] Add non-prod logs: selected format, score, detection ms, retry count.
- [ ] (Optional) Add timing analytics for detection/parsing stage.

## 8) Documentation

- [ ] Update `DECK-FORMATS.MD` with implemented behavior and limits.
- [ ] Document identifier preference order and fallback behavior.
- [ ] Document tie-break rules and deterministic-match early-stop policy.
- [ ] Document known limitations around MTGO ID mapping assumptions.

## 9) UI Guide (If In Scope)

- [ ] Add lightweight guide route with supported format examples.
- [ ] Include concise examples: Moxfield exact, MTGO `.dek`, Arena default, MTGGoldfish exact.
- [ ] Add guide link in upload section.
- [ ] Add guide link in footer.

## 10) Final Validation

- [ ] Run formatting.
- [ ] Run unit tests.
- [ ] Run build.
- [ ] Smoke-test key decklist inputs in dev UI/API.
