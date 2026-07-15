'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface Props {
  artisanId: string
  field: 'is_verified' | 'is_featured'
  value: boolean
  labelOn: string
  labelOff: string
  colorOn: string
  bgOn: string
}

export default function ArtisanToggle({ artisanId, field, value, labelOn, labelOff, colorOn, bgOn }: Props) {
  const [current, setCurrent] = useState(value)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { t } = useTranslation('adminArtisans')

  const toggle = async () => {
    setLoading(true)
    const next = !current
    const res = await fetch('/api/admin/artisans', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: artisanId, [field]: next }),
    })
    if (res.ok) {
      setCurrent(next)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={current ? t('clickToRemove') : t('clickToEnable')}
      style={{
        padding: '3px 10px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700,
        border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
        background: current ? bgOn : '#F3F4F6',
        color: current ? colorOn : '#9CA3AF',
        opacity: loading ? 0.6 : 1,
        whiteSpace: 'nowrap',
      }}
    >
      {current ? labelOn : labelOff}
    </button>
  )
}
