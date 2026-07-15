import { Lang } from './i18n/constants'

export function localizedGiField(en: string, hi: string | null | undefined, lang: Lang): string {
  return lang === 'hi' && hi?.trim() ? hi : en
}
