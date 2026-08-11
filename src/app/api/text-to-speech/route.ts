import { NextRequest, NextResponse } from 'next/server'

// In-memory rate limit: max 20 requests per IP per minute — one call per
// assistant answer, generally more frequent than voice input.
const rateLimitMap = new Map<string, { count: number; reset: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.reset) {
    rateLimitMap.set(ip, { count: 1, reset: now + 60_000 })
    return true
  }
  if (entry.count >= 20) return false
  entry.count++
  return true
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Voice output is not configured on this server yet.' }, { status: 503 })
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Too many voice requests. Please wait a moment.' }, { status: 429 })
  }

  const { text } = await req.json()
  if (!text?.trim()) return NextResponse.json({ error: 'Text required' }, { status: 400 })
  if (text.length > 2000) return NextResponse.json({ error: 'Text too long for voice playback' }, { status: 400 })

  try {
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini-tts',
        voice: 'nova',
        input: text,
        instructions: 'Speak with a warm, natural Indian English accent.',
        response_format: 'mp3',
      }),
      signal: AbortSignal.timeout(30000),
    })

    if (!response.ok) {
      const body = await response.text().catch(() => '')
      console.error('TTS synthesis error:', response.status, body)
      return NextResponse.json({ error: 'Voice synthesis service error. Please try again.' }, { status: 502 })
    }

    const audio = await response.arrayBuffer()
    return new NextResponse(audio, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === 'TimeoutError'
    console.error('Text-to-speech proxy error:', err)
    return NextResponse.json(
      { error: isTimeout ? 'Voice synthesis timed out.' : 'Voice output is currently unavailable.' },
      { status: 503 }
    )
  }
}
