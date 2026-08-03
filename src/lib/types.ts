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
  is_featured: boolean
  user_id: string | null
  created_at: string
}

export interface Product {
  id: string
  artisan_id: string
  name: string
  name_hi: string | null
  slug: string
  description: string | null
  description_hi: string | null
  price: number
  images: string[]
  gi_tag: string | null
  category: Category
  subcategory: string | null
  state: string | null
  stock: number
  is_featured: boolean
  cod_available: boolean
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

export interface Review {
  id: string
  product_id: string
  user_id: string | null
  reviewer_name: string
  email: string | null
  rating: number
  title: string | null
  body: string | null
  media_url: string | null
  youtube_url: string | null
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
      reviews: {
        Row: Review
        Insert: Omit<Review, 'id' | 'created_at'>
        Update: Partial<Omit<Review, 'id' | 'created_at'>>
      }
    }
  }
}

export const CATEGORY_META: Record<Category, { label: string; icon: string; color: string; bg: string }> = {
  textile:    { label: 'Textiles & Silk',  icon: '🧵', color: '#1B2E4A', bg: '#E0EAFF' },
  handicraft: { label: 'Handicrafts',      icon: '🏺', color: '#E8380A', bg: '#FFE8DC' },
  agricultural:{ label: 'Agricultural',    icon: '🌾', color: '#1A7A32', bg: '#C8F5D8' },
  food:       { label: 'Food & Natural',   icon: '🍵', color: '#C21859', bg: '#FFD6E8' },
}

export interface SubcategoryMeta { value: string; label: string }

export const SUBCATEGORY_META: Record<Category, SubcategoryMeta[]> = {
  textile: [
    { value: 'silk-sarees', label: 'Silk Sarees' },
    { value: 'cotton-handloom', label: 'Cotton Handloom' },
    { value: 'ikat', label: 'Ikat Weaves' },
    { value: 'shawls-stoles', label: 'Shawls & Stoles' },
    { value: 'block-print', label: 'Hand Block Print' },
    { value: 'embroidery', label: 'Embroidery' },
    { value: 'ethnic-wear', label: 'Ethnic Wear' },
  ],
  handicraft: [
    { value: 'wooden-craft', label: 'Wooden Craft' },
    { value: 'metal-craft', label: 'Metal Craft' },
    { value: 'stone-craft', label: 'Stone Craft' },
    { value: 'paintings', label: 'Paintings' },
    { value: 'pottery-terracotta', label: 'Pottery & Terracotta' },
    { value: 'paper-fibre-craft', label: 'Paper & Fibre Craft' },
    { value: 'leather-craft', label: 'Leather Craft' },
    { value: 'jewellery', label: 'Jewellery' },
  ],
  agricultural: [
    { value: 'rice', label: 'GI Rice' },
    { value: 'fruits', label: 'Fruits' },
    { value: 'spices', label: 'Spices' },
    { value: 'pulses-grains', label: 'Pulses & Grains' },
    { value: 'jaggery-sweeteners', label: 'Jaggery & Natural Sweeteners' },
    { value: 'dry-fruits-nuts', label: 'Dry Fruits & Nuts' },
  ],
  food: [
    { value: 'tea', label: 'Tea' },
    { value: 'coffee', label: 'Coffee' },
    { value: 'honey-preserves', label: 'Honey & Preserves' },
    { value: 'oils-perfumes', label: 'Natural Oils & Perfumes' },
    { value: 'incense', label: 'Incense' },
    { value: 'ayurvedic-wellness', label: 'Ayurvedic & Wellness' },
  ],
}

export const STATE_EMOJI: Record<string, string> = {
  'Bihar': '🎨', 'Jammu & Kashmir': '🧣', 'West Bengal': '🍵',
  'Uttar Pradesh': '🥻', 'Rajasthan': '🏺', 'Tamil Nadu': '🥻',
  'Assam': '✨', 'Punjab': '🧵', 'Odisha': '🎭', 'Gujarat': '🪢',
  'Maharashtra': '🥭', 'Kerala': '🥥', 'Karnataka': '☕',
}
