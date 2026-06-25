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

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ answer: 'Too many requests. Please wait a moment before asking again.', sources: [] }, { status: 429 })
    }

    const { question } = await req.json()
    if (!question?.trim()) return NextResponse.json({ error: 'Question required' }, { status: 400 })
    if (question.length > 500) return NextResponse.json({ error: 'Question too long (max 500 characters)' }, { status: 400 })

    const response = await fetch('https://ashish766733-kalastree-chatbot.hf.space/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
      signal: AbortSignal.timeout(60000),
    })

    if (!response.ok) throw new Error(`HF Space returned ${response.status}`)
    const data = await response.json()
    return NextResponse.json(data)
  } catch (err) {
    console.error('Chat proxy error:', err)
    return NextResponse.json({ answer: 'The AI assistant is currently unavailable. Please try again shortly.', sources: [] }, { status: 200 })
  }
}
