import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

async function requireArtisanOrAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'artisan' && profile?.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { error: null }
}

// In-memory rate limit: max 30 translate calls per user session per minute
const rateLimitMap = new Map<string, { count: number; reset: number }>()

function checkRateLimit(key: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(key)
  if (!entry || now > entry.reset) {
    rateLimitMap.set(key, { count: 1, reset: now + 60_000 })
    return true
  }
  if (entry.count >= 30) return false
  entry.count++
  return true
}

export async function POST(req: NextRequest) {
  const { error } = await requireArtisanOrAdmin()
  if (error) return error

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Translation is not configured on this server yet.' }, { status: 503 })
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Too many translation requests. Please wait a moment.' }, { status: 429 })
  }

  const { text } = await req.json()
  if (!text?.trim()) return NextResponse.json({ error: 'Text required' }, { status: 400 })
  if (text.length > 2000) return NextResponse.json({ error: 'Text too long (max 2000 characters)' }, { status: 400 })

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content:
              'You translate English e-commerce/craft copy into natural, idiomatic Hindi (Devanagari script). ' +
              'Reply with ONLY the Hindi translation — no quotes, no notes, no romanization, nothing else. ' +
              'Preserve any Markdown formatting (**bold**, *italic*, headings, bullet lists) and line breaks as-is.',
          },
          { role: 'user', content: text },
        ],
      }),
      signal: AbortSignal.timeout(20000),
    })

    if (!response.ok) {
      const body = await response.text().catch(() => '')
      console.error('OpenAI translate error:', response.status, body)
      return NextResponse.json({ error: 'Translation service error. Please try again.' }, { status: 502 })
    }

    const data = await response.json()
    const translated = data?.choices?.[0]?.message?.content?.trim()
    if (typeof translated !== 'string' || !translated) {
      return NextResponse.json({ error: 'Translation service returned an unexpected response.' }, { status: 502 })
    }

    return NextResponse.json({ translated })
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === 'TimeoutError'
    console.error('Translate proxy error:', err)
    return NextResponse.json(
      { error: isTimeout ? 'Translation request timed out.' : 'Translation service is currently unavailable.' },
      { status: 503 }
    )
  }
}
