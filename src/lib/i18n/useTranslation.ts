'use client'

import { useLanguage } from './LanguageContext'
import { registry, Namespace } from './registry'

export function useTranslation<N extends Namespace>(namespace: N) {
  const { lang, setLang } = useLanguage()
  const dict = registry[namespace] as Record<'en' | 'hi', Record<string, string>>

  function t(key: keyof (typeof registry)[N]['en']): string {
    const k = key as string
    return dict[lang]?.[k] ?? dict.en?.[k] ?? k
  }

  return { t, lang, setLang }
}
