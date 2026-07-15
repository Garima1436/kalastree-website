'use client'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/lib/i18n/useTranslation'

export default function DeleteGIProductButton({ id, name }: { id: string; name: string }) {
  const router = useRouter()
  const { t } = useTranslation('adminGiProducts')
  const { t: tc } = useTranslation('common')

  const handleDelete = async () => {
    if (!confirm(t('confirmDeleteGiProduct').replace('{name}', name))) return
    await fetch('/api/admin/gi-products', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    router.refresh()
  }

  return (
    <button onClick={handleDelete} style={{
      fontSize: '0.78rem', color: '#EF4444', fontWeight: 700,
      border: '1px solid #EF4444', background: 'none',
      padding: '4px 10px', borderRadius: 4, cursor: 'pointer',
    }}>
      {tc('delete')}
    </button>
  )
}
