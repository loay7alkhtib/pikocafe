-- Piko Café Database Setup
-- Run this in your Supabase SQL Editor

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  names JSONB NOT NULL DEFAULT '{}',
  descriptions JSONB NOT NULL DEFAULT '{}',
  image TEXT NOT NULL,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  archived_at TIMESTAMP WITH TIME ZONE NULL
);

-- Create items table
CREATE TABLE IF NOT EXISTS items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  names JSONB NOT NULL DEFAULT '{}',
  descriptions JSONB NOT NULL DEFAULT '{}',
  prices JSONB NOT NULL DEFAULT '{}',
  image TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  variants JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  archived_at TIMESTAMP WITH TIME ZONE NULL
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  items JSONB NOT NULL DEFAULT '[]',
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_categories_archived ON categories(archived_at);
CREATE INDEX IF NOT EXISTS idx_items_archived ON items(archived_at);
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Set up Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active categories and items
CREATE POLICY "Allow public read access to categories" ON categories
  FOR SELECT USING (archived_at IS NULL);

CREATE POLICY "Allow public read access to items" ON items
  FOR SELECT USING (archived_at IS NULL);

-- Allow authenticated users to manage data
CREATE POLICY "Allow authenticated users to manage categories" ON categories
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to manage items" ON items
  FOR ALL USING (auth.role() = 'authenticated');

-- Allow public to create orders
CREATE POLICY "Allow public to create orders" ON orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated users to manage orders" ON orders
  FOR ALL USING (auth.role() = 'authenticated');

-- Insert sample data
INSERT INTO categories (names, descriptions, image, "order") VALUES
  ('{"en": "Hot Drinks", "tr": "Sıcak İçecekler", "ar": "المشروبات الساخنة"}', 
   '{"en": "Warm and comforting beverages", "tr": "Sıcak ve rahatlatıcı içecekler", "ar": "مشروبات دافئة ومريحة"}',
   'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=400',
   1),
  ('{"en": "Cold Drinks", "tr": "Soğuk İçecekler", "ar": "المشروبات الباردة"}',
   '{"en": "Refreshing cold beverages", "tr": "Ferahlatıcı soğuk içecekler", "ar": "مشروبات باردة منعشة"}',
   'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400',
   2),
  ('{"en": "Pastries", "tr": "Hamur İşleri", "ar": "المعجنات"}',
   '{"en": "Fresh baked pastries and desserts", "tr": "Taze pişmiş hamur işleri ve tatlılar", "ar": "معجنات وحلويات طازجة"}',
   'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400',
   3);

-- Insert sample items
INSERT INTO items (names, descriptions, prices, image, category_id, tags, "order") VALUES
  ('{"en": "Cappuccino", "tr": "Kapuçino", "ar": "كابتشينو"}',
   '{"en": "Rich espresso with steamed milk and foam", "tr": "Buharda süt ve köpük ile zengin espresso", "ar": "إسبريسو غني مع الحليب المبخر والرغوة"}',
   '{"en": 25, "tr": 25, "ar": 25}',
   'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400',
   (SELECT id FROM categories WHERE names->>'en' = 'Hot Drinks'),
   '{"coffee", "hot", "milk"}',
   1),
  ('{"en": "Iced Coffee", "tr": "Buzlu Kahve", "ar": "قهوة مثلجة"}',
   '{"en": "Cold brewed coffee over ice", "tr": "Soğuk demlenmiş kahve buz üzerinde", "ar": "قهوة مخمرة باردة على الثلج"}',
   '{"en": 20, "tr": 20, "ar": 20}',
   'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400',
   (SELECT id FROM categories WHERE names->>'en' = 'Cold Drinks'),
   '{"coffee", "cold", "ice"}',
   1),
  ('{"en": "Croissant", "tr": "Kruvasan", "ar": "كرواسون"}',
   '{"en": "Buttery, flaky pastry", "tr": "Tereyağlı, katmerli hamur işi", "ar": "معجنات زبدية ومقرمشة"}',
   '{"en": 15, "tr": 15, "ar": 15}',
   'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400',
   (SELECT id FROM categories WHERE names->>'en' = 'Pastries'),
   '{"pastry", "butter", "flaky"}',
   1);

-- Verify the setup
SELECT 'Categories created:' as info, count(*) as count FROM categories;
SELECT 'Items created:' as info, count(*) as count FROM items;
