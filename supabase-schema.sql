-- ============================================================
-- KalaStree Database Schema
-- Run this in Supabase → SQL Editor
-- ============================================================

-- ARTISANS
CREATE TABLE artisans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  photo_url TEXT,
  state TEXT NOT NULL,
  craft TEXT NOT NULL,
  gi_product TEXT,
  story TEXT,
  bio TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- PRODUCTS
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  artisan_id UUID REFERENCES artisans(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  images TEXT[] DEFAULT '{}',
  gi_tag TEXT,
  category TEXT CHECK (category IN ('textile','handicraft','agricultural','food')) NOT NULL,
  state TEXT,
  stock INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- INQUIRIES (contact + artisan join forms)
CREATE TABLE inquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT CHECK (type IN ('contact','artisan_join')) NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  state TEXT,
  craft TEXT,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE artisans ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- Public read access for artisans and products
CREATE POLICY "Public read artisans" ON artisans FOR SELECT USING (true);
CREATE POLICY "Public read products" ON products FOR SELECT USING (true);

-- Allow anyone to submit inquiries (join/contact forms)
CREATE POLICY "Anyone can insert inquiry" ON inquiries FOR INSERT WITH CHECK (true);

-- ============================================================
-- SEED DATA — Sample artisans and products
-- ============================================================

INSERT INTO artisans (name, slug, state, craft, gi_product, story, bio, is_verified) VALUES
(
  'Meena Devi',
  'meena-devi',
  'Bihar',
  'Madhubani Painting',
  'Madhubani Art (GI Tag 2007)',
  'I have been painting Madhubani art since I was 12 years old, taught by my mother who learned from her mother. Every painting tells a story of our village, our festivals, and our gods.',
  'Meena Devi is a third-generation Madhubani artist from Mithila, Bihar. She works with natural colors and hand-made paper, preserving a tradition that is over 2,500 years old.',
  true
),
(
  'Fatima Begum',
  'fatima-begum',
  'Jammu & Kashmir',
  'Pashmina Weaving',
  'Kashmir Pashmina (GI Tag 2008)',
  'My husband''s family has been weaving Pashmina for four generations. When he passed, I took over the loom. Now I weave for my children''s future.',
  'Fatima Begum is a master Pashmina weaver from Srinagar. Each of her shawls takes 3-6 months to complete and carries the authentic GI certification.',
  true
),
(
  'Rajni Kumari',
  'rajni-kumari',
  'Punjab',
  'Phulkari Embroidery',
  'Phulkari (GI Tag 2011)',
  'Phulkari means "flower work". We stitch flowers into cloth the way our grandmothers did — with silk thread on coarse cotton, one tiny stitch at a time.',
  'Rajni Kumari leads a 6-woman self-help group in Patiala, Punjab. They create authentic Phulkari embroidery and recently started selling online through KalaStree.',
  true
),
(
  'Lakshmi Amma',
  'lakshmi-amma',
  'Tamil Nadu',
  'Kanchipuram Silk Weaving',
  'Kanchipuram Silk Saree (GI Tag 2005)',
  'A Kanchipuram saree is not just cloth — it is a temple in threads. The zari we use is real gold and silver. Every saree takes 15 days minimum.',
  'Lakshmi Amma has been weaving Kanchipuram silk for 25 years in the temple town of Kanchipuram. Her sarees are known for their distinctive borders and heavy zari work.',
  true
);

INSERT INTO products (artisan_id, name, slug, description, price, gi_tag, category, state, stock, is_featured, images) VALUES
(
  (SELECT id FROM artisans WHERE slug = 'meena-devi'),
  'Madhubani Fish Painting — Matsya Motif',
  'madhubani-fish-painting-matsya',
  'Hand-painted on handmade paper using natural colors. The fish (Matsya) is a sacred symbol in Madhubani art representing fertility and prosperity. Measures 12x16 inches. Each painting is unique.',
  2500,
  'Madhubani Art — Bihar GI Tag 2007',
  'handicraft',
  'Bihar',
  5,
  true,
  '{}'
),
(
  (SELECT id FROM artisans WHERE slug = 'meena-devi'),
  'Madhubani Peacock & Lotus — Wedding Series',
  'madhubani-peacock-lotus-wedding',
  'Large format Madhubani painting featuring the iconic peacock and lotus motif, traditionally gifted at weddings. 18x24 inches on handmade paper. Natural vegetable dyes.',
  4500,
  'Madhubani Art — Bihar GI Tag 2007',
  'handicraft',
  'Bihar',
  3,
  true,
  '{}'
),
(
  (SELECT id FROM artisans WHERE slug = 'fatima-begum'),
  'Pure Pashmina Shawl — Natural Ivory',
  'pure-pashmina-shawl-ivory',
  'Handwoven from 100% Grade-A Pashmina wool sourced from Changthangi goats of Ladakh. Natural ivory color, no dyes. 80x200 cm. Comes with GI authenticity certificate.',
  18500,
  'Kashmir Pashmina — GI Tag 2008',
  'textile',
  'Jammu & Kashmir',
  2,
  true,
  '{}'
),
(
  (SELECT id FROM artisans WHERE slug = 'fatima-begum'),
  'Sozni Embroidered Pashmina — Garden of Paradise',
  'sozni-pashmina-garden-paradise',
  'Pashmina shawl with fine Sozni needle embroidery depicting the Mughal Garden of Paradise motif. Took 4 months to complete. 70x200 cm.',
  35000,
  'Kashmir Pashmina — GI Tag 2008',
  'textile',
  'Jammu & Kashmir',
  1,
  true,
  '{}'
),
(
  (SELECT id FROM artisans WHERE slug = 'rajni-kumari'),
  'Phulkari Dupatta — Bagh Pattern',
  'phulkari-dupatta-bagh',
  'Traditional Bagh Phulkari where the embroidery covers the entire base cloth. Silk thread on khaddar cotton. Vivid multicolor geometric patterns. 90x250 cm.',
  3200,
  'Phulkari — Punjab GI Tag 2011',
  'textile',
  'Punjab',
  8,
  true,
  '{}'
),
(
  (SELECT id FROM artisans WHERE slug = 'lakshmi-amma'),
  'Kanchipuram Silk Saree — Temple Border',
  'kanchipuram-silk-temple-border',
  'Pure Kanchipuram silk with traditional temple border in real zari (gold thread). Deep maroon body with gold and green border. 6.5 meters including blouse piece.',
  22000,
  'Kanchipuram Silk — Tamil Nadu GI Tag 2005',
  'textile',
  'Tamil Nadu',
  4,
  true,
  '{}'
);
