## Plan: Robust Deck Format Detection & Parsing

Add a two-stage intake pipeline: (1) deterministic format detection with confidence scoring over sampled lines, then (2) format-specific parsing into ordered Scryfall identifier candidates (preferred + fallbacks). Keep API performance stable by doing lightweight regex/token checks only once per request and preserving existing batching/caching in `/api/collections` and `/api/cards`.

**Steps**

1. **Define canonical parser output contract**
    - Create shared types for matcher scores and parser output to avoid parser-specific branching later.
    - Output shape per card line should include: `quantity`, `groupId`, `rawLine`, and `identifierCandidates` ordered by reliability (e.g., `{set, collector_number}` first, then `{name, set}`, then `{name}`).
    - Include a parse-level `format`, `score`, and `evidence` for observability.

2. **Implement low-false-positive matcher layer** (_Phase A_)
    - Implement one matcher per documented format in `services/card-list/listMatchers.ts`:
        - Moxfield exact (`name (SET) collector` with commander/main/sideboard sections)
        - Moxfield Arena copy (About/Name/Deck/Sideboard blocks)
        - MTGO `.dek` XML
        - MTGO `.csv`
        - MTGO/plain text (`qty name` + optional `SIDEBOARD:`)
        - Arena default export (`Deck` / `Commander` sections + `(SET) number` lines)
        - MTGGoldfish exact variants (`[SET]`, optional `<treatment>`, optional `(F|FE)`)
    - Use weighted signals (headers, delimiters, token patterns), not a single regex. Cap score to 10.
    - Add tie-break policy for your chosen behavior (`always pick highest`): if equal score, choose the matcher with higher-priority deterministic signature (XML > CSV > structured headers > generic line format).
    - Early stop only for deterministic signatures (e.g., XML prolog + `<Deck>`, CSV header exact match), not just any 10/10 from heuristic patterns.

3. **Implement format-specific parsers producing Scryfall identifiers** (_depends on 1,2_)
    - Add parser module(s) under `services/card-list/` (e.g., `listParsers.ts` + `identifierBuilders.ts`).
    - For each format line, extract the best supported `/cards/collection` identifiers:
        - Best: `{mtgo_id}` (only for MTGO .dek and .csv)
        - Preferred when possible: `{collector_number, set}`
        - Fallback: `{name, set}`
        - Last fallback: `{name}`
    - Preserve section semantics: main deck vs sideboard; commander position where represented as sideboard annotation.

4. **Add an orchestration entrypoint and integrate APIs** (_depends on 3_)
    - Introduce a single entrypoint (e.g., `parseDecklistToRequests(decklist)`) that runs matcher -> selected parser -> normalized card requests.
    - Integrate this in:
        - `app/api/collections/route.ts` (primary path)
        - `app/api/cards/route.ts` (fallback/legacy path)
    - Keep existing limits (150 unique in collections, 75 in cards) and SSE progress behavior unchanged.

5. **Adjust fetch logic to consume identifier candidates efficiently** (_depends on 4_)
    - For `/api/collections`: submit best candidate per card first; if `not_found`, retry unresolved cards in one additional pass with next fallback candidate tier. One single retry, collate all unresolved cards according to querty limits, do not retry indefinitely.
    - clean up mock card fallback logic in `/api/collections` route to align with new candidate-based approach; remove any old fallback that doesn't fit the new contract. Missing cards after one retry should be marked `not_found` without further retries to protect latency.
    - Ensure stable mapping by using a request token per entry (do not rely on response index when `not_found` exists).
    - For `/api/cards` (named endpoint), use final `{name}` fallback only; avoid repeated per-card retries to protect latency.
    - clean up mock card fallback logic in `/api/cards` route to align with new candidate-based approach; remove any old fallback that doesn't fit the new contract. Missing cards after one retry should be marked `not_found` without further retries to protect latency.
6. **Add strong test coverage from DECK-FORMATS fixtures** (_parallelizable after 2/3 skeleton exists_)
    - Add matcher tests for every supported format and near-miss anti-cases to prevent false positives.
    - Add parser tests asserting identifier candidate ordering and extracted quantities/sections.
    - Add integration tests for both API routes verifying:
        - correct parser selected
        - unresolved identifiers fallback path
        - no regression in limit validation / maintenance handling / SSE complete events.

7. **Performance guardrails and observability** (_depends on 4,5_)
    - Keep matcher scan bounded (e.g., first 40 non-empty lines + header lines), O(n) string checks, no deep backtracking regex.
    - Emit lightweight debug logs in non-production: chosen format, score, detection time, fallback retry count.
    - Optional analytics timing metric for detection/parsing stage only.

8. **Documentation update** (_depends on implementation complete_)
    - Update `DECK-FORMATS.MD` and relevant README/testing docs to reflect exact behavior:
        - supported inputs
        - identifier preference order
        - tie-break rules
        - known limitations (MTGO CatID mapping uncertainty).

9. **UI update** (_depends on implementation complete_)
    - Create a new "guide" route in the app with examples of supported decklist formats and tips for best results for details. This can be a simple static page with formatted examples and common pitfalls.
    - Example formats to include:
        - Moxfield exact export
        - MTGO `.dek` XML
        - Arena default export
    - MTGGoldfish exact variant
    - Keep it lightweight and focused on helping users understand how to format their decklists for best parsing results.
      -Provide only limited and effective guidance, a link to a full reference will be included later down the line.
    - include succint decklist examples for the main supported formats, highlighting the key signals that enable correct parsing (e.g., section headers, collector numbers, set codes).
    - add a link to this guide in the upload section UI and in the footer for easy access.

**Relevant files**

- `c:/Users/servo/Documents/personal/mtg-deck-to-png/services/card-list/listMatchers.ts` — implement format matchers and scoring.
- `c:/Users/servo/Documents/personal/mtg-deck-to-png/services/card-list/` (new parser/orchestrator files) — format-specific parsing + candidate identifier construction.
- `c:/Users/servo/Documents/personal/mtg-deck-to-png/app/api/collections/route.ts` — integrate parser output and collection fallback strategy.
- `c:/Users/servo/Documents/personal/mtg-deck-to-png/app/api/cards/route.ts` — integrate normalized parse output for named-fetch path.
- `c:/Users/servo/Documents/personal/mtg-deck-to-png/utils/decklist.ts` — keep as compatibility layer or slim delegator to new service.
- `c:/Users/servo/Documents/personal/mtg-deck-to-png/utils/__tests__/decklist.test.ts` — preserve existing behavior tests; add compatibility assertions if needed.
- `c:/Users/servo/Documents/personal/mtg-deck-to-png/app/api/collections/__tests__/route.test.ts` — add parser integration + fallback retry tests.
- `c:/Users/servo/Documents/personal/mtg-deck-to-png/app/api/cards/__tests__/route.test.ts` — add named fallback behavior tests.
- `c:/Users/servo/Documents/personal/mtg-deck-to-png/DECK-FORMATS.MD` — align docs with implemented parsing behavior.

**Format priority order for tie-breaking**

1. MTGO `.dek` XML (most deterministic with prolog + `<Deck>` structure)
2. MTGO `.csv` (deterministic header + comma-delimited structure)
3. Moxfield exact (structured headers + `(SET) collector` format)
4. Arena default export (section headers + `(SET) number` lines)
5. MTGGoldfish exact variants (strong signals with `[SET]` + optional treatments)
6. MTGO/plain text (generic line format with optional `SIDEBOARD:`)
7. Other heuristics (e.g., presence of `Commander` section without strong signals may indicate Arena copy format, but with lower confidence than exact formats).

**Grouping and section handling**

- For formats with explicit section headers (e.g., `Commander`, `Sideboard`), use those to assign `groupId` and preserve commander/main/sideboard semantics.
- For formats without explicit sections but with sideboard signals (e.g., `SIDEBOARD:` line), use that to split main vs sideboard and assign `groupId` accordingly.
- For formats without any section signals, preserve current behaviour of treating empty lines as separators and assigning `groupId` based on line position (e.g., first contiguous block as main, second as sideboard).
- For .dek XML, review the `sideboard` of each `<Cards>` element to assign `groupId` appropriately. `Sideboard="true"` results in `groupId` 1, otherwise `groupId` 0.
- For .dek XML, a commander deck can be identified by the following signals:
    - Presence of a single card with `Annotation="16777728"`.
    - All cards have `Sideboard="false"`.
- For MTGO .csv, use the presence of a `Sideboarded` column to determine if sideboard cards are present. If so, assign `groupId` 1 to rows where `Sideboarded=Yes`, `groupId` 0.

**Format-specific card parsing details**

- For Moxfield exact, extract `{collector_number, set}` from lines matching `name (SET) collector` format.
- For Arena default export, extract `{collector_number, set}` from lines matching `(SET) number` format.
- For MTGGoldfish exact variants, extract `{name, set}` from lines matching `name [SET]`. Trim optional treatment suffixes (e.g., `<prerelease>`, `<OTJ Special Guest>`), the `(F)` foil suffix.
- For MTGO .dek XML, use the `catID` attribute to query Scryfall's `mtgo_id` field for the most reliable identifier. If not found, fallback to `{name}` from the `Name` attribute.
- For MTGO .csv, extract `{mtgo_id}` from the `ID` column for the most reliable identifier. If not found, fallback to `{collector_number, set}` from the `Collector #` and `Set` columns.

extract `{name}` from the `<Card>` element's `Name` attribute. If a validated mapping dataset is added later, this can be enhanced to include `{collector_number, set}` based on the `Multiverseid` or `MTGOCardID` attributes.

**Verification**

1. Unit: matcher tests prove each official format matches highest, and near-miss formats do not outrank correct parser.
2. Unit: parser tests prove candidate identifier ordering for each input variant (`{set+collector}` > `{name+set}` > `{name}`).
3. Integration: `/api/collections` returns cards for mixed exact/non-exact lists, including not_found fallback pass.
4. Regression: existing `utils/decklist` tests still pass or are intentionally migrated with equivalent assertions.
5. Performance: benchmark detection + parse on 100-card decklists remains low single-digit ms on local runs; no additional network round trips except unresolved fallback pass.

**Decisions**

- Confirmed requirement: use exact identifiers when possible; normalize to name-only when not.
- Confirmed ambiguity policy: always choose highest score (with deterministic tie-break rules to avoid non-determinism).
- Included scope: all formats in `DECK-FORMATS.MD`.
- Excluded scope for now: authoritative MTGO CatID -> Scryfall `mtgo_id` mapping unless verified dataset/source is added.
- "exact versions" should fallback permissively to best-effort parsing rather than failing outright, to maximize successful matches while still preferring exact when available.
- keep server-only logs for format detection and parsing details to aid troubleshooting without exposing complexity to users
- reorganize `utils/decklist` to delegate to new service while preserving existing API for compatibility; reorganize logic into `services/card-list/` for clearer separation of concerns and easier testing when appropriate.
