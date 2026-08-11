// Static KalaStree-the-company facts (mission, founder, platform pillars).
// Sourced verbatim from the site's own existing About page copy
// (src/lib/i18n/dictionaries/about.ts) — never invented. This exists
// because the chat pipeline previously had no domain at all for "what is
// Kalastree" / "who founded it" questions: general_question wasn't wired to
// any evidence source, and the underlying research corpus (ingested from
// d:\gi_chatbot\data) is PhD research data, not company information.
//
// Kept as a small static block rather than a Chroma/DB source because this
// content changes rarely and living in a second system just for this would
// be more infrastructure than the problem needs.
import type { Evidence } from './types'

export const FOUNDER_NAME = 'Garima Awasthi'

export const KALASTREE_EVIDENCE: Evidence[] = [
  {
    source_id: 'static:kalastree-company',
    source_type: 'static',
    source_title: 'About KalaStree',
    source_reference: 'src/lib/i18n/dictionaries/about.ts (About page copy)',
    retrieved_text:
      'KalaStree ("Heritage by Her") is a verified-GI marketplace connecting India\'s women artisans directly to buyers, ' +
      'so payment goes straight to the artisan with no middleman. It has three parts: (1) a Verified GI Marketplace — ' +
      'AI-verified product listings cross-checked against the DPIIT GI registry; (2) FinTech for Artisans — digital ' +
      'wallets, Artisan Credit Scores, microloans, and sachet insurance built for women in GI value chains; ' +
      '(3) an AI Knowledge Engine — this chatbot, trained on GI product and artisan research data.',
    relevance_score: 1,
    verification_status: 'verified',
  },
  {
    source_id: 'static:kalastree-founder',
    source_type: 'static',
    source_title: 'KalaStree Founder',
    source_reference: 'src/lib/i18n/dictionaries/about.ts (About page copy)',
    retrieved_text:
      `${FOUNDER_NAME} is the founder of KalaStree. She is a PhD scholar and researcher at the Department of Computer ` +
      'Science & Engineering, IIT Patna, and a Springer LNNS author. Her research combines FinTech, women\'s ' +
      'empowerment, and GI-tagged products, studying how traditional women artisans can grow in the digital economy. ' +
      `She founded KalaStree after field research across 16 states of India with 2,500 women artisans, after seeing ` +
      'an artisan in Jitwarpur village, Bihar paid a fraction of her work\'s real market value by a middleman.',
    relevance_score: 1,
    verification_status: 'verified',
  },
]

export function isFounderName(name: string | null): boolean {
  if (!name) return false
  return name.trim().toLowerCase() === FOUNDER_NAME.toLowerCase()
}

// Same "sourced from real, existing site content" rule as KALASTREE_EVIDENCE
// above — this is a direct restatement of the brand tagline ("Heritage by
// Her") and mission copy already on the site, not a new claim.
//
// Injected whenever entities.artisan_gender === 'male' (see pipeline.ts),
// regardless of which intent the query landed on. Reproduced without this:
// "made by men" / "products made by men?" got the generic
// insufficient-evidence refusal instead of the true, confident answer —
// because the query didn't reliably classify as product_discovery on its
// own, so the product pipeline (which now correctly returns zero eligible
// products for a male-artisan request — see eligibility.ts) never ran.
// This fact is available independent of that pipeline running at all.
export const WOMEN_ONLY_PLATFORM_EVIDENCE: Evidence = {
  source_id: 'static:women-only-platform',
  source_type: 'static',
  source_title: 'KalaStree Artisan Policy',
  source_reference: 'src/lib/i18n/dictionaries/about.ts (About page copy — "Heritage by Her")',
  retrieved_text:
    'KalaStree exclusively features women artisans ("Heritage by Her"). There are no male artisans and no ' +
    'products made by men on the platform.',
  relevance_score: 1,
  verification_status: 'verified',
}
