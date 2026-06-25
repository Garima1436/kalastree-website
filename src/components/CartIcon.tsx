'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function CartIcon() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const update = () => {
      try {
        const cart = JSON.parse(localStorage.getItem('kalastree_cart') || '[]')
        setCount(cart.reduce((s: number, i: { qty: number }) => s + i.qty, 0))
      } catch { setCount(0) }
    }
    update()
    window.addEventListener('storage', update)
    window.addEventListener('cart_updated', update)
    return () => {
      window.removeEventListener('storage', update)
      window.removeEventListener('cart_updated', update)
    }
  }, [])

  return (
    <Link href="/cart" style={{ position: 'relative', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
      <span style={{ fontSize: '1.4rem' }}>🛒</span>
      {count > 0 && (
        <span style={{
          position: 'absolute', top: -8, right: -8,
          background: '#C94B1A', color: '#fff',
          fontSize: '0.65rem', fontWeight: 700,
          width: 18, height: 18, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {count}
        </span>
      )}
    </Link>
  )
}
