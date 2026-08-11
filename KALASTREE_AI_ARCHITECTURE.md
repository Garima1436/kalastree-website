# KalaStree AI — Chat Intelligence Architecture

Technical reference for how the KalaStree chatbot works: what happens between a user's message and the answer they see. Companion to `KALASTREE_INVENTION_DISCLOSURE.md` (which explains *why* each mechanism exists and documents it for prior-art purposes) — this document is the plain architecture reference: current system, data flow, and each mechanism in turn.

---

## 1. Current architecture

Two codebases, one live pipeline:

- **`d:\gi_chatbot\kalastree`** (Next.js, deployed to kalastree.com via Amplify) — owns the entire deterministic pipeline and both LLM calls. `src/app/api/chat/route.ts` is the API entry point; `src/lib/intelligence/*` is the pipeline itself.
- **`d:\gi_chatbot\backend`** (Python/FastAPI, deployed to a Hugging Face Space) — owns the Chroma vector store and embedding model, exposed only via `POST /retrieve` (raw scored chunks, no LLM call). Called by the Next.js app only for intents that need narrative/cultural evidence.

The Next.js app has direct access to the live Supabase catalogue (`products`, `artisans`, `gi_products`, `profiles`) via a service-role client (`src/lib/supabase-admin.ts`) — this is what makes GI verification, product eligibility, and artisan lookups deterministic instead of LLM-guessed.

## 2. Pipeline stages (in order)

```
USER MESSAGE
   │
   ▼
QUERY UNDERSTANDING  (queryUnderstanding.ts — LLM call #1, JSON mode, temp=0)
   │  intent classification + entity extraction
   │  + deterministic grounding validator (strips entities not traceable
   │    to the CURRENT message — stops the LLM lifting facts from its own
   │    prior replies)
   │  + entity normalization (fuzzy-match craft/state against the live
   │    catalogue, entityNormalization.ts)
   │  + multi-turn merge (mergeEntities — carries state/price/craft across
   │    turns for genuine refinements, but CLEARS stale product-shape
   │    fields — craft/product_type/material/... — when the new message
   │    introduces a different craft or product_type; a topic change must
   │    not silently keep narrowing an unrelated new search)
   ▼
STRUCTURED QUERY   { intents: Intent[], entities: ExtractedEntities }
   │
   ├──────────────┬──────────────────┬────────────────────┐
   ▼              ▼                  ▼                    ▼
CONSTRAINT     GI VERIFICATION   NARRATIVE RETRIEVAL   KALASTREE/FOUNDER
ENGINE         (verification.ts, │  (retrieval.ts →      LOOKUP
(constraints.ts)relationships.ts)│   Python /retrieve,    (kalastreeInfo.ts —
hard vs. soft  deterministic,    │   only for craft/gi/   static facts; wins
constraints    DB-only, never    │   cultural/state       any name collision
               LLM-decided       │   intents)             with a marketplace
                                 │                         artisan of the
                                 │                         same name)
   │              │                  │                    │
   ▼              │                  │                    │
CANDIDATE          │                  │                    │
RETRIEVAL          │                  │                    │
(retrieval.ts —    │                  │                    │
 structured         │                  │                    │
 Supabase filter +   │                  │                    │
 full-text search)   │                  │                    │
   │              │                  │                    │
   ▼              │                  │                    │
ELIGIBILITY        │                  │                    │
(eligibility.ts —  │                  │                    │
 hard constraints   │                  │                    │
 only, per-product   │                  │                    │
 GI match via         │                  │                    │
 matchesGIRegistry)   │                  │                    │
   │              │                  │                    │
   ▼              │                  │                    │
RANKING            │                  │                    │
(ranking.ts —      │                  │                    │
 documented weighted│                  │                    │
 score)              │                  │                    │
   │              │                  │                    │
   └──────────────┴──────────────────┴────────────────────┘
                          ▼
                  EVIDENCE ASSEMBLY  (evidence.ts + pipeline.ts)
                  unifies: GI verification, ranked products, narrative
                  chunks, artisan/founder facts — each tagged with
                  source_type + verification_status
                          │
                          ▼
              SOURCE_INQUIRY SHORT-CIRCUIT (pipeline.ts)
              "where did you get that?" REPLACES the evidence above with
              the client-held evidence from the PRIOR turn — answers from
              what was actually used, not a fresh unrelated retrieval
                          │
                          ▼
         CONTEXT BUILDER + RESPONSE GENERATION  (responseGenerator.ts —
         LLM call #2)
         Strict system prompt: GI status and marketplace availability are
         independent facts (never conflate "not sold" with "not GI
         verified"); a confident zero-result search gets a plain answer,
         not the insufficient-evidence refusal; research-corpus statistics
         are caveated as unverified, not stated as confirmed counts.
                          │
                          ▼
              ANSWER + PRODUCT CARDS + SOURCES + DEBUG (admin-only)
```

## 3. Data flow

```
Supabase (products, artisans, gi_products, profiles)
        ▲                                  ▲
        │ structured filter queries         │ per-product GI match,
        │ (retrieval.ts,                    │ artisan/founder lookup
        │  relationships.ts)                │ (pipeline.ts)
        │                                    │
   ┌────┴────────────────────────────────────┴────┐
   │        src/lib/intelligence/pipeline.ts        │──► OpenAI (query
   │        (orchestrates all stages)               │    understanding,
   └────┬────────────────────────────────────────────┘    response generation)
        │ HTTP POST /retrieve (narrative-intent queries only)
        ▼
Python backend (Chroma vector store, unstructured research corpus)

Client (ChatWidget.tsx) round-trips, per turn, WITHOUT server session state:
  - previousQuery      (last StructuredQuery — multi-turn entity memory)
  - previousEvidence   (last turn's Evidence[] — source_inquiry follow-ups)
```

## 4. Query processing

`understandQuery()` (queryUnderstanding.ts) is the only place natural language is turned into structure. It never decides anything consequential (GI status, price eligibility, product existence) — only intent + entities. Intents (14 total): `product_discovery`, `product_information`, `artisan_information`, `craft_information`, `gi_information`, `state_information`, `product_comparison`, `recommendation`, `purchase_assistance`, `cultural_information`, `order_related`, `general_question`, `kalastree_information`, `source_inquiry`.

## 5. Entity resolution

`entityNormalization.ts` resolves free-text craft/state mentions to canonical values that actually exist in the knowledge base (cached, 5-minute TTL, queried from `gi_products`/`artisans` directly) — never invented aliases, only documented synonyms (e.g. "Mithila Painting" → "Madhubani Painting") plus fuzzy substring matching against live data.

## 6. GI verification

`verification.ts::verifyGI` — the single deterministic authority on whether the query's top-level subject is GI-certified. Looks up `gi_products` via `relationships.ts::resolveGIProduct` (in-memory match against the cached registry — not a hand-built SQL filter string, which previously broke on GI names containing parentheses). Separately, `eligibility.ts`'s `matchesGIRegistry` verifies each CANDIDATE PRODUCT independently, because a region can have multiple registered GIs and each product must be checked against whichever one it actually matches — this is deliberately a different mechanism from `verifyGI`, not the same function reused.

## 7. Marketplace search

`retrieval.ts::retrieveCandidateProducts` — structured Supabase queries (state equality, craft-keyword match, full-text search on `search_vector`, price range, stock) plus a second artisan-craft-scoped pass to catch products whose own name doesn't mention the craft but whose artisan's craft field does. **Never gated by GI status** — GI requirement is only applied as a hard constraint when the user explicitly asked for GI-verified items (`entities.gi_required === true`); otherwise marketplace search and GI status are computed independently and combined only when presenting the answer.

## 8. Constraint engine

`constraints.ts::buildConstraints` — converts entities into typed, labeled constraints, each `hard` (must be satisfied: state, GI requirement, craft, explicit price ceiling/floor, availability) or `soft` (only affects ranking: approximate target price, a female-artisan mention — structurally always true on this platform).

## 9. Product ranking

`ranking.ts::rankProducts` — documented weighted sum (`constraint_match` 0.30, `semantic_relevance` 0.25, `gi_relevance` 0.20, `cultural_relevance` 0.10, `price_suitability` 0.10, `availability` 0.05), returned with a full breakdown and human-readable `ranking_reason` per product.

## 10. Evidence retrieval (RAG)

Two channels, combined: structured Supabase facts (always) and semantic retrieval from the Python backend's Chroma store (`retrieveNarrativeEvidence`, only for `NARRATIVE_INTENTS` — craft/GI/cultural/state information). Metadata filtering is preferred over vector similarity wherever a filter is available.

## 11. LLM integration

Exactly two LLM calls per request, both direct `fetch` to OpenAI (`gpt-4o-mini`) via `openai.ts` — no SDK dependency, matching the pattern already used by `src/app/api/translate/route.ts`. Query understanding (temp 0, JSON mode) and response generation (assembles evidence into natural language, cannot introduce new facts). Every other stage is a plain, independently unit-tested TypeScript function.

## 12. Frontend integration

`src/components/ChatWidget.tsx` — renders the answer, product cards (image/price/artisan/GI badge/state), sources, and (admin-only, opt-in via `?debug=1`) a collapsible debug panel. Round-trips `previousQuery` and `previousEvidence` as plain client-held state between turns — no server session, matching the app's existing stateless API design.

## 13. Debug/admin mode

`DebugInfo` (types.ts) — original query, structured query, constraints, verification, candidate/eligible counts, ranked products with score breakdowns, evidence, the exact LLM context string, groundedness warnings, and per-stage latency. Gated server-side on `profiles.role === 'admin'` (`route.ts::isAdmin`), regardless of what the client requests.

## 14. Testing & evaluation

- `npm test` — unit tests (Vitest) for every deterministic module.
- `npm run test:integration` — end-to-end tests against real Supabase + OpenAI.
- `npm run eval` — scored evaluation harness (`scripts/eval.ts` + `scripts/eval-dataset.json`) against representative queries, with a timestamped metrics report per run.
