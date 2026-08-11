# KalaStree GI-Aware AI Commerce Intelligence Engine — Technical Disclosure

**Status:** Objective description of the implemented system as of 2026-08-10. This document records what was built and why, for internal reference and future prior-art analysis. **It does not assert that any part of this system is patentable** — patentability is a separate legal determination made later, if at all, through prior-art search.

**Scope:** This disclosure covers Phase 1 (the deterministic pipeline, product-aware chat, debug mode), Phase 2 (automated tests, evaluation harness, latency/metrics logging), and Phase 3 (§21 below — bug fixes found through real production usage: a company-information domain, GI/marketplace decoupling, multi-turn topic-shift handling, and evidence-chain traceability) of the "GI-aware AI commerce intelligence engine" project. See also `KALASTREE_AI_ARCHITECTURE.md` for the plain architecture reference.

---

## 1. Technical Problem

KalaStree (kalastree.com) is a live e-commerce marketplace connecting Indian Geographical-Indication (GI) verified women artisans to buyers, backed by a Supabase/Postgres catalogue of `products`, `artisans`, and `gi_products`. Its chatbot, however, was architecturally disconnected from that catalogue: `src/app/api/chat/route.ts` (Next.js) forwarded every user message verbatim to an external Python/FastAPI service (`d:\gi_chatbot\backend`), which answered solely from a Chroma vector store built over a static corpus of PhD research documents (Excel/CSV/HTML files under `d:\gi_chatbot\data` — GI research reports, a literature review tracker, a fintech survey). The result: a user asking "show me a GI product from Bihar under ₹2000" received a generic, ungrounded answer with no awareness of which products actually exist, their prices, stock, or verified GI status — because the LLM had no access to that data and no structural constraint stopping it from guessing.

## 2. Existing Limitations (pre-implementation)

- **No connection between commerce data and chat.** The chat backend had zero knowledge of `products`/`artisans`/`gi_products`.
- **No deterministic GI verification.** Nothing prevented the LLM from asserting GI status; it could only be as accurate as whatever text happened to be retrieved from the research corpus.
- **No structured query understanding.** Every message went straight to `retriever.invoke(question)` → LLM, with no intent classification, entity extraction, or constraint modeling.
- **No eligibility/ranking logic.** There was no concept of "eligible products" — the system could not answer product-discovery queries at all.
- **Weak data linkage even within the catalogue.** `products.gi_tag` and `artisans.gi_product` were free-text strings with no foreign key to `gi_products`, and (discovered during this implementation) `products.gi_tag` is `null` on every row in the live catalogue — the admin UI field exists but has never been populated.
- **A prior attempt at RAG-quality improvement existed and was abandoned.** Git history of the Python backend (`d:\gi_chatbot\backend`, commit `1b5e323` "self rag") shows a LangGraph pipeline (query rewrite → retrieve → grade retrieval → retry → generate → check groundedness) that was implemented and then reverted twice. It addressed retrieval quality over the unstructured corpus, not the commerce-intelligence problem (structured entities, constraints, eligibility) described here.

## 3. Proposed / Implemented Architecture

```
User message
   │
   ▼
Query Preprocessor (rate limit, length validation)          src/app/api/chat/route.ts
   │
   ▼
Intent + Entity Understanding (LLM, JSON-mode, temp=0)      queryUnderstanding.ts
   │  + deterministic grounding validator (strips entities
   │    not traceable to the user's own current message)
   ▼
Entity Normalization (fuzzy match against live catalogue)   entityNormalization.ts
   │
   ▼
Structured Query Object  { intents[], entities{} }
   │
   ▼
Constraint Engine (hard vs. soft)                            constraints.ts
   │
   ▼
GI/Artisan/Product Relationship Resolution                   relationships.ts
   │
   ▼
GI Verification Engine (deterministic, DB-only)               verification.ts
   │
   ▼
Hybrid Knowledge Retrieval                                    retrieval.ts
   │   ├─ structured Supabase metadata filter + full-text search
   │   └─ narrative/cultural evidence — HTTP call to Python
   │      backend's new /retrieve endpoint (Chroma), only for
   │      intents that need it
   ▼
Product Eligibility Engine (pure function, hard constraints)  eligibility.ts
   │
   ▼
Product Ranking Engine (documented weighted scoring)          ranking.ts
   │
   ▼
Evidence Assembly (DB facts + narrative chunks, unified)      evidence.ts
   │
   ▼
Context Builder + LLM Response Generation (strict grounding    responseGenerator.ts
   system prompt, refusal-on-insufficient-evidence)
   │
   ▼
Product/Action Linking (product cards, evidence, debug panel)  ChatWidget.tsx
```

Two separate codebases participate: the Next.js app (`d:\gi_chatbot\kalastree`) orchestrates the entire deterministic pipeline and owns the LLM calls for query understanding and generation; the Python backend (`d:\gi_chatbot\backend`) is reduced to a single-purpose narrative-evidence retrieval service over its existing Chroma store, reached via one new endpoint, `POST /retrieve` (`backend/app.py`, `backend/rag.py::retrieve_evidence`).

## 4. Query Understanding Mechanism

`src/lib/intelligence/queryUnderstanding.ts::understandQuery` sends the user's message (plus prior conversation turns, for follow-up resolution) to an LLM in JSON mode at `temperature: 0`, with a system prompt enumerating the 12 supported intents and 20 entity fields defined in `src/lib/intelligence/types.ts` (`ExtractedEntities`). The prompt explicitly forbids inferring unstated values.

A deterministic post-processing stage, `groundInCurrentMessage`, then re-validates a subset of "detail" fields (artisan, material, colour, product_type, gifting_purpose, cultural_preference, occasion, traditional, handmade) against the literal text of the *current* user message, nulling any value not actually traceable to it. This exists because testing surfaced a real failure mode: given full conversation history, the LLM would sometimes attribute a fact the *assistant* had stated in a prior turn (a product's material, an artisan's name) back to the user, as if newly requested. The system prompt alone reduced but did not eliminate this; `groundInCurrentMessage` makes it structurally impossible for those specific fields, regardless of model behavior. State/craft/price fields are deliberately excluded from this check — carrying those across turns from context is the intended multi-turn behavior (§9 below), not the bug being guarded against.

## 5. Entity Resolution Mechanism

`entityNormalization.ts` resolves free-text craft/state mentions to canonical values actually present in the knowledge base — never to invented aliases. It caches (`5min` TTL) the set of known craft names by querying `gi_products.name`, `gi_products.gi_tag`, and `artisans.craft` directly, then fuzzy-matches (exact → documented synonym table → substring either direction) against that live set. `normalizeState` matches similarly against the fixed `INDIAN_STATES` list (`src/lib/indian-states.ts`). The only hardcoded synonym mappings are well-established alternate names for the same GI (e.g. "Mithila Painting" → "Madhubani Painting") — not invented.

## 6. GI Relationship Model

`relationships.ts` implements the structured relationships (GI_PRODUCT↔STATE, GI_PRODUCT↔CRAFT, CRAFT↔ARTISAN, ARTISAN↔PRODUCT, PRODUCT↔GI_PRODUCT) using the existing relational schema — no graph database was introduced, per the "don't overengineer" constraint, since Postgres foreign keys and a small (~10–1000 row) `gi_products` table are sufficient. A migration (`supabase/migrations/20260809120000_add_gi_product_links.sql`, written but not yet applied to production) adds real `gi_product_id` foreign keys to `products` and `artisans`, replacing the current string-matching relationship (`products.gi_tag`, `artisans.gi_product`).

Because `products.gi_tag` is unpopulated on every live row today, per-product GI matching (`matchesGIRegistry`) falls back to a documented heuristic: the first significant word of a `gi_products.name` (its distinguishing identifier — "Madhubani", "Bhagalpur") must appear in the candidate product's name/category/artisan-craft, scoped to a matching state. This is explicitly an interim measure, retireable once every product has a real `gi_product_id`.

## 7. Verification Mechanism

`verification.ts::verifyGI` is the sole authority on GI status for a query's top-level subject (e.g. "is Madhubani Painting GI certified"): it looks up the entity against the live `gi_products` table via `relationships.ts::resolveGIProduct` and returns `verification_status: "verified" | "not_verified"` — never a guess, and never delegated to the LLM. A separate, per-candidate check (`matchesGIRegistry`, §6) verifies each individual product during eligibility filtering, since a state-only query ("GI products from Bihar") has no single subject entity to resolve — Bihar has multiple registered GIs, and each candidate must be checked against whichever one it actually matches.

`resolveGIProduct` originally built a hand-interpolated PostgREST `.or()` filter string from the extracted craft text. This broke silently for GI names containing characters PostgREST's filter syntax treats specially — e.g. "Bhagalpur Silk (Tussar)" contains parentheses, which `or=` interprets as filter grouping, so the query matched zero rows even though the GI is registered. This was caught by the evaluation harness (case `gi-02`) and fixed by matching in-memory against the already-cached registry (`getAllGIProducts`) instead of building a query string — eliminating the entire class of filter-injection/parsing bugs, not just this instance.

## 8. Constraint Engine

`constraints.ts::buildConstraints` converts extracted entities into typed `Constraint` objects, each tagged `hard` or `soft`. Hard: state, GI requirement, craft, an explicit price ceiling/floor ("under X"), and availability (always hard — never recommend out-of-stock items). Soft: a female-artisan request (structurally always satisfied, since every artisan on the platform is a woman by construction — kept as an informational/explainability constraint rather than a fabricated data field to filter on) and an approximate target price ("around X" — distinguished from an explicit ceiling via the `price_mode` field set during entity extraction).

## 9. Product Eligibility Mechanism

`eligibility.ts::filterEligible` is a pure function: given candidate products, constraints, and the GI registry, it keeps only products satisfying every hard constraint, computed per-product (not decided by the LLM). Each surviving product also carries its `matchedConstraints` (satisfied constraints, hard and soft) for explainability.

## 10. Ranking Mechanism

`ranking.ts::rankProducts` scores eligible products via a documented weighted sum:

| Factor | Weight | Rationale (from source comments) |
|---|---|---|
| `constraint_match` | 0.30 | Strongest signal — how many of the user's stated constraints this product satisfies |
| `semantic_relevance` | 0.25 | Keyword overlap between the requested craft/product type and the product's name/category (a token-overlap proxy; no product embedding index exists yet — see §16) |
| `gi_relevance` | 0.20 | GI authenticity is core to the brand promise |
| `cultural_relevance` | 0.10 | Soft signals: traditional/handmade/gifting/occasion |
| `price_suitability` | 0.10 | Closeness to a soft target price, when one was given |
| `availability` | 0.05 | Small tiebreaker (already hard-filtered) |

Weights sum to 1.0; every ranked result carries its full `breakdown` and a human-readable `ranking_reason`.

## 11. Evidence Mechanism

`evidence.ts::buildEvidence` unifies three sources into one typed list (`source_id`, `source_type`, `source_title`, `source_reference`, `retrieved_text`, `relevance_score`, `verification_status`): (1) the GI verification result, (2) the top 5 ranked products, (3) narrative chunks from the Python backend. `pipeline.ts` additionally injects artisan-record evidence (including the artisan's actual in-stock product list — added after testing showed its absence caused the LLM to wrongly claim "no products exist" for an artisan who had several) for `artisan_information` queries. This evidence list is the *only* material handed to the response-generation LLM call.

## 12. RAG Architecture (Hybrid Retrieval)

`retrieval.ts` implements retrieval in two independent channels, combined rather than relied on alone (per the "avoid pure vector similarity" principle): (1) structured Supabase queries — state equality, craft-keyword `ilike`/full-text search (`search_vector`, from the pre-existing migration `20260727163000_add_fulltext_search.sql`), price range, stock — for product candidates; (2) a semantic call to the Python backend's Chroma store, `retrieveNarrativeEvidence`, invoked *only* for intents in `NARRATIVE_INTENTS` (craft/GI/cultural/state information), so a plain product lookup doesn't pay the extra network hop. Candidate retrieval also runs a second, artisan-craft-scoped query pass to catch products whose own name doesn't mention the craft but whose artisan's craft field does — a plain "silk stole" made by a Madhubani-craft artisan, for instance.

## 13. LLM Integration

Two, and only two, pipeline stages call an LLM: query understanding (§4) and final response generation (`responseGenerator.ts`). Both use a direct `fetch` to the OpenAI Chat Completions API (`gpt-4o-mini`) via `openai.ts` — the same raw-fetch pattern already established in `src/app/api/translate/route.ts`, avoiding a new SDK dependency. No other stage (verification, eligibility, ranking) touches an LLM; all are plain deterministic TypeScript functions, independently unit-tested (§19).

The generation system prompt explicitly forbids inventing GI status, artisan identity, origin, price, or availability, and mandates an exact refusal string when evidence is insufficient. A lightweight, non-blocking post-generation check (`findUngroundedPrices`) flags — but does not suppress — any ₹-price in the answer that doesn't appear anywhere in the assembled evidence or the user's own stated budget figures, reviving the groundedness-check idea from the backend's earlier, reverted "self rag" experiment (§2) in a form that fits this architecture.

## 14. Data Flow

```
Supabase (products, artisans, gi_products, profiles)
        ▲                                  ▲
        │ structured queries                │ per-product GI match,
        │ (retrieval.ts,                    │ artisan lookup
        │  relationships.ts)                │ (pipeline.ts)
        │                                    │
   ┌────┴────────────────────────────────────┴────┐
   │        src/lib/intelligence/pipeline.ts        │──► OpenAI (query understanding,
   │        (orchestrates all 9 stages)             │    response generation)
   └────┬────────────────────────────────────────────┘
        │ HTTP POST /retrieve (narrative-intent queries only)
        ▼
Python backend (Chroma vector store over the PhD-research corpus)
```

## 15. API Flow

`POST /api/chat` (`src/app/api/chat/route.ts`) — unchanged externally-visible contract for `question`/`history`, extended with optional `previousQuery` (client-held structured query from the prior turn, enabling multi-turn memory — §9 of the original spec — without server-side session state) and `debug` (boolean; honored only if the caller's Supabase session resolves to `profiles.role = 'admin'`). Response: `{ answer, sources, products[], matchedConstraints, structuredQuery, debug | null }`. `debug`, when present, carries the full `DebugInfo` — structured query, constraints, verification, candidate/eligible counts, ranked products with score breakdowns, evidence, the exact LLM context string, and per-stage latency (§18).

## 16. Alternative Implementations Considered

- **Orchestrate the whole pipeline in the Python backend** (adding Supabase access there) instead of Next.js. Rejected: would duplicate product/artisan domain types across two languages and two repos, and the debug-mode/admin-auth patterns already exist in Next.js.
- **Vector-embed the product catalogue** for `semantic_relevance` instead of keyword overlap. Not implemented — the catalogue is currently ~10 products; a dedicated embedding index isn't justified yet at this scale, per the explicit "don't overengineer" constraint. Documented in `ranking.ts` as a candidate future improvement.
- **A knowledge graph database (e.g. Neo4j)** for the GI/craft/artisan/product relationships. Rejected — the existing Postgres schema with a handful of foreign keys expresses the same relationships adequately at this data volume.
- **LangGraph-style self-correcting RAG** (query rewrite, retrieval grading, retry) — attempted previously in the Python backend and reverted twice (§2). Superseded here by deterministic constraint/eligibility logic, which addresses the actual failure mode (ungrounded commerce claims) more directly than iterative retrieval refinement over an unstructured corpus.

## 17. Technical Advantages (as implemented, not as a patentability claim)

- GI status, price, availability, and eligibility are never LLM-decided — each is a deterministic function over live data, independently testable and auditable.
- The same constraint objects drive both eligibility (hard) and ranking (soft) — no separate, potentially inconsistent representation of "what the user asked for."
- Narrative retrieval is called conditionally by intent, not unconditionally, reducing latency and cost for pure product/GI/artisan lookups.
- A deterministic entity-grounding validator, not just prompt wording, prevents a documented class of hallucination (facts lifted from the model's own prior turns).
- All of the above is exercised by an automated evaluation harness (§20) that measures, rather than assumes, groundedness and hallucination-refusal behavior.

## 18. Performance Measurements

From the evaluation harness (`scripts/eval.ts`, report `scripts/eval-reports/eval-2026-08-09T14-57-30-435Z.json`, 12 representative queries / 41 automated checks, run against the live Supabase catalogue and a local instance of the Python backend):

| Metric | Result |
|---|---|
| Automated check pass rate | 41/41 (100%) |
| Groundedness rate | 100% |
| Hallucination refusal rate | 100% |
| Average end-to-end latency | ~4.2–5.0s |

Per-stage latency breakdown (typical, from `latency_ms` in pipeline output): query understanding ~2.0–3.5s (the single LLM call dominating pipeline cost), verification + narrative retrieval ~0–0.4s, candidate retrieval ~0.3–0.8s, eligibility/ranking ~0–1ms (sub-millisecond — confirms this stage is genuinely free of LLM cost, as designed), response generation ~0.9–2.3s. Query understanding and response generation (the two LLM calls) account for essentially all latency; every deterministic stage in between is negligible by comparison.

## 19. Experiments (Automated Testing)

Two test layers, per `package.json`:

- **Unit tests** (`npm test`, Vitest, 41 tests across 8 files under `src/lib/intelligence/*.test.ts`) — pure-function tests of constraint building, GI registry matching (including the parentheses-in-filter regression, §7), eligibility filtering, ranking score composition, entity normalization, the entity-grounding validator, and groundedness-price detection. Free, fast (~1.5s), no external calls.
- **Integration tests** (`npm run test:integration`, opt-in via `RUN_INTEGRATION=1`, 8 tests in `pipeline.integration.test.ts`) — exercise the real pipeline against live Supabase and OpenAI, covering the representative query categories from the original specification: GI queries, product queries, artisan queries, constraint queries, a 3-turn multi-turn sequence, and hallucination probes (a fabricated GI craft, an unknown artisan).
- **Evaluation harness** (`npm run eval`, `scripts/eval.ts` + `scripts/eval-dataset.json`) — a superset of the integration scenarios, scored against explicit expected properties (intents, entities, GI status, price/state constraints, refusal behavior) and producing a timestamped metrics report. This harness directly found and drove the fix for three real defects during this implementation: the PostgREST filter bug (§7), and two groundedness-checker false-positive classes (the user's own stated budget being flagged as fabricated; an artisan's product-list evidence being invisible to a check that only looked at the product-ranking output).

## 20. Diagrams

See §3 (pipeline stages) and §14 (data flow) above for the two primary architecture diagrams. A third, showing the debug/admin-mode data path:

```
ChatWidget (?debug=1 in URL)
    │  POST /api/chat { ..., debug: true }
    ▼
route.ts: isAdmin() — checks Supabase session → profiles.role
    │
    ├─ not admin ──────────────► debug: null in response (silently ignored)
    │
    └─ is admin ───────────────► pipeline.ts returns full DebugInfo
                                  (structured query, constraints, verification,
                                   candidate/eligible counts, ranked scores,
                                   evidence, final LLM context, latency)
                                       │
                                       ▼
                              ChatWidget renders a collapsible
                              JSON panel beneath the answer
```

---

## 21. Phase 3 — Fixes From Real Production Usage

Phases 1–2 covered the initial pipeline build and its own test infrastructure. Phase 3 addresses six defects found through actual production use of kalastree.com — each reproduced locally with full debug output before being fixed, per the same discipline as Phases 1–2.

**21.1 — Company-information domain.** `general_question` had no evidence source at all, so "What is Kalastree?" always fell to the refusal fallback. Added `kalastree_information` as a distinct intent, and a small static evidence module (`src/lib/intelligence/kalastreeInfo.ts`) sourced verbatim from the site's own existing About page copy (`src/lib/i18n/dictionaries/about.ts`) — not invented, and deliberately not a new Chroma/DB source, since this content changes rarely.

**21.2 — Name collision between two real entities.** "Who is Garima Awasthi?" resolved against the `artisans` marketplace table via a naive `ilike` match and answered with an unrelated, coincidentally-same-named artisan — stating this confidently as fact, when the real Garima Awasthi is KalaStree's founder. Fixed by checking the founder's name (`isFounderName`, `kalastreeInfo.ts`) *before* the marketplace lookup in `pipeline.ts`; the founder wins the collision, with any same-named marketplace artisan surfaced as a clearly-separate, brief note rather than blended into the founder's identity or dropped silently.

**21.3 — GI verification and marketplace availability conflated.** A GI-verified craft with zero KalaStree listings ("send link to buy Pashmina shawl") produced the blunt fallback string despite `verifyGI` correctly returning `gi_verified: true` with full evidence — the response-generation prompt had no rule telling the model these are two independent facts. Added an explicit rule to `responseGenerator.ts`'s system prompt: state GI status and marketplace availability separately; never phrase "not currently sold" as "not verified," or vice versa.

**21.4 — Stale entities surviving a genuine topic change.** Reproduced via `dupatta → stole → paintings`: `product_type: "stole"` silently persisted into an unrelated later query about paintings, narrowing it incorrectly. `queryUnderstanding.ts`'s multi-turn entity merge (`mergeEntities`) now detects when the newly-extracted `craft` or `product_type` differs from the previous turn's and clears the *other* shape-describing fields (the sibling of craft/product_type, plus material/colour/occasion/gifting_purpose/cultural_preference) before merging — state, price, and artisan_gender continue to persist across turns as before, since carrying those across an actual topic change remains correct behavior.

**21.5 — Unsupported claims and broken evidence chains.** A raw research-corpus factoid ("22 GI products from Maharashtra") was stated as if confirmed, and a follow-up asking for its source did a fresh, unrelated retrieval that found nothing and refused — because no evidence persisted across turns. Two-part fix: (a) the response-generation prompt now requires unverified (`research_corpus`-sourced) statistics to be caveated as research data, not stated as confirmed counts; (b) a new `source_inquiry` intent, detected by `queryUnderstanding.ts`, causes `pipeline.ts` to *replace* freshly-retrieved evidence with the client-round-tripped evidence from the prior turn (`previousEvidence`, mirroring the existing `previousQuery` pattern — no server session state) — a sourcing question is answered from what was actually used, or honestly declared unsubstantiated if it wasn't.

**21.6 — Confident zero-results treated as missing information.** A correctly-computed empty product search ("show products below ₹100" — genuinely nothing that cheap) triggered the same insufficient-evidence refusal as an unanswerable factual question. Added a prompt rule distinguishing the two: a real, completed search with zero matches gets a plain "nothing found" answer; the fallback sentence is reserved for questions with no bearing evidence at all.

All six are covered by dedicated cases in `scripts/eval-dataset.json` (`kalastree-info-01`, `founder-identity-01/02`, `gi-vs-marketplace-01`, `zero-results-confidence-01`, `multiturn-topic-shift-01`, `multiturn-source-inquiry-01`) plus unit tests for the two purely-deterministic mechanisms (`mergeEntities` topic-shift clearing, `isFounderName`).
