import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { runPipeline } from '@/lib/intelligence/pipeline'
import type { Evidence, StructuredQuery } from '@/lib/intelligence/types'

// In-memory rate limit: max 10 requests per IP per minute
const rateLimitMap = new Map<string, { count: number; reset: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.reset) {
    rateLimitMap.set(ip, { count: 1, reset: now + 60_000 })
    return true
  }
  if (entry.count >= 10) return false
  entry.count++
  return true
}

interface HistoryMessage {
  role: 'user' | 'ai'
  text: string
}

async function isAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    return profile?.role === 'admin'
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { answer: 'Too many requests. Please wait a moment before asking again.', sources: [] },
        { status: 429 }
      )
    }

    const { question, history, previousQuery, previousEvidence, debug } = await req.json()
    if (!question?.trim()) {
      return NextResponse.json({ error: 'Question required' }, { status: 400 })
    }
    if (question.length > 500) {
      return NextResponse.json({ error: 'Question too long (max 500 characters)' }, { status: 400 })
    }

    // Validate and sanitize history — cap at last 8 messages
    const safeHistory: HistoryMessage[] = Array.isArray(history)
      ? history
          .filter((m: unknown) =>
            m !== null &&
            typeof m === 'object' &&
            'role' in (m as object) &&
            'text' in (m as object) &&
            ((m as HistoryMessage).role === 'user' || (m as HistoryMessage).role === 'ai') &&
            typeof (m as HistoryMessage).text === 'string'
          )
          .slice(-8)
      : []

    // previousQuery is client-held, round-tripped state (spec section 18's
    // multi-turn memory) — trust its shape loosely, the pipeline only reads
    // known fields off it and merges non-null values.
    const safePreviousQuery: StructuredQuery | null =
      previousQuery && typeof previousQuery === 'object' && Array.isArray(previousQuery.intents) && previousQuery.entities
        ? (previousQuery as StructuredQuery)
        : null

    // previousEvidence is client-held, round-tripped state (same pattern as
    // previousQuery) — used only for a source_inquiry follow-up ("where did
    // you get that?"), which answers strictly from what actually supported
    // the last answer instead of a fresh, unrelated retrieval.
    const safePreviousEvidence: Evidence[] | null = Array.isArray(previousEvidence) ? previousEvidence : null

    const includeDebug = debug === true && (await isAdmin())

    const result = await runPipeline(question, safeHistory, safePreviousQuery, includeDebug, safePreviousEvidence)
    return NextResponse.json(result)
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === 'TimeoutError'
    const message = isTimeout
      ? 'The request timed out. Please try again in a moment.'
      : 'The AI assistant is currently unavailable. Please try again shortly.'
    console.error('Chat pipeline error:', err)
    return NextResponse.json({ answer: message, sources: [] }, { status: 200 })
  }
}
