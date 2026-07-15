'use client'

import { useLanguage } from '@/lib/i18n/LanguageContext'

export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { lang, setLang } = useLanguage()

  return (
    <button
      onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
      aria-label="Toggle language / भाषा बदलें"
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: compact ? 34 : 36,
        padding: '0 12px',
        background: 'none', border: '1.5px solid #DDB840', borderRadius: 8,
        cursor: 'pointer', color: '#6B4820',
        fontFamily: "'Lato', sans-serif", fontSize: '0.78rem', fontWeight: 700,
        letterSpacing: '0.03em', whiteSpace: 'nowrap', transition: 'all 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#E8380A'; e.currentTarget.style.color = '#E8380A' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#DDB840'; e.currentTarget.style.color = '#6B4820' }}
    >
      <span style={{ opacity: lang === 'en' ? 1 : 0.45 }}>EN</span>
      <span style={{ margin: '0 4px', opacity: 0.45 }}>/</span>
      <span style={{ opacity: lang === 'hi' ? 1 : 0.45 }}>हिं</span>
    </button>
  )
}
