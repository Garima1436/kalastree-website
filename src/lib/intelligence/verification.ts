// Stage 4: GI verification engine (spec section 7).
//
// The single deterministic authority on whether something is GI-certified.
// The LLM never sees a "yes it's GI" fact unless this function produced it.
// Unknown entities return verification_status: "not_verified" — never a
// guess.
import { resolveGIProduct } from './relationships'
import type { ExtractedEntities, VerificationResult } from './types'

export async function verifyGI(entities: ExtractedEntities): Promise<VerificationResult | null> {
  const entityLabel = entities.craft ?? entities.state
  if (!entityLabel) return null

  const giProduct = await resolveGIProduct(entities)

  if (!giProduct) {
    return {
      entity: entityLabel,
      gi_verified: false,
      region: null,
      craft_category: null,
      source: null,
      source_confidence: null,
      verification_status: 'not_verified',
    }
  }

  return {
    entity: giProduct.name,
    gi_verified: true,
    region: giProduct.state,
    craft_category: giProduct.category,
    source: `KalaStree verified GI registry (tag: ${giProduct.gi_tag}, registered ${giProduct.year})`,
    source_confidence: 'high',
    verification_status: 'verified',
    gi_product: giProduct,
  }
}
