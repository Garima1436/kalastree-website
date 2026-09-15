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
import aboutDict from '../i18n/dictionaries/about'

export const FOUNDER_NAME = 'Garima Awasthi'

// Confirmed directly by the KalaStree team (not present in the public About
// page copy, unlike everything else in this file) — kept here anyway since
// it's real, user-confirmed leadership info the chatbot should be able to
// state, but flagged as its own source so it's not mistaken for site copy.
export const CO_FOUNDER_NAME = 'Manish Rawat'

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
  {
    source_id: 'static:kalastree-cofounder',
    source_type: 'static',
    source_title: 'KalaStree Co-founder',
    source_reference: 'KalaStree team (confirmed, not yet on the public About page)',
    retrieved_text: `${CO_FOUNDER_NAME} is the co-founder of KalaStree, alongside founder ${FOUNDER_NAME}.`,
    relevance_score: 1,
    verification_status: 'verified',
  },
]

export function isFounderName(name: string | null): boolean {
  if (!name) return false
  const normalized = name.trim().toLowerCase()
  return normalized === FOUNDER_NAME.toLowerCase() || normalized === CO_FOUNDER_NAME.toLowerCase()
}

// A generic "what is a GI?" has no product/craft/state entity for
// verification.ts to check (verifyGI returns null with nothing to look up),
// and previously fell through to the external research-corpus retrieval
// alone — a PhD survey-data corpus with no actual definitional passage, and
// one that also silently returns nothing on a cold-started backend (see
// retrieval.ts's 15s timeout). Net effect: the single most basic question a
// GI marketplace chatbot should answer ("what is GI?") was hitting the
// generic insufficient-evidence fallback. This is settled, publicly
// documented fact (DPIIT / the GI Act, 1999) — not corpus- or DB-derived —
// so it is a static block like KALASTREE_EVIDENCE above, not a retrieval.
export const GI_DEFINITION_EVIDENCE: Evidence = {
  source_id: 'static:gi-definition',
  source_type: 'static',
  source_title: 'What is a Geographical Indication (GI)?',
  source_reference: 'Geographical Indications of Goods (Registration and Protection) Act, 1999 (DPIIT)',
  retrieved_text:
    'A Geographical Indication (GI) is a name or sign used on products that corresponds to a specific geographical ' +
    'origin, where a given quality, reputation, or other characteristic of the product is essentially attributable ' +
    'to that place of origin. In India, GI tags are registered and administered by the Geographical Indications ' +
    'Registry under the Department for Promotion of Industry and Internal Trade (DPIIT), under the Geographical ' +
    'Indications of Goods (Registration and Protection) Act, 1999. A GI tag legally protects the name so that only ' +
    'producers from that specific region/community can use it, helping establish authenticity and often commanding ' +
    'a price premium for the makers. Well-known Indian GI examples include Darjeeling Tea, Pashmina, and Madhubani ' +
    'Painting. KalaStree cross-checks each listed product against the DPIIT GI registry before marking it verified.',
  relevance_score: 1,
  verification_status: 'verified',
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

// order_related ("Where's my order?", "Can I cancel my order?") previously
// had NO evidence wiring at all — not in PRODUCT_INTENTS, not in
// NARRATIVE_INTENTS, no deterministic lookup like artisan_information has —
// so it always hit the generic insufficient-evidence refusal. This pipeline
// has no signed-in-user/order-ID context to look up a REAL order's status
// (that would require auth plumbing this chat endpoint doesn't have), so
// the honest fix is pointing to the real, existing self-service page
// rather than fabricating or guessing at order data.
export const ORDER_RELATED_EVIDENCE: Evidence = {
  source_id: 'static:order-related',
  source_type: 'static',
  source_title: 'Checking Your Order Status',
  source_reference: 'src/app/account/orders/page.tsx (My Orders page)',
  retrieved_text:
    'This chat assistant does not have access to individual order records. To check an order\'s status, cancel an ' +
    'eligible order, or confirm delivery, sign in to your KalaStree account and go to My Orders ' +
    '(kalastree.com/account/orders). For any other order issue, contact KalaStree directly at garima@kalastree.com.',
  relevance_score: 1,
  verification_status: 'verified',
}

export interface AboutStoryMention {
  paragraph: string
}

// Built from the SAME about.ts fields the About page itself renders
// (memorialName/memorialQuote/memorialAttribution) — never a hand-copied
// snapshot. If that content is ever edited, both the live page and this
// answer change together automatically on the next deploy; nothing here
// needs to be hand-updated to stay in sync. Reproduced live: a real user
// asked the chatbot the EXACT name shown on the page ("SB Sharma" /
// "S.B. Sharma") and it flatly said not found, despite the About page
// naming him. Deliberately does NOT also match "Shyam Babu Sharma" or any
// other expansion of "S.B." — there's no evidence on the site of what the
// initials stand for, and guessing would be exactly the kind of
// fabrication this whole lookup chain exists to avoid.
// Framed in third person, and attribution stated explicitly up front,
// specifically so the quote itself can't be misread as HIS words — it is
// Garima's own dedication, addressed to his memory, not something he said.
function buildMemorialText(): string {
  const { memorialName, memorialQuote, memorialAttribution } = aboutDict.en
  return (
    `The About page carries an in-memoriam dedication to "Late Shri ${memorialName}" (Garima Awasthi's ` +
    `father-in-law, per the signature "${memorialAttribution.replace(/^—\s*/, '')}"). The dedication is words ` +
    `WRITTEN BY Garima Awasthi, addressed to his memory — not a quote from him: ${memorialQuote}`
  )
}

// The About page's "Why KalaStree?" origin story names a real person who
// has no artisans-table record, no News & Events mention, and no product
// review: Sunita, the Jitwarpur (Bihar) artisan whose underpayment is the
// platform's founding story (about.ts storyPara1/3/5). Reproduced live:
// "who is Sunita?" flatly said no artisan/news/review match existed, even
// though the About page is *literally* about her — every other
// named-person lookup in pipeline.ts is DB-backed and had no reason to
// ever look at this static story content. English-only (the `en` dict):
// a Latin-script name query wouldn't match the Hindi paragraphs anyway.
//
// Matching is done on a letters/digits-only normalized form so "SB
// Sharma", "S.B. Sharma", and "sb sharma" all resolve to the same
// substring check regardless of punctuation/spacing differences.
function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '')
}

export function findAboutStoryMention(name: string | null): AboutStoryMention | null {
  if (!name) return null
  const needle = normalize(name)
  if (!needle) return null
  const paragraphs = [
    aboutDict.en.storyPara1, aboutDict.en.storyPara2, aboutDict.en.storyPara3, aboutDict.en.storyPara4,
    aboutDict.en.storyPara5, aboutDict.en.storyPara6, aboutDict.en.storyPara7, aboutDict.en.storyPara8,
    buildMemorialText(),
  ]
  const match = paragraphs.find(p => normalize(p).includes(needle))
  return match ? { paragraph: match.replace(/\n/g, ' ') } : null
}
