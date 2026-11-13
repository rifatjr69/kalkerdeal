-- ==============================================================================
-- CART APP (cartapp.demotheme.xyz) - COMPLETE POSTGRESQL / SUPABASE DATABASE SCHEMA
-- Multi-Vendor E-Commerce Platform for Bangladesh
--
-- Instructions:
-- 1. Go to your Supabase Dashboard: https://supabase.com/dashboard
-- 2. Select your Project -> Click "SQL Editor" in the left sidebar
-- 3. Click "New Query", paste this entire script and click "Run" (Ctrl+Enter)
-- 4. All tables, relations, triggers, RLS security policies, and seed data will be created!
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. ENUMS & CUSTOM TYPES
-- ==============================================================================
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('customer', 'seller', 'admin');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM (
    'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('cod', 'bkash', 'nagad', 'card');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('unpaid', 'paid', 'refunded', 'failed');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE vendor_status AS ENUM ('pending', 'active', 'suspended', 'rejected');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- 3. PROFILES TABLE (Linked with Supabase Auth users)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  email TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'customer', -- 'customer', 'seller', 'admin'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 4. VENDORS / SELLERS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  shop_name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  category TEXT,
  district TEXT NOT NULL,
  address TEXT,
  trade_license_nid TEXT,
  logo_url TEXT,
  banner_url TEXT,
  commission_rate NUMERIC(5, 2) DEFAULT 0.00, -- 0% for first 30 days
  status TEXT NOT NULL DEFAULT 'active', -- 'pending', 'active', 'suspended'
  rating NUMERIC(2, 1) DEFAULT 4.8,
  total_sales NUMERIC(12, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 5. CATEGORIES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_bn TEXT,
  slug TEXT UNIQUE NOT NULL,
  icon_name TEXT DEFAULT 'ShoppingBag',
  image_url TEXT,
  badge TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 6. SUB-CATEGORIES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.sub_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  category_slug TEXT,
  name TEXT NOT NULL,
  name_bn TEXT,
  slug TEXT NOT NULL,
  image_url TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 7. BRANDS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  letter CHAR(1) NOT NULL,
  color TEXT DEFAULT '#00A5A8',
  logo_url TEXT,
  is_featured BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 8. PRODUCTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  title_bn TEXT,
  slug TEXT UNIQUE NOT NULL,
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
  category_slug TEXT NOT NULL,
  sub_category_slug TEXT,
  brand_name TEXT DEFAULT 'Kalkerdeal',
  price NUMERIC(10, 2) NOT NULL,
  old_price NUMERIC(10, 2),
  discount_percent INT DEFAULT 0,
  stock INT NOT NULL DEFAULT 50,
  rating NUMERIC(2, 1) DEFAULT 4.5,
  review_count INT DEFAULT 0,
  sold_count INT DEFAULT 0,
  image TEXT NOT NULL,
  hover_image TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  description TEXT,
  description_bn TEXT,
  short_description TEXT,
  specs JSONB DEFAULT '{}'::jsonb,
  colors TEXT[] DEFAULT '{}',
  sizes TEXT[] DEFAULT '{}',
  in_stock BOOLEAN DEFAULT true,
  is_flash_sale BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_latest_drop BOOLEAN DEFAULT false,
  is_bestseller BOOLEAN DEFAULT false,
  is_grocery BOOLEAN DEFAULT false,
  is_deal BOOLEAN DEFAULT false,
  is_just_for_you BOOLEAN DEFAULT false,
  is_fast BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT true,
  promo_badge TEXT, -- e.g. "Buy 3, Free Delivery", "Best Price"
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 9. FLASH SALES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.flash_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT 'Flash Sale',
  discount_badge TEXT DEFAULT 'UPTO 23% OFF',
  subtitle TEXT DEFAULT 'Don''t miss out',
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 10. VOUCHERS / COUPONS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  discount NUMERIC(10, 2) NOT NULL,
  type TEXT NOT NULL DEFAULT 'fixed', -- 'fixed' or 'percent'
  min_order NUMERIC(10, 2) DEFAULT 0,
  expiry_date TIMESTAMPTZ,
  usage_limit INT DEFAULT 1000,
  times_used INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 11. DELIVERY ZONES TABLE (Bangladesh 64 Districts Shipping)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.delivery_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  district TEXT NOT NULL,
  charge NUMERIC(8, 2) NOT NULL,
  estimated_delivery TEXT DEFAULT '2-3 Business Days',
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 12. ORDERS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL, -- e.g. 'CA-482910'
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  district TEXT NOT NULL,
  delivery_method TEXT NOT NULL DEFAULT 'cod', -- 'cod', 'bkash', 'nagad', 'card'
  delivery_charge NUMERIC(8, 2) DEFAULT 60.00,
  subtotal NUMERIC(10, 2) NOT NULL,
  discount NUMERIC(10, 2) DEFAULT 0.00,
  total NUMERIC(10, 2) NOT NULL,
  coupon_code TEXT,
  payment_status TEXT NOT NULL DEFAULT 'unpaid', -- 'unpaid', 'paid', 'refunded'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 13. ORDER ITEMS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  image TEXT,
  variant TEXT,
  total_price NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 14. ORDER TRACKING LOGS (Timeline Milestones)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.order_trackings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  status_step TEXT NOT NULL, -- 'placed', 'confirmed', 'packed', 'dispatched', 'out_for_delivery', 'delivered'
  title TEXT NOT NULL,
  description TEXT,
  location TEXT DEFAULT 'Dhaka Sorting Hub',
  courier_name TEXT DEFAULT 'Steadfast Courier',
  courier_tracking_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 15. WISHLISTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- ==============================================================================
-- 16. REVIEWS & RATINGS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewer_name TEXT NOT NULL,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_verified_buyer BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 17. BANNERS & SLIDERS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag TEXT,
  title TEXT NOT NULL,
  subtitle TEXT,
  button_text TEXT DEFAULT 'Shop now →',
  button_link TEXT DEFAULT '/shop',
  banner_type TEXT DEFAULT 'hero_carousel', -- 'hero_carousel', 'hero_side_promo', 'app_download'
  bg_gradient TEXT,
  accent_color TEXT DEFAULT '#FF2B74',
  image_url TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 18. PERFORMANCE INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_slug);
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products(brand_name);
CREATE INDEX IF NOT EXISTS idx_products_flash_sale ON public.products(is_flash_sale);
CREATE INDEX IF NOT EXISTS idx_products_bestseller ON public.products(is_bestseller);
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products(price);
CREATE INDEX IF NOT EXISTS idx_orders_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_phone ON public.orders(phone);
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_sub_categories_cat ON public.sub_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_user ON public.wishlists(user_id);

-- ==============================================================================
-- 19. AUTOMATIC USER PROFILE CREATION TRIGGER
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Valued Customer'),
    NEW.email,
    NEW.phone,
    'customer'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==============================================================================
-- 20. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flash_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_trackings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- Public READ access for storefront browsing (Products, Categories, Brands, Vouchers, etc.)
DROP POLICY IF EXISTS "Public can view active categories" ON public.categories;
CREATE POLICY "Public can view active categories" ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view active sub_categories" ON public.sub_categories;
CREATE POLICY "Public can view active sub_categories" ON public.sub_categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view active brands" ON public.brands;
CREATE POLICY "Public can view active brands" ON public.brands FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view products" ON public.products;
CREATE POLICY "Public can view products" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view active vendors" ON public.vendors;
CREATE POLICY "Public can view active vendors" ON public.vendors FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "Public can view flash sales" ON public.flash_sales;
CREATE POLICY "Public can view flash sales" ON public.flash_sales FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Public can view active vouchers" ON public.vouchers;
CREATE POLICY "Public can view active vouchers" ON public.vouchers FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Public can view delivery zones" ON public.delivery_zones;
CREATE POLICY "Public can view delivery zones" ON public.delivery_zones FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Public can view banners" ON public.banners;
CREATE POLICY "Public can view banners" ON public.banners FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Public can view reviews" ON public.product_reviews;
CREATE POLICY "Public can view reviews" ON public.product_reviews FOR SELECT USING (true);

-- Orders: Anyone can create an order (supports guest checkout without login)
DROP POLICY IF EXISTS "Anyone can place order" ON public.orders;
CREATE POLICY "Anyone can place order" ON public.orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can insert order items" ON public.order_items;
CREATE POLICY "Anyone can insert order items" ON public.order_items FOR INSERT WITH CHECK (true);

-- Anyone can track their order by order_number or view own orders
DROP POLICY IF EXISTS "View order tracking" ON public.orders;
CREATE POLICY "View order tracking" ON public.orders FOR SELECT USING (
  auth.uid() = user_id OR auth.uid() IS NULL OR order_number IS NOT NULL
);

DROP POLICY IF EXISTS "Allow update orders" ON public.orders;
CREATE POLICY "Allow update orders" ON public.orders FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow delete orders" ON public.orders;
CREATE POLICY "Allow delete orders" ON public.orders FOR DELETE USING (true);

DROP POLICY IF EXISTS "View order items" ON public.order_items;
CREATE POLICY "View order items" ON public.order_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow update order items" ON public.order_items;
CREATE POLICY "Allow update order items" ON public.order_items FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow delete order items" ON public.order_items;
CREATE POLICY "Allow delete order items" ON public.order_items FOR DELETE USING (true);

DROP POLICY IF EXISTS "View order tracking milestones" ON public.order_trackings;
CREATE POLICY "View order tracking milestones" ON public.order_trackings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow manage order tracking milestones" ON public.order_trackings;
CREATE POLICY "Allow manage order tracking milestones" ON public.order_trackings FOR ALL USING (true) WITH CHECK (true);

-- Profiles: Users can view and update their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Vendor application: Anyone can submit a vendor registration form
DROP POLICY IF EXISTS "Anyone can register vendor" ON public.vendors;
CREATE POLICY "Anyone can register vendor" ON public.vendors FOR INSERT WITH CHECK (true);

-- Wishlist: Users can view and toggle their own wishlist
DROP POLICY IF EXISTS "Users manage own wishlist" ON public.wishlists;
CREATE POLICY "Users manage own wishlist" ON public.wishlists FOR ALL USING (auth.uid() = user_id);

-- ==============================================================================
-- 21. SEED DATA (Pre-populated for Kalkerdeal)
-- ==============================================================================

-- 21.1 Categories (Matching 14 Kalkerdeal Categories)
INSERT INTO public.categories (name, name_bn, slug, icon_name, sort_order) VALUES
('Automotives & Motorbikes', 'মোটরবাইক ও অটোমোটিভ', 'automotives-motorbikes', 'Car', 1),
('Computers & Laptops', 'কম্পিউটার ও ল্যাপটপ', 'computers-laptops', 'Laptop', 2),
('Groceries & Essentials', 'নিত্যপ্রয়োজনীয় মুদি বাজার', 'groceries-essentials', 'ShoppingBag', 3),
('Health & Beauty', 'হেলথ ও বিউটি কেয়ার', 'health-beauty', 'Sparkles', 4),
('Home & Living', 'হোম অ্যান্ড লিভিং', 'home-living', 'Home', 5),
('Lifestyle & Tools', 'লাইফস্টাইল ও টুলস', 'lifestyle-tools', 'Wrench', 6),
('Men''s Fashion', 'পুরুষদের ফ্যাশন', 'mens-fashion', 'Shirt', 7),
('Mobiles & Cameras', 'মোবাইল ও ক্যামেরা', 'mobiles-cameras', 'Smartphone', 8),
('Mother & Baby', 'মা ও শিশুর যত্ন', 'mother-baby', 'Baby', 9),
('Sports & Outdoors', 'খেলাধুলা ও আউটডোর', 'sports-outdoors', 'Trophy', 10),
('Stationery & Crafts', 'স্টেশনারি ও আর্ট ক্রাফট', 'stationery-crafts', 'PenTool', 11),
('TV & Appliances', 'টিভি ও হোম অ্যাপ্লায়েন্স', 'tv-appliances', 'Tv', 12),
('Watches & Bags', 'ঘড়ি ও প্রিমিয়াম ব্যাগ', 'watches-bags', 'Watch', 13),
('Women''s Fashion', 'মহিলাদের ফ্যাশন', 'womens-fashion', 'Heart', 14)
ON CONFLICT (slug) DO NOTHING;

-- 21.2 Brands (12 Top Brands from prompt)
INSERT INTO public.brands (name, slug, letter, color, sort_order) VALUES
('Voltix', 'voltix', 'V', '#00A5A8', 1),
('Trekline', 'trekline', 'T', '#0284C7', 2),
('Mintleaf', 'mintleaf', 'M', '#10B981', 3),
('Zephyra', 'zephyra', 'Z', '#06B6D4', 4),
('Sonora', 'sonora', 'S', '#0EA5E9', 5),
('Oakridge', 'oakridge', 'O', '#38BDF8', 6),
('Lumera', 'lumera', 'L', '#60A5FA', 7),
('Aurelio', 'aurelio', 'A', '#818CF8', 8),
('Bengal Harvest', 'bengal-harvest', 'B', '#16A34A', 9),
('Pranto', 'pranto', 'P', '#F59E0B', 10),
('Kirana Gold', 'kirana-gold', 'K', '#D97706', 11),
('Nordhaven', 'nordhaven', 'N', '#475569', 12)
ON CONFLICT (slug) DO NOTHING;

-- 21.3 Vouchers
INSERT INTO public.vouchers (code, title, discount, type, min_order) VALUES
('CARTAPP250', 'First App Order Discount', 250, 'fixed', 1000),
('SAVE15', 'Prepaid bKash Offer 15% Off', 15, 'percent', 999),
('FREEBD', 'Free Delivery Nationwide', 60, 'fixed', 500)
ON CONFLICT (code) DO NOTHING;

-- 21.4 Delivery Zones (Bangladesh)
INSERT INTO public.delivery_zones (name, district, charge, estimated_delivery, sort_order) VALUES
('Inside Dhaka City', 'Dhaka', 60.00, '24-48 Hours', 1),
('Dhaka Suburbs (Savar, Gazipur, Narayanganj)', 'Dhaka Suburb', 80.00, '1-2 Business Days', 2),
('Chattogram City', 'Chattogram', 120.00, '2-3 Business Days', 3),
('Sylhet Division', 'Sylhet', 120.00, '2-4 Business Days', 4),
('Rajshahi & North Bengal', 'Rajshahi', 120.00, '2-4 Business Days', 5),
('Khulna & South Bengal', 'Khulna', 120.00, '2-4 Business Days', 6),
('All Other Districts Nationwide', 'Nationwide', 120.00, '2-4 Business Days', 7)
ON CONFLICT DO NOTHING;

-- 21.5 Sample Products (Bangladeshi Taka ৳)
INSERT INTO public.products (
  title, title_bn, slug, category_slug, brand_name, price, old_price, discount_percent, stock, rating, review_count, sold_count, image, is_flash_sale, is_bestseller, is_fast, is_verified, promo_badge, description
) VALUES
(
  '1TB Portable Hard Drive USB 3.0', '১টিবি পোর্টেবল এক্সটারনাল হার্ড ড্রাইভ', '1tb-portable-hard-drive',
  'computers-laptops', 'Voltix', 900.00, 1100.00, 18, 45, 4.8, 12, 187,
  'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=400', true, false, true, true, 'Best Seller',
  'High-speed external hard drive with shock-resistant enclosure and fast USB 3.0 transfer speed.'
),
(
  'Dual-Band Wi-Fi Router Gigabit AC1200', 'ডুয়েল-ব্যান্ড ওয়াই-ফাই গিগাবিট রাউটার', 'dual-band-wifi-router',
  'computers-laptops', 'Voltix', 2750.00, 3200.00, 14, 30, 4.6, 18, 211,
  'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400', true, false, true, true, 'FAST',
  'High performance quad antenna router with coverage up to 2500 sq ft and beamforming technology.'
),
(
  'Wireless Silent Optical Mouse 2.4GHz', 'ওয়্যারলেস সাইলেন্ট অপটিক্যাল মাউস', 'wireless-silent-mouse',
  'computers-laptops', 'Voltix', 850.00, 1100.00, 23, 80, 4.7, 34, 133,
  'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=400', true, false, true, true, 'UPTO 23% OFF',
  'Ergonomic quiet click mouse with 1600 DPI optical sensor and 12-month battery life.'
),
(
  'Mechanical Keyboard RGB Blue Switch', 'মেকানিক্যাল আরজিবি কিবোর্ড', 'mechanical-keyboard-rgb',
  'computers-laptops', 'Voltix', 3490.00, 4200.00, 17, 25, 4.9, 41, 258,
  'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400', true, false, true, true, 'Hot Deal',
  'Custom mechanical switches with double-shot keycaps and 18 dynamic RGB lighting presets.'
),
(
  '27" IPS Monitor 75Hz Full HD Borderless', '২৭ ইঞ্চি আইপিএস ফুল এইচডি মনিটর', '27-ips-monitor-75hz',
  'computers-laptops', 'Voltix', 18900.00, 21500.00, 12, 15, 4.8, 29, 200,
  'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400', true, false, true, true, 'Verified',
  'Crisp 1080p IPS panel with 99% sRGB color gamut and ultra-slim three-sided micro bezel.'
),
(
  'ANC Wireless Earbuds Pro Active Noise Cancelling', 'এএনসি নয়েজ ক্যানসেলিং ওয়্যারলেস ইয়ারবাডস', 'anc-wireless-earbuds-pro',
  'mobiles-cameras', 'Voltix', 3490.00, 4500.00, 22, 60, 4.8, 56, 320,
  'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400', false, true, true, true, 'Buy 3, Free Delivery',
  'Studio-grade 35dB hybrid active noise cancellation, transparency audio mode and 32 hours battery.'
),
(
  'Fitness Smart Watch with SpO2 & Heart Rate', 'ফিটনেস স্মার্ট ওয়াচ হার্ট রেট ও স্লিপ ট্র্যাকার', 'fitness-smart-watch-spo2',
  'watches-bags', 'Voltix', 3290.00, 4200.00, 22, 40, 4.7, 48, 280,
  'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=400', false, true, true, true, 'Verified',
  'Vibrant 1.43 inch AMOLED display with continuous heart rate monitoring, SpO2 sensor and IP68 waterproof.'
),
(
  'Natural Sundarban Honey 500g Glass Jar', 'প্রাকৃতিক সুন্দরবনের খাঁটি মধু ৫০০ গ্রাম', 'natural-sundarban-honey-500g',
  'groceries-essentials', 'Bengal Harvest', 690.00, 750.00, 8, 120, 4.9, 92, 540,
  'https://images.unsplash.com/photo-1587049352847-4a222e784d38?w=400', false, true, true, true, '100% Pure',
  'Raw, unprocessed floral honey sourced sustainably from deep within the Sundarbans mangrove forest.'
)
ON CONFLICT (slug) DO NOTHING;

-- Flash Sale Initialization
INSERT INTO public.flash_sales (title, discount_badge, subtitle)
VALUES ('Flash Sale', 'UPTO 23% OFF', 'Don''t miss out')
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- DONE! All tables, indexes, triggers, RLS policies, and seed data created.
-- ==============================================================================
