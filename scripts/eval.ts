// Evaluation harness (spec section 24): runs the representative query
// dataset (scripts/eval-dataset.json) through the real pipeline and reports
// metrics — intent accuracy, entity resolution accuracy, GI verification
// success rate, constraint satisfaction, groundedness, hallucination
// refusal rate, and per-stage latency. Writes a timestamped JSON report to
// scripts/eval-reports/ for tracking over time.
//
// Two metrics from the spec (retrieval precision, recommendation
// relevance) don't have a ground-truth label in this dataset — true
// precision/relevance grading needs human judgment or a much larger
// labeled corpus. They're reported as approximations below, clearly
// labeled as such, rather than presented as if precisely measured.
//
// Run with: npm run eval
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import type { Evidence, ExtractedEntities, StructuredQuery } from '../src/lib/intelligence/types'
import type { runPipeline as RunPipeline } from '../src/lib/intelligence/pipeline'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// dotenv must run BEFORE anything that constructs a Supabase client is
// imported (src/lib/supabase-admin.ts reads process.env at import time),
// so runPipeline is loaded dynamically inside main() below, after config()
// has actually executed — not as a static top-level import.
let runPipeline: typeof RunPipeline

interface SingleTurnCase {
  id: string
  category: string
  query: string
  expected_intents?: string[]
  expected_entities?: Partial<ExtractedEntities>
  expected_gi_verified?: boolean
  expect_products?: boolean
  expect_refusal?: boolean
  // Opposite of expect_refusal: asserts the fallback message must NOT
  // appear — for cases like a genuine, correctly-computed zero-result
  // product search, which should get a plain "nothing found" answer, not
  // the insufficient-evidence refusal.
  forbid_refusal?: boolean
  product_price_max?: number
  product_state?: string
  product_gi_verified?: boolean
  // Case-insensitive substring checks against the final answer text.
  required_answer_substring?: string[]
  forbidden_answer_substring?: string[]
  // Checks a specific constraint's hard/soft classification (debug.constraints).
  expected_constraint_kinds?: { field: string; kind: 'hard' | 'soft' }[]
}

interface MultiTurnCase {
  id: string
  turns: {
    query: string
    expected_intents?: string[]
    expected_entities?: Partial<ExtractedEntities>
    forbidden_entities?: (keyof ExtractedEntities)[]
    // Weaker than forbidden_entities (which requires null): asserts the
    // field is not STUCK on a specific stale value, without requiring it
    // to be null — correct when the user's current message legitimately
    // supplies a fresh, different, non-null value for that same field.
    forbidden_entity_values?: Partial<ExtractedEntities>
    required_answer_substring?: string[]
    forbidden_answer_substring?: string[]
    expect_products?: boolean
  }[]
}

interface Dataset {
  single_turn: SingleTurnCase[]
  multi_turn: MultiTurnCase[]
}

interface CaseResult {
  id: string
  category: string
  query: string
  passed_checks: string[]
  failed_checks: string[]
  latency_ms: number
}

const REFUSAL_TEXT = 'does not contain enough information'

function record(ok: boolean, name: string, passed: string[], failed: string[], failMessage: string) {
  if (ok) passed.push(name)
  else failed.push(failMessage)
}

function checkEntities(actual: ExtractedEntities, expected: Partial<ExtractedEntities> | undefined, failures: string[], label = 'entities') {
  if (!expected) return
  for (const [key, value] of Object.entries(expected)) {
    const actualValue = actual[key as keyof ExtractedEntities]
    if (actualValue !== value) failures.push(`${label}.${key}: expected ${JSON.stringify(value)}, got ${JSON.stringify(actualValue)}`)
  }
}

function checkAnswerSubstrings(
  answer: string,
  required: string[] | undefined,
  forbidden: string[] | undefined,
  passed: string[],
  failed: string[]
) {
  const lower = answer.toLowerCase()
  for (const s of required ?? []) {
    record(lower.includes(s.toLowerCase()), `contains:"${s}"`, passed, failed, `answer should contain "${s}" but didn't`)
  }
  for (const s of forbidden ?? []) {
    record(!lower.includes(s.toLowerCase()), `omits:"${s}"`, passed, failed, `answer should NOT contain "${s}" but did`)
  }
}

async function runSingleTurnCase(c: SingleTurnCase): Promise<CaseResult> {
  const start = Date.now()
  const result = await runPipeline(c.query, [], null, true)
  const latency_ms = Date.now() - start

  const passed: string[] = []
  const failed: string[] = []

  if (c.expected_intents) {
    const hasAll = c.expected_intents.every(i => result.structuredQuery.intents.includes(i as never))
    record(hasAll, 'intents', passed, failed, `intents: expected ${c.expected_intents}, got ${result.structuredQuery.intents}`)
  }

  checkEntities(result.structuredQuery.entities, c.expected_entities, failed)
  if (c.expected_entities && !failed.some(f => f.startsWith('entities'))) passed.push('entities')

  for (const { field, kind } of c.expected_constraint_kinds ?? []) {
    const actual = result.debug?.constraints.find(con => con.field === field)?.kind ?? null
    record(actual === kind, `constraint_kind:${field}`, passed, failed, `constraint_kind:${field}: expected ${kind}, got ${actual}`)
  }

  if (c.expected_gi_verified !== undefined) {
    const actual = result.debug?.verification[0]?.gi_verified ?? null
    record(actual === c.expected_gi_verified, 'gi_verified', passed, failed, `gi_verified: expected ${c.expected_gi_verified}, got ${actual}`)
  }

  if (c.expect_products !== undefined) {
    const hasProducts = result.products.length > 0
    record(hasProducts === c.expect_products, 'expect_products', passed, failed, `expect_products: expected ${c.expect_products}, got ${hasProducts}`)
  }

  if (c.expect_refusal) {
    record(result.answer.includes(REFUSAL_TEXT), 'refusal', passed, failed, 'refusal: expected the fallback refusal message')
  }
  if (c.forbid_refusal) {
    record(!result.answer.includes(REFUSAL_TEXT), 'forbid_refusal', passed, failed, 'forbid_refusal: got the generic fallback for what should be a confident answer')
  }

  checkAnswerSubstrings(result.answer, c.required_answer_substring, c.forbidden_answer_substring, passed, failed)

  if (c.product_price_max !== undefined) {
    const ok = result.products.every(p => p.price <= c.product_price_max!)
    record(ok, 'product_price_max', passed, failed, 'product_price_max: a returned product exceeded the stated ceiling')
  }
  if (c.product_state !== undefined) {
    const ok = result.products.every(p => p.state === c.product_state)
    record(ok, 'product_state', passed, failed, 'product_state: a returned product was from the wrong state')
  }
  if (c.product_gi_verified !== undefined) {
    const ok = result.products.every(p => p.giVerified === c.product_gi_verified)
    record(ok, 'product_gi_verified', passed, failed, 'product_gi_verified: a returned product had the wrong GI status')
  }

  record(
    (result.debug?.groundedness_warnings.length ?? 0) === 0,
    'groundedness', passed, failed,
    `groundedness: ${result.debug!.groundedness_warnings.join('; ')}`
  )

  return { id: c.id, category: c.category, query: c.query, passed_checks: passed, failed_checks: failed, latency_ms }
}

async function runMultiTurnCase(c: MultiTurnCase): Promise<CaseResult[]> {
  const results: CaseResult[] = []
  const history: { role: 'user' | 'ai'; text: string }[] = []
  let previousQuery: StructuredQuery | null = null
  let previousEvidence: Evidence[] | null = null

  for (const [i, turn] of c.turns.entries()) {
    const start = Date.now()
    const result = await runPipeline(turn.query, history, previousQuery, true, previousEvidence)
    const latency_ms = Date.now() - start
    previousQuery = result.structuredQuery
    previousEvidence = result.evidence
    history.push({ role: 'user', text: turn.query }, { role: 'ai', text: result.answer })

    const passed: string[] = []
    const failed: string[] = []

    if (turn.expected_intents) {
      const hasAll = turn.expected_intents.every(intent => result.structuredQuery.intents.includes(intent as never))
      record(hasAll, 'intents', passed, failed, `intents: expected ${turn.expected_intents}, got ${result.structuredQuery.intents}`)
    }

    checkEntities(result.structuredQuery.entities, turn.expected_entities, failed)
    if (turn.expected_entities && !failed.some(f => f.startsWith('entities'))) passed.push('entities')

    for (const field of turn.forbidden_entities ?? []) {
      const value = result.structuredQuery.entities[field]
      record(
        value === null, `forbidden:${field}`, passed, failed,
        `forbidden:${field} should be null, got ${JSON.stringify(value)} (likely lifted from the assistant's own prior reply)`
      )
    }

    for (const [field, staleValue] of Object.entries(turn.forbidden_entity_values ?? {})) {
      const actual = result.structuredQuery.entities[field as keyof ExtractedEntities]
      record(
        actual !== staleValue, `stale:${field}`, passed, failed,
        `stale:${field}: still stuck on ${JSON.stringify(staleValue)} from an earlier turn`
      )
    }

    checkAnswerSubstrings(result.answer, turn.required_answer_substring, turn.forbidden_answer_substring, passed, failed)

    if (turn.expect_products !== undefined) {
      const hasProducts = result.products.length > 0
      record(hasProducts === turn.expect_products, 'expect_products', passed, failed, `expect_products: expected ${turn.expect_products}, got ${hasProducts}`)
    }

    results.push({ id: `${c.id}:turn${i + 1}`, category: 'multi_turn', query: turn.query, passed_checks: passed, failed_checks: failed, latency_ms })
  }
  return results
}

async function main() {
  const { config } = await import('dotenv')
  config({ path: '.env.local' })
  ;({ runPipeline } = await import('../src/lib/intelligence/pipeline'))

  const dataset: Dataset = JSON.parse(readFileSync(path.join(__dirname, 'eval-dataset.json'), 'utf8'))

  const allResults: CaseResult[] = []
  for (const c of dataset.single_turn) {
    process.stdout.write(`Running ${c.id}... `)
    const r = await runSingleTurnCase(c)
    console.log(r.failed_checks.length === 0 ? 'PASS' : `FAIL (${r.failed_checks.length})`)
    allResults.push(r)
  }
  for (const c of dataset.multi_turn) {
    process.stdout.write(`Running ${c.id}... `)
    const rs = await runMultiTurnCase(c)
    console.log(rs.every(r => r.failed_checks.length === 0) ? 'PASS' : 'FAIL')
    allResults.push(...rs)
  }

  const totalChecks = allResults.reduce((s, r) => s + r.passed_checks.length + r.failed_checks.length, 0)
  const passedChecks = allResults.reduce((s, r) => s + r.passed_checks.length, 0)
  const avgLatency = allResults.reduce((s, r) => s + r.latency_ms, 0) / allResults.length

  const groundednessResults = allResults.filter(r => r.passed_checks.includes('groundedness') || r.failed_checks.some(f => f.startsWith('groundedness')))
  const groundednessRate = groundednessResults.length
    ? groundednessResults.filter(r => r.passed_checks.includes('groundedness')).length / groundednessResults.length
    : null

  const refusalResults = allResults.filter(r => r.passed_checks.includes('refusal') || r.failed_checks.some(f => f.startsWith('refusal')))
  const refusalRate = refusalResults.length
    ? refusalResults.filter(r => r.passed_checks.includes('refusal')).length / refusalResults.length
    : null

  const report = {
    run_at: new Date().toISOString(),
    total_cases: allResults.length,
    total_checks: totalChecks,
    passed_checks: passedChecks,
    // "Retrieval precision" and "recommendation relevance" (spec section
    // 24) are NOT precisely measured here — this dataset has no
    // human-graded relevance labels. check_pass_rate is the closest
    // measurable proxy this harness computes: the fraction of automatable,
    // deterministic assertions (constraint satisfaction, GI verification
    // correctness, entity accuracy, groundedness) that passed.
    check_pass_rate: totalChecks ? passedChecks / totalChecks : null,
    groundedness_rate: groundednessRate,
    hallucination_refusal_rate: refusalRate,
    avg_latency_ms: Math.round(avgLatency),
    results: allResults,
  }

  const reportsDir = path.join(__dirname, 'eval-reports')
  mkdirSync(reportsDir, { recursive: true })
  const reportPath = path.join(reportsDir, `eval-${report.run_at.replace(/[:.]/g, '-')}.json`)
  writeFileSync(reportPath, JSON.stringify(report, null, 2))

  console.log('\n=== Summary ===')
  console.log(`Checks passed: ${passedChecks}/${totalChecks} (${((report.check_pass_rate ?? 0) * 100).toFixed(1)}%)`)
  console.log(`Groundedness rate: ${groundednessRate !== null ? (groundednessRate * 100).toFixed(1) + '%' : 'n/a'}`)
  console.log(`Hallucination refusal rate: ${refusalRate !== null ? (refusalRate * 100).toFixed(1) + '%' : 'n/a'}`)
  console.log(`Avg latency: ${report.avg_latency_ms}ms`)
  console.log(`Report written to ${reportPath}`)

  const failures = allResults.filter(r => r.failed_checks.length > 0)
  if (failures.length) {
    console.log('\n=== Failures ===')
    for (const f of failures) {
      console.log(`- ${f.id} (${f.query}):`)
      for (const check of f.failed_checks) console.log(`    ${check}`)
    }
  }
}

main().catch(err => { console.error(err); process.exit(1) })
