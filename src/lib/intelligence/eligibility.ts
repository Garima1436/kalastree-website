// Stage 6: Product eligibility engine (spec section 10).
//
// Pure, deterministic hard-constraint filtering — no LLM. A product is
// eligible only if it satisfies every hard constraint; soft constraints
// never disqualify a product, they only feed the ranking stage.
//
// GI verification here is evaluated PER PRODUCT against the full registry
// (matchesGIRegistry), not against the single entity the top-level query
// happened to resolve to (verification.ts's verifyGI). Those are different
// questions: "is Madhubani Painting GI certified" resolves one entity, but
// "show me a GI product from Bihar" must check each candidate against
// whichever of Bihar's (possibly several) registered GIs it actually
// belongs to.
import type { GIProduct } from '@/lib/types'
import type { CandidateProduct, Constraint, EligibleProduct, VerificationResult } from './types'
import { hardConstraints } from './constraints'
import { matchesGIRegistry, sameCraftByTokens } from './relationships'

function verificationForProduct(product: CandidateProduct, giProducts: GIProduct[]): VerificationResult {
  const match = matchesGIRegistry(product, giProducts)
  if (match) {
    return {
      entity: match.name,
      gi_verified: true,
      region: match.state,
      craft_category: match.category,
      source: `KalaStree verified GI registry (tag: ${match.gi_tag}, registered ${match.year})`,
      source_confidence: 'high',
      verification_status: 'verified',
      gi_product: match,
    }
  }
  return {
    entity: product.gi_tag ?? product.name,
    gi_verified: false,
    region: null,
    craft_category: null,
    source: null,
    source_confidence: null,
    verification_status: 'not_verified',
  }
}

// Shared by 'craft' and 'material' constraints — both are "does this
// free-text term describe the product" checks against the same fields,
// with the same recall-favoring keyword fallback. Reproduced live, two
// related but distinct cases:
// 1. entities.craft carried over from conversation history as "iron art"
//    (not the real registered name, "Bastar Iron Craft") — "iron art"
//    isn't a substring of "bastar iron craft" (nor the reverse: "art"/
//    "craft" are different words, not a reordering, so sameCraftByTokens'
//    word-order fix alone doesn't bridge it).
// 2. "bamboo craft" for a product literally named "...Bamboo Wall Panel"
//    made by a "Bastar Iron Craft" artisan — "bamboo" is real and
//    present, but only in the PRODUCT NAME, and only as one word among
//    several, not as part of any field containing the phrase "bamboo
//    craft" at all.
// 3. entities.material ("iron", "wood", "silk", ...) was extracted but
//    never used as a filter ANYWHERE in this pipeline until now — whether
//    the right products surfaced for "iron items?" was pure luck of
//    ranking.ts's soft semantic score, not a real, repeatable match.
// retrieval.ts ALREADY deliberately matches on just the phrase's primary
// keyword, across name/gi_tag/category/craft ALL FOUR fields ("a
// product's own name/category rarely repeats the full craft phrase
// verbatim") — but this eligibility check was re-applying a stricter
// full-phrase requirement afterward, and (in an earlier version of this
// fix) only added the keyword fallback for the craft field, not name/
// gi_tag/category — silently discarding candidates retrieval had already
// correctly found via exactly those other fields. Mirrors retrieval.ts's
// OR across all four fields, keyword-based, so eligibility never undoes
// retrieval's own recall.
function matchesCraftOrMaterial(product: CandidateProduct, value: unknown): boolean {
  const needle = String(value).toLowerCase()
  const craft = (product.artisan?.craft ?? '').toLowerCase()
  const name = product.name.toLowerCase()
  const giTag = (product.gi_tag ?? '').toLowerCase()
  const category = product.category.toLowerCase()
  const keyword = needle.split(/\s+/)[0]
  const keywordOk = keyword.length >= 4
  return (
    name.includes(needle) ||
    giTag.includes(needle) ||
    category.includes(needle) ||
    craft.includes(needle) ||
    (!!craft && sameCraftByTokens(craft, needle)) ||
    (keywordOk && (name.includes(keyword) || giTag.includes(keyword) || category.includes(keyword) || craft.includes(keyword)))
  )
}

function satisfiesConstraint(
  product: CandidateProduct,
  constraint: Constraint,
  productVerification: VerificationResult
): boolean {
  switch (constraint.field) {
    case 'state':
      return product.state === constraint.value
    case 'craft':
    case 'material':
      return matchesCraftOrMaterial(product, constraint.value)
    case 'gi_verified':
      return productVerification.gi_verified
    case 'max_price':
      return product.price <= Number(constraint.value)
    case 'min_price':
      return product.price >= Number(constraint.value)
    case 'availability':
      return product.stock > 0
    // Every artisan on this platform is a woman ("Heritage by Her") — a
    // request for "female" is structurally always satisfied; a request for
    // "male" can never be satisfied (see constraints.ts, which only ever
    // builds this constraint with one of those two values).
    case 'artisan_gender':
      return constraint.value === 'female'
    // Soft: "close enough" to the target price (within 25%), used only for
    // the matched-constraints explanation, not for eligibility filtering
    // (target_price is never a hard constraint — see constraints.ts).
    case 'target_price': {
      const target = Number(constraint.value)
      return Math.abs(product.price - target) <= target * 0.25
    }
    default:
      return true
  }
}

export function filterEligible(
  candidates: CandidateProduct[],
  constraints: Constraint[],
  giProducts: GIProduct[]
): EligibleProduct[] {
  const hard = hardConstraints(constraints)

  return candidates
    .map(product => ({ product, verification: verificationForProduct(product, giProducts) }))
    .filter(({ product, verification }) => hard.every(c => satisfiesConstraint(product, c, verification)))
    .map(({ product, verification }) => ({
      product,
      matchedConstraints: constraints
        .filter(c => satisfiesConstraint(product, c, verification))
        .map(c => c.label),
      giVerification: verification,
    }))
}
