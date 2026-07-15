import { cookies } from 'next/headers'
import { Lang, LANG_COOKIE, normalizeLang } from './constants'
import { registry, Namespace } from './registry'

export async function getServerLang(): Promise<Lang> {
  const store = await cookies()
  return normalizeLang(store.get(LANG_COOKIE)?.value)
}

export function getT<N extends Namespace>(namespace: N, lang: Lang) {
  const dict = registry[namespace] as Record<'en' | 'hi', Record<string, string>>

  return function t(key: keyof (typeof registry)[N]['en']): string {
    const k = key as string
    return dict[lang]?.[k] ?? dict.en?.[k] ?? k
  }
}
