'use client'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import dict from '@/lib/i18n/dictionaries/adminProducts'
import commonDict from '@/lib/i18n/dictionaries/common'

export default function DeleteProductButton({ id, name }: { id: string; name: string }) {
  const router = useRouter()
  const { lang } = useLanguage()
  const t = (key: keyof typeof dict.en): string => dict[lang]?.[key] ?? dict.en[key]
  const tc = (key: keyof typeof commonDict.en): string => commonDict[lang]?.[key] ?? commonDict.en[key]

  const handleDelete = async () => {
    if (!confirm(t('deleteProductConfirm').replace('{name}', name))) return
    await fetch('/api/admin/products', {
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
