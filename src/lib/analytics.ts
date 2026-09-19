// Thin wrapper over Google Analytics (gtag is loaded in app/layout.tsx). Uses GA4's
// recommended event names where one exists (view_item, add_to_cart, begin_checkout,
// sign_up, login, search) so they light up GA's built-in e-commerce reports.
// Never pass personal data (email, phone, name) as a parameter. Safe to call anywhere
// on the client: does nothing on the server, or if GA is blocked or hasn't loaded.

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

export function trackEvent(name: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  try {
    // 'beacon' lets the event survive a page navigation right after it (e.g. login redirect).
    window.gtag?.('event', name, { transport_type: 'beacon', ...params })
  } catch {
    // Analytics must never break the page.
  }
}

interface ItemLike { id: string; name: string; price: number; category?: string }

// GA4 e-commerce item shape.
export function gaItem(p: ItemLike, quantity = 1) {
  return { item_id: p.id, item_name: p.name, price: p.price, quantity, ...(p.category ? { item_category: p.category } : {}) }
}
