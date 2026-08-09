// Orchestrates the full pipeline (spec section 2):
//   query understanding -> constraints -> relationships -> verification
//   -> hybrid retrieval -> eligibility -> ranking -> evidence -> LLM answer
//
// Product-pipeline stages (constraints/eligibility/ranking) only run for
// intents that need them (spec example 3: "do not recommend products
// unless appropriate").
import { supabaseAdmin } from '@/lib/supabase-admin'
import { understandQuery } from './queryUnderstanding'
import { buildConstraints } from './constraints'
import { verifyGI } from './verification'
import { getAllGIProducts, findArtisanByName } from './relationships'
import { retrieveCandidateProducts, retrieveNarrativeEvidence } from './retrieval'
import { filterEligible } from './eligibility'
import { rankProducts } from './ranking'
import { buildEvidence } from './evidence'
import { generateResponse } from './responseGenerator'
import { PRODUCT_INTENTS } from './types'
import type { DebugInfo, StructuredQuery } from './types'

interface HistoryMessage {
  role: 'user' | 'ai'
  text: string
}

export interface PipelineResult {
  answer: string
  sources: string[]
  products: ReturnType<typeof publicProduct>[]
  matchedConstraints: string[]
  structuredQuery: StructuredQuery
  debug: DebugInfo | null
}

function publicProduct(r: import('./types').RankedProduct) {
  return {
    id: r.product.id,
    name: r.product.name,
    slug: r.product.slug,
    price: r.product.price,
    image: r.product.images?.[0] ?? null,
    state: r.product.state,
    giVerified: !!r.giVerification?.gi_verified,
    giTag: r.product.gi_tag,
    artisan: r.product.artisan ? { name: r.product.artisan.name, slug: r.product.artisan.slug } : null,
    craft: r.product.artisan?.craft ?? null,
    score: r.score,
    matchedConstraints: r.matchedConstraints,
    whyRecommended: r.ranking_reason,
  }
}

export async function runPipeline(
  question: string,
  history: HistoryMessage[],
  previousQuery: StructuredQuery | null,
  includeDebug: boolean
): Promise<PipelineResult> {
  const t0 = Date.now()
  const structuredQuery = await understandQuery(question, history, previousQuery)
  const t1 = Date.now()
  const needsProducts = structuredQuery.intents.some(i => PRODUCT_INTENTS.includes(i))

  const [verification, narrative] = await Promise.all([
    verifyGI(structuredQuery.entities),
    retrieveNarrativeEvidence(question, structuredQuery.intents),
  ])
  const t2 = Date.now()

  const constraints = needsProducts ? buildConstraints(structuredQuery) : []
  const candidates = needsProducts ? await retrieveCandidateProducts(structuredQuery.entities) : []
  const giProducts = needsProducts ? await getAllGIProducts() : []
  const t3 = Date.now()

  const eligible = needsProducts ? filterEligible(candidates, constraints, giProducts) : []
  const ranked = needsProducts ? rankProducts(eligible, structuredQuery.entities, constraints.length) : []

  const evidence = buildEvidence(verification, ranked, narrative)

  // artisan_information ("who made this?", "tell me about artisan X") has
  // its own deterministic lookup — separate from the product pipeline,
  // since the user is asking about a person, not shopping.
  if (structuredQuery.intents.includes('artisan_information') && structuredQuery.entities.artisan) {
    const artisan = await findArtisanByName(structuredQuery.entities.artisan)
    if (artisan) {
      evidence.unshift({
        source_id: `artisans:${artisan.id}`,
        source_type: 'database',
        source_title: artisan.name,
        source_reference: `artisans.id=${artisan.id}`,
        retrieved_text: `${artisan.name} — ${artisan.craft} artisan from ${artisan.state}. ${artisan.bio ?? artisan.story ?? ''}`.trim(),
        relevance_score: 1,
        verification_status: artisan.is_verified ? 'verified' : 'not_verified',
      })

      // Without this, the LLM only sees the artisan's bio and (having
      // never been told whether products exist) tends to wrongly assert
      // "no products found" — an unverified claim. Give it the real count.
      const { data: artisanProducts } = await supabaseAdmin
        .from('products').select('name, price, stock').eq('artisan_id', artisan.id).gt('stock', 0)
      evidence.push({
        source_id: `artisans:${artisan.id}:products`,
        source_type: 'database',
        source_title: `${artisan.name}'s products`,
        source_reference: `products.artisan_id=${artisan.id}`,
        retrieved_text: artisanProducts?.length
          ? artisanProducts.map(p => `${p.name} — ₹${p.price}`).join('; ')
          : `${artisan.name} currently has no in-stock products listed.`,
        relevance_score: 1,
        verification_status: 'verified',
      })
    } else {
      evidence.unshift({
        source_id: `artisans:not_found:${structuredQuery.entities.artisan}`,
        source_type: 'database',
        source_title: 'Artisan Lookup',
        source_reference: 'artisans lookup (no match)',
        retrieved_text: `No artisan named "${structuredQuery.entities.artisan}" was found in the verified artisan records.`,
        relevance_score: 1,
        verification_status: 'not_verified',
      })
    }
  }

  const t4 = Date.now()

  const { answer, finalContext, groundednessWarnings } = await generateResponse(
    question, structuredQuery, verification, evidence, ranked, history, needsProducts
  )
  const t5 = Date.now()

  const latency_ms = {
    query_understanding_ms: t1 - t0,
    verification_and_narrative_ms: t2 - t1,
    candidate_retrieval_ms: t3 - t2,
    // Includes eligibility, ranking, evidence assembly, and the
    // artisan_information lookup above — all the remaining deterministic
    // work between candidate retrieval and final generation.
    eligibility_and_ranking_ms: t4 - t3,
    response_generation_ms: t5 - t4,
    total_ms: t5 - t0,
  }

  const sources = [...new Set(evidence.map(e => e.source_title))]
  const topRanked = ranked.slice(0, 5)
  const matchedConstraints = [...new Set(topRanked.flatMap(r => r.matchedConstraints))]

  // Anonymous technical metrics (spec section 24) — no user identity, no
  // raw free-text beyond a truncated query preview for debugging context.
  console.log('[chat-metrics]', JSON.stringify({
    intents: structuredQuery.intents,
    query_preview: question.slice(0, 80),
    needs_products: needsProducts,
    gi_verification_status: verification?.verification_status ?? null,
    candidate_count: candidates.length,
    eligible_count: eligible.length,
    returned_count: topRanked.length,
    groundedness_warning_count: groundednessWarnings.length,
    latency_ms,
  }))

  const debug: DebugInfo | null = includeDebug
    ? {
        original_query: question,
        structured_query: structuredQuery,
        constraints,
        verification: verification ? [verification] : [],
        candidate_count: candidates.length,
        eligible_count: eligible.length,
        ranked: topRanked,
        evidence,
        final_context: finalContext + (groundednessWarnings.length ? `\n\n[groundedness warnings: ${groundednessWarnings.join('; ')}]` : ''),
        latency_ms,
        groundedness_warnings: groundednessWarnings,
      }
    : null

  return {
    answer,
    sources,
    products: topRanked.map(publicProduct),
    matchedConstraints,
    structuredQuery,
    debug,
  }
}
