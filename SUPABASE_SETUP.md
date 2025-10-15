# 🔧 Supabase Setup Guide

## 📋 Prerequisites
- A Supabase account (sign up at [supabase.com](https://supabase.com))
- Your Piko Café project created in Supabase

## 🚀 Step-by-Step Setup

### 1. Get Your Supabase Credentials

1. **Go to your Supabase Dashboard**: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. **Select your project** (or create a new one)
3. **Go to Settings → API**
4. **Copy the following values**:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **Anon/Public Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **Project ID**: Extract from URL (the part before `.supabase.co`)

### 2. Create Environment Variables

Create a `.env.local` file in your project root:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_SUPABASE_PROJECT_ID=your-project-id
```

**Replace the values with your actual credentials!**

### 3. Create Database Tables

Run this SQL in your Supabase SQL Editor:

```sql
-- Enable Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

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

-- Insert sample data
INSERT INTO categories (names, descriptions, image, "order") VALUES
  ('{"en": "Hot Drinks", "tr": "Sıcak İçecekler", "ar": "المشروبات الساخنة"}', 
   '{"en": "Warm and comforting beverages", "tr": "Sıcak ve rahatlatıcı içecekler", "ar": "مشروبات دافئة ومريحة"}',
   'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=400',
   1),
  ('{"en": "Cold Drinks", "tr": "Soğuk İçecekler", "ar": "المشروبات الباردة"}',
   '{"en": "Refreshing cold beverages", "tr": "Ferahlatıcı soğuk içecekler", "ar": "مشروبات باردة منعشة"}',
   'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400',
   2);

INSERT INTO items (names, descriptions, prices, image, category_id, tags, "order") VALUES
  ('{"en": "Cappuccino", "tr": "Kapuçino", "ar": "كابتشينو"}',
   '{"en": "Rich espresso with steamed milk", "tr": "Zengin espresso buharda süt", "ar": "إسبريسو غني مع الحليب المبخر"}',
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
   1);
```

### 4. Set Up Row Level Security (RLS)

```sql
-- Allow public read access to categories and items
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
```

### 5. Test Your Connection

After setting up, restart your development server:

```bash
npm run dev
```

The app should now connect to your Supabase database and the archive functionality should work!

## 🔍 Troubleshooting

### Common Issues:

1. **"Failed to fetch" errors**: Check your environment variables are correct
2. **Database connection errors**: Verify your Supabase project is active
3. **Permission errors**: Make sure RLS policies are set up correctly
4. **Table not found**: Run the SQL commands to create tables

### Check Connection:

Visit your app and check the browser console. You should see:
```
🔧 Supabase Config: { projectId: "your-project-id", supabaseUrl: "https://...", hasAnonKey: true }
```

## 🎉 Success!

Once configured, your Piko Café app will:
- ✅ Connect to your Supabase database
- ✅ Archive items properly (no more "Failed to fetch")
- ✅ Store all data persistently
- ✅ Work with real-time updates
- ✅ Scale automatically with Supabase

## 📞 Need Help?

If you encounter any issues:
1. Check the browser console for error messages
2. Verify your Supabase project is active
3. Make sure all environment variables are set correctly
4. Test the connection in your Supabase dashboard
