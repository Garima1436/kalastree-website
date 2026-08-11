# KalaStree Chat Intelligence Engine — Technical Differentiation & Patent-Readiness Review

**Purpose:** Objectively separate what this system reuses from established technique, what is KalaStree-specific engineering, and what may be worth prior-art investigation. **This document does not conclude that anything here is patentable or novel** — that is a legal determination requiring a formal prior-art search, which has not been performed. Every claim below is grounded in the actual implemented code (`src/lib/intelligence/*`) and real test/eval results current as of this review; nothing is invented or extrapolated beyond what exists.

Companion documents: `KALASTREE_INVENTION_DISCLOSURE.md` (full technical description, all three phases), `KALASTREE_AI_ARCHITECTURE.md` (plain architecture reference).

---

## 1. Old System

Before this project, the chatbot (`src/app/api/chat/route.ts`, pre-Phase-1) was a stateless proxy:

```
User Query
   │
   ▼
POST https://ashish766733-kalastree-chatbot.hf.space/chat   (thin forward, no processing)
   │
   ▼
Python backend (d:\gi_chatbot\backend\rag.py):
   retriever.invoke(question)   — Chroma similarity search, k=5, no metadata filter
   │
   ▼
LLM (ChatOpenAI gpt-4o-mini) generates the answer directly from the 5 retrieved chunks
   │
   ▼
Response { answer, sources }
```

**Decisions made by the LLM/RAG layer alone, with no independent check:** whether a claim was true, whether a product existed, whether something was GI-certified, what a price or availability fact was, which sources actually supported the answer. The retrieved chunks came exclusively from an unstructured PhD-research corpus (`d:\gi_chatbot\data` — Excel/CSV/HTML) — the live Supabase product/artisan/GI catalogue was never queried at all. There was no intent classification, no entity extraction, no constraint model, and no concept of "eligible product."

## 2. New System

```
User Query
   │
   ▼
INTENT DETECTION + ENTITY EXTRACTION      queryUnderstanding.ts (LLM call #1, JSON mode, temp 0)
   │  + deterministic grounding validator (groundInCurrentMessage)
   ▼
ENTITY RESOLUTION / NORMALIZATION          entityNormalization.ts (fuzzy-match against live catalogue)
   │  + multi-turn merge with topic-shift invalidation (mergeEntities)
   ▼
STRUCTURED QUERY   { intents: Intent[], entities: ExtractedEntities }
   │
   ▼
CONSTRAINT PROCESSING                      constraints.ts (hard vs. soft, typed)
   │
   ▼
DOMAIN RESOLUTION                          relationships.ts / kalastreeInfo.ts
   │  routes to: GI_PRODUCT / ARTISAN / KALASTREE-company domain
   │  (founder-name collision resolved here, before any marketplace lookup)
   ▼
GI VERIFICATION            ◄──────────────────┐   verification.ts (single-entity, deterministic)
   │                                            │
   ▼                                            │
MARKETPLACE SEARCH          (independent of GI) │   retrieval.ts (structured Supabase filter + FTS)
   │                                            │
   ▼                                            │
PRODUCT ELIGIBILITY                             │   eligibility.ts (hard constraints; per-candidate
   │   matchesGIRegistry — separate from        │   GI check via matchesGIRegistry, NOT verification.ts)
   │   verification.ts above, deliberately ─────┘
   ▼
PRODUCT RANKING                            ranking.ts (documented weighted score)
   │
   ▼
EVIDENCE RETRIEVAL (RAG)                   retrieval.ts → Python /retrieve (Chroma), only for
   │                                       narrative-relevant intents; evidence.ts unifies
   │                                       DB facts + narrative chunks + KalaStree/artisan facts
   ▼
CONTEXT CONSTRUCTION                       responseGenerator.ts::buildFinalContext
   │  (source_inquiry REPLACES this evidence with the client-held prior-turn evidence instead)
   ▼
LLM (call #2)                              generateResponse — explains only, invents nothing
   │
   ▼
FINAL RESPONSE + product cards + sources + (admin) debug panel
```

Every box above exists as a real, separately-testable module in `src/lib/intelligence/`. Nothing in this diagram is aspirational.

## 3. Component-by-Component Analysis

| Component | Existing/Common Technology? | KalaStree Implementation | Technical Role |
|---|---|---|---|
| Intent classification | Common (LLM JSON-mode classification) | `queryUnderstanding.ts`, 14 intents incl. `kalastree_information`, `source_inquiry` | Routes the query to the right domain(s) |
| Entity resolution | Common (LLM slot extraction + fuzzy matching) | `entityNormalization.ts` — fuzzy-matches against a live, cached snapshot of actual `gi_products`/`artisans` values, not a static dictionary | Canonicalizes free text to real catalogue values |
| Founder/entity collision handling | Uncommon as a distinct mechanism | `kalastreeInfo.ts::isFounderName` + priority branch in `pipeline.ts` | Resolves a name that matches two real entities (company founder vs. unrelated marketplace artisan) deterministically, before any DB lookup runs |
| Structured query | Common (dialogue-state / slot-filling pattern) | `StructuredQuery { intents[], entities }` (`types.ts`) | Typed contract between understanding and every downstream stage |
| Constraint engine | Common (faceted search / filter-then-rank) | `constraints.ts` — typed hard/soft `Constraint[]`, price-mode-aware (ceiling vs. approximate target) | Encodes what MUST hold vs. what only influences ranking |
| GI verification | Uncommon in this exact form | `verification.ts::verifyGI` — single-entity DB lookup, never LLM-decided | Answers "is craft/product X GI-certified" |
| Marketplace search | Common (structured DB query + FTS) | `retrieval.ts::retrieveCandidateProducts` — metadata filter + full-text search, two-pass (product fields + joined artisan craft) | Finds candidate products independent of GI status |
| Artisan resolution | Common (DB lookup) | `relationships.ts::findArtisanByName` | Resolves a named artisan to their marketplace record |
| Product eligibility | Common pattern, KalaStree-specific rules | `eligibility.ts::filterEligible` + `matchesGIRegistry` | Deterministically keeps only products satisfying every hard constraint |
| Product ranking | Common (weighted linear scoring) | `ranking.ts` — 6 named, documented weights summing to 1.0 | Orders already-eligible products transparently |
| Evidence tracking | Common concept (citations), KalaStree-specific structure | `evidence.ts` + `types.ts::Evidence` — typed `source_type`/`verification_status` per fact | Gives the LLM only verifiable, labeled facts |
| Source inquiry | Uncommon as a distinct mechanism | `pipeline.ts` — `source_inquiry` intent replaces fresh evidence with client-round-tripped `previousEvidence` | Answers "where did you get that" from what was ACTUALLY used, not a new search |
| RAG | Standard technique | Retained from the pre-existing Python backend, narrowed to `POST /retrieve` (no LLM call in that service anymore) | Narrative/cultural evidence only, not answer generation |
| Chroma / vector search | Standard technique | Unchanged: `BAAI/bge-small-en-v1.5` embeddings, `similarity_search_with_score` | Semantic retrieval over the unstructured research corpus |
| LLM | Standard technique | OpenAI `gpt-4o-mini`, two calls per request (`openai.ts`, raw fetch, no SDK) | Language understanding (call 1) and language generation (call 2) only |
| Multi-turn entity merging | Common concept (dialogue state tracking) | `queryUnderstanding.ts::mergeEntities` | Carries state/price/craft across turns for genuine refinements |
| Stale entity clearing | Uncommon as an explicit mechanism | `isTopicShift` + `SHAPE_FIELDS` clearing in `mergeEntities` | Detects a new craft/product_type and clears sibling shape fields from the old topic |
| Response generation | Common (grounded generation + refusal prompting) | `responseGenerator.ts` — explicit rules decoupling GI status from availability, confident-zero-results vs. refusal, unverified-corpus-stat caveating | Explains deterministic results in natural language without re-deciding them |

## 4. Technical Problems Solved

### Problem: No commerce awareness (foundational, Phase 1)
**Cause:** The old system's only knowledge source was an unstructured research corpus; it never queried `products`/`artisans`/`gi_products`.
**Solution:** The entire pipeline in §2, with Supabase as a first-class data source alongside Chroma.
**Result:** Product discovery, eligibility, and ranking became possible at all — measured via the Phase 1/2 eval harness (100% check pass rate on GI/product/artisan/constraint/multi-turn/hallucination categories).

### Problem: "What is Kalastree?" → refusal
**Cause:** `general_question` intent had no evidence source wired to it at all.
**Solution:** New `kalastree_information` intent + `kalastreeInfo.ts` (facts sourced verbatim from the site's existing About page copy).
**Result:** `kalastree-info-01` eval case now passes (`forbid_refusal: true`, requires the answer to actually describe the platform).

### Problem: Name collision — "Who is Garima Awasthi?"
**Cause:** `findArtisanByName` matched an unrelated, coincidentally-same-named marketplace artisan and stated it as fact, because no other identity source was ever consulted.
**Solution:** `isFounderName` check runs before the marketplace lookup in `pipeline.ts`; founder evidence is injected first, with a same-named marketplace artisan (if any) surfaced only as a clearly-separated note.
**Result:** Verified via live trace (§7 below) — the answer now correctly leads with "Garima Awasthi is the founder of KalaStree... PhD scholar... IIT Patna," with the unrelated artisan mentioned once at the end as "a different individual."

### Problem: GI status conflated with marketplace availability — "buy Pashmina shawl"
**Cause:** `verifyGI` correctly returned `gi_verified: true`, but the response-generation prompt had no rule preventing the model from treating "zero eligible products" as "nothing to say," producing the generic refusal.
**Solution:** Explicit system-prompt rule in `responseGenerator.ts`: state GI status and marketplace availability as two independent facts, always.
**Result:** Live trace (§8): "The Pashmina Shawl is GI verified... However, KalaStree doesn't currently have any Pashmina Shawls listed for sale." — both facts stated, neither invented, no conflation.

### Problem: Marketplace search silently gated by GI / stale entities — "what paintings are available?"
**Cause:** Reproduced as a *multi-turn* bug: a prior turn's `product_type: "stole"` survived into an unrelated later query about paintings via unconditional entity carryover.
**Solution:** `mergeEntities`'s topic-shift detection (`isTopicShift`) clears sibling shape fields when the newly-extracted craft or product_type changes.
**Result:** `multiturn-topic-shift-01` eval case (dupatta → stole → paintings) passes; unit tests in `queryUnderstanding.test.ts` lock in the exact reproduced scenario.

### Problem: Unsupported claims, broken evidence chain — "22 GI products," then "where did you get that?"
**Cause:** A raw research-corpus factoid was stated as confirmed fact; a follow-up sourcing question did a fresh, unrelated retrieval that found nothing, since no evidence persisted across turns.
**Solution:** (a) Prompt rule requiring `research_corpus`-sourced statistics to be caveated, not stated as fact. (b) New `source_inquiry` intent + client-round-tripped `previousEvidence` (mirrors the existing `previousQuery` pattern) that *replaces* fresh retrieval when answering a sourcing question.
**Result:** Live trace (§9): re-running "GI products of Maharashtra" now states only the one verified fact (Paithani Saree) with no unverified count; the follow-up either correctly traces the claim to its real evidence when that evidence exists (verified in a separate Bhagalpur Silk trace, §9 note) or honestly says it can't substantiate an untraceable claim — never repeats it as if confirmed.

### Problem: Confident zero-results misread as "insufficient information" — "show products below ₹100"
**Cause:** No prompt distinction between "we don't know" and "we searched and there's genuinely nothing."
**Solution:** Explicit prompt rule: a completed search with zero matches gets a plain, confident answer; the refusal sentence is reserved for questions with no bearing evidence.
**Result:** `zero-results-confidence-01` eval case passes (`expect_products: false` AND `forbid_refusal: true` simultaneously).

## 5. Important Distinction

### A. Business functionality (not technical differentiation)
Selling GI products; recommending products to shoppers; displaying product listings; a chatbot answering customer questions; company/founder information pages.

### B. AI/software functionality (standard technique, not differentiation)
RAG; text embeddings; vector similarity search (Chroma); LLM-based natural language generation; JSON-mode structured extraction; weighted-score ranking; full-text search.

### C. Potentially distinctive system behavior (requires prior-art investigation, not assumed novel)
- Independent computation of GI verification and marketplace availability, with an explicit prompt-level rule preventing the LLM from conflating the two.
- Domain-aware entity resolution that prioritizes a company/founder identity over a same-named marketplace record.
- Structured, typed hard/soft constraints enforced deterministically before any LLM-generated recommendation.
- An evidence array with explicit per-fact `verification_status`, persisted client-side and replayable to answer a later sourcing question instead of re-retrieving.
- Deterministic invalidation of specific structured dialogue-state fields ("shape fields") on detected topic change, distinct from ordinary multi-turn slot carryover.

## 6. End-to-End Example 1 — "I want a GI product from Bihar made by a woman artisan under ₹2,000."

Traced live against the running pipeline (`runPipeline`, debug mode):

1. **Raw query:** `"I want a GI product from Bihar made by a woman artisan under ₹2,000."`
2. **Detected intent:** `["product_discovery"]`
3. **Extracted entities (raw, pre-normalization):** `state: "Bihar", gi_required: true, artisan_gender: "female", max_price: 2000, price_mode: "max"` — craft left `null` (not stated).
4. **Normalized entities:** unchanged (`"Bihar"` already canonical against `INDIAN_STATES`).
5. **Constraints** (`buildConstraints`):
   ```json
   [
     { "field": "state", "value": "Bihar", "kind": "hard" },
     { "field": "gi_verified", "value": true, "kind": "hard" },
     { "field": "artisan_gender", "value": "female", "kind": "soft" },
     { "field": "max_price", "value": 2000, "kind": "hard" },
     { "field": "availability", "value": true, "kind": "hard" }
   ]
   ```
6. **GI lookup** (`verifyGI`, single-entity — craft is null so it resolves the first Bihar GI in the registry): `Madhubani Painting`, `gi_verified: true`, `GI Tag No. 213`, registered 2007.
7. **Artisan lookup:** not applicable (no `entities.artisan` stated — this is a discovery query, not an identity query).
8. **Marketplace lookup** (`retrieveCandidateProducts`): filtered on `state = Bihar`, `price <= 2000`.
9. **Eligible products:** 0 — the live catalogue's Bihar items (a ₹8,500 painting, a ₹2,160 stole) both exceed ₹2,000.
10. **Ranking:** not applicable (nothing to rank).
11. **Retrieved evidence:** one entry — the Madhubani Painting GI registry record (`source_type: "database"`, `verification_status: "verified"`).
12. **Context passed to LLM:** GI verification fact stated; "Eligible/ranked products: (no eligible products)" (search ran, genuinely empty).
13. **Final response:** *"Madhubani Painting is a GI-verified craft from Bihar, recognized for its rich history and the empowerment of Mithila women artisans. However, I couldn't find any products currently available for sale under ₹2,000."*

## 7. End-to-End Example 2 — GI Verification vs. Marketplace Availability ("Send me a link to buy Pashmina Shawl.")

1. **Entities:** `craft: "Pashmina Shawl"` (normalized to the exact registry name), all else null.
2. **Constraints:** `craft = "Pashmina Shawl"` (hard), `availability` (hard).
3. **GI verification (independent track, `verification.ts`):** `gi_verified: true`, `GI Tag No. 285`, Jammu & Kashmir, 2008 — resolved purely from `gi_products`, with zero knowledge of what's for sale.
4. **Marketplace search (independent track, `retrieval.ts` + `eligibility.ts`):** 0 candidates matching craft "Pashmina Shawl" in the live catalogue → 0 eligible.
5. **These two tracks never touch each other's logic** — `verifyGI` never reads `products`, and `retrieveCandidateProducts`/`filterEligible` never read GI-verification results to decide whether a product search should even run.
6. **Evidence handed to the LLM:** the GI registry fact (verified) + "no eligible products" (search ran, empty) — both present, neither omitted.
7. **Final response:** *"The Pashmina Shawl is GI verified, with its registration originating from Jammu & Kashmir. However, KalaStree doesn't currently have any Pashmina Shawls listed for sale."* — both facts stated plainly, correctly decoupled.

## 8. End-to-End Example 3 — Marketplace Availability Independent of GI ("What paintings are available?")

1. **Entities:** `product_type: "paintings"`, `craft: null`, `gi_required: null` (the user never asked for GI-verified specifically).
2. **Constraints:** only `availability` (hard) — critically, **no `gi_verified` constraint is added**, because `gi_required` was never stated. This is the deterministic guarantee that marketplace search is never gated by GI status unless the user explicitly asked for it (`constraints.ts` only adds the `gi_verified` constraint `if (e.gi_required)`).
3. **Marketplace search:** full-text search on `search_vector` for "paintings" plus the craft-keyword pass → 6 candidates (Bhil Tribal Painting, Madhubani Painting, a Madhubani-artisan silk stole, three Gond Art rakhis).
4. **Eligibility:** all 6 pass (only `availability` is hard here) → 6 eligible.
5. **GI status is then attached to each result independently** (via `matchesGIRegistry` inside eligibility, exposed per-product as `giVerified` in the API response) — it does not filter the set, it only annotates it.
6. **Final response:** lists the actual available paintings with prices/artisans, correctly making no claim about GI status blocking availability — resolving the exact bug where this query previously answered "there are no paintings available... as they are not verified in the GI registry."

## 9. End-to-End Example 4 — Source Inquiry Using Prior-Answer Evidence

**Turn 1:** *"GI products of Maharashtra"* → intent `product_discovery`; GI lookup resolves `Paithani Saree` (`GI Tag No. 153`, 2009); evidence = `[{ source_title: "Paithani Saree — KalaStree GI Registry", verification_status: "verified", ... }]`. Answer: *"The Paithani Saree is a GI-verified product from Maharashtra... registered under GI Tag No. 153 since 2009... However, there are currently no Paithani Sarees available for sale on KalaStree."* This turn's full evidence array is returned to the client and held as `previousEvidence`.

**Turn 2:** *"Where did you get the information about Sindhudurg & Ratnagiri Kokum?"* → intent classified as `["source_inquiry"]`. Per `pipeline.ts`, this **replaces** the evidence that would normally be freshly retrieved with exactly `previousEvidence` from turn 1 (the Paithani Saree GI record — nothing about Kokum, because turn 1 never actually asserted anything about Kokum). The response-generation prompt is instructed: for `source_inquiry`, answer strictly from the evidence given, and if it doesn't support the specific claim being asked about, say so rather than repeating it. Result: *"I can't currently substantiate the source of information regarding Sindhudurg & Ratnagiri Kokum."* — an honest, correct answer, because the system checked what it actually had rather than either fabricating a source or blindly re-searching on the sourcing question's own text (which would find nothing related and produce the same refusal for the wrong reason).

A second live trace, using a claim that genuinely WAS made and DOES have evidence (*"What GI tag number does Bhagalpur Silk have?"* → *"Where did you get that information?"*), confirms the positive path: turn 2's evidence is exactly turn 1's `Bhagalpur Silk (Tussar) — KalaStree GI Registry` record, and the answer is *"The information about Bhagalpur Silk (Tussar) and its GI tag number 174 comes from the verified KalaStree GI Registry."* — correctly traceable when the evidence exists, correctly declined when it doesn't.

## 10. Multi-Turn Example — State Maintenance and Sibling-Field Clearing

**Turn 1:** *"Show me Madhubani paintings."* → `entities.craft = "Madhubani Painting"` (normalized), nothing else set. No `previousQuery`, so `mergeEntities` returns the fresh extraction unchanged.

**Turn 2:** *"Under ₹3000."* → fresh extraction: `max_price: 3000, price_mode: "max"`, `craft: null` (not restated). `mergeEntities` sees no topic shift (`craft`/`product_type` both null in the fresh extraction) → carries `craft: "Madhubani Painting"` forward from turn 1 and adds `max_price: 3000`. Result: `{ craft: "Madhubani Painting", max_price: 3000 }`.

**Turn 3:** *"Only women artisans."* → fresh extraction: `artisan_gender: "female"` only (the grounding validator, §Phase-1, strips any `artisan`/`material` the model might have tried to lift from its own turn-2 answer). No topic shift → merged result: `{ craft: "Madhubani Painting", max_price: 3000, artisan_gender: "female" }`, with `artisan`, `material`, `product_type` all confirmed `null` (verified by the `forbidden_entities` check in the `multiturn-01` eval case, which passes).

**Contrast — where sibling-field clearing actually fires** (`multiturn-topic-shift-01`): *"Any stole"* sets `product_type: "stole"`. The next turn, *"What paintings are available"*, sets `product_type: "paintings"` — a genuine value change, so `isTopicShift` returns true and the merge clears the sibling shape fields (there were none stale here beyond `product_type` itself, which the fresh extraction overwrites anyway) before merging — preventing the reproduced bug where "stole" silently survived into the paintings query.

## 11. Deterministic vs. LLM Decisions

| Decision | Deterministic/System | LLM |
|---|---|---|
| GI verification | ✅ `verification.ts` / `matchesGIRegistry` | — |
| Product availability | ✅ `stock > 0` filter, `eligibility.ts` | — |
| Price filtering | ✅ `constraints.ts` hard constraints | — |
| Stock | ✅ `eligibility.ts` (`availability` hard constraint, always) | — |
| Entity interpretation (raw extraction) | — | ✅ `queryUnderstanding.ts` call #1 |
| Entity interpretation (grounding/normalization/topic-shift) | ✅ `groundInCurrentMessage`, `entityNormalization.ts`, `mergeEntities` | (post-processes the LLM's raw output) |
| Founder/entity collision resolution | ✅ `isFounderName`, checked before any DB call | — |
| Natural language generation | — | ✅ `responseGenerator.ts` call #2 |
| Evidence selection | ✅ `evidence.ts` (which facts exist, their type/status) | (LLM chooses which of the *given* facts to mention, not which facts exist) |
| Product eligibility | ✅ `eligibility.ts` (pure function over constraints) | — |
| Product ranking | ✅ `ranking.ts` (documented weighted score) | — |
| Source-inquiry evidence set | ✅ `previousEvidence` replacement in `pipeline.ts` | (LLM only explains whether the given evidence supports the claim) |

**Why split this way:** every row on the deterministic side is either a factual lookup against live data or a filter/scoring rule that must be independently auditable and cannot vary with LLM sampling. The LLM's two roles (interpret ambiguous natural language in; generate natural language out) are the only places genuine language understanding is needed, and both are fenced by deterministic pre- and post-processing (grounding validator before, groundedness price-check after) rather than trusted outright.

## 12. Technical Advantages (measured, not projected)

From the current test/eval results (`npm test`: 52 unit tests; `npm run test:integration`: 8 tests; `npm run eval`: 72/72 checks across 19 representative queries, 100% groundedness rate, 100% hallucination-refusal rate):

- **Fewer false "insufficient information" responses** — measured directly via the `forbid_refusal` checks added in Phase 3 (`kalastree-info-01`, `founder-identity-01/02`, `gi-vs-marketplace-01`, `zero-results-confidence-01`), all passing, each corresponding to a query that previously produced the generic fallback incorrectly.
- **Correct entity identification** — `founder-identity-01/02` require the answer to identify the founder correctly (`"IIT Patna"`, `"founder"`) where it previously stated a wrong, unrelated identity.
- **Correct separation of GI status and marketplace availability** — `gi-vs-marketplace-01` requires both `expected_gi_verified: true` AND the absence of "not verified" phrasing in the same answer; passing.
- **Correct product filtering independent of GI** — `matchesGIRegistry`'s per-product check plus `constraints.ts` only adding a `gi_verified` constraint when explicitly requested is directly responsible for the "paintings" example (§8) now returning real, available products.
- **Evidence traceability** — `multiturn-source-inquiry-01` passes, requiring the follow-up answer to actually reference the originally-cited GI entity by name.
- **Improved multi-turn behavior** — `multiturn-topic-shift-01` passes; `multiturn-01`'s `forbidden_entities` check (no leaked `artisan`/`material`/`product_type`) also passes.

No claim is made about relevance/precision beyond what these checks measure — see the eval harness's own documented limitation that "retrieval precision" and "recommendation relevance" have no human-graded ground truth in this dataset.

## 13. Potential Invention Candidates

*Potential subjects for prior-art investigation — not asserted as patentable.*

### Candidate 1: Dual-track GI verification (entity-level vs. per-candidate registry matching)
**Mechanism:** Two independent, differently-scoped functions resolve GI status depending on question shape — `verification.ts::verifyGI` resolves ONE entity the query is *about* (e.g., "is craft X GI-certified"); `relationships.ts::matchesGIRegistry`, called from `eligibility.ts`, independently checks EACH CANDIDATE PRODUCT against the full registry, because a region can have multiple registered GIs and a single "the GI for this query" resolution would be wrong for state-only or category-only searches.
**Problem addressed:** A naive system would either (a) resolve one GI entity and apply it as a blanket eligibility filter (wrong for multi-GI regions/categories) or (b) never verify per-product at all.
**Difference from basic RAG:** Basic RAG has no concept of "eligibility" or per-item verification at all — this requires a structured product catalogue and a registry to check against, neither of which a pure retrieve-then-generate system has.
**Components involved:** `verification.ts`, `relationships.ts::matchesGIRegistry`, `eligibility.ts`, `gi_products`/`products` schema.
**Evidence it exists:** `src/lib/intelligence/relationships.test.ts`, `resolveGIProduct.test.ts`, `eligibility.test.ts` — all passing, testing the two paths independently.
**Why prior-art research is needed:** Product-eligibility-against-a-certification-registry is plausible in adjacent domains (organic/fair-trade certification e-commerce, for instance) — unclear whether this exact two-track structure has prior art there.

### Candidate 2: Deterministic invalidation of intermediate dialogue-state fields on detected topic shift
**Mechanism:** `mergeEntities`/`isTopicShift` in `queryUnderstanding.ts` detects when a newly-extracted `craft` or `product_type` differs from the previous turn's value, and — as a distinct, separate step from ordinary slot carryover — clears a defined set of "shape fields" (`SHAPE_FIELDS`: craft, product_type, material, colour, occasion, gifting_purpose, cultural_preference) from the carried-forward state, while explicitly preserving other fields (state, price, artisan_gender) that remain valid across a topic change.
**Problem addressed:** Standard multi-turn slot-filling either carries everything forward (stale-field leakage, reproduced and fixed here) or clears everything on any new information (loses genuine refinements like "under 3000" after "show me Madhubani paintings").
**Difference from basic RAG:** RAG has no dialogue state at all; even typical slot-filling dialogue systems we're aware of don't commonly distinguish "shape" fields from "scope" fields (state/price) with different carryover rules.
**Components involved:** `queryUnderstanding.ts::mergeEntities`, `isTopicShift`, `SHAPE_FIELDS`.
**Evidence it exists:** `queryUnderstanding.test.ts` — 5 dedicated tests for this exact mechanism, plus the `multiturn-topic-shift-01` eval case.
**Why prior-art research is needed:** Task-oriented dialogue systems (e.g., restaurant/flight booking bots) have long dealt with slot invalidation on topic change; whether this specific field-partitioning approach (shape vs. scope) is already documented technique is unknown without a search.

### Candidate 3: Evidence-replacement source attribution combined with independent-fact-track generation
**Mechanism:** Two related but distinct behaviors in `responseGenerator.ts`/`pipeline.ts`: (a) GI verification and marketplace availability are computed on fully separate code paths and never merged into a single "eligible" signal before reaching the LLM — the system prompt explicitly instructs the model to report both independently; (b) a detected `source_inquiry` intent causes the evidence assembled for the CURRENT turn to be discarded and replaced with the client-held evidence array from the PREVIOUS turn, so a sourcing question is answered from what was actually used rather than a fresh, semantically-unrelated retrieval.
**Problem addressed:** (a) prevents the "not sold, therefore not verified" (and vice versa) class of false compound claims; (b) prevents "where did you get that" from either fabricating a source or silently failing via unrelated retrieval.
**Difference from basic RAG:** Basic RAG always retrieves fresh context per query: there is no mechanism for "answer this new question using the OLD context, not new retrieval," and no structural separation preventing two independently-true facts from being merged into one (possibly false) compound statement by the generation step.
**Components involved:** `pipeline.ts` (evidence replacement), `responseGenerator.ts` (prompt rules + `previousEvidence` plumbing), `route.ts`/`ChatWidget.tsx` (client-side round-trip, no server session).
**Evidence it exists:** `multiturn-source-inquiry-01` eval case; live traces in §7 and §9 above.
**Why prior-art research is needed:** Conversational citation/source-tracking exists in some RAG products (e.g., "cite your sources" chat assistants); whether any documents this specific "replace, don't merge, retrieval for a meta-question about the prior turn" mechanism is unknown without a search.

## 14. Non-Inventive / Common Features

Explicitly NOT the basis for any novelty claim — standard technology used as-is or per common integration patterns:

- LLM-based chatbot
- Retrieval-Augmented Generation (RAG)
- Text embeddings (`BAAI/bge-small-en-v1.5`)
- Chroma vector database / vector similarity search
- Product recommendation generally
- E-commerce website functionality
- Chatbot website integration (widget, floating button, product cards)
- Source citations by themselves (listing which documents were used)
- Rate limiting, role-gated admin panels, service-role DB clients — standard web engineering

## 15. Patent Research Keywords

For prior-art search, combinations to try:

- intent-aware retrieval augmented generation
- entity resolution conversational commerce
- constraint-based product recommendation chatbot
- evidence-grounded LLM response generation
- verified knowledge retrieval e-commerce
- domain-aware retrieval routing multi-domain chatbot
- product eligibility deterministic filtering LLM
- knowledge graph relationship resolution certification verification
- conversational constraint management multi-turn dialogue state
- source traceability conversational AI citation replay
- RAG structured filtering hybrid retrieval metadata
- AI commerce recommendation eligibility ranking
- certification verification independent availability e-commerce
- dialogue state slot invalidation topic shift detection
- structured entity extraction grounding validation LLM
- named entity disambiguation company founder collision resolution
- evidence replay prior turn conversational question answering

## 16. Final Summary

### What KalaStree actually built
A deterministic pipeline (query understanding → entity resolution → constraints → domain resolution → independent GI verification and marketplace search → eligibility → ranking → evidence assembly → grounded generation) replacing a prior architecture where an LLM answered directly from unstructured document retrieval with no access to the live product catalogue and no structural constraint against inventing facts. Phase 3 fixed six concrete, reproduced defects in how the pipeline's stages interact — a missing company-information domain, an identity collision between two real entities, GI/marketplace conflation in generated language, stale conversational state across topic changes, an unmaintained evidence chain, and confident-vs-uncertain response miscalibration.

### What is standard technology
RAG, embeddings, vector search, LLM-based classification and generation, weighted-score ranking, hard/soft constraint filtering, rate limiting, and role-gated admin tooling — all well-established, all used per common practice.

### What is technically distinctive
The specific combination and staging of: independent GI-verification and marketplace-availability tracks that are never merged before reaching the LLM; a founder/entity-collision resolution mechanism that runs before ordinary database lookups; a dialogue-state merge that distinguishes "shape" fields (cleared on topic shift) from "scope" fields (carried forward); and an evidence-replacement mechanism for answering meta-questions about a prior answer's own sourcing.

### What requires prior-art research
The three candidates in §13, and more broadly whether the specific pipeline staging in §2 (particularly the hard boundary between what the two LLM calls are and are not permitted to decide) has documented precedent in commerce-chatbot or task-oriented-dialogue-system literature and patents.

### What should NOT be claimed as novel
That this is "an AI chatbot," that it "uses RAG," that it "cites sources," that it "recommends products," or that it "verifies GI certification" as a bare business requirement — all of these are either standard technique or ordinary business functionality. Any eventual patentability discussion should focus narrowly on the specific mechanisms in §13, not the system as a whole or its business purpose.
