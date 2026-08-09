// Shared types for the chat intelligence pipeline:
//   query understanding -> constraints -> GI/artisan/product relationships
//   -> verification -> retrieval -> eligibility -> ranking -> evidence -> LLM
//
// See KALASTREE_INVENTION_DISCLOSURE plan section for the full pipeline
// rationale. Every stage here is deterministic (plain functions over
// Supabase data) except queryUnderstanding.ts and responseGenerator.ts,
// which are the only two stages that call an LLM.

import type { Product, Artisan, GIProduct } from '@/lib/types'

export type Intent =
  | 'product_discovery'
  | 'product_information'
  | 'artisan_information'
  | 'craft_information'
  | 'gi_information'
  | 'state_information'
  | 'product_comparison'
  | 'recommendation'
  | 'purchase_assistance'
  | 'cultural_information'
  | 'order_related'
  | 'general_question'

// Intents that require the product pipeline (constraints -> eligibility ->
// ranking). Everything else answers from verified/narrative knowledge only —
// "do not recommend products unless appropriate" (spec example 3).
export const PRODUCT_INTENTS: Intent[] = [
  'product_discovery', 'product_information', 'product_comparison',
  'recommendation', 'purchase_assistance',
]

// Intents that benefit from narrative/cultural evidence (the Python
// backend's Chroma-backed /retrieve), not just structured DB facts.
export const NARRATIVE_INTENTS: Intent[] = [
  'craft_information', 'gi_information', 'cultural_information', 'state_information',
]

export type PriceMode = 'max' | 'min' | 'target' | null

// Raw entities extracted from the user's message. Every field is `null`
// when the user did not specify it — never guessed (spec section 3).
export interface ExtractedEntities {
  state: string | null
  region: string | null
  gi_required: boolean | null
  craft: string | null
  product_type: string | null
  artisan: string | null
  artisan_gender: 'female' | 'male' | null
  min_price: number | null
  max_price: number | null
  target_price: number | null
  price_mode: PriceMode
  quantity: number | null
  gifting_purpose: string | null
  cultural_preference: string | null
  material: string | null
  colour: string | null
  size: string | null
  occasion: string | null
  traditional: boolean | null
  handmade: boolean | null
}

export interface StructuredQuery {
  raw_query: string
  intents: Intent[]
  entities: ExtractedEntities
}

export type ConstraintField =
  | 'state' | 'gi_verified' | 'craft' | 'artisan_gender' | 'min_price'
  | 'max_price' | 'target_price' | 'availability'

export interface Constraint {
  field: ConstraintField
  operator: '=' | '<=' | '>=' | '>0'
  value: string | number | boolean
  kind: 'hard' | 'soft'
  // Human-readable label used in matched_constraints / "why recommended".
  label: string
}

export interface VerificationResult {
  entity: string
  gi_verified: boolean
  region: string | null
  craft_category: string | null
  source: string | null
  source_confidence: 'high' | 'low' | null
  verification_status: 'verified' | 'not_verified'
  gi_product?: GIProduct
}

export type SourceType = 'database' | 'research_corpus'

export interface Evidence {
  source_id: string
  source_type: SourceType
  source_title: string
  source_reference: string
  retrieved_text: string
  relevance_score: number
  verification_status: 'verified' | 'not_verified' | 'unverified_corpus'
}

export interface CandidateProduct extends Product {
  artisan: Artisan
}

export interface EligibleProduct {
  product: CandidateProduct
  matchedConstraints: string[]
  giVerification: VerificationResult | null
}

export interface RankingBreakdown {
  semantic_relevance: number
  constraint_match: number
  gi_relevance: number
  cultural_relevance: number
  price_suitability: number
  availability: number
}

export interface RankedProduct extends EligibleProduct {
  score: number
  breakdown: RankingBreakdown
  ranking_reason: string
}

export interface NarrativeChunk {
  content: string
  source: string
  score: number
}

// Per-stage timings (section 24: "response latency"). Kept flat and cheap
// to compute — no tracing infrastructure, just Date.now() deltas around
// each pipeline stage.
export interface LatencyBreakdown {
  query_understanding_ms: number
  verification_and_narrative_ms: number
  candidate_retrieval_ms: number
  eligibility_and_ranking_ms: number
  response_generation_ms: number
  total_ms: number
}

export interface DebugInfo {
  original_query: string
  structured_query: StructuredQuery
  constraints: Constraint[]
  verification: VerificationResult[]
  candidate_count: number
  eligible_count: number
  ranked: RankedProduct[]
  evidence: Evidence[]
  final_context: string
  latency_ms: LatencyBreakdown
  groundedness_warnings: string[]
}
