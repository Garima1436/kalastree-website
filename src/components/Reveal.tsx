'use client'
import { useEffect, useRef, useState } from 'react'

interface Props {
  children: React.ReactNode
  // Stagger multiple Reveal-wrapped siblings by giving each an increasing delay (ms).
  delay?: number
  // 'up' (default) slides in from below; 'none' is a plain fade, useful for
  // wide elements where a vertical slide would look like layout jank.
  direction?: 'up' | 'none'
  style?: React.CSSProperties
  className?: string
}

// Fades/slides an element in once when it scrolls into view. Uses
// IntersectionObserver (no animation library needed) and respects
// prefers-reduced-motion by skipping straight to the visible state.
export default function Reveal({ children, delay = 0, direction = 'up', style, className }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : direction === 'up' ? 'translateY(24px)' : 'none',
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
        ...style,
      }}
    >
      {children}
    </div>
  )
}
