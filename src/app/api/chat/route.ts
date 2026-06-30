import { NextRequest, NextResponse } from 'next/server'

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

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { answer: 'Too many requests. Please wait a moment before asking again.', sources: [] },
        { status: 429 }
      )
    }

    const { question, history } = await req.json()
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

    const response = await fetch('https://ashish766733-kalastree-chatbot.hf.space/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, history: safeHistory }),
      signal: AbortSignal.timeout(60000),
    })

    if (!response.ok) throw new Error(`Backend returned ${response.status}`)
    const data = await response.json()
    return NextResponse.json(data)
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === 'TimeoutError'
    const message = isTimeout
      ? 'The request timed out. The AI may be starting up — please try again in a moment.'
      : 'The AI assistant is currently unavailable. Please try again shortly.'
    console.error('Chat proxy error:', err)
    return NextResponse.json({ answer: message, sources: [] }, { status: 200 })
  }
}
