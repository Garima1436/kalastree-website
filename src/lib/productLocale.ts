import { Lang } from './i18n/constants'
import { Product } from './types'

export function localizedProductName(product: Pick<Product, 'name' | 'name_hi'>, lang: Lang): string {
  return lang === 'hi' && product.name_hi?.trim() ? product.name_hi : product.name
}

export function localizedProductDescription(product: Pick<Product, 'description' | 'description_hi'>, lang: Lang): string | null {
  return lang === 'hi' && product.description_hi?.trim() ? product.description_hi : product.description
}
