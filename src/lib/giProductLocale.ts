import { Lang } from './i18n/constants'

export function localizedGiField<T extends string | null>(en: T, hi: string | null | undefined, lang: Lang): T {
  return lang === 'hi' && hi?.trim() ? (hi as T) : en
}
