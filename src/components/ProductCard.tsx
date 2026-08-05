'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import type { Product } from '@/lib/types'
import { CATEGORY_META } from '@/lib/types'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { localizedProductName } from '@/lib/productLocale'

export default function ProductCard({ product }: { product: Product }) {
  const cat = CATEGORY_META[product.category]
  const { t, lang } = useTranslation('shop')
  const { t: tc } = useTranslation('common')
  const name = localizedProductName(product, lang)
  const [added, setAdded] = useState(false)

  const addToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const cart = JSON.parse(localStorage.getItem('kalastree_cart') || '[]')
    const idx = cart.findIndex((i: { id: string }) => i.id === product.id)
    if (idx >= 0) cart[idx].qty += 1
    else cart.push({ id: product.id, name: product.name, price: product.price, image: product.images?.[0] || '', slug: product.slug, qty: 1 })
    localStorage.setItem('kalastree_cart', JSON.stringify(cart))
    window.dispatchEvent(new Event('cart_updated'))
    setAdded(true)
    setTimeout(() => setAdded(false), 1600)
  }

  const buttonClass = product.stock === 0
    ? 'bg-[#F3ECDD] text-text-muted cursor-not-allowed'
    : added
      ? 'bg-forest text-white cursor-pointer'
      : 'bg-saffron text-white cursor-pointer'

  return (
    <div className="flex flex-col overflow-hidden rounded-[3px] bg-white transition-all duration-[250ms] hover:-translate-y-1.5 hover:shadow-[0_16px_40px_rgba(232,56,10,0.12)]">
      <Link href={`/shop/${product.slug}`} className="block cursor-pointer no-underline">
        {/* Image */}
        <div className="relative flex h-[170px] items-center justify-center overflow-hidden bg-white max-sm:h-[110px]">
          {product.images?.[0] ? (
            <Image src={product.images[0]} alt={name} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 240px" style={{ objectFit: 'contain' }} />
          ) : (
            <span className="text-[3rem]">{cat.icon}</span>
          )}
          {product.gi_tag && (
            <div className="absolute top-2 left-2">
              <span className="gi-badge">✦ {t('giTagged')}</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="px-[0.95rem] pt-[0.85rem] max-sm:px-[0.7rem] max-sm:pt-[0.6rem]">
          <div className="mb-[3px] text-[0.68rem] font-bold uppercase tracking-[0.1em]" style={{ color: cat.color }}>
            {cat.icon} {cat.label}
          </div>
          <div className="mb-[3px] min-h-[2.6em] font-serif text-[1.02rem] leading-[1.3] font-semibold text-navy line-clamp-2 max-sm:text-[0.86rem]">
            {name}
          </div>
          <div className="mb-1.5 min-h-[1.2em] truncate text-[0.74rem] text-text-muted max-sm:text-[0.66rem]">
            {product.artisan ? <>{t('byPrefix')}{product.artisan.name}{t('bySuffix')} · {product.state}</> : ' '}
          </div>
          <div className="mt-1.5 flex items-center justify-between">
            <span className="font-serif text-[1.2rem] font-bold text-saffron max-sm:text-[1rem]">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            <span className={`text-[0.7rem] font-bold max-sm:text-[0.62rem] ${product.stock > 0 ? 'text-forest' : 'text-saffron'}`}>
              {product.stock > 0 ? <>{product.stock}{t('stockLeftSuffix')}</> : t('outOfStock')}
            </span>
          </div>
        </div>
      </Link>

      {/* Add to cart */}
      <div className="mt-auto px-[0.95rem] pt-[0.7rem] pb-[0.85rem] max-sm:px-[0.7rem] max-sm:pt-[0.5rem] max-sm:pb-[0.65rem]">
        <button
          onClick={product.stock > 0 ? addToCart : undefined}
          disabled={product.stock === 0}
          className={`w-full rounded-[3px] border-none py-[9px] font-sans text-[0.8rem] font-bold transition-colors duration-200 max-sm:py-[7px] max-sm:text-[0.72rem] ${buttonClass}`}
        >
          {product.stock === 0 ? t('outOfStock') : added ? `✓ ${t('addedToCart')}` : tc('addToCart')}
        </button>
      </div>
    </div>
  )
}
