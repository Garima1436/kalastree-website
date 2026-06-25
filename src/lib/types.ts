export type Category = 'textile' | 'handicraft' | 'agricultural' | 'food'

export interface Artisan {
  id: string
  name: string
  slug: string
  photo_url: string | null
  state: string
  craft: string
  gi_product: string | null
  story: string | null
  bio: string | null
  is_verified: boolean
  created_at: string
}

export interface Product {
  id: string
  artisan_id: string
  name: string
  slug: string
  description: string | null
  price: number
  images: string[]
  gi_tag: string | null
  category: Category
  state: string | null
  stock: number
  is_featured: boolean
  created_at: string
  artisan?: Artisan
}

export interface Inquiry {
  id: string
  type: 'contact' | 'artisan_join'
  name: string
  email: string
  phone: string | null
  state: string | null
  craft: string | null
  message: string | null
  created_at: string
}

export type Database = {
  public: {
    Tables: {
      artisans: {
        Row: Artisan
        Insert: Omit<Artisan, 'id' | 'created_at'>
        Update: Partial<Omit<Artisan, 'id' | 'created_at'>>
      }
      products: {
        Row: Product
        Insert: Omit<Product, 'id' | 'created_at' | 'artisan'>
        Update: Partial<Omit<Product, 'id' | 'created_at' | 'artisan'>>
      }
      inquiries: {
        Row: Inquiry
        Insert: Omit<Inquiry, 'id' | 'created_at'>
        Update: Partial<Omit<Inquiry, 'id' | 'created_at'>>
      }
    }
  }
}

export const CATEGORY_META: Record<Category, { label: string; icon: string; color: string; bg: string }> = {
  textile:    { label: 'Textiles & Silk',  icon: '🧵', color: '#1B2E4A', bg: '#E8ECF2' },
  handicraft: { label: 'Handicrafts',      icon: '🏺', color: '#C94B1A', bg: '#F5E8E0' },
  agricultural:{ label: 'Agricultural',    icon: '🌾', color: '#3B5A2F', bg: '#E8F0E4' },
  food:       { label: 'Food & Natural',   icon: '🍵', color: '#7A3B52', bg: '#F5EBF0' },
}

export const STATE_EMOJI: Record<string, string> = {
  'Bihar': '🎨', 'Jammu & Kashmir': '🧣', 'West Bengal': '🍵',
  'Uttar Pradesh': '🥻', 'Rajasthan': '🏺', 'Tamil Nadu': '🥻',
  'Assam': '✨', 'Punjab': '🧵', 'Odisha': '🎭', 'Gujarat': '🪢',
  'Maharashtra': '🥭', 'Kerala': '🥥', 'Karnataka': '☕',
}
