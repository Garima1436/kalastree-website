'use client'
import { useRef } from 'react'
import type { Product } from '@/lib/types'
import ProductCard from './ProductCard'

export default function ProductCarousel({ products }: { products: Product[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return
    scrollRef.current.scrollBy({ left: dir === 'right' ? 280 : -280, behavior: 'smooth' })
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Left arrow */}
      <button onClick={() => scroll('left')} aria-label="Scroll left"
        style={{ position: 'absolute', left: -18, top: '50%', transform: 'translateY(-50%)', zIndex: 2, width: 36, height: 36, borderRadius: '50%', border: '1.5px solid #D9C9A8', background: '#FFFEF9', cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', color: '#5C5542', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        ‹
      </button>

      {/* Scrollable track */}
      <div ref={scrollRef} className="product-carousel" style={{ display: 'flex', gap: '1.25rem', overflowX: 'auto', scrollSnapType: 'x mandatory', paddingBottom: 8, scrollbarWidth: 'none' }}>
        <style>{`.product-carousel::-webkit-scrollbar { display: none; }`}</style>
        {products.map(p => (
          <div key={p.id} style={{ minWidth: 240, maxWidth: 260, flexShrink: 0, scrollSnapAlign: 'start' }}>
            <ProductCard product={p} />
          </div>
        ))}
      </div>

      {/* Right arrow */}
      <button onClick={() => scroll('right')} aria-label="Scroll right"
        style={{ position: 'absolute', right: -18, top: '50%', transform: 'translateY(-50%)', zIndex: 2, width: 36, height: 36, borderRadius: '50%', border: '1.5px solid #D9C9A8', background: '#FFFEF9', cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', color: '#5C5542', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        ›
      </button>
    </div>
  )
}
