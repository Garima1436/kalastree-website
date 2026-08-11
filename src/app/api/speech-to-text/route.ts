import { NextRequest, NextResponse } from 'next/server'

// In-memory rate limit: max 10 requests per IP per minute — same pattern
// and budget as /api/chat and /api/translate.
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

const MAX_AUDIO_BYTES = 15 * 1024 * 1024 // 15MB — a few minutes of voice input is plenty

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Voice input is not configured on this server yet.' }, { status: 503 })
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Too many voice requests. Please wait a moment.' }, { status: 429 })
  }

  try {
    const form = await req.formData()
    const audio = form.get('audio')
    if (!(audio instanceof Blob) || audio.size === 0) {
      return NextResponse.json({ error: 'Audio required' }, { status: 400 })
    }
    if (audio.size > MAX_AUDIO_BYTES) {
      return NextResponse.json({ error: 'Audio too long' }, { status: 400 })
    }

    // Forward as multipart/form-data to OpenAI's transcription endpoint —
    // reuses the browser-recorded Blob directly, no local re-encoding.
    const upstreamForm = new FormData()
    upstreamForm.append('file', audio, 'speech.webm')
    upstreamForm.append('model', 'whisper-1')
    // Language intentionally left unset — this site is bilingual (EN/HI)
    // and Whisper auto-detects reliably; forcing one would break the other.

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: upstreamForm,
      signal: AbortSignal.timeout(30000),
    })

    if (!response.ok) {
      const body = await response.text().catch(() => '')
      console.error('Whisper transcription error:', response.status, body)
      return NextResponse.json({ error: 'Voice transcription service error. Please try again.' }, { status: 502 })
    }

    const data = await response.json()
    const text = typeof data?.text === 'string' ? data.text.trim() : ''
    if (!text) {
      return NextResponse.json({ error: "Couldn't hear anything — please try again." }, { status: 422 })
    }

    return NextResponse.json({ text })
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === 'TimeoutError'
    console.error('Speech-to-text proxy error:', err)
    return NextResponse.json(
      { error: isTimeout ? 'Transcription timed out.' : 'Voice transcription is currently unavailable.' },
      { status: 503 }
    )
  }
}
