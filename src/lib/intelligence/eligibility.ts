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
import { matchesGIRegistry } from './relationships'

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

function satisfiesConstraint(
  product: CandidateProduct,
  constraint: Constraint,
  productVerification: VerificationResult
): boolean {
  switch (constraint.field) {
    case 'state':
      return product.state === constraint.value
    case 'craft': {
      const needle = String(constraint.value).toLowerCase()
      return (
        product.name.toLowerCase().includes(needle) ||
        (product.gi_tag ?? '').toLowerCase().includes(needle) ||
        product.category.toLowerCase().includes(needle) ||
        (product.artisan?.craft ?? '').toLowerCase().includes(needle)
      )
    }
    case 'gi_verified':
      return productVerification.gi_verified
    case 'max_price':
      return product.price <= Number(constraint.value)
    case 'min_price':
      return product.price >= Number(constraint.value)
    case 'availability':
      return product.stock > 0
    // Every artisan on this platform is a woman ("Heritage by Her") — see
    // constraints.ts. Structurally always satisfied.
    case 'artisan_gender':
      return true
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
