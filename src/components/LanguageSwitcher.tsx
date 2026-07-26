'use client'

import { useLanguage } from '@/lib/i18n/LanguageContext'

export default function LanguageSwitcher({ compact = false, tiny = false }: { compact?: boolean; tiny?: boolean }) {
  const { lang, setLang } = useLanguage()

  return (
    <button
      onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
      aria-label="Toggle language / भाषा बदलें"
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: tiny ? 20 : compact ? 34 : 36,
        padding: tiny ? '0 8px' : '0 12px',
        background: 'none', border: '1.5px solid #C7D2D6', borderRadius: tiny ? 5 : 8,
        cursor: 'pointer', color: '#5B7480',
        fontFamily: "'Inter', sans-serif", fontSize: tiny ? '0.65rem' : '0.78rem', fontWeight: 700,
        letterSpacing: '0.03em', whiteSpace: 'nowrap', transition: 'all 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#1E5F74'; e.currentTarget.style.color = '#1E5F74' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#C7D2D6'; e.currentTarget.style.color = '#5B7480' }}
    >
      <span style={{ opacity: lang === 'en' ? 1 : 0.45 }}>EN</span>
      <span style={{ margin: '0 4px', opacity: 0.45 }}>/</span>
      <span style={{ opacity: lang === 'hi' ? 1 : 0.45 }}>हिं</span>
    </button>
  )
}
