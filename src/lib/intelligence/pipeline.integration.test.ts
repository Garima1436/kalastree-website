// Integration tests for the representative query categories from the spec
// (section 23): GI queries, product queries, artisan queries, constraint
// queries, multi-turn queries, and hallucination tests. These hit the real
// Supabase catalogue and a real OpenAI call — not free, not instant, and
// their assertions are necessarily looser than the unit tests (an LLM's
// exact phrasing varies) since they're checking end-to-end behavior, not
// implementation details.
//
// Run with: npm run test:integration
// Requires .env.local to have a real OPENAI_API_KEY and Supabase credentials.
import { describe, it, expect } from 'vitest'
import { runPipeline } from './pipeline'

const TIMEOUT = 30000

describe('GI queries', () => {
  it('confirms a real, registered GI craft', async () => {
    const result = await runPipeline('Is Madhubani Painting GI certified?', [], null, false)
    expect(result.answer.toLowerCase()).toContain('gi')
    expect(result.answer).not.toMatch(/not certified|is not gi/i)
    expect(result.sources.some(s => s.toLowerCase().includes('madhubani'))).toBe(true)
  }, TIMEOUT)
})

describe('product queries', () => {
  it('returns products for a plain craft + price request, all within budget', async () => {
    const result = await runPipeline('Show Madhubani paintings under ₹3000', [], null, false)
    expect(result.structuredQuery.intents).toContain('product_discovery')
    for (const p of result.products) expect(p.price).toBeLessThanOrEqual(3000)
  }, TIMEOUT)
})

describe('artisan queries', () => {
  it('answers from verified artisan records for a named artisan', async () => {
    const result = await runPipeline('Tell me about the artisan Sunita Jha', [], null, false)
    expect(result.structuredQuery.intents).toContain('artisan_information')
    expect(result.sources.length).toBeGreaterThan(0)
  }, TIMEOUT)

  // "Who made this product?" (the spec's own example 2) needs product-page
  // context — which product? — that the floating ChatWidget doesn't carry
  // today (it's a site-wide widget, not scoped to a product page). Known
  // limitation, not exercised here; see KALASTREE_TECHNICAL_DIFFERENTIATION.md.
})

describe('constraint queries', () => {
  it('applies every stated hard constraint (state + GI + price) deterministically', async () => {
    const result = await runPipeline('Show GI products from Bihar under ₹2000', [], null, false)
    for (const p of result.products) {
      expect(p.state).toBe('Bihar')
      expect(p.giVerified).toBe(true)
      expect(p.price).toBeLessThanOrEqual(2000)
    }
  }, TIMEOUT)
})

describe('multi-turn queries', () => {
  it('carries craft and accumulates constraints across turns without the user repeating them', async () => {
    const turn1 = await runPipeline('Show me Madhubani paintings', [], null, false)
    expect(turn1.structuredQuery.entities.craft).toBe('Madhubani Painting')

    const history1 = [
      { role: 'user' as const, text: 'Show me Madhubani paintings' },
      { role: 'ai' as const, text: turn1.answer },
    ]
    const turn2 = await runPipeline('under 3000', history1, turn1.structuredQuery, false)
    expect(turn2.structuredQuery.entities.craft).toBe('Madhubani Painting')
    expect(turn2.structuredQuery.entities.max_price).toBe(3000)
    for (const p of turn2.products) expect(p.price).toBeLessThanOrEqual(3000)

    const history2 = [...history1, { role: 'user' as const, text: 'under 3000' }, { role: 'ai' as const, text: turn2.answer }]
    const turn3 = await runPipeline('only women artisans', history2, turn2.structuredQuery, false)
    expect(turn3.structuredQuery.entities.craft).toBe('Madhubani Painting')
    expect(turn3.structuredQuery.entities.max_price).toBe(3000)
    expect(turn3.structuredQuery.entities.artisan_gender).toBe('female')
    // Regression check for a real bug found during manual verification:
    // the model must not lift facts (artisan name, material, ...) out of
    // its OWN prior answer text as if the user had stated them.
    expect(turn3.structuredQuery.entities.artisan).toBeNull()
    expect(turn3.structuredQuery.entities.material).toBeNull()
  }, TIMEOUT * 3)
})

describe('hallucination tests', () => {
  it('refuses to confirm GI status for a fabricated craft', async () => {
    const result = await runPipeline('Is Rajasthani Moonstone Weaving a GI certified craft?', [], null, false)
    expect(result.answer.toLowerCase()).toMatch(/not (a )?gi|not certified|not found|no.*information/)
  }, TIMEOUT)

  it('refuses to invent details for an unknown artisan', async () => {
    const result = await runPipeline('Tell me about the artisan Rekha Devi from Nagaland', [], null, false)
    expect(result.answer).toContain('does not contain enough information')
  }, TIMEOUT)

  it('does not claim GI verification for a state with no matching registered craft in context', async () => {
    const result = await runPipeline('Is there a GI-certified "Moonlight Batik" craft from Sikkim?', [], null, false)
    expect(result.answer).not.toMatch(/is gi certified|is gi-certified|yes.*gi/i)
  }, TIMEOUT)
})
