export type Lang = 'en' | 'hi'

export const LANG_COOKIE = 'kalastree_lang'
export const DEFAULT_LANG: Lang = 'en'

export function normalizeLang(value: string | undefined | null): Lang {
  return value === 'hi' ? 'hi' : DEFAULT_LANG
}
