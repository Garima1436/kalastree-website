import { supabase } from '@/lib/supabase'
import { STATE_EMOJI } from '@/lib/types'
import { INDIAN_STATES } from '@/lib/indian-states'
import Image from 'next/image'
import Link from 'next/link'
import fs from 'fs'
import path from 'path'
import { getServerLang, getT } from '@/lib/i18n/server'

export const revalidate = 300

function slugify(s: string) {
  return s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '')
}

function getStateImages(): Record<string, string> {
  const result: Record<string, string> = {}
  try {
    const dir = path.join(process.cwd(), 'public', 'states')
    if (!fs.existsSync(dir)) return result
    const files = fs.readdirSync(dir)
    for (const state of INDIAN_STATES) {
      const key = slugify(state)
      const match = files.find(f => /\.(jpe?g|png|webp|avif)$/i.test(f) && slugify(f.replace(/\.[^.]+$/, '')) === key)
      if (match) result[state] = `/states/${match}`
    }
  } catch {
    // ignore
  }
  return result
}

async function getStateCounts() {
  const { data } = await supabase.from('products').select('state').eq('status', 'approved')
  const counts: Record<string, number> = {}
  for (const row of data ?? []) {
    if (!row.state) continue
    counts[row.state] = (counts[row.state] ?? 0) + 1
  }
  return counts
}

const FALLBACK_GRADIENTS = [
  'linear-gradient(135deg, #E8380A, #C21859)',
  'linear-gradient(135deg, #D4A000, #E8380A)',
  'linear-gradient(135deg, #1A7A32, #1B2E4A)',
  'linear-gradient(135deg, #1B2E4A, #C21859)',
  'linear-gradient(135deg, #8A5A1E, #D4A000)',
  'linear-gradient(135deg, #C21859, #8A5A1E)',
]

export default async function ShopByStatePage() {
  const lang = await getServerLang()
  const t = getT('shop', lang)
  const tc = getT('common', lang)
  const stateCounts = await getStateCounts()
  const stateImages = getStateImages()

  return (
    <div style={{ background: '#E8E3D9', minHeight: '80vh' }}>
      {/* Header */}
      <div style={{ background: '#1B2E4A', padding: '3rem 5%', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cg fill='none' stroke='%23B8860B' stroke-width='0.4' opacity='0.1'%3E%3Crect x='10' y='10' width='60' height='60' rx='2'/%3E%3Cline x1='40' y1='0' x2='40' y2='80'/%3E%3Cline x1='0' y1='40' x2='80' y2='40'/%3E%3C/g%3E%3C/svg%3E\")", pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1280, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#D4A000', marginBottom: 8 }}>
            <Link href="/" style={{ color: '#D4A000', textDecoration: 'none' }}>{tc('home')}</Link> / {tc('shopByState')}
          </p>
          <h1 style={{ fontFamily: "'EB Garamond', serif", fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, color: '#fff', marginBottom: 8 }}>
            {tc('shopByState')}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1rem', maxWidth: 600 }}>
            {t('shopByStateSubtitle')}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[1280px] px-[5%] py-12">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-5 max-sm:grid-cols-2 max-sm:gap-3">
          {INDIAN_STATES.map((state, i) => {
            const img = stateImages[state]
            const count = stateCounts[state] ?? 0
            return (
              <Link
                key={state}
                href={`/shop?state=${encodeURIComponent(state)}`}
                className="h-[200px] max-sm:h-[140px]"
                style={{ position: 'relative', display: 'block', borderRadius: 12, overflow: 'hidden', textDecoration: 'none', boxShadow: '0 6px 18px rgba(26,8,0,0.18)' }}
              >
                {img ? (
                  <Image src={img} alt={state} fill sizes="(max-width: 640px) 50vw, 25vw" style={{ objectFit: 'cover' }} />
                ) : (
                  <div style={{ position: 'absolute', inset: 0, background: FALLBACK_GRADIENTS[i % FALLBACK_GRADIENTS.length], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '2.8rem', opacity: 0.35 }}>{STATE_EMOJI[state] ?? '🪔'}</span>
                  </div>
                )}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 40%, rgba(20,8,0,0.75) 100%)' }} />
                <div style={{ position: 'absolute', left: 16, right: 16, bottom: 14 }}>
                  <div style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>{state}</div>
                  {count > 0 && (
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>
                      {count} {count === 1 ? t('product') : t('products')}
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
