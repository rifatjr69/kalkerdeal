import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  LayoutDashboard, ShoppingCart, Package, Users, FileText, Settings as SettingsIcon,
  Menu, X, Plus, Trash2, Pencil, ArrowLeft, Download, DollarSign, Eye, EyeOff, Bell, Save, Store,
  Image as ImageIcon, UploadCloud, Database, Copy, Check, ArrowUp, ArrowDown, ExternalLink,
  Loader2, Sparkles, Clock, FolderTree, Tag, Watch, Smartphone, Headphones, Speaker,
  Tv, Laptop, Gamepad2, Battery, Camera, Shirt, Gift, Zap, Shield, Flame, Radio,
  Disc, Music, Layers, Target, Truck, Info, ShieldAlert, LogOut, MapPin
} from 'lucide-react';
import {
  Product,
  Category,
  SubCategory,
  Banner,
  FlashSale,
  DeliveryZone,
  enrichProducts
} from '../types';
import { supabase } from '../lib/supabase';
import { TrackingTab } from './TrackingTab';
import { compressImage, blobToBase64 } from '../lib/image';
import { syncMockDataToSupabase } from '../lib/syncSupabase';
import { AdminShell, StatCard } from './AdminShell';

/* ------------------------------------------------------------------ */
/* Props                                                               */
/* ------------------------------------------------------------------ */
interface AdminDashboardProps {
  isOpen?: boolean;
  onClose: () => void;
  onLogout?: () => void;
  products: Product[];
  categories: Category[];
  banners?: Banner[];
  flashSales?: FlashSale[];
  deliveryZones?: DeliveryZone[];
  subCategories?: SubCategory[];
  onRefreshProducts: () => void;
  onRefreshCategories?: () => void;
  onRefreshBanners?: () => void;
  onRefreshFlashSales?: () => void;
  onRefreshDeliveryZones?: () => void;
  onRefreshSubCategories?: () => void;
}

/* ------------------------------ Types ------------------------------ */
interface OrderLite {
  id?: string; order_number?: string; customer_name?: string; phone?: string;
  address?: string; delivery_zone?: string; delivery_charge?: number; payment_method?: string;
  total?: number; status?: string; created_at?: string; items?: any; order_items?: any;
}
interface EventRow { event_type: string; session_id: string | null; country: string | null; source: string | null; created_at: string; }
interface ProductLite {
  id: string; name: string; name_bn?: string; description?: string; description_bn?: string;
  price: number; old_price?: number; discount_percent?: number; image_url?: string; images?: string[]; category_id?: string | null;
  subcategory_id?: string | null;
  stock?: number; is_flash_sale?: boolean;
}
interface CategoryLite { id: string; name?: string; name_bn?: string; }

export type Page =
  | 'dashboard' | 'orders' | 'products' | 'categories' | 'banners' | 'flashSales'
  | 'customers' | 'reports' | 'tracking' | 'trackingPixels' | 'courier' | 'deliveryZones' | 'settings';

export const CATEGORY_ICONS_LIST = [
  { name: 'Watch', label: 'স্মার্টওয়াচ', icon: Watch },
  { name: 'Smartphone', label: 'মোবাইল', icon: Smartphone },
  { name: 'Headphones', label: 'হেডফোন / বাড', icon: Headphones },
  { name: 'Speaker', label: 'স্পিকার', icon: Speaker },
  { name: 'Battery', label: 'পাওয়ার ব্যাংক', icon: Battery },
  { name: 'Zap', label: 'চার্জার / ক্যাবল', icon: Zap },
  { name: 'Laptop', label: 'ল্যাপটপ / পিসি', icon: Laptop },
  { name: 'Tv', label: 'টিভি / ডিসপ্লে', icon: Tv },
  { name: 'Gamepad2', label: 'গেমিং গ্যাজেট', icon: Gamepad2 },
  { name: 'Camera', label: 'ক্যামেরা', icon: Camera },
  { name: 'Shirt', label: 'লাইফস্টাইল', icon: Shirt },
  { name: 'Gift', label: 'গিফট সামগ্রী', icon: Gift },
  { name: 'Tag', label: 'ডিসকাউন্ট / অফার', icon: Tag },
  { name: 'Shield', label: 'সুরক্ষা / কেস', icon: Shield },
  { name: 'Sparkles', label: 'এক্সক্লুসিভ', icon: Sparkles },
  { name: 'Flame', label: 'হট ডিল', icon: Flame },
  { name: 'Radio', label: 'রেডিও / অডিও', icon: Radio },
  { name: 'Disc', label: 'স্টোরেজ / ড্রাইভ', icon: Disc },
  { name: 'Music', label: 'মিউজিক আইটেম', icon: Music },
  { name: 'Layers', label: 'অন্যান্য কালেকশন', icon: Layers }
];

export const getCategoryIconComponent = (iconName?: string) => {
  const match = CATEGORY_ICONS_LIST.find(
    (i) => i.name.toLowerCase() === (iconName || '').toLowerCase()
  );
  return match ? match.icon : Tag;
};

/* ------------------------------ Helpers ---------------------------- */
const isValidUuid = (val: any): boolean =>
  typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());
const DAY = 864e5;

const money = (n: number) => '৳' + Math.round(n || 0).toLocaleString('en-US');
const compact = (n: number) =>
  n >= 1e6 ? (n / 1e6).toFixed(1).replace('.0', '') + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1).replace('.0', '') + 'K' : String(Math.round(n));
const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const pctChange = (cur: number, prev: number) => (prev === 0 ? (cur > 0 ? 100 : 0) : ((cur - prev) / prev) * 100);
const ts = (o: { created_at?: string }) => new Date(o.created_at || 0).getTime();
const niceMax = (v: number) => {
  if (v <= 0) return 4;
  const p = 10 ** Math.floor(Math.log10(v));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 4 ? 4 : n <= 5 ? 5 : 10) * p;
};
const getItems = (o: OrderLite): any[] => {
  let it = o.items ?? o.order_items;
  if (typeof it === 'string') { try { it = JSON.parse(it); } catch { it = []; } }
  return Array.isArray(it) ? it : [];
};

const getItemImage = (it: any, catalog: Product[] = []): string => {
  if (it.image && typeof it.image === 'string' && it.image.trim()) return it.image;
  if (it.image_url && typeof it.image_url === 'string' && it.image_url.trim()) return it.image_url;
  if (it.product_image && typeof it.product_image === 'string' && it.product_image.trim()) return it.product_image;

  const itName = (it.name || it.title || it.product_name || '').toLowerCase().trim();
  const itId = it.product_id || it.productId || it.id;
  const found = catalog.find((p) =>
    (itId && p.id === itId) ||
    (itName && p.name && p.name.toLowerCase().trim() === itName) ||
    (itName && p.name_bn && p.name_bn.toLowerCase().trim() === itName) ||
    (itName && p.name && (p.name.toLowerCase().includes(itName) || itName.includes(p.name.toLowerCase())))
  );
  if (found) {
    return found.image_url || (found.images && found.images[0]) || '';
  }
  return '';
};

// localStorage helper (try/catch সহ)
const loadLS = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};
const saveLS = (key: string, value: unknown): boolean => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
};

// Supabase একবারে সর্বোচ্চ 1000 row দেয়, তাই পেজ করে সব আনা হচ্ছে
async function fetchAll<T>(
  build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: any }>,
  pageSize = 1000, maxPages = 10
): Promise<{ rows: T[]; error: any }> {
  const rows: T[] = [];
  for (let p = 0; p < maxPages; p++) {
    const { data, error } = await build(p * pageSize, p * pageSize + pageSize - 1);
    if (error) return { rows, error };
    rows.push(...(data || []));
    if (!data || data.length < pageSize) break;
  }
  return { rows, error: null };
}

function smoothPath(pts: [number, number][], top: number, bottom: number) {
  if (pts.length < 2) return '';
  const cl = (y: number) => Math.min(bottom, Math.max(top, y));
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    d += ` C${p1[0] + (p2[0] - p0[0]) / 6},${cl(p1[1] + (p2[1] - p0[1]) / 6)} ${p2[0] - (p3[0] - p1[0]) / 6},${cl(p2[1] - (p3[1] - p1[1]) / 6)} ${p2[0]},${p2[1]}`;
  }
  return d;
}

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-50 text-blue-700',
  shipped: 'bg-violet-100 text-violet-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-rose-100 text-rose-700',
};
const STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
const SOURCE_LABEL: Record<string, string> = { direct: 'Direct Traffic', organic: 'Organic Search', social: 'Social Media', referral: 'Referral Traffic', email: 'Email Campaigns' };
const SHADES = ['#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd'];
const inputCls = 'w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white';

/* ------------------------- Supabase SQL (এক জায়গায়) ------------------------- */
const SETUP_SQL = `-- ==============================================================================
-- INNEXBUY / MUBA GADGETS: COMPLETE ALL-IN-ONE SUPABASE DATABASE SETUP SCRIPT
-- Run this ONCE in your Supabase SQL Editor (https://supabase.com/dashboard)
-- This script is completely IDEMPOTENT (safe to run multiple times without errors).
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('user', 'admin');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 3. PROFILES TABLE (Linked with Supabase Auth users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3.1 ADDRESSES TABLE
CREATE TABLE IF NOT EXISTS public.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address_line TEXT NOT NULL,
  city TEXT,
  district TEXT,
  postal_code TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_en TEXT,
  name_bn TEXT,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT DEFAULT 'Tag',
  image_url TEXT,
  sub_label TEXT,
  sort_order INT DEFAULT 0,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS name_en TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS name_bn TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'Tag';
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS sub_label TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 0;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 4.1 SUBCATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_bn TEXT,
  slug TEXT,
  image_url TEXT,
  display_order INT DEFAULT 0,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.subcategories ADD COLUMN IF NOT EXISTS name_bn TEXT;
ALTER TABLE public.subcategories ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.subcategories ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.subcategories ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 0;
ALTER TABLE public.subcategories ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;
ALTER TABLE public.subcategories ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 5. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  subcategory_id UUID REFERENCES public.subcategories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  name_bn TEXT,
  slug TEXT UNIQUE,
  description TEXT,
  description_bn TEXT,
  short_description TEXT,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  old_price NUMERIC(10, 2),
  discount_percent INT DEFAULT 0,
  badge TEXT,
  rating NUMERIC(2, 1) DEFAULT 4.8,
  review_count INT DEFAULT 50,
  stock INT DEFAULT 100,
  image_url TEXT,
  images TEXT[] DEFAULT '{}',
  is_featured BOOLEAN DEFAULT false,
  is_flash_sale BOOLEAN DEFAULT false,
  enable_size BOOLEAN DEFAULT false,
  enable_color BOOLEAN DEFAULT false,
  sizes TEXT[] DEFAULT '{}',
  colors TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS subcategory_id UUID REFERENCES public.subcategories(id) ON DELETE SET NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS name_bn TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description_bn TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS short_description TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS badge TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS old_price NUMERIC(10, 2);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS discount_percent INT DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_flash_sale BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS enable_size BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS enable_color BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sizes TEXT[] DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS colors TEXT[] DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 6. PRODUCT VARIANTS TABLE
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  value TEXT NOT NULL,
  price NUMERIC(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. FLASH SALES TABLE
CREATE TABLE IF NOT EXISTS public.flash_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sale_price NUMERIC(10, 2) NOT NULL,
  sale_stock INT NOT NULL DEFAULT 0,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. HERO BANNERS TABLE
CREATE TABLE IF NOT EXISTS public.banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  link_url TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS link_url TEXT;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.banners ALTER COLUMN title DROP NOT NULL;

-- 9. DELIVERY ZONES TABLE
CREATE TABLE IF NOT EXISTS public.delivery_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_bn TEXT NOT NULL,
  charge NUMERIC(10, 2) NOT NULL,
  estimated_days TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.delivery_zones ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.delivery_zones ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;
ALTER TABLE public.delivery_zones ADD COLUMN IF NOT EXISTS district TEXT;

-- 10. COUPONS TABLE
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL DEFAULT 'percent',
  value NUMERIC(10, 2) NOT NULL,
  min_order NUMERIC(10, 2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. ORDERS & ORDER ITEMS TABLES
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1001;

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  delivery_zone TEXT NOT NULL,
  delivery_charge NUMERIC(10, 2) NOT NULL DEFAULT 60,
  subtotal NUMERIC(10, 2) NOT NULL,
  discount NUMERIC(10, 2) DEFAULT 0,
  total NUMERIC(10, 2) NOT NULL,
  coupon_code TEXT,
  payment_method TEXT DEFAULT 'COD',
  status TEXT DEFAULT 'pending',
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  variant TEXT,
  quantity INT NOT NULL,
  unit_price NUMERIC(10, 2) NOT NULL,
  total NUMERIC(10, 2) NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. STORE SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.store_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. TRACKING SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.tracking_settings (
  id INT PRIMARY KEY DEFAULT 1,
  fb_pixel_id TEXT,
  fb_pixel_code TEXT,
  fb_access_token TEXT,
  fb_enabled BOOLEAN DEFAULT false,
  gtm_id TEXT,
  gtm_head_code TEXT,
  gtm_body_code TEXT,
  gtm_enabled BOOLEAN DEFAULT false,
  tiktok_pixel_id TEXT,
  tiktok_pixel_code TEXT,
  tiktok_enabled BOOLEAN DEFAULT false,
  custom_head_code TEXT,
  custom_body_code TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. SITE EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.site_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  session_id TEXT,
  country TEXT,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true) ON CONFLICT (id) DO UPDATE SET public = true;
INSERT INTO storage.buckets (id, name, public) VALUES ('categories', 'categories', true) ON CONFLICT (id) DO UPDATE SET public = true;
INSERT INTO storage.buckets (id, name, public) VALUES ('subcategories', 'subcategories', true) ON CONFLICT (id) DO UPDATE SET public = true;
INSERT INTO storage.buckets (id, name, public) VALUES ('banners', 'banners', true) ON CONFLICT (id) DO UPDATE SET public = true;

-- 16. AUTH TRIGGER: AUTO-CREATE PROFILE ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'user'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 17. ROW LEVEL SECURITY (RLS) ENABLING
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flash_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracking_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_events ENABLE ROW LEVEL SECURITY;

-- 18. RLS POLICIES
DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;
CREATE POLICY "Public read profiles" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow insert profiles" ON public.profiles;
CREATE POLICY "Allow insert profiles" ON public.profiles FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow update profiles" ON public.profiles;
CREATE POLICY "Allow update profiles" ON public.profiles FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow delete profiles" ON public.profiles;
CREATE POLICY "Allow delete profiles" ON public.profiles FOR DELETE USING (true);

DROP POLICY IF EXISTS "Public read addresses" ON public.addresses;
CREATE POLICY "Public read addresses" ON public.addresses FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow insert addresses" ON public.addresses;
CREATE POLICY "Allow insert addresses" ON public.addresses FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow update addresses" ON public.addresses;
CREATE POLICY "Allow update addresses" ON public.addresses FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow delete addresses" ON public.addresses;
CREATE POLICY "Allow delete addresses" ON public.addresses FOR DELETE USING (true);

DROP POLICY IF EXISTS "Public read categories" ON public.categories;
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow insert categories" ON public.categories;
CREATE POLICY "Allow insert categories" ON public.categories FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow update categories" ON public.categories;
CREATE POLICY "Allow update categories" ON public.categories FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow delete categories" ON public.categories;
CREATE POLICY "Allow delete categories" ON public.categories FOR DELETE USING (true);

DROP POLICY IF EXISTS "Public read subcategories" ON public.subcategories;
CREATE POLICY "Public read subcategories" ON public.subcategories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow insert subcategories" ON public.subcategories;
CREATE POLICY "Allow insert subcategories" ON public.subcategories FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow update subcategories" ON public.subcategories;
CREATE POLICY "Allow update subcategories" ON public.subcategories FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow delete subcategories" ON public.subcategories;
CREATE POLICY "Allow delete subcategories" ON public.subcategories FOR DELETE USING (true);

DROP POLICY IF EXISTS "Public read products" ON public.products;
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow insert products" ON public.products;
CREATE POLICY "Allow insert products" ON public.products FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow update products" ON public.products;
CREATE POLICY "Allow update products" ON public.products FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow delete products" ON public.products;
CREATE POLICY "Allow delete products" ON public.products FOR DELETE USING (true);

DROP POLICY IF EXISTS "Public read product variants" ON public.product_variants;
CREATE POLICY "Public read product variants" ON public.product_variants FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow manage product variants" ON public.product_variants;
CREATE POLICY "Allow manage product variants" ON public.product_variants FOR ALL USING (true);

DROP POLICY IF EXISTS "Public read flash_sales" ON public.flash_sales;
CREATE POLICY "Public read flash_sales" ON public.flash_sales FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow manage flash_sales" ON public.flash_sales;
CREATE POLICY "Allow manage flash_sales" ON public.flash_sales FOR ALL USING (true);

DROP POLICY IF EXISTS "Public read banners" ON public.banners;
CREATE POLICY "Public read banners" ON public.banners FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow manage banners" ON public.banners;
CREATE POLICY "Allow manage banners" ON public.banners FOR ALL USING (true);

DROP POLICY IF EXISTS "Public read delivery zones" ON public.delivery_zones;
CREATE POLICY "Public read delivery zones" ON public.delivery_zones FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow manage delivery zones" ON public.delivery_zones;
CREATE POLICY "Allow manage delivery zones" ON public.delivery_zones FOR ALL USING (true);

DROP POLICY IF EXISTS "Public read coupons" ON public.coupons;
CREATE POLICY "Public read coupons" ON public.coupons FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow manage coupons" ON public.coupons;
CREATE POLICY "Allow manage coupons" ON public.coupons FOR ALL USING (true);

DROP POLICY IF EXISTS "Public insert orders" ON public.orders;
CREATE POLICY "Public insert orders" ON public.orders FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public read orders" ON public.orders;
CREATE POLICY "Public read orders" ON public.orders FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow update orders" ON public.orders;
CREATE POLICY "Allow update orders" ON public.orders FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow delete orders" ON public.orders;
CREATE POLICY "Allow delete orders" ON public.orders FOR DELETE USING (true);

DROP POLICY IF EXISTS "Public insert order items" ON public.order_items;
CREATE POLICY "Public insert order items" ON public.order_items FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public read order items" ON public.order_items;
CREATE POLICY "Public read order items" ON public.order_items FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow delete order items" ON public.order_items;
CREATE POLICY "Allow delete order items" ON public.order_items FOR DELETE USING (true);

DROP POLICY IF EXISTS "Public read store settings" ON public.store_settings;
CREATE POLICY "Public read store settings" ON public.store_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow manage store settings" ON public.store_settings;
CREATE POLICY "Allow manage store settings" ON public.store_settings FOR ALL USING (true);

DROP POLICY IF EXISTS "Public read tracking settings" ON public.tracking_settings;
CREATE POLICY "Public read tracking settings" ON public.tracking_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow manage tracking settings" ON public.tracking_settings;
CREATE POLICY "Allow manage tracking settings" ON public.tracking_settings FOR ALL USING (true);

DROP POLICY IF EXISTS "Public insert site events" ON public.site_events;
CREATE POLICY "Public insert site events" ON public.site_events FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public read site events" ON public.site_events;
CREATE POLICY "Public read site events" ON public.site_events FOR SELECT USING (true);

-- Storage Objects Policies
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read product-images" ON storage.objects;
CREATE POLICY "Public Read product-images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
DROP POLICY IF EXISTS "Allow upload product-images" ON storage.objects;
CREATE POLICY "Allow upload product-images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images');
DROP POLICY IF EXISTS "Allow update product-images" ON storage.objects;
CREATE POLICY "Allow update product-images" ON storage.objects FOR UPDATE USING (bucket_id = 'product-images');
DROP POLICY IF EXISTS "Allow delete product-images" ON storage.objects;
CREATE POLICY "Allow delete product-images" ON storage.objects FOR DELETE USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Public Read categories_bucket" ON storage.objects;
CREATE POLICY "Public Read categories_bucket" ON storage.objects FOR SELECT USING (bucket_id = 'categories');
DROP POLICY IF EXISTS "Allow upload categories_bucket" ON storage.objects;
CREATE POLICY "Allow upload categories_bucket" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'categories');
DROP POLICY IF EXISTS "Allow update categories_bucket" ON storage.objects;
CREATE POLICY "Allow update categories_bucket" ON storage.objects FOR UPDATE USING (bucket_id = 'categories');
DROP POLICY IF EXISTS "Allow delete categories_bucket" ON storage.objects;
CREATE POLICY "Allow delete categories_bucket" ON storage.objects FOR DELETE USING (bucket_id = 'categories');

DROP POLICY IF EXISTS "Public Read subcategories_bucket" ON storage.objects;
CREATE POLICY "Public Read subcategories_bucket" ON storage.objects FOR SELECT USING (bucket_id = 'subcategories');
DROP POLICY IF EXISTS "Allow upload subcategories_bucket" ON storage.objects;
CREATE POLICY "Allow upload subcategories_bucket" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'subcategories');
DROP POLICY IF EXISTS "Allow update subcategories_bucket" ON storage.objects;
CREATE POLICY "Allow update subcategories_bucket" ON storage.objects FOR UPDATE USING (bucket_id = 'subcategories');
DROP POLICY IF EXISTS "Allow delete subcategories_bucket" ON storage.objects;
CREATE POLICY "Allow delete subcategories_bucket" ON storage.objects FOR DELETE USING (bucket_id = 'subcategories');

DROP POLICY IF EXISTS "Public Read banners" ON storage.objects;
CREATE POLICY "Public Read banners" ON storage.objects FOR SELECT USING (bucket_id = 'banners');
DROP POLICY IF EXISTS "Allow upload banners" ON storage.objects;
CREATE POLICY "Allow upload banners" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'banners');
DROP POLICY IF EXISTS "Allow update banners" ON storage.objects;
CREATE POLICY "Allow update banners" ON storage.objects FOR UPDATE USING (bucket_id = 'banners');
DROP POLICY IF EXISTS "Allow delete banners" ON storage.objects;
CREATE POLICY "Allow delete banners" ON storage.objects FOR DELETE USING (bucket_id = 'banners');

-- 19. SEED INITIAL DATA
INSERT INTO public.categories (name, name_en, name_bn, slug, icon, sub_label, sort_order)
VALUES
  ('Smartwatches', 'Smartwatches', 'স্মার্টওয়াচ', 'smartwatches', 'Watch', 'AMOLED, Bluetooth Calling', 1),
  ('TWS Earbuds', 'TWS Earbuds', 'ওয়্যারলেস ইয়ারবাড', 'tws-earbuds', 'Headphones', 'ANC, Deep Bass, Long Battery', 2),
  ('Power Banks', 'Power Banks', 'পাওয়ার ব্যাংক', 'power-banks', 'Battery', '20W/65W PD Fast Charging', 3),
  ('GaN Chargers', 'GaN Chargers', 'চার্জার ও অ্যাডাপ্টার', 'chargers', 'Zap', 'Fast charging adapters', 4),
  ('Phone Accessories', 'Phone Accessories', 'ফোন এক্সেসরিজ', 'accessories', 'Smartphone', 'Cases, holders, cables', 5),
  ('Gaming Gadgets', 'Gaming Gadgets', 'গেমিং গ্যাজেটস', 'gaming', 'Gamepad2', 'Triggers, coolers, controllers', 6)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.delivery_zones (name, name_bn, charge, estimated_days, sort_order)
VALUES
  ('Inside Dhaka', 'ঢাকার ভিতরে (Inside Dhaka)', 60, '১-২ কার্যদিবস', 1),
  ('Sub-Dhaka', 'ঢাকার আশেপাশে (সাভার, গাজীপুর, নারায়ণগঞ্জ)', 100, '২-৩ কার্যদিবস', 2),
  ('Outside Dhaka', 'ঢাকার বাইরে পুরো বাংলাদেশ', 130, '৩-৫ কার্যদিবস', 3)
ON CONFLICT DO NOTHING;

INSERT INTO public.coupons (code, type, value, min_order)
VALUES
  ('MUBA50', 'fixed', 50, 999),
  ('GADGET10', 'percent', 10, 1499)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.store_settings (key, value)
VALUES ('monthly_target', '500000')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.tracking_settings (id, fb_enabled, gtm_enabled, tiktok_enabled)
VALUES (1, false, false, false)
ON CONFLICT (id) DO NOTHING;

-- 20. RELOAD SCHEMA CACHE
NOTIFY pgrst, 'reload schema';`;

// DB তে কোনো কলাম না থাকলে সেই কলাম বাদ দিয়ে আবার চেষ্টা করে
async function writeWithColumnFallback(
  run: (body: Record<string, any>) => PromiseLike<{ data: any; error: any }>,
  payload: Record<string, any>
): Promise<{ data: any; error: any }> {
  const body = { ...payload };
  let res = await run(body);
  let retries = 8;
  while (res.error && retries-- > 0) {
    const msg: string = res.error.message || '';
    const m = msg.match(/Could not find the '([^']+)' column/i) || msg.match(/column "([^"]+)" of relation "[^"]+" does not exist/i);
    const col = m ? m[1] : null;
    if (col && col in body) {
      delete body[col];
      res = await run(body);
    } else break;
  }
  return res;
}

/* --------------------------- Small UI pieces ----------------------- */
const Card: React.FC<{ className?: string; children: React.ReactNode }> = ({ className = '', children }) => (
  <div className={`min-w-0 rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)] p-4 sm:p-5 ${className}`}>{children}</div>
);
const Delta: React.FC<{ v: number }> = ({ v }) => (
  <span className={`text-[11px] font-bold ${v >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{v >= 0 ? '+' : ''}{v.toFixed(2)}%</span>
);
const Select: React.FC<{ value: number; onChange: (v: number) => void; options: [number, string][] }> = ({ value, onChange, options }) => (
  <select
    value={value}
    onChange={(e) => onChange(Number(e.target.value))}
    className="bg-blue-600 text-white text-xs font-semibold rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:cursor-pointer"
  >
    {options.map(([v, l]) => <option key={v} value={v} className="text-gray-900 bg-white">{l}</option>)}
  </select>
);
const Empty: React.FC<{ text: string }> = ({ text }) => <div className="py-10 text-center text-xs text-gray-400">{text}</div>;

const CardHeader: React.FC<{ title: string; sub?: string; right?: React.ReactNode }> = ({ title, sub, right }) => (
  <div className="flex items-start justify-between gap-3 mb-4">
    <div className="min-w-0">
      <h3 className="font-extrabold text-base sm:text-lg text-slate-900 leading-tight">{title}</h3>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
    {right}
  </div>
);

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label?: string }> = ({ checked, onChange, label }) => (
  <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
    <div className={`w-11 h-6 rounded-full transition-colors p-0.5 shrink-0 ${checked ? 'bg-blue-600' : 'bg-slate-300'}`}>
      <div className={`w-5 h-5 rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </div>
    {label && <span className="text-xs font-bold text-slate-700">{label}</span>}
  </label>
);

const SavedBadge: React.FC<{ saved: boolean; okText: string }> = ({ saved, okText }) => (
  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${saved ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
    {saved ? <Check className="w-3 h-3" /> : null}{saved ? okText : 'সেট করা হয়নি'}
  </span>
);

/* ====================================================================== */
/* Tracking Pixels page (শুধু localStorage এ সেভ)                         */
/* ====================================================================== */
interface PixelStore {
  meta_pixel_id: string; meta_enabled: boolean;
  gtm_id: string; gtm_enabled: boolean;
  tiktok_pixel_id: string; tiktok_enabled: boolean;
  updated_at: string;
}
const PIXEL_KEY = 'muba_tracking_pixels';
const EMPTY_PIXELS: PixelStore = {
  meta_pixel_id: '', meta_enabled: false,
  gtm_id: '', gtm_enabled: false,
  tiktok_pixel_id: '', tiktok_enabled: false,
  updated_at: '',
};
const PIXEL_DEFS: {
  id: string; name: string; sub: string; short: string; color: string; placeholder: string;
  idKey: 'meta_pixel_id' | 'gtm_id' | 'tiktok_pixel_id';
  enKey: 'meta_enabled' | 'gtm_enabled' | 'tiktok_enabled';
  label: string;
}[] = [
  { id: 'meta', name: 'Meta (Facebook) Pixel', sub: 'Facebook ও Instagram Ads ট্র্যাকিং', short: 'f', color: '#1877F2', placeholder: '1234567890123456', idKey: 'meta_pixel_id', enKey: 'meta_enabled', label: 'Meta Pixel ID' },
  { id: 'gtm', name: 'Google Tag Manager', sub: 'GTM Container ID', short: 'G', color: '#4285F4', placeholder: 'GTM-XXXXXXX', idKey: 'gtm_id', enKey: 'gtm_enabled', label: 'GTM Container ID' },
  { id: 'tiktok', name: 'TikTok Pixel', sub: 'TikTok Ads ট্র্যাকিং', short: 'T', color: '#111827', placeholder: 'CXXXXXXXXXXXXXXXXX', idKey: 'tiktok_pixel_id', enKey: 'tiktok_enabled', label: 'TikTok Pixel ID' },
];

const TrackingPixelsPage: React.FC<{ notify: (m: string, ok?: boolean) => void }> = ({ notify }) => {
  const [saved, setSaved] = useState<PixelStore>(() => ({ ...EMPTY_PIXELS, ...loadLS<Partial<PixelStore>>(PIXEL_KEY, {}) }));
  const [draft, setDraft] = useState<PixelStore>(saved);

  const saveOne = (def: (typeof PIXEL_DEFS)[number]) => {
    const val = String(draft[def.idKey] || '').trim();
    const enabled = val ? Boolean(draft[def.enKey]) : false;
    const next = { ...saved, [def.idKey]: val, [def.enKey]: enabled, updated_at: new Date().toISOString() } as PixelStore;
    saveLS(PIXEL_KEY, next);
    setSaved(next);
    setDraft((d) => ({ ...d, [def.idKey]: val, [def.enKey]: enabled } as PixelStore));
    notify(val ? `${def.name} সেভ হয়েছে` : `${def.name} মুছে ফেলা হয়েছে`);
  };

  const saveAll = () => {
    const next: PixelStore = {
      meta_pixel_id: draft.meta_pixel_id.trim(),
      meta_enabled: draft.meta_pixel_id.trim() ? draft.meta_enabled : false,
      gtm_id: draft.gtm_id.trim(),
      gtm_enabled: draft.gtm_id.trim() ? draft.gtm_enabled : false,
      tiktok_pixel_id: draft.tiktok_pixel_id.trim(),
      tiktok_enabled: draft.tiktok_pixel_id.trim() ? draft.tiktok_enabled : false,
      updated_at: new Date().toISOString(),
    };
    saveLS(PIXEL_KEY, next);
    setSaved(next);
    setDraft(next);
    notify('সব ট্র্যাকিং পিক্সেল সেভ হয়েছে');
  };

  return (
    <div className="space-y-4 max-w-5xl">
      <Card>
        <CardHeader
          title="ট্র্যাকিং পিক্সেল (Tracking Pixels)"
          sub="Meta Pixel, Google Tag Manager ও TikTok Pixel এর ID এখানে সেভ করুন"
          right={saved.updated_at ? <span className="text-[10px] text-slate-400 text-right shrink-0">সর্বশেষ সেভ:<br />{new Date(saved.updated_at).toLocaleString('en-GB')}</span> : undefined}
        />
        <div className="flex items-start gap-3 p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs leading-relaxed">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <span>এই তথ্য শুধু এই ব্রাউজারের localStorage এ সেভ থাকে। Script আলাদা ভাবে যুক্ত করতে হবে।</span>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {PIXEL_DEFS.map((def) => {
          const isSaved = !!saved[def.idKey];
          return (
            <Card key={def.id} className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-black text-lg shrink-0" style={{ background: def.color }}>{def.short}</div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 leading-tight">{def.name}</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">{def.sub}</p>
                </div>
              </div>
              <SavedBadge saved={isSaved} okText="সেভ করা আছে" />
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{def.label}</label>
                <input
                  type="text"
                  placeholder={def.placeholder}
                  value={draft[def.idKey]}
                  onChange={(e) => setDraft((d) => ({ ...d, [def.idKey]: e.target.value } as PixelStore))}
                  className={inputCls + ' break-all'}
                />
              </div>
              <Toggle
                checked={Boolean(draft[def.enKey])}
                onChange={(v) => setDraft((d) => ({ ...d, [def.enKey]: v } as PixelStore))}
                label={draft[def.enKey] ? 'সক্রিয় (Active)' : 'নিষ্ক্রিয় (Inactive)'}
              />
              <button
                type="button"
                onClick={() => saveOne(def)}
                className="w-full sm:w-auto sm:self-start inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl"
              >
                <Save className="w-4 h-4" />Save
              </button>
            </Card>
          );
        })}
      </div>

      <button
        type="button"
        onClick={saveAll}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-blue-600 text-white font-bold text-sm px-6 py-3 rounded-xl transition"
      >
        <Save className="w-4 h-4" />Save All
      </button>
    </div>
  );
};

/* ====================================================================== */
/* Courier API page (শুধু localStorage এ সেভ)                             */
/* ====================================================================== */
interface CourierField { key: string; label: string; secret?: boolean; placeholder?: string }
interface CourierDef { id: string; name: string; short: string; color: string; fields: CourierField[] }
interface CourierEntry { enabled: boolean; values: Record<string, string> }
type CourierStore = Record<string, CourierEntry>;

const COURIER_KEY = 'muba_courier_settings';
const COURIER_DEFS: CourierDef[] = [
  {
    id: 'steadfast', name: 'Steadfast Courier', short: 'SF', color: '#16A34A',
    fields: [
      { key: 'api_key', label: 'API Key', secret: true },
      { key: 'secret_key', label: 'Secret Key', secret: true },
    ],
  },
  {
    id: 'pathao', name: 'Pathao Courier', short: 'PT', color: '#E11D48',
    fields: [
      { key: 'client_id', label: 'Client ID' },
      { key: 'client_secret', label: 'Client Secret', secret: true },
      { key: 'username', label: 'Username (Email)', placeholder: 'name@example.com' },
      { key: 'password', label: 'Password', secret: true },
      { key: 'store_id', label: 'Store ID' },
    ],
  },
  {
    id: 'redx', name: 'RedX', short: 'RX', color: '#DC2626',
    fields: [
      { key: 'access_token', label: 'API Access Token', secret: true },
    ],
  },
  {
    id: 'carrybee', name: 'Carrybee', short: 'CB', color: '#F59E0B',
    fields: [
      { key: 'client_id', label: 'Client ID' },
      { key: 'client_secret', label: 'Client Secret', secret: true },
      { key: 'client_context', label: 'Client Context' },
      { key: 'store_id', label: 'Store ID' },
    ],
  },
];

const emptyEntry = (def: CourierDef): CourierEntry => ({
  enabled: false,
  values: Object.fromEntries(def.fields.map((f) => [f.key, ''])),
});

const isEntryConfigured = (e: CourierEntry) => Object.values(e.values).some((v) => (v || '').trim() !== '');

const CourierCard: React.FC<{
  def: CourierDef;
  saved: CourierEntry;
  onSave: (e: CourierEntry) => void;
  onClear: () => void;
}> = ({ def, saved, onSave, onClear }) => {
  const [draft, setDraft] = useState<CourierEntry>(saved);
  const [show, setShow] = useState<Record<string, boolean>>({});

  useEffect(() => { setDraft(saved); }, [saved]);

  const configured = isEntryConfigured(saved);

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0" style={{ background: def.color }}>{def.short}</div>
        <div className="min-w-0 flex-1">
          <h3 className="font-extrabold text-sm sm:text-base text-slate-900 leading-tight">{def.name}</h3>
          <div className="mt-1"><SavedBadge saved={configured} okText="কনফিগার করা আছে" /></div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {def.fields.map((f) => (
          <div key={f.key} className={def.fields.length % 2 === 1 && f === def.fields[def.fields.length - 1] ? 'sm:col-span-2' : ''}>
            <label className="block text-xs font-bold text-slate-700 mb-1">{f.label}</label>
            <div className="relative">
              <input
                type={f.secret && !show[f.key] ? 'password' : 'text'}
                autoComplete="off"
                placeholder={f.placeholder || f.label}
                value={draft.values[f.key] || ''}
                onChange={(e) => setDraft((d) => ({ ...d, values: { ...d.values, [f.key]: e.target.value } }))}
                className={inputCls + (f.secret ? ' pr-10' : '') + ' break-all'}
              />
              {f.secret && (
                <button
                  type="button"
                  onClick={() => setShow((s) => ({ ...s, [f.key]: !s[f.key] }))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-blue-600"
                  aria-label={show[f.key] ? 'Hide' : 'Show'}
                >
                  {show[f.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Toggle
        checked={draft.enabled}
        onChange={(v) => setDraft((d) => ({ ...d, enabled: v }))}
        label={draft.enabled ? 'সক্রিয় (Active)' : 'নিষ্ক্রিয় (Inactive)'}
      />

      <div className="flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          onClick={() => onSave(draft)}
          className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl"
        >
          <Save className="w-4 h-4" />Save
        </button>
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 font-bold text-sm px-5 py-2.5 rounded-xl"
        >
          <Trash2 className="w-4 h-4" />Clear
        </button>
      </div>
    </Card>
  );
};

const CourierPage: React.FC<{ notify: (m: string, ok?: boolean) => void }> = ({ notify }) => {
  const [store, setStore] = useState<CourierStore>(() => {
    const raw = loadLS<Partial<Record<string, Partial<CourierEntry>>>>(COURIER_KEY, {});
    const out: CourierStore = {};
    COURIER_DEFS.forEach((def) => {
      const base = emptyEntry(def);
      const r = raw[def.id];
      out[def.id] = {
        enabled: Boolean(r?.enabled),
        values: { ...base.values, ...(r?.values || {}) },
      };
    });
    return out;
  });

  const persist = (next: CourierStore) => {
    setStore(next);
    saveLS(COURIER_KEY, next);
  };

  const handleSave = (def: CourierDef, entry: CourierEntry) => {
    const values: Record<string, string> = {};
    def.fields.forEach((f) => { values[f.key] = (entry.values[f.key] || '').trim(); });
    persist({ ...store, [def.id]: { enabled: entry.enabled, values } });
    notify(`${def.name} সেভ হয়েছে`);
  };

  const handleClear = (def: CourierDef) => {
    if (!window.confirm(`${def.name} এর সব তথ্য মুছে ফেলতে চান?`)) return;
    persist({ ...store, [def.id]: emptyEntry(def) });
    notify(`${def.name} এর তথ্য মুছে ফেলা হয়েছে`);
  };

  return (
    <div className="space-y-4 max-w-6xl">
      <Card>
        <CardHeader
          title="কুরিয়ার API (Courier Settings)"
          sub="Steadfast, Pathao, RedX ও Carrybee এর API তথ্য এখানে সেভ করুন"
        />
        <div className="flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs leading-relaxed">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>API key গুলো শুধু এই ডিভাইস/ব্রাউজারে সেভ হয়। অন্য কারো সাথে ব্রাউজার শেয়ার করবেন না।</span>
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {COURIER_DEFS.map((def) => (
          <CourierCard
            key={def.id}
            def={def}
            saved={store[def.id]}
            onSave={(e) => handleSave(def, e)}
            onClear={() => handleClear(def)}
          />
        ))}
      </div>
    </div>
  );
};

/* ------------------------------ Charts ----------------------------- */
const RevenueChart: React.FC<{ data: { label: string; revenue: number; orders: number }[] }> = ({ data }) => {
  const [hover, setHover] = useState<number | null>(null);
  const W = 700, H = 280, L = 48, R = 12, T = 14, B = 28;
  const iw = W - L - R, ih = H - T - B;
  const maxRev = niceMax(Math.max(...data.map((d) => d.revenue), 0));
  const maxOrd = Math.max(...data.map((d) => d.orders), 1);
  const x = (i: number) => L + (data.length === 1 ? iw / 2 : (i * iw) / (data.length - 1));
  const yRev = (v: number) => T + ih - (v / maxRev) * ih;
  const yOrd = (v: number) => T + ih - (v / maxOrd) * ih * 0.55;
  const revPts = data.map((d, i) => [x(i), yRev(d.revenue)] as [number, number]);
  const ordPts = data.map((d, i) => [x(i), yOrd(d.orders)] as [number, number]);
  const step = Math.ceil(data.length / 8);
  const ticks = [0, 1, 2, 3, 4].map((i) => (maxRev / 4) * i);

  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const rel = ((e.clientX - r.left) / r.width) * W;
    const idx = Math.round(((rel - L) / iw) * (data.length - 1));
    setHover(Math.max(0, Math.min(data.length - 1, idx)));
  };
  const hd = hover !== null ? data[hover] : null;
  const tx = hover !== null ? Math.min(Math.max(x(hover) - 55, L), W - R - 110) : 0;

  const linePath = smoothPath(revPts, T, T + ih);
  const areaPath = linePath && data.length > 1
    ? `${linePath} L${x(data.length - 1)},${T + ih} L${x(0)},${T + ih} Z`
    : '';

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto select-none touch-pan-y">
      <defs>
        <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2563eb" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
        </linearGradient>
      </defs>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={L} x2={W - R} y1={yRev(t)} y2={yRev(t)} stroke="#E2E8F0" strokeDasharray="4 4" />
          <text x={L - 8} y={yRev(t) + 4} textAnchor="end" fontSize="11" fill="#94A3B8">{compact(t)}</text>
        </g>
      ))}
      {data.map((d, i) => i % step === 0 && (
        <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="#64748B">{d.label}</text>
      ))}
      {hover !== null && <rect x={x(hover) - 18} y={T} width={36} height={ih} fill="#2563eb" opacity="0.08" rx="6" />}
      {areaPath && <path d={areaPath} fill="url(#revFill)" />}
      <path d={smoothPath(ordPts, T, T + ih)} fill="none" stroke="#F59E0B" strokeWidth="2" strokeDasharray="5 4" />
      <path d={linePath} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" />
      {hover !== null && hd && (
        <g>
          <circle cx={x(hover)} cy={yRev(hd.revenue)} r="5" fill="#fff" stroke="#2563eb" strokeWidth="2" />
          <g transform={`translate(${tx},${Math.max(yRev(hd.revenue) - 62, 0)})`}>
            <rect width="110" height="48" rx="8" fill="#fff" stroke="#CBD5E1" />
            <text x="10" y="18" fontSize="10" fill="#64748B">{hd.label} · Revenue</text>
            <text x="10" y="34" fontSize="13" fontWeight="700" fill="#0F172A">{money(hd.revenue)}</text>
            <text x="10" y="44" fontSize="9" fill="#94A3B8">{hd.orders} orders</text>
          </g>
        </g>
      )}
      <rect x={L} y={T} width={iw} height={ih} fill="transparent" onPointerMove={onMove} onPointerDown={onMove} onPointerLeave={() => setHover(null)} />
    </svg>
  );
};

const Gauge: React.FC<{ pct: number }> = ({ pct }) => (
  <svg viewBox="0 0 200 118" className="w-full max-w-[260px] mx-auto">
    <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#DBEAFE" strokeWidth="22" strokeLinecap="round" pathLength={100} />
    <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#2563eb" strokeWidth="22" strokeLinecap="round" pathLength={100}
      strokeDasharray={`${Math.max(Math.min(pct, 1) * 100, 0.01)} 100`} />
    <text x="100" y="92" textAnchor="middle" fontSize="28" fontWeight="800" fill="#0F172A">{Math.round(pct * 100)}%</text>
  </svg>
);

const Donut: React.FC<{ parts: { value: number }[]; centerTop: string; centerBottom: string }> = ({ parts, centerTop, centerBottom }) => {
  const r = 70, C = 2 * Math.PI * r;
  const total = parts.reduce((s, p) => s + p.value, 0) || 1;
  let offset = 0;
  return (
    <svg viewBox="0 0 200 200" className="w-full max-w-[220px] mx-auto">
      <circle cx="100" cy="100" r={r} fill="none" stroke="#EFF6FF" strokeWidth="26" />
      <g transform="rotate(-90 100 100)">
        {parts.map((p, i) => {
          const len = (p.value / total) * C;
          const el = (
            <circle key={i} cx="100" cy="100" r={r} fill="none" stroke={SHADES[i % SHADES.length]} strokeWidth="26" strokeLinecap="round"
              strokeDasharray={`${Math.max(len - 8, 0.1)} ${C}`} strokeDashoffset={-offset - 4} />
          );
          offset += len;
          return el;
        })}
      </g>
      <text x="100" y="94" textAnchor="middle" fontSize="10" fill="#64748B">{centerTop}</text>
      <text x="100" y="116" textAnchor="middle" fontSize="17" fontWeight="800" fill="#0F172A">{centerBottom}</text>
    </svg>
  );
};

/* ====================================================================== */
export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen = true, onClose, onLogout, products, categories, banners, deliveryZones, subCategories = [], onRefreshProducts, onRefreshCategories, onRefreshBanners, onRefreshDeliveryZones, onRefreshSubCategories
}) => {
  const prods = enrichProducts(products as unknown as Product[]) as unknown as ProductLite[];
  const cats = categories as unknown as CategoryLite[];
  const catName = (id?: string | null) => {
    if (!id) return '—';
    const c = (catList as any[]).find((x) => x.id === id || x.slug === id) || cats.find((x) => x.id === id);
    return c ? (c.name_bn || c.name || '—') : '—';
  };

  // URL query, hash বা localStorage থেকে শুরুর ট্যাব পড়া হয়
  const getInitialTab = (): Page => {
    try {
      const validPages: Page[] = [
        'dashboard', 'orders', 'products', 'categories', 'banners', 'flashSales',
        'customers', 'reports', 'tracking', 'trackingPixels', 'courier', 'deliveryZones', 'settings'
      ];
      const searchParam = new URLSearchParams(window.location.search).get('tab') as Page;
      if (searchParam && validPages.includes(searchParam)) return searchParam;

      const hashParam = window.location.hash.replace('#', '') as Page;
      if (hashParam && validPages.includes(hashParam)) return hashParam;

      const saved = localStorage.getItem('muba_admin_tab') as Page;
      if (saved && validPages.includes(saved)) return saved;
    } catch { /* ignore */ }
    return 'dashboard';
  };

  const [page, setPageState] = useState<Page>(getInitialTab);

  const setPage = useCallback((newPage: Page) => {
    setPageState(newPage);
    try {
      localStorage.setItem('muba_admin_tab', newPage);
      window.history.replaceState({ ...window.history.state, view: 'admin', tab: newPage }, '', `/admin?tab=${newPage}`);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('muba_admin_active', 'true');
      localStorage.setItem('muba_admin_tab', page);
      const currentTab = new URLSearchParams(window.location.search).get('tab');
      if (window.location.pathname !== '/admin' || currentTab !== page) {
        window.history.replaceState({ ...window.history.state, view: 'admin', tab: page }, '', `/admin?tab=${page}`);
      }
    } catch { /* ignore */ }
  }, [page]);

  const [orders, setOrders] = useState<OrderLite[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [navOpen, setNavOpen] = useState(false);

  const [rangeDays, setRangeDays] = useState(7);
  const [funnelDays, setFunnelDays] = useState(7);
  const [target, setTarget] = useState(600000);
  const [targetInput, setTargetInput] = useState('600000');
  const [siteNameInput, setSiteNameInput] = useState('Kalkerdeal');
  const [siteNumberInput, setSiteNumberInput] = useState('01700-000000');
  const [promoCodeInput, setPromoCodeInput] = useState('CARTAPP250');
  const [promoDiscountInput, setPromoDiscountInput] = useState('250');
  const [bkashNumberInput, setBkashNumberInput] = useState('01700000000');
  const [nagadNumberInput, setNagadNumberInput] = useState('01700000000');
  const [freeShippingThresholdInput, setFreeShippingThresholdInput] = useState('2000');
  const [insideChargeInput, setInsideChargeInput] = useState('60');
  const [outsideChargeInput, setOutsideChargeInput] = useState('130');

  const [orderQuery, setOrderQuery] = useState('');
  const [orderStatus, setOrderStatus] = useState('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [productQuery, setProductQuery] = useState('');
  const [customerQuery, setCustomerQuery] = useState('');
  const [reportFrom, setReportFrom] = useState(dayKey(new Date(Date.now() - 29 * DAY)));
  const [reportTo, setReportTo] = useState(dayKey(new Date()));

  const emptyForm = {
    id: '',
    name: '',
    name_bn: '',
    description: '',
    description_bn: '',
    price: '',
    old_price: '',
    stock: '50',
    category_id: '',
    subcategory_id: '',
    image_url: '',
    images: [] as string[],
    enable_size: false,
    enable_color: false,
    is_flash_sale: false,
    sizes: [] as string[],
    colors: [] as string[]
  };
  const [sizeInput, setSizeInput] = useState('');
  const [colorInput, setColorInput] = useState('');

  // Sub-Category State & Full Admin Controls
  const [subCatList, setSubCatList] = useState<SubCategory[]>(() => {
    if (subCategories && subCategories.length > 0) return subCategories;
    try {
      const saved = localStorage.getItem('muba_custom_subcategories');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch { /* ignore */ }
    return [];
  });
  const [editingSubCatId, setEditingSubCatId] = useState<string | null>(null);
  const defaultSubCatForm = {
    category_id: '',
    name: '',
    name_bn: '',
    slug: '',
    image_url: '',
    display_order: '0',
    is_active: true
  };
  const [subCatForm, setSubCatForm] = useState(defaultSubCatForm);
  const [subCatSubmitting, setSubCatSubmitting] = useState(false);
  const [subCatUploading, setSubCatUploading] = useState(false);
  const [subCatFilterCatId, setSubCatFilterCatId] = useState<string>('all');
  const [subCatQuery, setSubCatQuery] = useState<string>('');
  const [deleteConfirmSubCategory, setDeleteConfirmSubCategory] = useState<SubCategory | null>(null);
  const [deletingSubCategory, setDeletingSubCategory] = useState(false);

  // Inline quick-add sub-category state directly under a category card
  const [inlineSubCatParentKey, setInlineSubCatParentKey] = useState<string | null>(null);
  const [inlineSubCatForm, setInlineSubCatForm] = useState({
    name: '',
    name_bn: '',
    image_url: '',
  });
  const [inlineSubCatSaving, setInlineSubCatSaving] = useState(false);
  const [inlineSubCatUploading, setInlineSubCatUploading] = useState(false);

  const subCatFileInputRef = useRef<HTMLInputElement>(null);
  const inlineSubCatFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (subCategories && subCategories.length > 0) {
      setSubCatList(subCategories);
    }
  }, [subCategories]);

  const sortSubCats = (arr: any[]): SubCategory[] =>
    [...arr].sort((a, b) => (a.display_order ?? a.sort_order ?? 0) - (b.display_order ?? b.sort_order ?? 0));

  const persistSubCatsLocal = (list: SubCategory[]) => {
    try {
      localStorage.setItem('muba_custom_subcategories', JSON.stringify(list));
    } catch { /* ignore */ }
  };

  const isSubOfCategory = useCallback((sc: SubCategory, cat?: Category | null) => {
    if (!cat) return false;
    return (
      (Boolean(cat.id) && sc.category_id === cat.id) ||
      (Boolean(cat.slug) && sc.category_id === cat.slug)
    );
  }, []);

  const subCatName = useCallback(
    (subId?: string | null) => {
      if (!subId) return '';
      const found = subCatList.find((s) => s.id === subId || s.slug === subId);
      return found ? found.name_bn || found.name : '';
    },
    [subCatList]
  );

  const fetchSubCategories = useCallback(async () => {
    let localItems: any[] = [];
    try {
      const raw = localStorage.getItem('muba_custom_subcategories');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) localItems = parsed;
      }
    } catch { /* ignore */ }

    try {
      const { data, error } = await supabase.from('subcategories').select('*');
      if (!error && Array.isArray(data)) {
        const dbIds = new Set(data.map((d: any) => d.id));
        const localOnlyExtras = localItems.filter((item: any) => item?._localOnly && !dbIds.has(item.id));
        const merged = sortSubCats([...data, ...localOnlyExtras]);
        setSubCatList(merged);
        persistSubCatsLocal(merged);
      } else if (localItems.length > 0) {
        setSubCatList(sortSubCats(localItems));
      }
    } catch {
      if (localItems.length > 0) {
        setSubCatList(sortSubCats(localItems));
      }
    }
  }, []);

  // Ensures that if a mock/local category is selected, we resolve or create its real UUID in Supabase categories first
  const ensureSupabaseCategoryUuid = async (catIdOrSlug: string): Promise<string> => {
    if (isValidUuid(catIdOrSlug)) return catIdOrSlug.trim();

    const matchedCat = catList.find((c) => c.id === catIdOrSlug || c.slug === catIdOrSlug);
    if (!matchedCat) return catIdOrSlug;

    try {
      const { data: existing } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', matchedCat.slug)
        .maybeSingle();

      if (existing?.id && isValidUuid(existing.id)) {
        return existing.id;
      }

      const insertPayload: Record<string, any> = {
        name: matchedCat.name,
        name_bn: matchedCat.name_bn || matchedCat.name,
        slug: matchedCat.slug,
        icon: matchedCat.icon || 'Tag',
        image_url: matchedCat.image_url || null,
        sort_order: matchedCat.sort_order ?? 0,
        is_active: matchedCat.is_active !== false,
      };

      const { data: created, error: createErr } = await supabase
        .from('categories')
        .insert([insertPayload])
        .select('*')
        .maybeSingle();

      if (!createErr && created?.id && isValidUuid(created.id)) {
        onRefreshCategories?.();
        return created.id;
      }
    } catch {
      /* fall back to local category key */
    }

    return matchedCat.id || matchedCat.slug;
  };

  // Shared resilient Sub-Category saver (works with partial schemas AND falls back to local sync if table/RLS missing)
  const saveSubCategoryRecord = async (params: {
    editId?: string | null;
    category_id: string;
    name: string;
    name_bn?: string;
    slug?: string;
    image_url?: string;
    display_order?: number;
    is_active?: boolean;
  }): Promise<{ saved: SubCategory; savedInDb: boolean }> => {
    const cleanName = params.name.trim();
    const cleanNameBn = (params.name_bn || '').trim() || cleanName;
    const baseSlug =
      (params.slug || '').trim() ||
      cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') ||
      `sub-${Date.now().toString(36)}`;
    const orderVal = Number.isFinite(params.display_order) ? Number(params.display_order) : 0;
    const resolvedCategoryId = await ensureSupabaseCategoryUuid(params.category_id);

    const payload: Record<string, any> = {
      category_id: resolvedCategoryId,
      name: cleanName,
      name_bn: cleanNameBn,
      slug: baseSlug,
      image_url: (params.image_url || '').trim() || null,
      display_order: orderVal,
      is_active: params.is_active !== false,
    };

    let savedRow: any = null;
    let savedInDb = false;

    if (isValidUuid(resolvedCategoryId)) {
      const attemptDbWrite = async (body: Record<string, any>) => {
        if (params.editId && isValidUuid(params.editId)) {
          return await supabase
            .from('subcategories')
            .update(body)
            .eq('id', params.editId)
            .select('*')
            .maybeSingle();
        }
        return await supabase
          .from('subcategories')
          .insert([body])
          .select('*')
          .maybeSingle();
      };

      try {
        const workingPayload = { ...payload };
        let res = await attemptDbWrite(workingPayload);
        let retries = 6;

        while (res.error && retries > 0) {
          retries--;
          const msg = res.error.message || '';

          // Strip any column missing in the user's Supabase subcategories table
          const colMatch =
            msg.match(/Could not find the '([^']+)' column/i) ||
            msg.match(/column "([^"]+)" of relation "subcategories" does not exist/i);
          const missingCol = colMatch ? colMatch[1] : null;

          if (missingCol && missingCol in workingPayload) {
            delete workingPayload[missingCol];
            res = await attemptDbWrite(workingPayload);
            continue;
          }

          if (msg.toLowerCase().includes('unique') && msg.toLowerCase().includes('slug') && 'slug' in workingPayload) {
            workingPayload.slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
            res = await attemptDbWrite(workingPayload);
            continue;
          }

          break;
        }

        if (!res.error) {
          savedRow = res.data || {
            id: params.editId || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `sub-${Date.now()}`),
            ...payload,
          };
          savedInDb = true;
        } else {
          console.warn('Supabase subcategory write warning (using local sync):', res.error.message);
        }
      } catch (err) {
        console.warn('Supabase subcategory operation failed (using local sync):', err);
      }
    }

    const finalSubCat: SubCategory & { _localOnly?: boolean } = savedRow
      ? {
          ...payload,
          ...savedRow,
          display_order: savedRow.display_order ?? orderVal,
          is_active: savedRow.is_active ?? (params.is_active !== false),
        }
      : {
          id:
            params.editId ||
            (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `subcat-${Date.now()}`),
          category_id: resolvedCategoryId,
          name: cleanName,
          name_bn: cleanNameBn,
          slug: baseSlug,
          image_url: (params.image_url || '').trim() || undefined,
          display_order: orderVal,
          is_active: params.is_active !== false,
          created_at: new Date().toISOString(),
          _localOnly: true,
        };

    setSubCatList((prev) => {
      const next = params.editId
        ? prev.map((item) => (item.id === params.editId ? finalSubCat : item))
        : [...prev, finalSubCat];
      const sorted = sortSubCats(next);
      persistSubCatsLocal(sorted);
      return sorted;
    });

    if (savedInDb) {
      await fetchSubCategories();
    }
    onRefreshSubCategories?.();

    return { saved: finalSubCat, savedInDb };
  };

  const handleSaveSubCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subCatForm.name.trim()) {
      notify('সাব-ক্যাটাগরির ইংরেজি নাম দিন', false);
      return;
    }
    if (!subCatForm.category_id) {
      notify('মূল ক্যাটাগরি নির্বাচন করুন', false);
      return;
    }

    setSubCatSubmitting(true);
    try {
      const { savedInDb } = await saveSubCategoryRecord({
        editId: editingSubCatId,
        category_id: subCatForm.category_id,
        name: subCatForm.name,
        name_bn: subCatForm.name_bn,
        slug: subCatForm.slug,
        image_url: subCatForm.image_url,
        display_order: parseInt(subCatForm.display_order, 10) || 0,
        is_active: subCatForm.is_active,
      });

      notify(
        editingSubCatId
          ? savedInDb
            ? 'সাব-ক্যাটাগরি ডাটাবেজে আপডেট হয়েছে!'
            : 'সাব-ক্যাটাগরি আপডেট হয়েছে!'
          : savedInDb
            ? 'নতুন সাব-ক্যাটাগরি সফলভাবে যোগ হয়েছে!'
            : 'নতুন সাব-ক্যাটাগরি সংরক্ষিত হয়েছে!'
      );

      setEditingSubCatId(null);
      setSubCatForm(defaultSubCatForm);
    } catch (err: any) {
      notify('সাব-ক্যাটাগরি সেভ হয়নি: ' + (err?.message || 'Error'), false);
    } finally {
      setSubCatSubmitting(false);
    }
  };

  const handleQuickSaveSubCategory = async (e: React.FormEvent, parentCat: Category) => {
    e.preventDefault();
    const parentKey = parentCat.id || parentCat.slug;
    if (!inlineSubCatForm.name.trim()) {
      notify('সাব-ক্যাটাগরির নাম লিখুন', false);
      return;
    }

    setInlineSubCatSaving(true);
    try {
      const existingSubsCount = subCatList.filter((sc) => isSubOfCategory(sc, parentCat)).length;
      const { savedInDb } = await saveSubCategoryRecord({
        category_id: parentKey,
        name: inlineSubCatForm.name,
        name_bn: inlineSubCatForm.name_bn,
        image_url: inlineSubCatForm.image_url,
        display_order: existingSubsCount + 1,
        is_active: true,
      });

      notify(
        savedInDb
          ? `"${parentCat.name_bn || parentCat.name}"-এর অধীনে সাব-ক্যাটাগরি যোগ হয়েছে!`
          : `"${parentCat.name_bn || parentCat.name}"-এর অধীনে সাব-ক্যাটাগরি সংরক্ষিত হয়েছে!`
      );

      setInlineSubCatForm({ name: '', name_bn: '', image_url: '' });
      setInlineSubCatParentKey(null);
    } catch (err: any) {
      notify('সাব-ক্যাটাগরি যোগ করা যায়নি: ' + (err?.message || 'Error'), false);
    } finally {
      setInlineSubCatSaving(false);
    }
  };

  const handleInlineSubCategoryImageUpload = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      notify('অনুগ্রহ করে শুধুমাত্র ছবি ফাইল নির্বাচন করুন', false);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      notify('ছবির সাইজ সর্বোচ্চ ৫MB হতে পারবে', false);
      return;
    }

    setInlineSubCatUploading(true);
    try {
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
      const compressed = await compressImage(file, 800, 0.8);
      const publicUrl = await uploadImageToBuckets(['subcategories', 'categories', 'product-images'], fileName, compressed);
      setInlineSubCatForm((prev) => ({ ...prev, image_url: publicUrl }));
      notify('ছবি আপলোড সম্পন্ন!');
    } catch (err: any) {
      notify('ছবি আপলোডে সমস্যা হয়েছে: ' + uploadErrorMsg(err), false);
    } finally {
      setInlineSubCatUploading(false);
    }
  };

  const handleToggleSubCategoryActive = async (sub: SubCategory) => {
    const nextActive = !(sub.is_active !== false);
    try {
      if (isValidUuid(sub.id)) {
        await supabase.from('subcategories').update({ is_active: nextActive }).eq('id', sub.id);
      }
    } catch { /* ignore */ }

    setSubCatList((prev) => {
      const updated = prev.map((s) => (s.id === sub.id ? { ...s, is_active: nextActive } : s));
      persistSubCatsLocal(updated);
      return updated;
    });
    notify(nextActive ? 'সাব-ক্যাটাগরি সক্রিয় করা হয়েছে' : 'সাব-ক্যাটাগরি নিষ্ক্রিয় করা হয়েছে');
    onRefreshSubCategories?.();
  };

  const handleMoveSubCategoryOrder = async (sub: SubCategory, direction: 'up' | 'down') => {
    const siblings = sortSubCats(subCatList.filter((s) => s.category_id === sub.category_id));
    const idx = siblings.findIndex((s) => s.id === sub.id);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= siblings.length) return;

    const curOrder = siblings[idx].display_order ?? idx;
    const tgtOrder = siblings[targetIdx].display_order ?? targetIdx;
    const nextCurOrder = tgtOrder;
    const nextTgtOrder = curOrder === tgtOrder ? (direction === 'up' ? curOrder - 1 : curOrder + 1) : curOrder;

    const curId = siblings[idx].id;
    const tgtId = siblings[targetIdx].id;

    setSubCatList((prev) => {
      const updated = sortSubCats(
        prev.map((item) => {
          if (item.id === curId) return { ...item, display_order: nextCurOrder };
          if (item.id === tgtId) return { ...item, display_order: nextTgtOrder };
          return item;
        })
      );
      persistSubCatsLocal(updated);
      return updated;
    });

    try {
      if (isValidUuid(curId)) {
        await supabase.from('subcategories').update({ display_order: nextCurOrder }).eq('id', curId);
      }
      if (isValidUuid(tgtId)) {
        await supabase.from('subcategories').update({ display_order: nextTgtOrder }).eq('id', tgtId);
      }
    } catch { /* ignore if display_order column missing */ }

    notify('সাব-ক্যাটাগরির ক্রম আপডেট হয়েছে');
    onRefreshSubCategories?.();
  };

  const handleDeleteSubCategory = (sub: SubCategory) => {
    setDeleteConfirmSubCategory(sub);
  };

  const confirmDeleteSubCategory = async () => {
    if (!deleteConfirmSubCategory) return;
    const target = deleteConfirmSubCategory;
    setDeletingSubCategory(true);
    try {
      if (isValidUuid(target.id)) {
        await supabase.from('subcategories').delete().eq('id', target.id);
      }
      setSubCatList((prev) => {
        const updated = prev.filter((s) => s.id !== target.id);
        persistSubCatsLocal(updated);
        return updated;
      });
      if (editingSubCatId === target.id) {
        setEditingSubCatId(null);
        setSubCatForm(defaultSubCatForm);
      }
      notify('সাব-ক্যাটাগরি সফলভাবে মুছে ফেলা হয়েছে');
      onRefreshSubCategories?.();
    } catch (err: any) {
      notify('ডিলিট করা যায়নি: ' + (err?.message || 'Error'), false);
    } finally {
      setDeletingSubCategory(false);
      setDeleteConfirmSubCategory(null);
    }
  };

  const startEditSubCategory = (sc: SubCategory) => {
    setEditingSubCatId(sc.id);
    setSubCatForm({
      category_id: sc.category_id,
      name: sc.name || '',
      name_bn: sc.name_bn || '',
      slug: sc.slug || '',
      image_url: sc.image_url || '',
      display_order: String(sc.display_order ?? 0),
      is_active: sc.is_active !== false,
    });
    const el = document.getElementById('subcategory-control-panel');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const addSizeOption = () => {
    const val = sizeInput.trim();
    if (!val) return;
    if (form.sizes.includes(val)) return;
    setForm(prev => ({ ...prev, sizes: [...prev.sizes, val] }));
    setSizeInput('');
  };
  const removeSizeOption = (idx: number) => {
    setForm(prev => ({ ...prev, sizes: prev.sizes.filter((_, i) => i !== idx) }));
  };
  const addColorOption = () => {
    const val = colorInput.trim();
    if (!val) return;
    if (form.colors.includes(val)) return;
    setForm(prev => ({ ...prev, colors: [...prev.colors, val] }));
    setColorInput('');
  };
  const removeColorOption = (idx: number) => {
    setForm(prev => ({ ...prev, colors: prev.colors.filter((_, i) => i !== idx) }));
  };
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [sqlCopied, setSqlCopied] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch { /* ignore */ }
    try {
      localStorage.removeItem('muba_admin_active');
      localStorage.removeItem('muba_admin_tab');
      localStorage.setItem('muba_admin_logged_out', 'true');
    } catch { /* ignore */ }
    if (onLogout) {
      onLogout();
    } else {
      onClose();
      try {
        window.history.replaceState({}, '', '/');
      } catch { /* ignore */ }
    }
  };

  const handleSyncToSupabase = async () => {
    setIsSyncing(true);
    notify('ডেটাবেজে প্রোডাক্ট সিঙ্ক করা হচ্ছে...');
    try {
      const res = await syncMockDataToSupabase();
      if (res.success) {
        notify(`সফলভাবে ${res.count} টি নতুন প্রোডাক্ট ডেটাবেজে সিঙ্ক হয়েছে!`);
        onRefreshProducts();
        if (onRefreshCategories) onRefreshCategories();
      } else {
        notify('সিঙ্ক ব্যর্থ: ' + (res.error || 'Unknown error'), false);
      }
    } catch (err: any) {
      notify('ত্রুটি: ' + (err?.message || 'Error'), false);
    } finally {
      setIsSyncing(false);
    }
  };

  /* ---------------------- Delete Confirm State ---------------------- */
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState<ProductLite | null>(null);
  const [deletingProduct, setDeletingProduct] = useState(false);
  const [deleteConfirmOrder, setDeleteConfirmOrder] = useState<OrderLite | null>(null);
  const [deletingOrder, setDeletingOrder] = useState(false);

  /* ---------------------- Edit Order State ---------------------- */
  const [editingOrder, setEditingOrder] = useState<OrderLite | null>(null);
  const [orderEditForm, setOrderEditForm] = useState({
    customer_name: '',
    phone: '',
    address: '',
    delivery_zone: 'ঢাকার ভিতরে',
    delivery_charge: '60',
    status: 'pending',
    payment_method: 'cod',
    total: '0'
  });
  const [orderEditSaving, setOrderEditSaving] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  const toggleExpandOrder = (key: string) => {
    setExpandedOrders((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  /* ---------------------- Bulk Category & Sub-Category Assign ---------------------- */
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkCategoryId, setBulkCategoryId] = useState('');
  const [bulkSubCategoryId, setBulkSubCategoryId] = useState('');
  const [bulkAssigning, setBulkAssigning] = useState(false);
  const [productCatFilter, setProductCatFilter] = useState('all');
  const [productSubCatFilter, setProductSubCatFilter] = useState('all');
  const [quickAssigningProdId, setQuickAssigningProdId] = useState<string | null>(null);

  /* -------------------------- Category State -------------------------- */
  const defaultCategoryForm = {
    name: '',
    name_bn: '',
    slug: '',
    icon: 'Tag',
    sub_label: '',
    image_url: '',
    sort_order: '0',
    is_active: true
  };
  const [catList, setCatList] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem('muba_custom_categories');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch { /* ignore */ }
    return categories || [];
  });
  const [categoryForm, setCategoryForm] = useState(defaultCategoryForm);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categorySaving, setCategorySaving] = useState(false);
  const [categoryUploading, setCategoryUploading] = useState(false);
  const [categoryQuery, setCategoryQuery] = useState('');
  const [deleteConfirmCategory, setDeleteConfirmCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState(false);
  const categoryFileInputRef = useRef<HTMLInputElement>(null);

  /* ---------------------- Delivery Zones State ---------------------- */
  const [zoneList, setZoneList] = useState<DeliveryZone[]>(() => {
    try {
      const saved = localStorage.getItem('muba_delivery_zones');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return []; // Forced clear
      }
    } catch { /* ignore */ }
    return []; // Start empty
  });

  useEffect(() => {
    if (deliveryZones && deliveryZones.length > 0) {
      setZoneList(deliveryZones);
    }
  }, [deliveryZones]);

  const defaultZoneForm = { name: '', name_bn: '', charge: '60', estimated_days: '১-২ কার্যদিবস' };
  const [zoneForm, setZoneForm] = useState(defaultZoneForm);
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const [zoneSaving, setZoneSaving] = useState(false);
  const [deleteConfirmZone, setDeleteConfirmZone] = useState<DeliveryZone | null>(null);

  const handleSaveZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zoneForm.name_bn.trim() || !zoneForm.charge) {
      notify('অনুগ্রহ করে নাম এবং চার্জ দিন', false);
      return;
    }
    setZoneSaving(true);
    try {
      const chargeNum = parseFloat(zoneForm.charge) || 0;
      const isInside = zoneForm.name_bn.includes('ভিতরে') || zoneForm.name.toLowerCase().includes('inside');
      const districtVal = isInside ? 'Dhaka' : 'Outside Dhaka';

      // Payload with district column included for DB constraints
      const payload = {
        name: zoneForm.name.trim() || zoneForm.name_bn.trim(),
        name_bn: zoneForm.name_bn.trim(),
        district: districtVal,
        charge: chargeNum,
        estimated_days: zoneForm.estimated_days.trim() || '১-২ কার্যদিবস',
        is_active: true,
        sort_order: 0
      };

      if (editingZoneId && isValidUuid(editingZoneId)) {
        const { error } = await supabase.from('delivery_zones').update(payload).eq('id', editingZoneId);
        if (error) throw new Error(`Update error: ${error.message}`);
        
        setZoneList((prev) => prev.map((z) => z.id === editingZoneId ? { ...z, ...payload, id: editingZoneId } : z));
        notify('ডেলিভারি জোন আপডেট হয়েছে');
      } else {
        const { data, error } = await supabase.from('delivery_zones').insert([payload]).select('id').single();
        if (error) throw new Error(`Insert error: ${error.message}`);
        
        const newObj: DeliveryZone = { ...payload, id: data.id };
        setZoneList((prev) => [...prev, newObj]);
        notify('নতুন ডেলিভারি জোন যোগ হয়েছে');
      }
      
      setEditingZoneId(null);
      setZoneForm(defaultZoneForm);
      try { window.dispatchEvent(new Event('delivery_zones_updated')); } catch {}
      if (onRefreshDeliveryZones) onRefreshDeliveryZones();
    } catch (err: any) {
      console.error('Zone save error:', err);
      notify('সেভ করতে ব্যর্থ হয়েছে: ' + (err?.message || 'Unknown error'), false);
    } finally {
      setZoneSaving(false);
    }
  };

  const confirmDeleteZone = async () => {
    if (!deleteConfirmZone) return;
    try {
      if (isValidUuid(deleteConfirmZone.id)) {
        const { error } = await supabase.from('delivery_zones').delete().eq('id', deleteConfirmZone.id);
        if (error) console.error('Supabase zone delete error:', error);
      }
      setZoneList((prev) => {
        const updated = prev.filter((z) => z.id !== deleteConfirmZone.id);
        try { localStorage.setItem('muba_delivery_zones', JSON.stringify(updated)); } catch {}
        return updated;
      });
      notify('ডেলিভারি জোন মুছে ফেলা হয়েছে');
      try { window.dispatchEvent(new Event('delivery_zones_updated')); } catch {}
      if (onRefreshDeliveryZones) onRefreshDeliveryZones();
    } catch (err) {
      console.error('General zone delete error:', err);
      notify('মুছে ফেলা যায়নি', false);
    } finally {
      setDeleteConfirmZone(null);
    }
  };


  useEffect(() => {
    if (categories && categories.length > 0) {
      setCatList(categories);
    }
  }, [categories]);

  /* -------------------------- Banner State -------------------------- */
  const [bannersList, setBannersList] = useState<Banner[]>(banners || []);
  const [bannerSaving, setBannerSaving] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [bannerUploadProgress, setBannerUploadProgress] = useState(0);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [deleteConfirmBanner, setDeleteConfirmBanner] = useState<Banner | null>(null);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);

  const emptyBannerForm = {
    title: '',
    description: '',
    image_url: '',
    link_url: '',
    sort_order: '1',
    is_active: true,
  };
  const [bannerForm, setBannerForm] = useState(emptyBannerForm);

  const notify = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000); };

  /* ------------------------------ Loaders ------------------------------ */
  const loadOrders = useCallback(async () => {
    let supabaseOrders: any[] = [];
    const orderItemsMap: Record<string, any[]> = {};

    try {
      const { rows, error } = await fetchAll<any>((f, t) =>
        supabase.from('orders').select('*').order('created_at', { ascending: false }).range(f, t)
      );
      if (!error && rows) {
        supabaseOrders = rows;
      }
    } catch (err) {
      console.warn('Could not fetch orders from Supabase:', err);
    }

    try {
      const { data: dbItems } = await supabase.from('order_items').select('*');
      if (dbItems && dbItems.length > 0) {
        dbItems.forEach((it: any) => {
          const ordId = it.order_id || it.orderId;
          if (ordId) {
            if (!orderItemsMap[ordId]) orderItemsMap[ordId] = [];
            orderItemsMap[ordId].push(it);
          }
        });
      }
    } catch {}

    const localOrders = loadLS<any[]>('cartapp_orders', []);
    const mergedMap = new Map<string, any>();

    localOrders.forEach((lo) => {
      const key = lo.orderNumber || lo.id;
      if (key) {
        mergedMap.set(key, {
          ...lo,
          id: lo.id || key,
          order_number: lo.orderNumber || lo.order_number || key,
          customer_name: lo.customerName || lo.customer_name,
          phone: lo.phone,
          address: lo.address,
          delivery_zone: lo.district || lo.delivery_zone,
          delivery_charge: lo.deliveryCharge || lo.delivery_charge,
          total: lo.total,
          status: lo.status || 'pending',
          created_at: lo.createdAt || lo.created_at,
          items: lo.items || []
        });
      }
    });

    supabaseOrders.forEach((so) => {
      const key = so.order_number || so.id;
      const existing = mergedMap.get(key) || {};
      const itemsFromDb = orderItemsMap[so.id] || orderItemsMap[so.order_number] || [];
      const combinedItems = (itemsFromDb.length > 0 ? itemsFromDb : null) || so.items || so.order_items || existing.items || [];

      mergedMap.set(key, {
        ...existing,
        ...so,
        id: so.id || existing.id,
        order_number: so.order_number || existing.order_number || key,
        customer_name: so.customer_name || existing.customer_name,
        phone: so.phone || existing.phone,
        address: so.address || existing.address,
        delivery_zone: so.delivery_zone || so.district || existing.delivery_zone,
        delivery_charge: so.delivery_charge ?? existing.delivery_charge,
        total: so.total ?? existing.total,
        status: so.status || existing.status || 'pending',
        created_at: so.created_at || existing.created_at,
        items: combinedItems
      });
    });

    const finalOrders = Array.from(mergedMap.values()).sort((a, b) => {
      const ta = new Date(a.created_at || a.createdAt || 0).getTime();
      const tb = new Date(b.created_at || b.createdAt || 0).getTime();
      return tb - ta;
    });

    setOrders(finalOrders);
    setLoadError('');
  }, []);

  const loadEvents = useCallback(async () => {
    const since = new Date(Date.now() - 30 * DAY).toISOString();
    const { rows, error } = await fetchAll<any>((f, t) =>
      supabase.from('site_events').select('event_type,session_id,country,source,created_at')
        .gte('created_at', since).order('created_at', { ascending: false }).range(f, t));
    setEvents(error ? [] : rows);
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const { data: sData, error: sErr } = await supabase.from('store_settings').select('key,value');
      if (!sErr && sData) {
        sData.forEach((row: any) => {
          if (!row.key || row.value === undefined || row.value === null) return;
          const val = String(row.value).trim();
          if (row.key === 'monthly_target' && val) { setTarget(Number(val) || 600000); setTargetInput(val); }
          if (row.key === 'site_name' && val) setSiteNameInput(val);
          if (row.key === 'site_number') setSiteNumberInput(val);
          if (row.key === 'promo_code') setPromoCodeInput(val);
          if (row.key === 'promo_discount') setPromoDiscountInput(val);
          if (row.key === 'bkash_number') setBkashNumberInput(val);
          if (row.key === 'nagad_number') setNagadNumberInput(val);
          if (row.key === 'free_shipping_threshold') setFreeShippingThresholdInput(val);
        });
      }

      const { data: zData, error: zErr } = await supabase.from('delivery_zones').select('*');
      if (!zErr && zData && zData.length > 0) {
        const inside = zData.find((z: any) => z.name_bn?.includes('ভিতরে') || z.name?.toLowerCase().includes('inside'));
        const outside = zData.find((z: any) => z.name_bn?.includes('বাইরে') || z.name?.toLowerCase().includes('outside'));
        if (inside) setInsideChargeInput(String(inside.charge));
        if (outside) setOutsideChargeInput(String(outside.charge));
      }
    } catch (err) {
      console.error('loadSettings error:', err);
    }
  }, []);

  const loadBanners = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('sort_order', { ascending: true });
      if (!error && data) {
        setBannersList(data);
        window.dispatchEvent(new CustomEvent('banners_updated'));
      }
    } catch (e) {
      console.log('Error loading banners:', e);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });
      if (!error && data && data.length > 0) {
        setCatList(data);
        try {
          localStorage.setItem('muba_custom_categories', JSON.stringify(data));
        } catch { /* ignore */ }
      }
    } catch (e) {
      console.log('Error loading categories:', e);
    }
  }, []);

  useEffect(() => {
    if (banners && banners.length > 0) {
      setBannersList(banners);
    }
  }, [banners]);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    Promise.all([loadOrders(), loadEvents(), loadSettings(), loadBanners(), loadCategories(), fetchSubCategories()]).finally(() => setLoading(false));
    let channel: any;
    try {
      channel = supabase.channel('admin-orders')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => loadOrders())
        .subscribe();
    } catch { /* realtime বন্ধ থাকলেও সমস্যা নেই */ }
    return () => { try { if (channel) supabase.removeChannel(channel); } catch { /* ignore */ } };
  }, [isOpen, loadOrders, loadEvents, loadSettings, loadBanners, loadCategories, fetchSubCategories]);

  /* ----------------------- Flash Sale Handlers ----------------------- */
  const toggleFlashSale = async (product: { id: string; is_flash_sale?: boolean }) => {
    const nextStatus = !product.is_flash_sale;

    // 1. Dispatch custom event for real-time update on front-end
    window.dispatchEvent(new Event('products_updated'));

    // 3. Try updating Supabase database
    try {
      if (isValidUuid(product.id)) {
        await supabase
          .from('products')
          .update({ is_flash_sale: nextStatus })
          .eq('id', product.id);
      }
      notify(nextStatus ? 'প্রোডাক্টটি Flash Sale-এ যোগ করা হয়েছে' : 'প্রোডাক্টটি Flash Sale থেকে বাদ দেওয়া হয়েছে');
      onRefreshProducts();
    } catch (err: any) {
      console.error('Error toggling flash sale:', err);
      notify(nextStatus ? 'প্রোডাক্টটি Flash Sale-এ সংরক্ষিত হয়েছে' : 'প্রোডাক্টটি Flash Sale থেকে সরানো হয়েছে');
      onRefreshProducts();
    }
  };

  /* ----------------------- Category Handlers ----------------------- */
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      notify('অনুগ্রহ করে ক্যাটাগরির ইংরেজি নাম প্রদান করুন', false);
      return;
    }

    setCategorySaving(true);
    const cleanSlug = (categoryForm.slug.trim() || categoryForm.name.trim())
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || `cat-${Date.now().toString(36)}`;

    const sortNum = parseInt(String(categoryForm.sort_order), 10) || 0;

    const payload: any = {
      name: categoryForm.name.trim(),
      name_en: categoryForm.name.trim(),
      name_bn: categoryForm.name_bn.trim() || categoryForm.name.trim(),
      slug: cleanSlug,
      icon: categoryForm.icon || 'Tag',
      sub_label: categoryForm.sub_label.trim() || '',
      image_url: categoryForm.image_url.trim() || '',
      sort_order: sortNum,
      is_active: categoryForm.is_active !== false,
      created_at: new Date().toISOString()
    };

    let savedCategory: Category | null = null;
    let savedInDb = false;

    try {
      const res = editingCategoryId && isValidUuid(editingCategoryId)
        ? await writeWithColumnFallback(
            (body) => supabase.from('categories').update(body).eq('id', editingCategoryId).select('*').maybeSingle(),
            payload
          )
        : await writeWithColumnFallback(
            (body) => supabase.from('categories').insert([body]).select('*').maybeSingle(),
            payload
          );

      if (res.error || !res.data) {
        console.error('Category save error:', res.error);
        notify('ক্যাটাগরি ডাটাবেজে সেভ হয়নি: ' + (res.error?.message || 'Unknown error'), false);
        setCategorySaving(false);
        return;
      }
      savedCategory = res.data;
      savedInDb = true;
    } catch (err: any) {
      console.error('Supabase category operation failed:', err);
      notify(`ক্যাটাগরি সেভ করতে সমস্যা হয়েছে: ${err?.message || 'Unknown error'}`, false);
      setCategorySaving(false);
      return;
    }

    setCatList((prev) => {
      let updated: Category[];
      if (editingCategoryId) {
        updated = prev.map((c) => (c.id === editingCategoryId ? { ...c, ...savedCategory! } : c));
      } else {
        updated = [...prev, savedCategory!];
      }
      updated.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      try {
        localStorage.setItem('muba_custom_categories', JSON.stringify(updated));
      } catch { /* ignore */ }
      return updated;
    });

    notify(
      editingCategoryId
        ? (savedInDb ? 'ক্যাটাগরি ডাটাবেজে আপডেট হয়েছে!' : 'ক্যাটাগরি আপডেট করা হয়েছে!')
        : (savedInDb ? 'নতুন ক্যাটাগরি সফলভাবে যোগ হয়েছে!' : 'নতুন ক্যাটাগরি সংরক্ষিত হয়েছে!'),
      true
    );

    setCategoryForm(defaultCategoryForm);
    setEditingCategoryId(null);
    setCategorySaving(false);

    try { window.dispatchEvent(new Event('categories_updated')); } catch { /* ignore */ }
    if (onRefreshCategories) onRefreshCategories();
    if (onRefreshProducts) onRefreshProducts();
  };

  const handleDeleteCategory = async (cat: Category) => {
    setDeleteConfirmCategory(cat);
  };

  const confirmDeleteCategory = async () => {
    if (!deleteConfirmCategory) return;
    setDeletingCategory(true);
    try {
      if (isValidUuid(deleteConfirmCategory.id)) {
        await supabase.from('categories').delete().eq('id', deleteConfirmCategory.id);
      }

      setCatList((prev) => {
        const updated = prev.filter((c) => c.id !== deleteConfirmCategory.id);
        try {
          localStorage.setItem('muba_custom_categories', JSON.stringify(updated));
        } catch { /* ignore */ }
        return updated;
      });

      notify('ক্যাটাগরি মুছে ফেলা হয়েছে', true);
      if (editingCategoryId === deleteConfirmCategory.id) {
        setEditingCategoryId(null);
        setCategoryForm(defaultCategoryForm);
      }
      if (onRefreshCategories) onRefreshCategories();
      if (onRefreshProducts) onRefreshProducts();
    } catch (e) {
      console.warn('Error deleting category from Supabase:', e);
      notify('ক্যাটাগরি মুছে ফেলা যায়নি', false);
    } finally {
      setDeletingCategory(false);
      setDeleteConfirmCategory(null);
    }
  };

  const handleToggleCategoryActive = async (cat: Category) => {
    const newActive = !(cat.is_active !== false);
    try {
      if (isValidUuid(cat.id)) {
        await supabase.from('categories').update({ is_active: newActive }).eq('id', cat.id);
      }
    } catch (e) {
      console.warn('Error toggling category status:', e);
    }

    setCatList((prev) => {
      const updated = prev.map((c) => (c.id === cat.id ? { ...c, is_active: newActive } : c));
      try {
        localStorage.setItem('muba_custom_categories', JSON.stringify(updated));
      } catch { /* ignore */ }
      return updated;
    });

    notify(newActive ? 'ক্যাটাগরি সক্রিয় করা হয়েছে' : 'ক্যাটাগরি নিষ্ক্রিয় করা হয়েছে', true);
    if (onRefreshCategories) onRefreshCategories();
  };

  const handleMoveCategoryOrder = async (cat: Category, direction: 'up' | 'down') => {
    const sorted = [...catList].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    const idx = sorted.findIndex(c => c.id === cat.id);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sorted.length) return;

    const currentOrder = sorted[idx].sort_order ?? idx;
    const targetOrder = sorted[targetIdx].sort_order ?? targetIdx;

    const newCurrentOrder = targetOrder;
    const newTargetOrder = currentOrder === targetOrder ? (direction === 'up' ? currentOrder - 1 : currentOrder + 1) : currentOrder;

    sorted[idx].sort_order = newCurrentOrder;
    sorted[targetIdx].sort_order = newTargetOrder;

    setCatList([...sorted]);
    try {
      localStorage.setItem('muba_custom_categories', JSON.stringify(sorted));
      if (isValidUuid(sorted[idx].id)) {
        await supabase.from('categories').update({ sort_order: newCurrentOrder }).eq('id', sorted[idx].id);
      }
      if (isValidUuid(sorted[targetIdx].id)) {
        await supabase.from('categories').update({ sort_order: newTargetOrder }).eq('id', sorted[targetIdx].id);
      }
    } catch { /* ignore */ }
    notify('ক্রম সাজানো সফল হয়েছে', true);
    if (onRefreshCategories) onRefreshCategories();
  };

  /* ----------------------- Image Upload Handlers ----------------------- */
  // প্রথম bucket না থাকলে পরের bucket এ চেষ্টা করে
  const uploadImageToBuckets = async (buckets: string[], path: string, blob: Blob): Promise<string> => {
    let lastErr: any = null;
    for (const b of buckets) {
      const { error } = await supabase.storage.from(b).upload(path, blob, {
        contentType: 'image/webp', cacheControl: '3600', upsert: true,
      });
      if (!error) {
        const { data } = supabase.storage.from(b).getPublicUrl(path);
        return data.publicUrl;
      }
      console.warn(`Upload to bucket "${b}" failed:`, error.message);
      lastErr = error;
    }
    throw lastErr || new Error('Upload failed');
  };

  const uploadErrorMsg = (err: any) => {
    const m = String(err?.message || 'Unknown error');
    return /bucket not found/i.test(m)
      ? 'Storage bucket পাওয়া যায়নি। Products পেজের "Supabase SQL কোড" একবার Run করুন।'
      : m;
  };

  const handleBannerImageUpload = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      notify('অনুগ্রহ করে শুধুমাত্র ছবি ফাইল নির্বাচন করুন', false);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      notify('ছবির সাইজ সর্বোচ্চ ৫MB হতে পারবে', false);
      return;
    }

    setBannerUploading(true);
    setBannerUploadProgress(10);

    try {
      const compressed = await compressImage(file, 1920, 0.85);
      setBannerUploadProgress(45);

      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;
      const publicUrl = await uploadImageToBuckets(['banners', 'product-images'], path, compressed);
      setBannerUploadProgress(85);

      setBannerForm((prev) => ({ ...prev, image_url: publicUrl }));
      setBannerUploadProgress(100);
      notify('ব্যানারের ছবি সফলভাবে আপলোড হয়েছে!');
    } catch (err: any) {
      console.error('Banner upload error:', err);
      notify('ছবি আপলোডে সমস্যা হয়েছে: ' + uploadErrorMsg(err), false);
    } finally {
      setBannerUploading(false);
      setTimeout(() => setBannerUploadProgress(0), 400);
    }
  };

  const handleCategoryImageUpload = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      notify('অনুগ্রহ করে শুধুমাত্র ছবি ফাইল নির্বাচন করুন', false);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      notify('ছবির সাইজ সর্বোচ্চ ৫MB হতে পারবে', false);
      return;
    }

    setCategoryUploading(true);

    try {
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
      const compressed = await compressImage(file, 800, 0.8);

      const publicUrl = await uploadImageToBuckets(['categories', 'category-images', 'product-images'], fileName, compressed);

      setCategoryForm((prev) => ({ ...prev, image_url: publicUrl }));
      notify('ক্যাটাগরি ছবি সফলভাবে আপলোড হয়েছে!');
    } catch (err: any) {
      console.error('Category upload error:', err);
      notify('ছবি আপলোডে সমস্যা হয়েছে: ' + uploadErrorMsg(err), false);
    } finally {
      setCategoryUploading(false);
    }
  };

  const handleSubCategoryImageUpload = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      notify('অনুগ্রহ করে শুধুমাত্র ছবি ফাইল নির্বাচন করুন', false);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      notify('ছবির সাইজ সর্বোচ্চ ৫MB হতে পারবে', false);
      return;
    }

    setSubCatUploading(true);

    try {
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
      const compressed = await compressImage(file, 800, 0.8);

      const publicUrl = await uploadImageToBuckets(['subcategories', 'categories', 'product-images'], fileName, compressed);

      setSubCatForm((prev) => ({ ...prev, image_url: publicUrl }));
      notify('সাব-ক্যাটাগরি ছবি সফলভাবে আপলোড হয়েছে!');
    } catch (err: any) {
      console.error('SubCategory upload error:', err);
      notify('ছবি আপলোডে সমস্যা হয়েছে: ' + uploadErrorMsg(err), false);
    } finally {
      setSubCatUploading(false);
    }
  };

  /* ----------------------- Banner Handlers ----------------------- */
  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    const imgUrl = bannerForm.image_url.trim();
    if (!imgUrl) {
      notify('অনুগ্রহ করে একটি ব্যানারের ছবি দিন (আপলোড বা URL)', false);
      return;
    }

    setBannerSaving(true);
    const orderNum = parseInt(bannerForm.sort_order, 10) || 0;
    const bannerTitle = (bannerForm.title || '').trim() || 'Special Offer';
    const bannerDesc = (bannerForm.description || '').trim() || '';
    const bannerLink = (bannerForm.link_url || '').trim() || '';

    const payload = {
      title: bannerTitle,
      description: bannerDesc,
      image_url: imgUrl,
      link_url: bannerLink,
      sort_order: orderNum,
      is_active: bannerForm.is_active,
    };

    try {
      if (editingBannerId) {
        const { error } = await supabase
          .from('banners')
          .update(payload)
          .eq('id', editingBannerId);

        if (error) {
          notify('ব্যানার আপডেট করতে সমস্যা হয়েছে: ' + error.message, false);
          return;
        }

        setBannersList((prev) =>
          prev.map((b) => (b.id === editingBannerId ? { ...b, ...payload } : b))
        );
        notify('ব্যানার সফলভাবে আপডেট হয়েছে!');
      } else {
        const { data, error } = await supabase
          .from('banners')
          .insert([payload])
          .select();

        if (error) {
          notify('ব্যানার যোগ করতে ব্যর্থ হয়েছে: ' + error.message, false);
          return;
        }

        if (data && data[0]) {
          setBannersList((prev) => [...prev, data[0]]);
        }
        window.dispatchEvent(new CustomEvent('banners_updated'));
        window.dispatchEvent(new Event('banners_updated'));
        notify('ব্যানার সফলভাবে যোগ হয়েছে!');
      }

      setBannerForm({
        title: '',
        description: '',
        image_url: '',
        link_url: '',
        sort_order: String((bannersList.length || 0) + 1),
        is_active: true,
      });
      setEditingBannerId(null);
      loadBanners();
      onRefreshBanners?.();
    } catch (err: any) {
      console.error('Error saving banner:', err);
      notify('ব্যানার সেভ করা যায়নি', false);
    } finally {
      setBannerSaving(false);
    }
  };

  const startEditBanner = (b: Banner) => {
    setEditingBannerId(b.id || null);
    setBannerForm({
      title: b.title || '',
      description: b.description || '',
      image_url: b.image_url || '',
      link_url: (b as any).link_url || (b as any).link || '',
      sort_order: String(b.sort_order ?? 0),
      is_active: b.is_active !== false,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditBanner = () => {
    setEditingBannerId(null);
    setBannerForm({
      title: '',
      description: '',
      image_url: '',
      link_url: '',
      sort_order: String((bannersList.length || 0) + 1),
      is_active: true,
    });
  };

  const toggleBannerStatus = async (b: Banner) => {
    const nextStatus = !b.is_active;
    try {
      await supabase.from('banners').update({ is_active: nextStatus }).eq('id', b.id);
    } catch (e) {
      console.warn('Toggle status warning:', e);
    }
    setBannersList((prev) =>
      prev.map((item) => (item.id === b.id ? { ...item, is_active: nextStatus } : item))
    );
    notify(nextStatus ? 'ব্যানার সক্রিয় করা হয়েছে' : 'ব্যানার নিষ্ক্রিয় করা হয়েছে');
    onRefreshBanners?.();
  };

  const moveBannerOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= bannersList.length) return;

    const currentBanner = bannersList[index];
    const targetBanner = bannersList[targetIndex];

    const currentOrder = currentBanner.sort_order ?? index;
    const targetOrder = targetBanner.sort_order ?? targetIndex;

    const newOrderCurrent = targetOrder === currentOrder ? (direction === 'up' ? targetOrder - 1 : targetOrder + 1) : targetOrder;
    const newOrderTarget = currentOrder;

    const updatedList = [...bannersList];
    updatedList[index] = { ...currentBanner, sort_order: newOrderCurrent };
    updatedList[targetIndex] = { ...targetBanner, sort_order: newOrderTarget };
    updatedList.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    setBannersList(updatedList);

    try {
      await Promise.all([
        supabase.from('banners').update({ sort_order: newOrderCurrent }).eq('id', currentBanner.id),
        supabase.from('banners').update({ sort_order: newOrderTarget }).eq('id', targetBanner.id),
      ]);
    } catch (e) {
      console.warn('Reorder error:', e);
    }
    notify('ব্যানারের ক্রম আপডেট হয়েছে');
    onRefreshBanners?.();
  };

  const handleDeleteBanner = async (b: Banner) => {
    try {
      if (b.id) {
        if (isValidUuid(b.id)) {
          await supabase.from('banners').delete().eq('id', b.id);
        } else if (b.title) {
          await supabase.from('banners').delete().eq('title', b.title);
        }
      }

      if (b.image_url && b.image_url.includes('/banners/')) {
        const parts = b.image_url.split('/banners/');
        const path = parts[parts.length - 1];
        if (path) {
          try { await supabase.storage.from('banners').remove([path]); } catch {}
        }
      }

      const nextList = bannersList.filter((item) => item.id !== b.id && item.title !== b.title);
      setBannersList(nextList);

      if (nextList.length === 0) {
        try {
          await supabase.from('store_settings').upsert({ key: 'banners_cleared', value: 'true' }, { onConflict: 'key' });
          localStorage.setItem('muba_banners_cleared', 'true');
        } catch {}
      }

      if (editingBannerId === b.id) {
        cancelEditBanner();
      }
      setDeleteConfirmBanner(null);
      window.dispatchEvent(new CustomEvent('banners_updated'));
      window.dispatchEvent(new Event('banners_updated'));
      notify('ব্যানার সফলভাবে মুছে ফেলা হয়েছে');
      onRefreshBanners?.();
    } catch (e: any) {
      console.warn('Delete banner error:', e);
      notify('মুছে ফেলা যায়নি', false);
    }
  };

  /* ------------------------------ Derived ------------------------------ */
  const valid = useMemo(() => orders.filter((o) => o.status !== 'cancelled'), [orders]);
  const pendingCount = useMemo(() => orders.filter((o) => (o.status || 'pending') === 'pending').length, [orders]);

  const stats = useMemo(() => {
    const t = Date.now();
    const sum = (a: number, b: number) => valid.filter((o) => ts(o) >= a && ts(o) < b).reduce((s, o) => s + (o.total || 0), 0);
    const cnt = (a: number, b: number) => orders.filter((o) => ts(o) >= a && ts(o) < b).length;
    const visits = events.filter((e) => e.event_type === 'visit');
    const sess = (a: number, b: number) => new Set(visits.filter((e) => ts(e) >= a && ts(e) < b).map((e, i) => e.session_id || `x${i}`)).size;
    return {
      sales: valid.reduce((s, o) => s + (o.total || 0), 0),
      salesDelta: pctChange(sum(t - 7 * DAY, t + 1), sum(t - 14 * DAY, t - 7 * DAY)),
      orders: orders.length,
      ordersDelta: pctChange(cnt(t - 7 * DAY, t + 1), cnt(t - 14 * DAY, t - 7 * DAY)),
      visitors: new Set(visits.map((e, i) => e.session_id || `x${i}`)).size,
      visitorsDelta: pctChange(sess(t - 7 * DAY, t + 1), sess(t - 14 * DAY, t - 7 * DAY)),
    };
  }, [valid, orders, events]);

  const series = useMemo(() => {
    const out: { label: string; revenue: number; orders: number }[] = [];
    const map: Record<string, { revenue: number; orders: number }> = {};
    orders.forEach((o) => {
      if (!o.created_at) return;
      const k = dayKey(new Date(o.created_at));
      map[k] = map[k] || { revenue: 0, orders: 0 };
      map[k].orders += 1;
      if (o.status !== 'cancelled') map[k].revenue += o.total || 0;
    });
    for (let i = rangeDays - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * DAY);
      const v = map[dayKey(d)] || { revenue: 0, orders: 0 };
      out.push({ label: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), ...v });
    }
    return out;
  }, [orders, rangeDays]);

  const monthly = useMemo(() => {
    const n = new Date();
    const start = new Date(n.getFullYear(), n.getMonth(), 1).getTime();
    const prevStart = new Date(n.getFullYear(), n.getMonth() - 1, 1).getTime();
    const cur = valid.filter((o) => ts(o) >= start).reduce((s, o) => s + (o.total || 0), 0);
    const prev = valid.filter((o) => ts(o) >= prevStart && ts(o) < start).reduce((s, o) => s + (o.total || 0), 0);
    return { cur, delta: pctChange(cur, prev) };
  }, [valid]);
  const targetPct = target > 0 ? monthly.cur / target : 0;

  const topCats = useMemo(() => {
    const byId = new Map(prods.map((p) => [p.id, p]));
    const totals: Record<string, number> = {};
    valid.forEach((o) => getItems(o).forEach((it) => {
      const p = byId.get(it.product_id ?? it.id);
      const cid = p?.category_id || 'none';
      const qty = Number(it.quantity ?? it.qty ?? 1);
      totals[cid] = (totals[cid] || 0) + Number(it.price ?? p?.price ?? 0) * qty;
    }));
    let mode: 'sales' | 'inventory' = 'sales';
    if (!Object.values(totals).some((v) => v > 0)) {
      mode = 'inventory';
      prods.forEach((p) => { const cid = p.category_id || 'none'; totals[cid] = (totals[cid] || 0) + (p.price || 0) * (p.stock ?? 0); });
    }
    const list = Object.entries(totals).filter(([, v]) => v > 0)
      .map(([id, value]) => ({ name: id === 'none' ? 'Others' : catName(id), value }))
      .sort((a, b) => b.value - a.value);
    const top = list.slice(0, 4);
    const rest = list.slice(4).reduce((s, x) => s + x.value, 0);
    if (rest > 0) top.push({ name: 'Others', value: rest });
    return { mode, list: top, total: list.reduce((s, x) => s + x.value, 0) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valid, prods, cats]);

  const countries = useMemo(() => {
    const m: Record<string, Set<string>> = {};
    const all = new Set<string>();
    events.filter((e) => e.event_type === 'visit').forEach((e, i) => {
      const sid = e.session_id || `x${i}`; const c = e.country || 'Unknown';
      (m[c] = m[c] || new Set()).add(sid); all.add(sid);
    });
    return { total: all.size, list: Object.entries(m).map(([name, s]) => ({ name, n: s.size })).sort((a, b) => b.n - a.n).slice(0, 4) };
  }, [events]);

  const sources = useMemo(() => {
    const m: Record<string, Set<string>> = {};
    events.filter((e) => e.event_type === 'visit').forEach((e, i) => { const s = e.source || 'direct'; (m[s] = m[s] || new Set()).add(e.session_id || `x${i}`); });
    const total = Object.values(m).reduce((s, x) => s + x.size, 0);
    return { total, list: Object.keys(SOURCE_LABEL).map((k) => ({ key: k, label: SOURCE_LABEL[k], n: m[k]?.size || 0 })).sort((a, b) => b.n - a.n) };
  }, [events]);

  const funnel = useMemo(() => {
    const since = Date.now() - funnelDays * DAY;
    const ev = events.filter((e) => ts(e) >= since);
    const set = (type: string) => new Set(ev.filter((e) => e.event_type === type).map((e, i) => e.session_id || `x${i}`));
    const views = ev.filter((e) => e.event_type === 'product_view').length;
    const cart = set('add_to_cart'), chk = set('checkout_start'), buy = set('purchase');
    const abandoned = Array.from(cart).filter((s) => !buy.has(s)).length;
    return [
      { label: 'Product Views', n: views }, { label: 'Add to Cart', n: cart.size },
      { label: 'Proceed to Checkout', n: chk.size }, { label: 'Completed Purchases', n: buy.size },
      { label: 'Abandoned Carts', n: abandoned },
    ];
  }, [events, funnelDays]);

  const filteredOrders = useMemo(() => {
    const q = orderQuery.trim().toLowerCase();
    return orders.filter((o) =>
      (orderStatus === 'all' || (o.status || 'pending') === orderStatus) &&
      (!q || [o.order_number, o.customer_name, o.phone, o.address].some((v) => (v || '').toLowerCase().includes(q))));
  }, [orders, orderQuery, orderStatus]);

  const customers = useMemo(() => {
    const m = new Map<string, { name: string; phone: string; address: string; count: number; spent: number; last: number }>();
    orders.forEach((o) => {
      const key = o.phone || o.customer_name || 'unknown';
      const c = m.get(key) || { name: o.customer_name || '—', phone: o.phone || '—', address: o.address || '', count: 0, spent: 0, last: 0 };
      c.count += 1; if (o.status !== 'cancelled') c.spent += o.total || 0; c.last = Math.max(c.last, ts(o));
      m.set(key, c);
    });
    const q = customerQuery.trim().toLowerCase();
    return Array.from(m.values()).filter((c) => !q || c.name.toLowerCase().includes(q) || c.phone.includes(q)).sort((a, b) => b.spent - a.spent);
  }, [orders, customerQuery]);

  const reportOrders = useMemo(() => {
    const a = new Date(reportFrom + 'T00:00:00').getTime(), b = new Date(reportTo + 'T23:59:59').getTime();
    return orders.filter((o) => ts(o) >= a && ts(o) <= b);
  }, [orders, reportFrom, reportTo]);

  /* ------------------------------ Actions ------------------------------ */
  const updateStatus = async (orderOrId: any, status: string) => {
    const orderObj = typeof orderOrId === 'object' && orderOrId ? orderOrId : orders.find((o) => o.id === orderOrId || o.order_number === orderOrId);
    const ordId = orderObj?.id || (typeof orderOrId === 'string' ? orderOrId : '');
    const ordNum = orderObj?.order_number || ordId;

    // 1. Update React state
    setOrders((prev) =>
      prev.map((o) =>
        (ordId && o.id === ordId) || (ordNum && o.order_number === ordNum)
          ? { ...o, status }
          : o
      )
    );

    // 2. Update localStorage cartapp_orders
    try {
      const local = loadLS<any[]>('cartapp_orders', []);
      const updatedLocal = local.map((lo) => {
        if ((ordId && lo.id === ordId) || (ordNum && (lo.orderNumber === ordNum || lo.order_number === ordNum))) {
          return { ...lo, status };
        }
        return lo;
      });
      saveLS('cartapp_orders', updatedLocal);
      window.dispatchEvent(new Event('cartapp_orders_updated'));
    } catch {}

    // 3. Update Supabase
    try {
      if (ordNum) {
        await supabase.from('orders').update({ status }).eq('order_number', ordNum);
      }
      if (ordId && isValidUuid(ordId)) {
        await supabase.from('orders').update({ status }).eq('id', ordId);
      }
    } catch (e) {
      console.warn('Status update db sync error:', e);
    }
    notify('অর্ডারের স্ট্যাটাস আপডেট হয়েছে: ' + status);
  };

  const handleMultipleImageUpload = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const newUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const compressed = await compressImage(file);
        const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const path = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}_${cleanName}`;

        const { error } = await supabase.storage.from('product-images').upload(path, compressed, {
          cacheControl: '3600',
          upsert: true
        });

        if (!error) {
          const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(path);
          if (urlData?.publicUrl) {
            newUrls.push(urlData.publicUrl);
            continue;
          }
        }

        console.warn('Supabase storage fallback used:', error?.message);
        const base64Url = await blobToBase64(compressed);
        newUrls.push(base64Url);
      } catch (err) {
        console.error('File process error:', err);
        try {
          const fallbackBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          newUrls.push(fallbackBase64);
        } catch {
          notify(`Failed to process ${file.name}`, false);
        }
      }
    }

    if (newUrls.length > 0) {
      setForm((prev) => {
        const updatedImages = [...(prev.images || []), ...newUrls];
        return {
          ...prev,
          images: updatedImages,
          image_url: prev.image_url || updatedImages[0] || '',
        };
      });
      notify(`${newUrls.length} টি ছবি যোগ হয়েছে!`);
    }
    setUploading(false);
  };

  const removeImage = (indexToRemove: number) => {
    setForm((prev) => {
      const updated = prev.images.filter((_, idx) => idx !== indexToRemove);
      return {
        ...prev,
        images: updated,
        image_url: updated[0] || '',
      };
    });
  };

  const setAsMainImage = (url: string) => {
    setForm((prev) => {
      const reordered = [url, ...prev.images.filter((img) => img !== url)];
      return {
        ...prev,
        images: reordered,
        image_url: url,
      };
    });
    notify('মেইন ইমেজ হিসেবে সেট করা হয়েছে');
  };

  const addImageUrl = () => {
    const val = imageUrlInput.trim();
    if (!val) return;
    if (!val.startsWith('http://') && !val.startsWith('https://') && !val.startsWith('data:image/')) {
      notify('সঠিক ইমেজ URL দিন (https://...)', false);
      return;
    }
    setForm((prev) => {
      const updated = [...(prev.images || []), val];
      return {
        ...prev,
        images: updated,
        image_url: prev.image_url || val,
      };
    });
    setImageUrlInput('');
    notify('ছবির লিঙ্ক যোগ হয়েছে!');
  };

  const openForm = (p?: any) => {
    let initialImages: string[] = [];
    if (p?.images && Array.isArray(p.images) && p.images.length > 0) {
      initialImages = [...p.images];
    } else if (p?.image_url) {
      initialImages = [p.image_url];
    }

    setForm(p ? {
      id: p.id,
      name: p.name || '',
      name_bn: p.name_bn || '',
      description: p.description || '',
      description_bn: p.description_bn || '',
      price: String(p.price ?? ''),
      old_price: p.old_price ? String(p.old_price) : '',
      stock: String(p.stock ?? 50),
      category_id: p.category_id || '',
      subcategory_id: p.subcategory_id || '',
      image_url: p.image_url || initialImages[0] || '',
      images: initialImages,
      enable_size: !!p.enable_size,
      enable_color: !!p.enable_color,
      is_flash_sale: Boolean(p.is_flash_sale),
      sizes: p.sizes || (p.variants ? p.variants.filter((v: any) => v.name === 'Size').map((v: any) => v.value) : []),
      colors: p.colors || (p.variants ? p.variants.filter((v: any) => v.name === 'Color').map((v: any) => v.value) : []),
    } : {
      ...emptyForm,
      category_id: '',
      subcategory_id: '',
      images: [],
      sizes: [],
      colors: [],
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.price) return;
    setSaving(true);

    const primaryImage = (form.images && form.images.length > 0)
      ? form.images[0]
      : (form.image_url.trim() || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80');

    const allImages = (form.images && form.images.length > 0)
      ? form.images
      : [primaryImage];

    const selectedSubObj = form.subcategory_id
      ? subCatList.find((s) => s.id === form.subcategory_id || s.slug === form.subcategory_id)
      : undefined;

    const rawCategoryKey = form.category_id || selectedSubObj?.category_id || '';
    let validCategoryId: string | null = null;
    if (rawCategoryKey) {
      const resolvedCat = await ensureSupabaseCategoryUuid(rawCategoryKey);
      if (isValidUuid(resolvedCat)) {
        validCategoryId = resolvedCat;
      } else {
        const matched = catList.find((c) => c.id === rawCategoryKey || (c as any).slug === rawCategoryKey);
        if (matched && isValidUuid(matched.id)) {
          validCategoryId = matched.id || null;
        }
      }
    }

    const rawSubCategoryId = form.subcategory_id ? form.subcategory_id.trim() : null;
    const validSubCategoryId: string | null = rawSubCategoryId && isValidUuid(rawSubCategoryId)
      ? rawSubCategoryId
      : null;

    const isExistingDbProduct = isValidUuid(form.id);

    // Do not block saving if category is not selected; allow nullable category_id
    const finalCategoryId = validCategoryId || (form.category_id && isValidUuid(form.category_id) ? form.category_id : null);

    const currentPrice = parseFloat(form.price) || 0;
    const oldPriceVal = form.old_price && form.old_price.trim() !== '' ? parseFloat(form.old_price) : null;
    const discountPct = oldPriceVal && oldPriceVal > currentPrice
      ? Math.round(((oldPriceVal - currentPrice) / oldPriceVal) * 100)
      : 0;


    // Exact schema matching public.products columns in Supabase:
    // (Notice: 'title', 'title_bn', 'image', 'category_slug' do NOT exist in the table and cause PGRST204 errors)
    const payload: Record<string, any> = {
      name: form.name.trim(),
      name_bn: form.name_bn.trim() || form.name.trim(),
      description: form.description.trim() || '',
      description_bn: form.description_bn.trim() || '',
      price: currentPrice,
      old_price: oldPriceVal,
      discount_percent: discountPct,
      stock: parseInt(form.stock || '0', 10),
      image_url: primaryImage,
      images: allImages,
      category_id: finalCategoryId,
      subcategory_id: validSubCategoryId,
      is_flash_sale: Boolean(form.is_flash_sale),
      enable_size: Boolean(form.enable_size),
      enable_color: Boolean(form.enable_color),
      sizes: form.sizes || [],
      colors: form.colors || [],
    };

    if (!isExistingDbProduct) {
       let newSlug = form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
       const { data: existing } = await supabase.from('products').select('slug').eq('slug', newSlug).maybeSingle();
       if (existing) {
           newSlug += '-' + Date.now().toString(36).slice(-4);
       }
       payload.slug = newSlug;
    }
    
    console.log('Saving product to Supabase, payload:', payload);

    const saveAttempt = (dataToSave: Record<string, any>) => {
      if (isExistingDbProduct && form.id) {
        return supabase.from('products').update(dataToSave).eq('id', form.id).select('id').maybeSingle();
      }
      return supabase.from('products').insert(dataToSave).select('id').maybeSingle();
    };

    const result = await writeWithColumnFallback(saveAttempt, payload);

    if (result.error) {
      console.error('Supabase product save error:', result.error);
      notify(`ডাটাবেজ সেভ ত্রুটি: ${result.error.message}`, false);
      setSaving(false);
      return;
    }
    console.log('Supabase product successfully saved to cloud DB:', result.data);

    const assignedId = result.data?.id;

    // Broadcast update across the whole application
    window.dispatchEvent(new Event('products_updated'));

    notify(form.id ? 'প্রোডাক্ট ডাটাবেজে সফলভাবে আপডেট হয়েছে!' : 'নতুন প্রোডাক্ট সফলভাবে যোগ হয়েছে!', true);
    setSaving(false);

    setShowForm(false);
    setForm(emptyForm);
    setImageUrlInput('');
    if (onRefreshProducts) onRefreshProducts();
  };

  const confirmDeleteProduct = async () => {
    if (!deleteConfirmProduct) return;
    const id = deleteConfirmProduct.id;
    setDeletingProduct(true);
    try {
      if (isValidUuid(id)) {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) {
          console.warn('Supabase product delete warning:', error.message);
        }
      }
      setSelectedIds((prev) => prev.filter((x) => x !== id));
      notify('প্রোডাক্ট সফলভাবে ডিলিট হয়েছে', true);
      if (onRefreshProducts) onRefreshProducts();
    } catch (err: any) {
      console.warn('Error deleting product:', err);
      notify('প্রোডাক্ট সফলভাবে ডিলিট হয়েছে', true);
      if (onRefreshProducts) onRefreshProducts();
    } finally {
      setDeletingProduct(false);
      setDeleteConfirmProduct(null);
    }
  };

  const confirmDeleteOrder = async () => {
    if (!deleteConfirmOrder) return;
    const id = deleteConfirmOrder.id;
    if (!id) {
      setDeleteConfirmOrder(null);
      return;
    }
    setDeletingOrder(true);
    try {
      try { await supabase.from('order_items').delete().eq('order_id', id); } catch { /* ignore */ }
      if (isValidUuid(id)) {
        const { error } = await supabase.from('orders').delete().eq('id', id);
        if (error) {
          console.warn('Supabase order delete warning:', error.message);
        }
      }
      setOrders((prev) => prev.filter((o) => o.id !== id));
      if (expanded === id) setExpanded(null);
      notify('অর্ডার সফলভাবে ডিলিট হয়েছে', true);
    } catch (err: any) {
      console.warn('Error deleting order:', err);
      setOrders((prev) => prev.filter((o) => o.id !== id));
      if (expanded === id) setExpanded(null);
      notify('অর্ডার সফলভাবে ডিলিট হয়েছে', true);
    } finally {
      setDeletingOrder(false);
      setDeleteConfirmOrder(null);
    }
  };

  /* ------------------- Edit Order Handlers ------------------- */
  const handleOpenEditOrder = (o: OrderLite) => {
    setEditingOrder(o);
    setOrderEditForm({
      customer_name: o.customer_name || '',
      phone: o.phone || '',
      address: o.address || '',
      delivery_zone: o.delivery_zone || (o.address?.includes('বাইরে') ? 'ঢাকার বাইরে' : 'ঢাকার ভিতরে'),
      delivery_charge: String(o.delivery_charge !== undefined ? o.delivery_charge : (o.delivery_zone?.includes('বাইরে') ? 130 : 60)),
      status: o.status || 'pending',
      payment_method: o.payment_method || 'cod',
      total: String(o.total || 0)
    });
  };

  const handleSaveOrderEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;
    setOrderEditSaving(true);

    const chargeNum = parseFloat(orderEditForm.delivery_charge) || 0;
    const totalNum = parseFloat(orderEditForm.total) || 0;
    const orderNum = editingOrder.order_number || editingOrder.id || '';

    // Database payload (ONLY valid columns in Supabase orders table)
    const dbPayload: Record<string, any> = {
      order_number: orderNum,
      customer_name: orderEditForm.customer_name.trim(),
      phone: orderEditForm.phone.trim(),
      address: orderEditForm.address.trim(),
      delivery_zone: orderEditForm.delivery_zone,
      delivery_charge: chargeNum,
      subtotal: Math.max(0, totalNum - chargeNum),
      total: totalNum,
      status: orderEditForm.status,
      payment_method: orderEditForm.payment_method
    };

    const localUpdatedFields = {
      customer_name: orderEditForm.customer_name.trim(),
      customerName: orderEditForm.customer_name.trim(),
      phone: orderEditForm.phone.trim(),
      address: orderEditForm.address.trim(),
      district: orderEditForm.delivery_zone,
      delivery_zone: orderEditForm.delivery_zone,
      delivery_charge: chargeNum,
      deliveryCharge: chargeNum,
      total: totalNum,
      status: orderEditForm.status,
      payment_method: orderEditForm.payment_method,
      deliveryMethod: (orderEditForm.payment_method || '').toLowerCase().includes('bkash') ? 'bkash' : 'cod'
    };

    // 1. Update in local state
    setOrders((prev) =>
      prev.map((o) => {
        const isMatch =
          (editingOrder.id && o.id === editingOrder.id) ||
          (editingOrder.order_number && o.order_number === editingOrder.order_number) ||
          (orderNum && (o.id === orderNum || o.order_number === orderNum));
        return isMatch ? { ...o, ...localUpdatedFields } : o;
      })
    );

    // 2. Update in localStorage cartapp_orders
    try {
      const local = loadLS<any[]>('cartapp_orders', []);
      let found = false;
      const updatedLocal = local.map((lo) => {
        const isMatch =
          (editingOrder.id && lo.id === editingOrder.id) ||
          (editingOrder.order_number && (lo.orderNumber === editingOrder.order_number || lo.order_number === editingOrder.order_number)) ||
          (orderNum && (lo.id === orderNum || lo.orderNumber === orderNum || lo.order_number === orderNum));
        if (isMatch) {
          found = true;
          return {
            ...lo,
            ...localUpdatedFields
          };
        }
        return lo;
      });

      if (!found && orderNum) {
        updatedLocal.unshift({
          ...editingOrder,
          ...localUpdatedFields,
          id: editingOrder.id || orderNum,
          orderNumber: orderNum,
          order_number: orderNum
        });
      }

      saveLS('cartapp_orders', updatedLocal);
      window.dispatchEvent(new Event('cartapp_orders_updated'));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }

    // 3. Upsert into Supabase database
    try {
      const { error: upsertErr } = await supabase
        .from('orders')
        .upsert([dbPayload], { onConflict: 'order_number' });

      if (upsertErr) {
        console.warn('Supabase upsert error, trying fallback update:', upsertErr.message);
        if (orderNum) {
          await supabase.from('orders').update(dbPayload).eq('order_number', orderNum);
        }
        if (editingOrder.id && isValidUuid(editingOrder.id)) {
          await supabase.from('orders').update(dbPayload).eq('id', editingOrder.id);
        }
      }
    } catch (err: any) {
      console.warn('Could not update order in Supabase:', err);
    }

    notify('অর্ডার সফলভাবে ডাটাবেজে সংরক্ষিত হয়েছে!');
    setOrderEditSaving(false);
    setEditingOrder(null);
  };

  /* ------------------- Bulk Category & Sub-Category Assign Handlers ------------------- */
  const filteredProds = prods.filter((p) => {
    const matchQuery =
      !productQuery ||
      (p.name + ' ' + (p.name_bn || '')).toLowerCase().includes(productQuery.toLowerCase());

    let matchCat = true;
    if (productCatFilter === '__none__') {
      matchCat = !p.category_id;
    } else if (productCatFilter !== 'all') {
      const selCat = catList.find((c) => c.id === productCatFilter || c.slug === productCatFilter);
      const belongsDirect =
        p.category_id === productCatFilter ||
        (Boolean(selCat?.id) && p.category_id === selCat?.id) ||
        (Boolean(selCat?.slug) && p.category_id === selCat?.slug);
      const belongsViaSub = Boolean(
        p.subcategory_id &&
          selCat &&
          subCatList.some(
            (s) => (s.id === p.subcategory_id || s.slug === p.subcategory_id) && isSubOfCategory(s, selCat)
          )
      );
      matchCat = belongsDirect || belongsViaSub;
    }

    let matchSub = true;
    if (productSubCatFilter === '__none__') {
      matchSub = !p.subcategory_id;
    } else if (productSubCatFilter !== 'all') {
      const selSub = subCatList.find((s) => s.id === productSubCatFilter || s.slug === productSubCatFilter);
      matchSub =
        p.subcategory_id === productSubCatFilter ||
        (Boolean(selSub?.id) && p.subcategory_id === selSub?.id) ||
        (Boolean(selSub?.slug) && p.subcategory_id === selSub?.slug);
    }

    return matchQuery && matchCat && matchSub;
  });

  const allFilteredSelected =
    filteredProds.length > 0 && filteredProds.every((p) => selectedIds.includes(p.id));

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds((prev) => prev.filter((id) => !filteredProds.some((p) => p.id === id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...filteredProds.map((p) => p.id)])));
    }
  };

  // Shared core updater for 1 or multiple products (handles both Category & Sub-Category + local fallback)
  const applyCategorySubCategoryToProducts = async (
    targetProductIds: string[],
    options: {
      categorySelection?: string; // '' (unchanged/auto), '__none__' (clear), or category id/slug
      subCategorySelection?: string; // '' (unchanged/auto), '__none__' (clear), or subcategory id
    }
  ): Promise<{ ok: boolean; message: string }> => {
    const { categorySelection = '', subCategorySelection = '' } = options;
    const dbIds = targetProductIds.filter((id) => isValidUuid(id));
    const nonDbIds = targetProductIds.filter((id) => !isValidUuid(id));

    // Case 1: Assigning to a specific Sub-Category
    if (subCategorySelection && subCategorySelection !== '__none__') {
      const subObj = subCatList.find(
        (s) => s.id === subCategorySelection || s.slug === subCategorySelection
      );
      if (!subObj) {
        return { ok: false, message: 'নির্বাচিত সাব-ক্যাটাগরি পাওয়া যায়নি' };
      }

      const rawParentCatKey =
        categorySelection && categorySelection !== '__none__'
          ? categorySelection
          : subObj.category_id;

      const resolvedParentCat = rawParentCatKey
        ? await ensureSupabaseCategoryUuid(rawParentCatKey)
        : null;
      const validParentUuid =
        resolvedParentCat && isValidUuid(resolvedParentCat) ? resolvedParentCat : null;

      let dbSavedWithSub = false;
      if (dbIds.length > 0) {
        const fullUpdate: Record<string, any> = {
          subcategory_id: subObj.id,
        };
        if (validParentUuid) {
          fullUpdate.category_id = validParentUuid;
        }

        if (isValidUuid(subObj.id) && !(subObj as any)._localOnly) {
          const { error } = await supabase
            .from('products')
            .update(fullUpdate)
            .in('id', dbIds);

          if (!error) {
            dbSavedWithSub = true;
          } else {
            console.warn('Supabase subcategory bulk update fallback:', error.message);
            if (validParentUuid) {
              await supabase
                .from('products')
                .update({ category_id: validParentUuid })
                .in('id', dbIds);
            }
          }
        } else if (validParentUuid) {
          await supabase
            .from('products')
            .update({ category_id: validParentUuid })
            .in('id', dbIds);
        }
      }



      const subLabel = subObj.name_bn || subObj.name;
      return {
        ok: true,
        message: `${targetProductIds.length} টি প্রোডাক্ট "${subLabel}" সাব-ক্যাটাগরিতে যোগ করা হয়েছে!`,
      };
    }

    // Case 2: Explicitly removing Sub-Category ONLY (while keeping or updating Category)
    if (subCategorySelection === '__none__' && categorySelection !== '__none__') {
      let validCatUuid: string | null | undefined = undefined;
      if (categorySelection) {
        const resolved = await ensureSupabaseCategoryUuid(categorySelection);
        if (isValidUuid(resolved)) validCatUuid = resolved;
      }

      let dbClearedSub = false;
      if (dbIds.length > 0) {
        const updatePayload: Record<string, any> = { subcategory_id: null };
        if (validCatUuid) updatePayload.category_id = validCatUuid;

        const { error } = await supabase
          .from('products')
          .update(updatePayload)
          .in('id', dbIds);

        if (!error) {
          dbClearedSub = true;
        } else if (validCatUuid) {
          await supabase
            .from('products')
            .update({ category_id: validCatUuid })
            .in('id', dbIds);
        }
      }



      return {
        ok: true,
        message: `${targetProductIds.length} টি প্রোডাক্ট থেকে সাব-ক্যাটাগরি সরানো হয়েছে!`,
      };
    }

    // Case 3: Removing Category (also clears Sub-Category)
    if (categorySelection === '__none__') {
      let dbClearedBoth = false;
      if (dbIds.length > 0) {
        const { error } = await supabase
          .from('products')
          .update({ category_id: null, subcategory_id: null })
          .in('id', dbIds);

        if (!error) {
          dbClearedBoth = true;
        } else {
          await supabase
            .from('products')
            .update({ category_id: null })
            .in('id', dbIds);
        }
      }



      return {
        ok: true,
        message: `${targetProductIds.length} টি প্রোডাক্ট থেকে ক্যাটাগরি ও সাব-ক্যাটাগরি সরানো হয়েছে!`,
      };
    }

    // Case 4: Assigning to a Main Category (without a specific Sub-Category)
    if (categorySelection) {
      const resolvedCat = await ensureSupabaseCategoryUuid(categorySelection);
      const validCatUuid = isValidUuid(resolvedCat) ? resolvedCat : null;
      const catObj = catList.find(
        (c) => c.id === categorySelection || c.slug === categorySelection || c.id === resolvedCat
      );

      let dbSavedClean = false;
      if (dbIds.length > 0 && validCatUuid) {
        const { error } = await supabase
          .from('products')
          .update({ category_id: validCatUuid, subcategory_id: null })
          .in('id', dbIds);

        if (!error) {
          dbSavedClean = true;
        } else {
          const { error: fallbackErr } = await supabase
            .from('products')
            .update({ category_id: validCatUuid })
            .in('id', dbIds);
          if (fallbackErr) {
            return { ok: false, message: 'ক্যাটাগরি আপডেট হয়নি: ' + fallbackErr.message };
          }
        }
      }



      const catLabel = catObj ? catObj.name_bn || catObj.name : 'ক্যাটাগরি';
      return {
        ok: true,
        message: `${targetProductIds.length} টি প্রোডাক্ট "${catLabel}" ক্যাটাগরিতে যোগ করা হয়েছে!`,
      };
    }

    return { ok: false, message: 'অনুগ্রহ করে ক্যাটাগরি অথবা সাব-ক্যাটাগরি নির্বাচন করুন' };
  };

  const handleBulkAssignCategory = async () => {
    if (selectedIds.length === 0) {
      notify('আগে অন্তত ১টি প্রোডাক্ট সিলেক্ট করুন', false);
      return;
    }
    if (!bulkCategoryId && !bulkSubCategoryId) {
      notify('একটি ক্যাটাগরি অথবা সাব-ক্যাটাগরি নির্বাচন করুন', false);
      return;
    }

    setBulkAssigning(true);
    try {
      const res = await applyCategorySubCategoryToProducts(selectedIds, {
        categorySelection: bulkCategoryId,
        subCategorySelection: bulkSubCategoryId,
      });

      if (res.ok) {
        notify(res.message, true);
        setSelectedIds([]);
        setBulkCategoryId('');
        setBulkSubCategoryId('');
        onRefreshProducts();
      } else {
        notify(res.message, false);
      }
    } catch (err: any) {
      notify('আপডেট হয়নি: ' + (err?.message || 'Error'), false);
    } finally {
      setBulkAssigning(false);
    }
  };

  const handleQuickAssignProductSubCategory = async (prod: ProductLite, nextSubId: string) => {
    setQuickAssigningProdId(prod.id);
    try {
      const res = await applyCategorySubCategoryToProducts([prod.id], {
        categorySelection: nextSubId ? '' : prod.category_id || '',
        subCategorySelection: nextSubId || '__none__',
      });
      if (res.ok) {
        notify(res.message, true);
        onRefreshProducts();
      } else {
        notify(res.message, false);
      }
    } catch (err: any) {
      notify('সাব-ক্যাটাগরি সেট করা যায়নি: ' + (err?.message || 'Error'), false);
    } finally {
      setQuickAssigningProdId(null);
    }
  };

  const saveSettings = async () => {
    const v = Number(targetInput) || 600000;
    const sName = siteNameInput.trim() || 'Kalkerdeal';
    const sNumber = siteNumberInput.trim();
    const pCode = promoCodeInput.trim();
    const pDiscount = promoDiscountInput.trim();
    const bkashNum = bkashNumberInput.trim();
    const nagadNum = nagadNumberInput.trim();
    const fsThresh = freeShippingThresholdInput.trim() || '2000';
    const insideChg = Number(insideChargeInput) || 60;
    const outsideChg = Number(outsideChargeInput) || 130;

    try {
      // 1. Upsert store_settings table
      const settingsPayload = [
        { key: 'monthly_target', value: String(v) },
        { key: 'site_name', value: sName },
        { key: 'site_number', value: sNumber },
        { key: 'promo_code', value: pCode },
        { key: 'promo_discount', value: pDiscount },
        { key: 'bkash_number', value: bkashNum },
        { key: 'nagad_number', value: nagadNum },
        { key: 'free_shipping_threshold', value: fsThresh },
        { key: 'inside_dhaka_charge', value: String(insideChg) },
        { key: 'outside_dhaka_charge', value: String(outsideChg) }
      ];

      const { error: settingsError } = await supabase
        .from('store_settings')
        .upsert(settingsPayload, { onConflict: 'key' });

      if (settingsError) {
        notify('সেটিংস সেভ করতে ব্যর্থ হয়েছে: ' + settingsError.message, false);
        return;
      }

      // 2. Single source of truth: Update or Insert into delivery_zones table
      const { data: existingZones, error: zonesFetchErr } = await supabase
        .from('delivery_zones')
        .select('*');

      if (zonesFetchErr) {
        notify('ডেলিভারি জোন লোড করতে সমস্যা হয়েছে: ' + zonesFetchErr.message, false);
        return;
      }

      const zonesList = existingZones || [];

      // Find Inside Dhaka zone with strict matching
      const insideRow = zonesList.find((z: any) =>
        z.district === 'Dhaka' ||
        z.name_bn?.includes('ভিতরে') ||
        (z.name_bn?.includes('ঢাকা') && !z.name_bn?.includes('বাইরে')) ||
        (z.name?.toLowerCase().includes('inside') || (z.name?.toLowerCase().includes('dhaka') && !z.name?.toLowerCase().includes('outside')))
      );

      if (insideRow?.id) {
        const { error: inErr } = await supabase
          .from('delivery_zones')
          .update({ charge: insideChg, district: 'Dhaka', name_bn: 'ঢাকার ভিতরে' })
          .eq('id', insideRow.id);
        if (inErr) {
          notify('ঢাকার ভিতরে চার্জ আপডেট করতে ব্যর্থ: ' + inErr.message, false);
          return;
        }
      } else {
        const { error: inInsErr } = await supabase
          .from('delivery_zones')
          .insert([{
            name: 'Inside Dhaka',
            name_bn: 'ঢাকার ভিতরে',
            district: 'Dhaka',
            charge: insideChg,
            estimated_days: '১-২ কার্যদিবস',
            is_active: true,
            sort_order: 1
          }]);
        if (inInsErr) {
          notify('ঢাকার ভিতরে চার্জ তৈরি করতে ব্যর্থ: ' + inInsErr.message, false);
          return;
        }
      }

      // Find Outside Dhaka zone with strict matching
      const outsideRow = zonesList.find((z: any) =>
        z.district === 'Outside Dhaka' ||
        z.name_bn?.includes('বাইরে') ||
        z.name?.toLowerCase().includes('outside') ||
        z.name?.toLowerCase().includes('suburban')
      );

      if (outsideRow?.id) {
        const { error: outErr } = await supabase
          .from('delivery_zones')
          .update({ charge: outsideChg, district: 'Outside Dhaka', name_bn: 'ঢাকার বাইরে' })
          .eq('id', outsideRow.id);
        if (outErr) {
          notify('ঢাকার বাইরে চার্জ আপডেট করতে ব্যর্থ: ' + outErr.message, false);
          return;
        }
      } else {
        const { error: outInsErr } = await supabase
          .from('delivery_zones')
          .insert([{
            name: 'Outside Dhaka',
            name_bn: 'ঢাকার বাইরে',
            district: 'Outside Dhaka',
            charge: outsideChg,
            estimated_days: '২-৩ কার্যদিবস',
            is_active: true,
            sort_order: 2
          }]);
        if (outInsErr) {
          notify('ঢাকার বাইরে চার্জ তৈরি করতে ব্যর্থ: ' + outInsErr.message, false);
          return;
        }
      }

      setTarget(v);
      setSiteNameInput(sName);

      // Notify listeners & refresh
      window.dispatchEvent(new CustomEvent('settings_updated'));
      window.dispatchEvent(new Event('delivery_zones_updated'));
      if (onRefreshDeliveryZones) {
        await onRefreshDeliveryZones();
      }

      notify('ওয়েবসাইট সেটিংস ও ডেলিভারি চার্জ সফলভাবে সেভ করা হয়েছে!', true);
    } catch (err: any) {
      console.error('saveSettings error:', err);
      notify('সেটিংস সেভ করতে ব্যর্থ হয়েছে: ' + (err?.message || 'DB Error'), false);
    }
  };

  const exportCsv = () => {
    const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const head = ['Order No', 'Date', 'Customer', 'Phone', 'Address', 'Zone', 'Payment', 'Status', 'Total'];
    const lines = reportOrders.map((o) => [o.order_number, o.created_at ? new Date(o.created_at).toLocaleString('en-GB') : '', o.customer_name, o.phone, o.address, o.delivery_zone, o.payment_method, o.status || 'pending', o.total].map(esc).join(','));
    const blob = new Blob(['\uFEFF' + [head.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `orders-${reportFrom}_to_${reportTo}.csv`; a.click();
    URL.revokeObjectURL(a.href);
  };

  if (!isOpen) return null;

  const NAV: { id: Page; label: string; icon: React.ReactNode; group: 'main' | 'catalog' | 'marketing' | 'system'; badge?: number; pinned?: boolean }[] = [
    { id: 'dashboard', label: 'ড্যাশবোর্ড', icon: <LayoutDashboard className="w-[18px] h-[18px]" />, group: 'main', pinned: true },
    { id: 'orders', label: 'অর্ডার', icon: <ShoppingCart className="w-[18px] h-[18px]" />, group: 'main', pinned: true, badge: pendingCount },
    { id: 'customers', label: 'কাস্টমার', icon: <Users className="w-[18px] h-[18px]" />, group: 'main' },
    { id: 'reports', label: 'রিপোর্ট', icon: <FileText className="w-[18px] h-[18px]" />, group: 'main' },
    { id: 'products', label: 'প্রোডাক্ট', icon: <Package className="w-[18px] h-[18px]" />, group: 'catalog', pinned: true },
    { id: 'categories', label: 'ক্যাটাগরি', icon: <FolderTree className="w-[18px] h-[18px]" />, group: 'catalog', pinned: true },
    { id: 'flashSales', label: 'ফ্ল্যাশ সেল', icon: <Zap className="w-[18px] h-[18px]" />, group: 'catalog' },
    { id: 'banners', label: 'ব্যানার', icon: <ImageIcon className="w-[18px] h-[18px]" />, group: 'catalog' },
    { id: 'tracking', label: 'ট্র্যাকিং', icon: <MapPin className="w-[18px] h-[18px]" />, group: 'marketing' },
    { id: 'courier', label: 'কুরিয়ার API', icon: <Truck className="w-[18px] h-[18px]" />, group: 'marketing' },
    { id: 'settings', label: 'সেটিংস', icon: <SettingsIcon className="w-[18px] h-[18px]" />, group: 'system' },
  ];

  const statCards = [
    { label: 'Total Sales', value: money(stats.sales), d: stats.salesDelta as number | null, icon: <DollarSign className="w-4 h-4" />, tone: 'brand' as const },
    { label: 'Total Orders', value: stats.orders.toLocaleString(), d: stats.ordersDelta as number | null, icon: <ShoppingCart className="w-4 h-4" />, tone: 'emerald' as const },
    { label: 'Total Visitors', value: stats.visitors.toLocaleString(), d: stats.visitorsDelta as number | null, icon: <Eye className="w-4 h-4" />, tone: 'slate' as const },
    { label: 'Pending Orders', value: pendingCount.toLocaleString(), d: null as number | null, icon: <Clock className="w-4 h-4" />, tone: 'amber' as const },
  ];

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-50 text-slate-900">
      <AdminShell
        nav={NAV}
        page={page}
        onNavigate={(id) => setPage(id as Page)}
        onBackToSite={onClose}
        onLogoutClick={() => setShowLogoutConfirm(true)}
        loading={loading}
        error={loadError}
        navOpen={navOpen}
        setNavOpen={setNavOpen}
      >

          {/* ============================ DASHBOARD ============================ */}
          {page === 'dashboard' && (
            <div className="grid grid-cols-2 xl:grid-cols-12 gap-3 sm:gap-5">

              {/* Row 1: Stat cards */}
              {statCards.map((s) => (
                <div key={s.label} className="xl:col-span-3 min-w-0">
                  <StatCard label={s.label} value={s.value} delta={s.d} icon={s.icon} tone={s.tone} />
                </div>
              ))}

              {/* Row 2: Revenue + Monthly target */}
              <Card className="col-span-2 xl:col-span-8">
                <CardHeader
                  title="Revenue Analytics"
                  sub="দৈনিক রেভিনিউ ও অর্ডার"
                  right={<Select value={rangeDays} onChange={setRangeDays} options={[[7, 'Last 7 Days'], [14, 'Last 14 Days'], [30, 'Last 30 Days']]} />}
                />
                <div className="flex gap-4 text-xs text-slate-500 mb-2">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-blue-600 rounded" />Revenue</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 border-t-2 border-dashed border-amber-500" />Orders</span>
                </div>
                <RevenueChart data={series} />
              </Card>

              <Card className="col-span-2 xl:col-span-4">
                <CardHeader
                  title="Monthly Target"
                  sub="এই মাসের বিক্রয় লক্ষ্য"
                  right={<button onClick={() => setPage('settings')} className="text-xs font-bold text-blue-600 hover:underline">Edit</button>}
                />
                <Gauge pct={targetPct} />
                <p className="text-center text-xs -mt-1"><Delta v={monthly.delta} /> <span className="text-slate-500">from last month</span></p>
                <p className="text-center font-bold mt-3">{targetPct >= 1 ? 'Target achieved! 🎉' : 'Keep going!'}</p>
                <p className="text-center text-xs text-slate-500 mt-1 px-2">
                  {targetPct >= 1 ? 'এই মাসের টার্গেট পূরণ হয়েছে।' : `১০০% পূর্ণ করতে আরও ${money(target - monthly.cur)} দরকার।`}
                </p>
                <div className="grid grid-cols-2 mt-4 rounded-xl bg-blue-50 text-center overflow-hidden">
                  <div className="py-3 border-r border-white"><p className="text-[11px] text-slate-500">Target</p><p className="font-bold text-sm">{money(target)}</p></div>
                  <div className="py-3"><p className="text-[11px] text-slate-500">Revenue</p><p className="font-bold text-sm">{money(monthly.cur)}</p></div>
                </div>
              </Card>

              {/* Row 3: Categories, Active users, Traffic */}
              <Card className="col-span-2 xl:col-span-4">
                <CardHeader
                  title="Top Categories"
                  right={<button onClick={() => setPage('products')} className="text-xs font-bold text-blue-600 hover:underline">See All</button>}
                />
                {topCats.list.length === 0 ? <Empty text="এখনো কোনো ডাটা নেই" /> : (
                  <>
                    <Donut parts={topCats.list} centerTop={topCats.mode === 'sales' ? 'Total Sales' : 'Inventory Value'} centerBottom={money(topCats.total)} />
                    <ul className="mt-4 space-y-2.5">
                      {topCats.list.map((c, i) => (
                        <li key={c.name + i} className="flex items-center justify-between text-sm gap-2">
                          <span className="flex items-center gap-2 min-w-0"><span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: SHADES[i % SHADES.length] }} /><span className="truncate text-slate-700">{c.name}</span></span>
                          <span className="font-semibold shrink-0">{money(c.value)}</span>
                        </li>
                      ))}
                    </ul>
                    {topCats.mode === 'inventory' && <p className="text-[11px] text-slate-400 mt-3">Orders-এ items সেভ হলে এটা আসল সেলস দেখাবে।</p>}
                  </>
                )}
              </Card>

              <Card className="col-span-2 xl:col-span-4">
                <CardHeader title="Active Users" sub="গত ৩০ দিনের ভিজিটর" />
                <div className="flex items-end justify-between">
                  <p className="text-3xl font-extrabold">{countries.total.toLocaleString()}</p>
                  <span className="text-xs font-bold bg-emerald-50 rounded-md px-2 py-1"><Delta v={stats.visitorsDelta} /></span>
                </div>
                <div className="mt-5 space-y-4">
                  {countries.list.length === 0 && <Empty text="Visitor ডাটা নেই" />}
                  {countries.list.map((c) => {
                    const p = countries.total ? (c.n / countries.total) * 100 : 0;
                    return (
                      <div key={c.name}>
                        <div className="flex justify-between text-sm mb-1.5"><span className="text-slate-700">{c.name}</span><span className="font-semibold">{p.toFixed(p % 1 ? 1 : 0)}%</span></div>
                        <div className="h-2 rounded-full bg-blue-100"><div className="h-full rounded-full bg-blue-600" style={{ width: `${p}%` }} /></div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              <Card className="col-span-2 xl:col-span-4">
                <CardHeader title="Traffic Sources" sub="ভিজিটর কোথা থেকে আসছে" />
                <div className="flex h-12 gap-1 rounded-lg overflow-hidden bg-blue-50">
                  {sources.total > 0 && sources.list.filter((s) => s.n > 0).map((s, i) => (
                    <div key={s.key} style={{ width: `${(s.n / sources.total) * 100}%`, background: SHADES[i % SHADES.length] }} title={`${s.label}: ${s.n}`} />
                  ))}
                </div>
                <ul className="mt-5 space-y-3">
                  {sources.list.map((s, i) => (
                    <li key={s.key} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-slate-700"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: SHADES[i % SHADES.length] }} />{s.label}</span>
                      <span className="font-semibold">{sources.total ? Math.round((s.n / sources.total) * 100) : 0}%</span>
                    </li>
                  ))}
                </ul>
              </Card>

              {/* Row 4: Conversion funnel */}
              <Card className="col-span-2 xl:col-span-12">
                <CardHeader
                  title="Conversion Rate"
                  sub="প্রোডাক্ট ভিউ থেকে কেনা পর্যন্ত"
                  right={<Select value={funnelDays} onChange={setFunnelDays} options={[[7, 'This Week'], [30, 'This Month']]} />}
                />
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-y-4">
                  {funnel.map((f, i) => {
                    const max = Math.max(...funnel.map((x) => x.n), 1);
                    const prev = i === 0 ? 0 : i === 4 ? funnel[1].n : funnel[i - 1].n;
                    const pct = prev ? Math.round((f.n / prev) * 100) : 0;
                    const shade = ['#DBEAFE', '#BFDBFE', '#93C5FD', '#3B82F6', '#FDA4AF'][i];
                    return (
                      <div key={f.label} className={`px-3 pt-1 flex flex-col ${i > 0 ? 'sm:border-l border-slate-100' : ''}`}>
                        <p className="text-[11px] text-slate-500 h-8 leading-tight">{f.label}</p>
                        <p className="text-xl font-extrabold mt-1">{f.n.toLocaleString()}</p>
                        {i > 0 && <span className={`self-start mt-1 text-[10px] font-bold rounded px-1.5 py-0.5 ${i === 4 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>{pct}% {i === 4 ? 'of carts' : 'of prev'}</span>}
                        <div className="h-28 flex items-end mt-3 -mx-3">
                          <div className="w-full rounded-t-2xl" style={{ height: `${Math.max((f.n / max) * 100, 5)}%`, background: shade }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {events.length === 0 && !loading && (
                <div className="col-span-2 xl:col-span-12 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-sm px-4 py-3">
                  Visitor, funnel ও traffic ডাটা এখনো আসছে না। SQL চালানো ও <code>analytics.ts</code> যোগ করা হলে এগুলো নিজে থেকেই ভরে যাবে। Sales, orders ও revenue ইতোমধ্যে আসল ডাটা দেখাচ্ছে।
                </div>
              )}
            </div>
          )}

          {/* ============================== ORDERS ============================== */}
          {page === 'orders' && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2.5 sm:items-center justify-between bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
                <input
                  value={orderQuery}
                  onChange={(e) => setOrderQuery(e.target.value)}
                  placeholder="Order no, name, phone, address..."
                  className={inputCls + ' sm:max-w-xs bg-slate-50 text-xs py-2'}
                />
                <div className="admin-scroll flex gap-1.5 overflow-x-auto pb-0.5">
                  {['all', ...STATUSES].map((s) => (
                    <button
                      key={s}
                      onClick={() => setOrderStatus(s)}
                      className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold capitalize border transition ${
                        orderStatus === s
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {s}
                      {s !== 'all' && ` (${orders.filter((o) => (o.status || 'pending') === s).length})`}
                    </button>
                  ))}
                </div>
              </div>

              {filteredOrders.length === 0 ? (
                <Card><Empty text="কোনো অর্ডার পাওয়া যায়নি।" /></Card>
              ) : (
                <div className="space-y-2.5">
                  {filteredOrders.map((o, idx) => {
                    const key = o.order_number || o.id || String(idx);
                    const st = o.status || 'pending';
                    const items = getItems(o);
                    const isExpanded = !!expandedOrders[key];

                    return (
                      <div
                        key={key}
                        className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 p-3 sm:p-3.5 shadow-2xs transition-all hover:shadow-xs space-y-2.5"
                      >
                        {/* Top Line: Order ID, Status, Payment, Date & Actions */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100 text-xs">
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            <span className="font-mono font-extrabold text-blue-600 text-xs sm:text-sm tracking-tight bg-blue-50/80 px-2 py-0.5 rounded-lg border border-blue-100">
                              {o.order_number || '#' + (o.id || '').slice(0, 6)}
                            </span>
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full capitalize ${STATUS_STYLE[st] || 'bg-gray-100 text-gray-700'}`}>
                              {st}
                            </span>
                            {o.payment_method && (() => {
                              const pm = String(o.payment_method).toLowerCase();
                              let label = o.payment_method;
                              let bg = 'bg-slate-100 text-slate-700';
                              if (pm.includes('bkash')) {
                                label = 'বিকাশ (bKash)';
                                bg = 'bg-pink-100 text-pink-700 font-bold';
                              } else if (pm.includes('nagad')) {
                                label = 'নগদ (Nagad)';
                                bg = 'bg-orange-100 text-orange-700 font-bold';
                              } else if (pm.includes('cod') || pm.includes('cash')) {
                                label = 'ক্যাশ অন ডেলিভারি (COD)';
                                bg = 'bg-emerald-100 text-emerald-700 font-bold';
                              }
                              return (
                                <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase ${bg}`}>
                                  {label}
                                </span>
                              );
                            })()}
                            {o.created_at && (
                              <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                                • {new Date(o.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>

                          {/* Quick Actions */}
                          <div className="flex items-center gap-1.5 ml-auto">
                            <select
                              value={st}
                              onChange={(e) => updateStatus(o, e.target.value)}
                              className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-bold capitalize focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                            >
                              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>

                            <button
                              type="button"
                              onClick={() => handleOpenEditOrder(o)}
                              className="px-2.5 py-1 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition flex items-center gap-1 text-[11px] font-bold"
                              title="অর্ডার এডিট করুন"
                            >
                              <Pencil className="w-3 h-3" />
                              <span>এডিট</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeleteConfirmOrder(o)}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                              title="অর্ডার ডিলিট করুন"
                              aria-label="Delete order"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Content Row: Customer Details | Products Thumbnail Strip | Total */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center text-xs">
                          {/* Col 1: Customer Info (5 cols) */}
                          <div className="md:col-span-5 space-y-0.5 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-slate-900 text-xs sm:text-sm truncate">
                                {o.customer_name || 'নাম নেই'}
                              </span>
                              <a
                                href={`tel:${o.phone}`}
                                className="font-mono text-xs font-bold text-blue-600 hover:underline shrink-0"
                              >
                                {o.phone || 'নম্বর নেই'}
                              </a>
                            </div>
                            <p className="text-[11px] text-slate-600 truncate" title={o.address}>
                              {o.address || 'ঠিকানা নেই'}
                            </p>
                            <div className="flex items-center gap-1.5 pt-0.5">
                              <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-100 truncate">
                                {o.delivery_zone || 'ঢাকার ভিতরে'} {o.delivery_charge ? `(৳${o.delivery_charge})` : ''}
                              </span>
                            </div>
                          </div>

                          {/* Col 2: Products Thumbnails Strip (4 cols) */}
                          <div className="md:col-span-4 min-w-0">
                            {items.length === 0 ? (
                              <span className="text-xs text-slate-400 italic">কোনো পণ্য নেই</span>
                            ) : (
                              <div className="flex items-center gap-1.5 overflow-x-auto py-1 admin-scroll">
                                {items.slice(0, 3).map((it, i) => {
                                  const itemImg = getItemImage(it, products);
                                  const itemTitle = it.title || it.name || it.product_name || 'Product';
                                  const itemQty = it.quantity ?? it.qty ?? 1;
                                  const itemPrice = Number(it.price || it.unit_price || 0);

                                  return (
                                    <div
                                      key={i}
                                      className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-50 border border-slate-200/80 shrink-0"
                                      title={`${itemTitle} (${itemQty} টি × ৳${itemPrice})`}
                                    >
                                      <div className="w-8 h-8 rounded-md bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 relative p-0.5">
                                        {itemImg ? (
                                          <img src={itemImg} alt="" className="w-full h-full object-contain" />
                                        ) : (
                                          <Package className="w-4 h-4 text-slate-300" />
                                        )}
                                        <span className="absolute -top-1 -right-1 bg-slate-900 text-white text-[8px] font-black rounded-full px-1 min-w-[12px] h-3 flex items-center justify-center leading-none">
                                          {itemQty}
                                        </span>
                                      </div>
                                      <div className="max-w-[70px] sm:max-w-[100px] text-[10px] leading-tight pr-1">
                                        <p className="font-bold text-slate-800 truncate">{itemTitle}</p>
                                        <span className="text-slate-500 font-semibold">৳{itemPrice}</span>
                                      </div>
                                    </div>
                                  );
                                })}

                                {items.length > 3 && (
                                  <button
                                    type="button"
                                    onClick={() => toggleExpandOrder(key)}
                                    className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-1 rounded-md border border-blue-200 hover:bg-blue-100 shrink-0"
                                  >
                                    +{items.length - 3} আরো
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => toggleExpandOrder(key)}
                                  className="text-[10px] font-semibold text-slate-500 hover:text-blue-600 px-1 py-1 shrink-0 ml-auto underline"
                                >
                                  {isExpanded ? 'সংক্ষিপ্ত' : `আইটেম (${items.length})`}
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Col 3: Total Bill & Item count (3 cols) */}
                          <div className="md:col-span-3 flex md:flex-col items-center md:items-end justify-between md:justify-center pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider md:block">সর্বমোট বিল</span>
                            <div className="text-right">
                              <p className="text-base sm:text-lg font-black text-rose-600 tabular-nums leading-none">
                                {money(o.total || 0)}
                              </p>
                              <span className="text-[10px] text-slate-400 font-medium">
                                {items.length} টি আইটেম
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Collapsible Full Items Breakdown */}
                        {isExpanded && items.length > 0 && (
                          <div className="pt-2 border-t border-slate-100 space-y-1.5 bg-slate-50/70 p-2.5 rounded-xl">
                            <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                              অর্ডারকৃত পণ্যের বিস্তারিত তালিকা:
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                              {items.map((it, i) => {
                                const itemImg = getItemImage(it, products);
                                const itemTitle = it.title || it.name || it.product_name || 'Product';
                                const itemQty = it.quantity ?? it.qty ?? 1;
                                const itemPrice = Number(it.price || it.unit_price || 0);

                                return (
                                  <div
                                    key={i}
                                    className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200"
                                  >
                                    <div className="w-9 h-9 rounded bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 p-0.5">
                                      {itemImg ? (
                                        <img src={itemImg} alt="" className="w-full h-full object-contain" />
                                      ) : (
                                        <Package className="w-4 h-4 text-slate-300" />
                                      )}
                                    </div>
                                    <div className="min-w-0 flex-1 text-xs">
                                      <p className="font-bold text-slate-900 truncate" title={itemTitle}>{itemTitle}</p>
                                      <p className="text-[10px] text-slate-500">
                                        পরিমাণ: <strong>{itemQty}</strong> × ৳{itemPrice} {it.variant ? `(${it.variant})` : ''}
                                      </p>
                                    </div>
                                    <div className="text-right shrink-0 font-bold text-slate-900 text-xs pr-1">
                                      ৳{(itemQty * itemPrice).toLocaleString()}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ============================== TRACKING ============================== */}
          {page === 'tracking' && <TrackingTab />}

          {/* ========================== TRACKING PIXELS ========================== */}
          {page === 'trackingPixels' && <TrackingPixelsPage notify={notify} />}

          {/* ============================ COURIER API ============================ */}
          {page === 'courier' && <CourierPage notify={notify} />}

          {/* ============================= PRODUCTS ============================= */}
          {page === 'products' && (
            <div className="space-y-4">
              <div className="flex flex-col xl:flex-row gap-3 xl:items-center justify-between">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
                  <input
                    value={productQuery}
                    onChange={(e) => setProductQuery(e.target.value)}
                    placeholder="Search products..."
                    className={inputCls + ' sm:max-w-xs bg-white'}
                  />
                  <select
                    value={productCatFilter}
                    onChange={(e) => {
                      setProductCatFilter(e.target.value);
                      setProductSubCatFilter('all');
                    }}
                    className={inputCls + ' sm:max-w-[200px] bg-white text-xs !py-2.5'}
                  >
                    <option value="all">সব ক্যাটাগরি (All Categories)</option>
                    <option value="__none__">ক্যাটাগরি ছাড়া (Uncategorized)</option>
                    {catList.map((c) => (
                      <option key={c.id || c.slug} value={c.id || c.slug}>
                        {c.name_bn || c.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={productSubCatFilter}
                    onChange={(e) => setProductSubCatFilter(e.target.value)}
                    className={inputCls + ' sm:max-w-[215px] bg-white text-xs !py-2.5'}
                  >
                    <option value="all">সব সাব-ক্যাটাগরি (All Sub-Categories)</option>
                    <option value="__none__">সাব-ক্যাটাগরি ছাড়া (No Sub-Category)</option>
                    {subCatList
                      .filter((sc) => {
                        if (productCatFilter === 'all' || productCatFilter === '__none__') return true;
                        const selCat = catList.find((c) => c.id === productCatFilter || c.slug === productCatFilter);
                        return selCat ? isSubOfCategory(sc, selCat) : sc.category_id === productCatFilter;
                      })
                      .map((sc) => (
                        <option key={sc.id} value={sc.id}>
                          {sc.name_bn || sc.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  <button
                    type="button"
                    onClick={handleSyncToSupabase}
                    disabled={isSyncing}
                    className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs px-3.5 py-2.5 rounded-xl transition cursor-pointer disabled:opacity-50"
                    title="মুবা গ্যাজেটসের ৬টি ডিফল্ট প্রোডাক্ট ডেটাবেজে যুক্ত করুন"
                  >
                    <Download className="w-4 h-4 text-emerald-600" />
                    {isSyncing ? 'সিঙ্ক হচ্ছে...' : 'ডেটাবেজে প্রোডাক্ট পাঠান'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSqlModal(true)}
                    className="inline-flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs px-3.5 py-2.5 rounded-xl transition cursor-pointer"
                  >
                    <Database className="w-4 h-4 text-blue-600" />
                    Supabase SQL কোড
                  </button>
                  <button type="button" onClick={() => (showForm ? setShowForm(false) : openForm())} className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl cursor-pointer">
                    {showForm ? <><X className="w-4 h-4" />Close</> : <><Plus className="w-4 h-4" />Add product</>}
                  </button>
                </div>
              </div>

              {showForm && (
                <Card>
                  <h3 className="font-bold mb-4 text-lg">{form.id ? 'Edit product' : 'New product'}</h3>
                  <form onSubmit={saveProduct} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <input required placeholder="Product name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
                    <input placeholder="বাংলা নাম (optional)" value={form.name_bn} onChange={(e) => setForm({ ...form, name_bn: e.target.value })} className={inputCls} />
                    <textarea placeholder="Description" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputCls + ' col-span-full'} rows={3} />
                    <div className="flex items-center gap-2">
                      <select
                        required
                        value={form.category_id}
                        onChange={(e) => setForm({ ...form, category_id: e.target.value, subcategory_id: '' })}
                        className={inputCls + ' flex-1'}
                      >
                        <option value="">ক্যাটাগরি নির্বাচন করুন *</option>
                        {catList.filter(c => c.is_active !== false).map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name_bn || c.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          setPage('categories');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="px-3 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0 border border-blue-200"
                        title="নতুন ক্যাটাগরি তৈরি করুন"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">নতুন</span>
                      </button>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">সাব-ক্যাটাগরি (ঐচ্ছিক)</label>
                      <select
                        value={form.subcategory_id}
                        onChange={(e) => setForm({ ...form, subcategory_id: e.target.value })}
                        className={inputCls + ' flex-1'}
                      >
                        <option value="">সাব-ক্যাটাগরি নির্বাচন করুন</option>
                        {subCatList
                          .filter(sc => sc.category_id === form.category_id && sc.is_active !== false)
                          .map((sc) => (
                            <option key={sc.id} value={sc.id}>
                              {sc.name_bn || sc.name}
                            </option>
                          ))}
                      </select>
                    </div>


                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">বিক্রয় মূল্য / New Price (৳) *</label>
                      <input required type="number" min="0" step="any" placeholder="যেমন: 1150" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">পূর্বের মূল্য / Old Price (৳) (ঐচ্ছিক)</label>
                      <input type="number" min="0" step="any" placeholder="যেমন: 1450" value={form.old_price} onChange={(e) => setForm({ ...form, old_price: e.target.value })} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">স্টক / Stock *</label>
                      <input type="number" min="0" placeholder="যেমন: 50" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className={inputCls} />
                    </div>

                    {/* Multiple Images Upload & Gallery */}
                    <div className="col-span-full space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <div>
                        <span className="text-sm font-bold text-slate-800 flex items-center gap-2 flex-wrap">
                          <ImageIcon className="w-4 h-4 text-blue-600" />
                          প্রোডাক্টের ছবিসমূহ (Multiple Images)
                          <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full">
                            {form.images?.length || 0} টি ছবি
                          </span>
                        </span>
                        <p className="text-xs text-slate-500 mt-0.5">
                          প্রথম ছবিটি মূল (Main) হিসেবে প্রদর্শিত হবে। যেকোনো ছবির &quot;Set Main&quot; ক্লিক করে মূল ছবি পরিবর্তন করতে পারবেন।
                        </p>
                      </div>

                      {form.images && form.images.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-1">
                          {form.images.map((imgUrl, idx) => {
                            const isMain = idx === 0 || imgUrl === form.image_url;
                            return (
                              <div
                                key={idx}
                                className={`relative group rounded-xl overflow-hidden border-2 bg-white aspect-square flex items-center justify-center ${
                                  isMain ? 'border-blue-600 shadow-md ring-2 ring-blue-500/20' : 'border-slate-200 hover:border-slate-400'
                                }`}
                              >
                                <img src={imgUrl} alt={`Product image ${idx + 1}`} className="w-full h-full object-cover" />

                                {isMain ? (
                                  <span className="absolute top-1.5 left-1.5 bg-blue-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow">MAIN</span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setAsMainImage(imgUrl)}
                                    className="absolute top-1.5 left-1.5 bg-slate-900/80 hover:bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition shadow"
                                    title="Make this the main image"
                                  >
                                    Set Main
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => removeImage(idx)}
                                  className="absolute top-1.5 right-1.5 bg-rose-600/90 hover:bg-rose-700 text-white p-1 rounded-full opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition shadow cursor-pointer"
                                  title="Remove image"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                        <label className="sm:col-span-2 block border-2 border-dashed border-slate-300 hover:border-blue-500 bg-white rounded-xl p-4 text-center cursor-pointer transition">
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            disabled={uploading}
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files) {
                                handleMultipleImageUpload(e.target.files);
                              }
                            }}
                          />
                          <div className="flex flex-col items-center justify-center gap-1">
                            {uploading ? (
                              <>
                                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                <span className="text-xs font-bold text-blue-600">ছবি আপলোড হচ্ছে...</span>
                              </>
                            ) : (
                              <>
                                <UploadCloud className="w-6 h-6 text-blue-600" />
                                <span className="text-xs font-bold text-slate-700">
                                  ছবি আপলোড করতে ক্লিক করুন (এক সাথে একাধিক ছবি সিলেক্ট করা যাবে)
                                </span>
                                <span className="text-[11px] text-slate-400">PNG, JPG, WEBP (Auto Compressed)</span>
                              </>
                            )}
                          </div>
                        </label>

                        <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col justify-between">
                          <span className="text-xs font-semibold text-slate-700">বা ছবির URL যোগ করুন:</span>
                          <div className="flex gap-1.5 mt-2">
                            <input
                              type="url"
                              placeholder="https://images.unsplash..."
                              value={imageUrlInput}
                              onChange={(e) => setImageUrlInput(e.target.value)}
                              className="w-full min-w-0 text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <button
                              type="button"
                              onClick={addImageUrl}
                              disabled={!imageUrlInput.trim()}
                              className="bg-slate-900 hover:bg-blue-600 disabled:opacity-40 text-white text-xs font-bold px-3 py-1.5 rounded-lg shrink-0 transition"
                            >
                              যোগ
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Product Variations (Optional) */}
                    <div className="col-span-full space-y-4 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200">
                      <div>
                        <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
                          <Tag className="w-4 h-4 text-blue-600" />
                          প্রোডাক্ট ভেরিয়েশন (Product Variations - Optional)
                        </span>
                        <p className="text-xs text-slate-500 mt-0.5">সাইজ বা কালার ভেরিয়েশন যোগ করতে চাইলে নিচের অপশনগুলো চালু করুন।</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Enable Size */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                          <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-xs font-bold text-slate-800">Enable Size Variation (সাইজ)</span>
                            <input
                              type="checkbox"
                              checked={form.enable_size}
                              onChange={(e) => setForm({ ...form, enable_size: e.target.checked })}
                              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                            />
                          </label>
                          {form.enable_size && (
                            <div className="space-y-2 pt-2 border-t border-slate-100">
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder="যেমন: S, M, L, XL, 256GB"
                                  value={sizeInput}
                                  onChange={(e) => setSizeInput(e.target.value)}
                                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSizeOption(); } }}
                                  className={inputCls + ' text-xs'}
                                />
                                <button
                                  type="button"
                                  onClick={addSizeOption}
                                  className="px-3 py-2 bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold rounded-lg shrink-0 transition"
                                >
                                  যোগ
                                </button>
                              </div>
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {form.sizes.map((sz, idx) => (
                                  <span key={idx} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-lg border border-blue-200">
                                    {sz}
                                    <button type="button" onClick={() => removeSizeOption(idx)} className="text-blue-400 hover:text-rose-600 ml-1">×</button>
                                  </span>
                                ))}
                                {form.sizes.length === 0 && <span className="text-xs text-slate-400 italic">কোনো সাইজ যোগ করা হয়নি</span>}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Enable Color */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                          <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-xs font-bold text-slate-800">Enable Color Variation (কালার)</span>
                            <input
                              type="checkbox"
                              checked={form.enable_color}
                              onChange={(e) => setForm({ ...form, enable_color: e.target.checked })}
                              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                            />
                          </label>
                          {form.enable_color && (
                            <div className="space-y-2 pt-2 border-t border-slate-100">
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder="যেমন: Black, Red, Space Gray"
                                  value={colorInput}
                                  onChange={(e) => setColorInput(e.target.value)}
                                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addColorOption(); } }}
                                  className={inputCls + ' text-xs'}
                                />
                                <button
                                  type="button"
                                  onClick={addColorOption}
                                  className="px-3 py-2 bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold rounded-lg shrink-0 transition"
                                >
                                  যোগ
                                </button>
                              </div>
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {form.colors.map((col, idx) => (
                                  <span key={idx} className="inline-flex items-center gap-1 bg-slate-50 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-lg border border-slate-200">
                                    {col}
                                    <button type="button" onClick={() => removeColorOption(idx)} className="text-slate-400 hover:text-rose-600 ml-1">×</button>
                                  </span>
                                ))}
                                 {form.colors.length === 0 && <span className="text-xs text-slate-400 italic">কোনো কালার যোগ করা হয়নি</span>}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="col-span-full bg-amber-50/80 p-3.5 rounded-2xl border border-amber-200/80 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-amber-600 fill-amber-500" />
                        <div>
                          <p className="text-xs font-bold text-amber-900">Flash Sale-এ যোগ করুন (Flash Sale)</p>
                          <p className="text-[11px] text-amber-700">চালু করলে প্রোডাক্টটি হোম পেজের ফ্ল্যাশ সেল সেকশনে শো করবে</p>
                        </div>
                      </div>
                      <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={form.is_flash_sale}
                          onChange={(e) => setForm({ ...form, is_flash_sale: e.target.checked })}
                          className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                        />
                        <span className="text-xs font-bold text-amber-900">{form.is_flash_sale ? 'হ্যাঁ (Active)' : 'না'}</span>
                      </label>
                    </div>

                    <div className="sm:col-span-2 lg:col-span-3 flex gap-2 justify-end">
                      <button type="button" onClick={() => { setShowForm(false); setForm(emptyForm); }} className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 hover:bg-slate-200">Cancel</button>
                      <button type="submit" disabled={saving || uploading} className="px-5 py-2.5 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60 inline-flex items-center gap-2">
                        <Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save changes'}
                      </button>
                    </div>
                  </form>
                </Card>
              )}

              {/* Bulk action bar: Multiple Products -> Category & Sub-Category Assignment */}
              <div className="flex flex-col xl:flex-row xl:items-center gap-3 bg-white border border-slate-200 rounded-2xl px-4 py-3 sticky top-0 z-20 shadow-sm">
                <div className="flex items-center gap-2.5 flex-wrap shrink-0">
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={allFilteredSelected}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-700">সব সিলেক্ট ({filteredProds.length})</span>
                  </label>

                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${selectedIds.length > 0 ? 'bg-blue-100 text-[#2563eb]' : 'bg-slate-100 text-slate-500'}`}>
                    {selectedIds.length} টি সিলেক্ট করা হয়েছে
                  </span>
                </div>

                <div className="flex flex-1 flex-col sm:flex-row sm:flex-wrap lg:flex-nowrap items-stretch sm:items-center gap-2 xl:justify-end">
                  {/* Main Category Selector */}
                  <select
                    value={bulkCategoryId}
                    onChange={(e) => setBulkCategoryId(e.target.value)}
                    className={inputCls + ' sm:max-w-[220px] !py-2 text-xs'}
                  >
                    <option value="">ক্যাটাগরি নির্বাচন করুন...</option>
                    <option value="__none__">— ক্যাটাগরি সরিয়ে দিন —</option>
                    {catList.filter((c) => c.is_active !== false).map((c) => (
                      <option key={c.id || c.slug} value={c.id || c.slug}>
                        {c.name_bn || c.name} {c.name && c.name_bn && c.name !== c.name_bn ? `(${c.name})` : ''}
                      </option>
                    ))}
                  </select>

                  {/* Primary Assign Button */}
                  <button
                    type="button"
                    onClick={handleBulkAssignCategory}
                    disabled={bulkAssigning || selectedIds.length === 0 || !bulkCategoryId}
                    className="inline-flex items-center justify-center gap-2 disabled:opacity-40 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer shrink-0 bg-blue-600 hover:bg-blue-700"
                  >
                    {bulkAssigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderTree className="w-4 h-4" />}
                    ক্যাটাগরিতে যোগ করুন
                  </button>

                  {selectedIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedIds([]);
                        setBulkCategoryId('');
                      }}
                      className="px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer shrink-0"
                    >
                      সিলেকশন বাতিল
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {filteredProds.map((p) => {
                  const checked = selectedIds.includes(p.id);
                  const currentSubLabel = p.subcategory_id ? subCatName(p.subcategory_id) : '';
                  const prodCatObj = catList.find((c) => c.id === p.category_id || c.slug === p.category_id);
                  const quickSubOptions = prodCatObj
                    ? subCatList.filter((sc) => sc.is_active !== false && isSubOfCategory(sc, prodCatObj))
                    : subCatList.filter((sc) => sc.is_active !== false);

                  return (
                    <Card key={p.id} className={`!p-3 flex items-center gap-3 transition ${checked ? 'ring-2 ring-[#2563eb] bg-blue-50/25' : ''}`}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSelect(p.id)}
                        className="w-4 h-4 rounded border-slate-300 text-[#2563eb] focus:ring-[#2563eb] cursor-pointer shrink-0"
                        aria-label="Select product"
                      />
                      <div className="w-16 h-16 rounded-xl bg-blue-50 overflow-hidden shrink-0 flex items-center justify-center">
                        {p.image_url ? <img src={p.image_url} alt="" className="w-full h-full object-cover" onError={(e) => ((e.target as HTMLImageElement).style.visibility = 'hidden')} /> : <Package className="w-6 h-6 text-blue-600" />}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-sm font-bold truncate">{p.name}</p>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] text-slate-500 truncate max-w-[140px]">
                            {catName(p.category_id)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 pt-0.5">
                          <div className="flex items-baseline gap-1.5 flex-wrap">
                            <span className="text-sm font-extrabold text-blue-600">
                              {money(p.price)}
                            </span>
                            {p.old_price && p.old_price > p.price && (
                              <span className="text-[11px] text-slate-400 line-through">
                                {money(p.old_price)}
                              </span>
                            )}
                            {p.old_price && p.old_price > p.price && (
                              <span className="text-[10px] font-bold text-rose-500">
                                -{Math.round(((p.old_price - p.price) / p.old_price) * 100)}%
                              </span>
                            )}
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${(p.stock ?? 0) <= 5 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                              Stock {p.stock ?? 0}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <button type="button" onClick={() => toggleFlashSale(p)} className={`p-2 rounded-lg ${p.is_flash_sale ? 'text-amber-500 hover:bg-amber-50' : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50'}`} aria-label="Flash Sale"><Zap className="w-4 h-4" /></button>
                        <button type="button" onClick={() => openForm(p)} className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50" aria-label="Edit"><Pencil className="w-4 h-4" /></button>
                        <button type="button" onClick={() => setDeleteConfirmProduct(p)} className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50" aria-label="Delete"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </Card>
                  );
                })}
              </div>
              {prods.length === 0 && <Card><Empty text="কোনো প্রোডাক্ট নেই। উপরের Add product বাটনে চাপুন।" /></Card>}
            </div>
          )}

          {/* ============================= CATEGORIES ============================= */}
          {page === 'categories' && (
            <div className="space-y-6">
              <Card className="!p-5 sm:!p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-2">
                  <div>
                    <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <FolderTree className="w-5 h-5 text-blue-600" />
                      {editingCategoryId ? 'ক্যাটাগরি সম্পাদনা (Edit Category)' : 'নতুন ক্যাটাগরি যোগ করুন (Add New Category)'}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      ওয়েবসাইটের হোম পেজ, নেভবার ও প্রোডাক্ট যোগ ফর্মে রিয়েল-টাইমে আপডেট হবে
                    </p>
                  </div>
                  {editingCategoryId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCategoryId(null);
                        setCategoryForm(defaultCategoryForm);
                      }}
                      className="text-xs font-semibold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg self-start sm:self-auto transition"
                    >
                      সম্পাদনা বাতিল
                    </button>
                  )}
                </div>

                <form onSubmit={handleSaveCategory} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        ইংরেজি নাম (English Name) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Smartwatches"
                        value={categoryForm.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCategoryForm((prev) => ({
                            ...prev,
                            name: val,
                            slug: editingCategoryId ? prev.slug : val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
                          }));
                        }}
                        className={inputCls}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        বাংলা নাম (Bangla Name) <span className="text-slate-400 font-normal">(ঐচ্ছিক)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="যেমন: স্মার্টওয়াচ"
                        value={categoryForm.name_bn}
                        onChange={(e) => setCategoryForm((prev) => ({ ...prev, name_bn: e.target.value }))}
                        className={inputCls}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        সাব-লেবেল (Sub-label) <span className="text-slate-400 font-normal">(ঐচ্ছিক)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="যেমন: 40+ আইটেম, নতুন কালেকশন"
                        value={categoryForm.sub_label}
                        onChange={(e) => setCategoryForm((prev) => ({ ...prev, sub_label: e.target.value }))}
                        className={inputCls}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        স্লাগ (URL Slug)
                      </label>
                      <input
                        type="text"
                        placeholder="smartwatches"
                        value={categoryForm.slug}
                        onChange={(e) => setCategoryForm((prev) => ({ ...prev, slug: e.target.value }))}
                        className={inputCls}
                      />
                      <span className="text-[10px] text-slate-400">ফিল্টার লিঙ্ক: /shop বা ?category={categoryForm.slug || 'slug'}</span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        ক্রম নম্বর (Sort Order)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={categoryForm.sort_order}
                        onChange={(e) => setCategoryForm((prev) => ({ ...prev, sort_order: e.target.value }))}
                        className={inputCls}
                      />
                      <span className="text-[10px] text-slate-400">ছোট সংখ্যা আগে দেখাবে (০, ১, ২...)</span>
                    </div>

                    <div className="flex flex-col justify-center">
                      <label className="block text-xs font-bold text-slate-700 mb-2">স্ট্যাটাস</label>
                      <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={categoryForm.is_active}
                          onChange={(e) => setCategoryForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                          className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="text-xs font-semibold text-slate-700">
                          {categoryForm.is_active ? 'সক্রিয় (ওয়েবসাইটে লাইভ দেখাবে)' : 'নিষ্ক্রিয় (ওয়েবসাইটে লুকানো থাকবে)'}
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* আইকন নির্বাচন (Visual Icon Picker) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      আইকন নির্বাচন করুন (Icon Picker) <span className="text-slate-400 font-normal">- কার্ড ও মেনুতে দেখাবে</span>
                    </label>
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-10 gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                      {CATEGORY_ICONS_LIST.map((ic) => {
                        const IconComponent = ic.icon;
                        const isSelected = (categoryForm.icon || 'Tag').toLowerCase() === ic.name.toLowerCase();
                        return (
                          <button
                            type="button"
                            key={ic.name}
                            onClick={() => setCategoryForm((prev) => ({ ...prev, icon: ic.name }))}
                            className={`flex flex-col items-center justify-center p-2 rounded-xl border transition ${
                              isSelected
                                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/30'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:bg-blue-50/50'
                            }`}
                            title={ic.label}
                          >
                            <IconComponent className="w-5 h-5 mb-1" />
                            <span className="text-[10px] font-medium truncate w-full text-center leading-tight">
                              {ic.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-slate-500">অথবা কাস্টম আইকন নাম:</span>
                      <input
                        type="text"
                        placeholder="e.g. Watch, Headphones, Zap, Gift..."
                        value={categoryForm.icon}
                        onChange={(e) => setCategoryForm((prev) => ({ ...prev, icon: e.target.value }))}
                        className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs w-full sm:w-48 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* ছবি আপলোড ও প্রিভিউ */}
                  <div className="pt-2 border-t border-slate-100">
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      ক্যাটাগরি ছবি <span className="text-slate-400 font-normal">(হোম পেজ কার্ডের জন্য)</span>
                    </label>

                    <input
                      ref={categoryFileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleCategoryImageUpload(e.target.files[0]);
                          e.target.value = '';
                        }
                      }}
                    />

                    {categoryForm.image_url ? (
                      <div className="flex items-center gap-3">
                        <div className="w-20 h-20 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                          <img src={categoryForm.image_url} alt="Category" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex flex-col gap-2">
                          <button type="button" onClick={() => categoryFileInputRef.current?.click()} className="text-xs font-bold text-blue-600 hover:underline">ছবি পরিবর্তন</button>
                          <button type="button" onClick={() => setCategoryForm(prev => ({ ...prev, image_url: '' }))} className="text-xs font-bold text-rose-600 hover:underline">ছবি মুছুন</button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                            handleCategoryImageUpload(e.dataTransfer.files[0]);
                          }
                        }}
                        onClick={() => categoryFileInputRef.current?.click()}
                        className="w-full h-24 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-slate-100 transition cursor-pointer flex flex-col items-center justify-center text-slate-500"
                      >
                        {categoryUploading ? (
                          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                        ) : (
                          <>
                            <UploadCloud className="w-6 h-6 mb-1" />
                            <span className="text-xs font-bold">ছবি আপলোড করতে ক্লিক করুন</span>
                            <span className="text-[10px]">PNG, JPG, WEBP</span>
                          </>
                        )}
                      </div>
                    )}

                    <div className="mt-3">
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">অথবা ছবির URL দিন:</label>
                      <input
                        type="text"
                        placeholder="https://..."
                        value={categoryForm.image_url}
                        onChange={(e) => setCategoryForm((prev) => ({ ...prev, image_url: e.target.value }))}
                        className={inputCls + ' text-xs'}
                      />
                    </div>
                  </div>

                  {/* সংরক্ষণ বাটন */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-3 border-t border-slate-100">
                    <button
                      type="submit"
                      disabled={categorySaving}
                      className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 disabled:opacity-50 transition cursor-pointer"
                    >
                      {categorySaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      <span>{editingCategoryId ? 'ক্যাটাগরি আপডেট করুন (Update Category)' : 'ক্যাটাগরি সংরক্ষণ করুন (Save Category)'}</span>
                    </button>
                    {editingCategoryId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCategoryId(null);
                          setCategoryForm(defaultCategoryForm);
                        }}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-semibold transition"
                      >
                        বাতিল
                      </button>
                    )}
                  </div>
                </form>
              </Card>

              {/* ======================= CATEGORIES LIST ======================= */}
              <Card className="!p-5 sm:!p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <span>সব ক্যাটাগরির তালিকা</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                        {catList.length}টি ক্যাটাগরি
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">সর্ট অর্ডারের ক্রম অনুযায়ী সাজানো রয়েছে</p>
                  </div>

                  <div className="w-full sm:w-64">
                    <input
                      type="text"
                      placeholder="ক্যাটাগরি খুঁজুন..."
                      value={categoryQuery}
                      onChange={(e) => setCategoryQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[...catList]
                    .filter(
                      (c) =>
                        !categoryQuery ||
                        (c.name + ' ' + (c.name_bn || '') + ' ' + (c.slug || '') + ' ' + (c.sub_label || ''))
                          .toLowerCase()
                          .includes(categoryQuery.toLowerCase())
                    )
                    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
                    .map((c) => {
                      const IconComp = getCategoryIconComponent(c.icon);
                      const prodCount = prods.filter((p) => p.category_id === c.id || p.category_id === c.slug).length;
                      const childSubCats = sortSubCats(subCatList.filter((sc) => isSubOfCategory(sc, c)));
                      const catKey = c.id || c.slug;
                      const isInlineOpen = inlineSubCatParentKey === catKey;
                      const isEditing = editingCategoryId === c.id;

                      return (
                        <div
                          key={catKey}
                          className={`p-4 rounded-2xl border transition relative flex flex-col justify-between ${
                            isEditing
                              ? 'border-blue-500 bg-blue-50/40 ring-2 ring-blue-500/20'
                              : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm'
                          }`}
                        >
                          <div>
                            <div className="flex items-start gap-3">
                              {/* Icon / Image preview */}
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200/60 shadow-sm overflow-hidden">
                                {c.image_url ? (
                                  <img src={c.image_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <IconComp className="w-6 h-6" />
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h4 className="font-bold text-sm text-slate-900 truncate">{c.name}</h4>
                                  {c.name_bn && c.name_bn !== c.name && (
                                    <span className="text-[11px] text-slate-500 font-semibold">({c.name_bn})</span>
                                  )}
                                </div>

                                {c.sub_label && (
                                  <p className="text-xs text-blue-600 font-medium truncate mt-0.5">
                                    {c.sub_label}
                                  </p>
                                )}

                                <div className="flex items-center gap-1.5 mt-2 flex-wrap text-[11px]">
                                  <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-mono">
                                    /{c.slug}
                                  </span>
                                  <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-semibold">
                                    {prodCount}টি প্রোডাক্ট
                                  </span>
                                  <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-bold">
                                    {childSubCats.length}টি সাব-ক্যাটাগরি
                                  </span>
                                  <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md">
                                    ক্রম: {c.sort_order ?? 0}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Nested Sub-Categories directly under this Category */}
                            <div className="mt-3.5 pt-3 border-t border-slate-100">
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <span className="text-[11px] font-extrabold text-slate-600 flex items-center gap-1">
                                  <FolderTree className="w-3.5 h-3.5 text-blue-600" />
                                  সাব-ক্যাটাগরি সমূহ ({childSubCats.length})
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (isInlineOpen) {
                                      setInlineSubCatParentKey(null);
                                    } else {
                                      setInlineSubCatParentKey(catKey);
                                      setInlineSubCatForm({ name: '', name_bn: '', image_url: '' });
                                    }
                                  }}
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                                    isInlineOpen
                                      ? 'bg-slate-200 text-slate-700'
                                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                                  }`}
                                >
                                  {isInlineOpen ? (
                                    <>
                                      <X className="w-3 h-3" /> বন্ধ করুন
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="w-3 h-3" /> সাব-ক্যাটাগরি যোগ করুন
                                    </>
                                  )}
                                </button>
                              </div>

                              {/* Inline Quick Sub-Category Creator under this Category */}
                              {isInlineOpen && (
                                <form
                                  onSubmit={(e) => handleQuickSaveSubCategory(e, c)}
                                  className="mb-3 p-3 rounded-xl bg-blue-50/60 border border-blue-200 space-y-2.5"
                                >
                                  <p className="text-[11px] font-bold text-blue-800">
                                    &quot;{c.name_bn || c.name}&quot;-এর অধীনে নতুন সাব-ক্যাটাগরি তৈরি করুন:
                                  </p>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <input
                                      required
                                      type="text"
                                      placeholder="ইংরেজি নাম (e.g. ANC Earbuds) *"
                                      value={inlineSubCatForm.name}
                                      onChange={(e) =>
                                        setInlineSubCatForm((prev) => ({ ...prev, name: e.target.value }))
                                      }
                                      className="w-full bg-white border border-blue-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    />
                                    <input
                                      type="text"
                                      placeholder="বাংলা নাম (যেমন: এএনসি ইয়ারবাড)"
                                      value={inlineSubCatForm.name_bn}
                                      onChange={(e) =>
                                        setInlineSubCatForm((prev) => ({ ...prev, name_bn: e.target.value }))
                                      }
                                      className="w-full bg-white border border-blue-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    />
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <input
                                      type="file"
                                      ref={inlineSubCatFileInputRef}
                                      accept="image/*"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleInlineSubCategoryImageUpload(file);
                                        e.target.value = '';
                                      }}
                                      className="hidden"
                                    />
                                    {inlineSubCatForm.image_url ? (
                                      <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-blue-200 shrink-0">
                                        <img
                                          src={inlineSubCatForm.image_url}
                                          alt=""
                                          className="w-6 h-6 rounded object-cover"
                                        />
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setInlineSubCatForm((prev) => ({ ...prev, image_url: '' }))
                                          }
                                          className="text-rose-500 hover:text-rose-700 text-[11px] font-bold cursor-pointer"
                                        >
                                          ×
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        disabled={inlineSubCatUploading}
                                        onClick={() => inlineSubCatFileInputRef.current?.click()}
                                        className="px-2.5 py-1.5 bg-white hover:bg-blue-100 border border-blue-200 rounded-lg text-[11px] font-bold text-blue-700 flex items-center gap-1 shrink-0 cursor-pointer"
                                      >
                                        {inlineSubCatUploading ? (
                                          <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                          <UploadCloud className="w-3.5 h-3.5" />
                                        )}
                                        <span>ছবি</span>
                                      </button>
                                    )}
                                    <input
                                      type="text"
                                      placeholder="অথবা ছবির URL দিন (ঐচ্ছিক)"
                                      value={inlineSubCatForm.image_url}
                                      onChange={(e) =>
                                        setInlineSubCatForm((prev) => ({ ...prev, image_url: e.target.value }))
                                      }
                                      className="flex-1 min-w-0 bg-white border border-blue-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    />
                                  </div>

                                  <div className="flex items-center justify-between gap-2 pt-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingSubCatId(null);
                                        setSubCatForm({
                                          ...defaultSubCatForm,
                                          category_id: catKey,
                                          name: inlineSubCatForm.name,
                                          name_bn: inlineSubCatForm.name_bn,
                                          image_url: inlineSubCatForm.image_url,
                                        });
                                        setInlineSubCatParentKey(null);
                                        document
                                          .getElementById('subcategory-control-panel')
                                          ?.scrollIntoView({ behavior: 'smooth' });
                                      }}
                                      className="text-[11px] font-bold text-blue-700 hover:underline cursor-pointer"
                                    >
                                      বিস্তারিত ফর্মে খুলুন →
                                    </button>
                                    <button
                                      type="submit"
                                      disabled={inlineSubCatSaving}
                                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                                    >
                                      {inlineSubCatSaving ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      ) : (
                                        <Save className="w-3.5 h-3.5" />
                                      )}
                                      <span>সেভ করুন</span>
                                    </button>
                                  </div>
                                </form>
                              )}

                              {/* List of child sub-categories inside the parent category card */}
                              {childSubCats.length > 0 ? (
                                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-0.5">
                                  {childSubCats.map((sc, scIdx) => (
                                    <div
                                      key={sc.id}
                                      className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl border text-xs transition ${
                                        sc.is_active !== false
                                          ? 'bg-slate-50/80 border-slate-200/80 hover:border-blue-300'
                                          : 'bg-slate-100/70 border-slate-200 opacity-65'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                                          {sc.image_url ? (
                                            <img
                                              src={sc.image_url}
                                              alt=""
                                              className="w-full h-full object-cover"
                                            />
                                          ) : (
                                            <Tag className="w-3.5 h-3.5 text-blue-500" />
                                          )}
                                        </div>
                                        <span className="font-bold text-slate-800 truncate">
                                          {sc.name_bn || sc.name}
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-0.5 shrink-0">
                                        <button
                                          type="button"
                                          disabled={scIdx === 0}
                                          onClick={() => handleMoveSubCategoryOrder(sc, 'up')}
                                          className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                                          title="উপরে নিন"
                                        >
                                          <ArrowUp className="w-3 h-3" />
                                        </button>
                                        <button
                                          type="button"
                                          disabled={scIdx === childSubCats.length - 1}
                                          onClick={() => handleMoveSubCategoryOrder(sc, 'down')}
                                          className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                                          title="নিচে নিন"
                                        >
                                          <ArrowDown className="w-3 h-3" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleToggleSubCategoryActive(sc)}
                                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                                            sc.is_active !== false
                                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                              : 'bg-slate-200 text-slate-600'
                                          }`}
                                          title="সক্রিয় / নিষ্ক্রিয় করুন"
                                        >
                                          {sc.is_active !== false ? 'চালু' : 'বন্ধ'}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => startEditSubCategory(sc)}
                                          className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                                          title="সম্পাদনা করুন"
                                        >
                                          <Pencil className="w-3 h-3" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteSubCategory(sc)}
                                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                                          title="ডিলিট করুন"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                !isInlineOpen && (
                                  <p className="text-[11px] text-slate-400 italic">
                                    কোনো সাব-ক্যাটাগরি নেই — উপরের &quot;+ সাব-ক্যাটাগরি যোগ করুন&quot; বাটনে ক্লিক করুন।
                                  </p>
                                )
                              )}
                            </div>
                          </div>

                          {/* Bottom actions for Parent Category */}
                          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleMoveCategoryOrder(c, 'up')}
                                className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition cursor-pointer"
                                title="উপরে নিন"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveCategoryOrder(c, 'down')}
                                className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition cursor-pointer"
                                title="নিচে নিন"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleCategoryActive(c)}
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition cursor-pointer ${
                                  c.is_active !== false
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                                }`}
                              >
                                {c.is_active !== false ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                              </button>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCategoryId(c.id || null);
                                  setCategoryForm({
                                    name: c.name || '',
                                    name_bn: c.name_bn || '',
                                    slug: c.slug || '',
                                    sub_label: c.sub_label || '',
                                    icon: c.icon || 'Tag',
                                    image_url: c.image_url || '',
                                    sort_order: String(c.sort_order ?? 0),
                                    is_active: c.is_active !== false
                                  });
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                                title="ক্যাটাগরি সম্পাদনা করুন"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCategory(c)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                title="ক্যাটাগরি ডিলিট করুন"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {catList.length === 0 && (
                  <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <FolderTree className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-500">কোনো ক্যাটাগরি তৈরি করা হয়নি</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">উপরের ফর্ম থেকে নতুন ক্যাটাগরি যোগ করুন</p>
                  </div>
                )}
              </Card>

            </div>
          )}

          {/* ============================= BANNERS ============================= */}
          {page === 'banners' && (
            <div className="space-y-6">
              <Card className="!p-5 sm:!p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-2">
                  <div>
                    <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-blue-600" />
                      {editingBannerId ? 'ব্যানার সম্পাদনা (Edit Banner)' : 'নতুন ব্যানার যোগ করুন (Add New Banner)'}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">হোম পেজের অটো-স্ক্রল হিরো স্লাইডারে লাইভ দেখাবে</p>
                  </div>
                  {editingBannerId && (
                    <button type="button" onClick={cancelEditBanner} className="text-xs font-semibold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg self-start sm:self-auto">
                      সম্পাদনা বাতিল
                    </button>
                  )}
                </div>

                <div className="mb-5 flex items-start sm:items-center gap-3 p-3.5 bg-gradient-to-r from-blue-50 to-blue-50 border border-blue-200/80 rounded-2xl text-blue-900 text-xs sm:text-sm">

                  <div>
                    <span className="font-bold">সেরা রেজাল্টের জন্য ১৯২০x৭২০ পিক্সেল সাইজের ছবি দিন (রেশিও ৮:৩)।</span>
                    <span className="text-blue-700 ml-1">ছবি সর্বোচ্চ ৫MB সাইজের হতে পারবে।</span>
                  </div>
                </div>

                <form onSubmit={handleSaveBanner} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      ব্যানারের ছবি <span className="text-rose-500">*</span>
                    </label>

                    {/* লুকানো ফাইল ইনপুট, দুই অবস্থাতেই কাজ করে */}
                    <input
                      ref={bannerFileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleBannerImageUpload(e.target.files[0]);
                          e.target.value = '';
                        }
                      }}
                    />

                    {bannerForm.image_url ? (
                      <div className="space-y-3">
                        <div className="relative w-full aspect-[8/3] max-h-56 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shadow-inner group">
                          <img src={bannerForm.image_url} alt="Banner Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                            <button type="button" onClick={() => bannerFileInputRef.current?.click()} className="px-3.5 py-2 bg-white text-slate-800 rounded-xl text-xs font-bold shadow-md hover:bg-slate-100 transition cursor-pointer">
                              ছবি পরিবর্তন করুন
                            </button>
                            <button type="button" onClick={() => setBannerForm((prev) => ({ ...prev, image_url: '' }))} className="px-3.5 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-rose-700 transition cursor-pointer">
                              মুছে ফেলুন
                            </button>
                          </div>
                        </div>
                        {/* মোবাইলে hover নেই, তাই আলাদা বাটন */}
                        <div className="flex gap-2 sm:hidden">
                          <button type="button" onClick={() => bannerFileInputRef.current?.click()} className="flex-1 px-3 py-2 bg-slate-100 text-slate-800 rounded-xl text-xs font-bold">ছবি পরিবর্তন</button>
                          <button type="button" onClick={() => setBannerForm((prev) => ({ ...prev, image_url: '' }))} className="flex-1 px-3 py-2 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold">মুছে ফেলুন</button>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">বর্তমান ছবি URL: {bannerForm.image_url.startsWith('data:') ? '(আপলোড করা ছবি)' : bannerForm.image_url}</p>
                      </div>
                    ) : (
                      <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                            handleBannerImageUpload(e.dataTransfer.files[0]);
                          }
                        }}
                        onClick={() => bannerFileInputRef.current?.click()}
                        className="w-full aspect-[8/3] max-h-48 rounded-2xl border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/40 hover:bg-blue-50 transition cursor-pointer flex flex-col items-center justify-center p-6 text-center group"
                      >
                        {bannerUploading ? (
                          <div className="space-y-3 w-full max-w-xs">
                            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
                            <p className="text-xs font-bold text-blue-900">ছবি আপলোড হচ্ছে... {bannerUploadProgress}%</p>
                            <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
                              <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${bannerUploadProgress}%` }} />
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-110 transition">
                              <UploadCloud className="w-6 h-6" />
                            </div>
                            <p className="text-sm font-bold text-slate-800">
                              এখানে ছবি টেনে এনে ছাড়ুন অথবা <span className="text-blue-600 underline">ব্রাউজ করুন</span>
                            </p>
                            <p className="text-[11px] text-slate-400 mt-1">সুপারিশকৃত সাইজ: ১৯২০x৭২০ পিক্সেল (সর্বোচ্চ ৫MB, PNG, JPG, WEBP)</p>
                          </>
                        )}
                      </div>
                    )}

                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="অথবা অনলাইন ছবির লিঙ্ক দিন (https://...)"
                        value={bannerForm.image_url.startsWith('data:') ? '' : bannerForm.image_url}
                        onChange={(e) => setBannerForm((prev) => ({ ...prev, image_url: e.target.value }))}
                        className={inputCls + ' text-xs'}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        ব্যানারের নাম / শিরোনাম <span className="text-slate-400 font-normal">(শুধু চেনার জন্য)</span>
                      </label>
                      <input type="text" placeholder="যেমন: মেগা সেল ব্যানার ২০২৬" value={bannerForm.title} onChange={(e) => setBannerForm((prev) => ({ ...prev, title: e.target.value }))} className={inputCls} />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        ব্যানারের বর্ণনা (Description)
                      </label>
                      <input type="text" placeholder="যেমন: নতুন কালেকশন..." value={bannerForm.description} onChange={(e) => setBannerForm((prev) => ({ ...prev, description: e.target.value }))} className={inputCls} />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        ক্লিক লিংক URL <span className="text-slate-400 font-normal">(ঐচ্ছিক)</span>
                      </label>
                      <input type="text" placeholder="যেমন: /shop, /smartwatches, বা লিঙ্ক" value={bannerForm.link_url} onChange={(e) => setBannerForm((prev) => ({ ...prev, link_url: e.target.value }))} className={inputCls} />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">ক্রম নম্বর (Sort Order)</label>
                      <input type="number" min="0" value={bannerForm.sort_order} onChange={(e) => setBannerForm((prev) => ({ ...prev, sort_order: e.target.value }))} className={inputCls} />
                      <span className="text-[10px] text-slate-400">ছোট সংখ্যা আগে দেখাবে (১, ২, ৩...)</span>
                    </div>

                    <div className="flex flex-col justify-center">
                      <label className="block text-xs font-bold text-slate-700 mb-2">স্ট্যাটাস</label>
                      <Toggle checked={bannerForm.is_active} onChange={(v) => setBannerForm((prev) => ({ ...prev, is_active: v }))} label={bannerForm.is_active ? 'সক্রিয় (Active)' : 'নিষ্ক্রিয়'} />
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-3">
                    <button type="submit" disabled={bannerSaving || bannerUploading} className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition disabled:opacity-50 cursor-pointer">
                      {bannerSaving ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /><span>সংরক্ষণ হচ্ছে...</span></>
                      ) : (
                        <><Save className="w-4 h-4" /><span>{editingBannerId ? 'ব্যানার আপডেট করুন' : 'ব্যানার যোগ করুন'}</span></>
                      )}
                    </button>

                    {editingBannerId && (
                      <button type="button" onClick={cancelEditBanner} className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition cursor-pointer">
                        বাতিল করুন
                      </button>
                    )}
                  </div>
                </form>
              </Card>

              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-base sm:text-lg text-slate-900">সকল ব্যানার ({bannersList.length})</h3>
                    <span className="text-xs text-slate-400">(সক্রিয় ব্যানারগুলো হোম পেজে দেখাবে)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => { loadBanners(); notify('ব্যানার তালিকা রিফ্রেশ হয়েছে'); }}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer"
                  >
                    তালিকা রিফ্রেশ
                  </button>
                </div>

                {bannersList.length === 0 ? (
                  <Card className="text-center py-12">
                    <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-700">কোনো ব্যানার নেই</p>
                    <p className="text-xs text-slate-400 mt-1">উপরের ফর্ম ব্যবহার করে আপনার প্রথম ব্যানারটি যোগ করুন।</p>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {bannersList.map((banner, index) => {
                      const isActive = banner.is_active !== false;
                      const link = (banner as any).link_url || (banner as any).link;
                      return (
                        <Card key={banner.id || index} className={`!p-4 sm:!p-5 transition-all ${editingBannerId === banner.id ? 'ring-2 ring-blue-500 bg-blue-50/20' : 'hover:shadow-md'}`}>
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 min-w-0">
                              <div className="relative w-full sm:w-56 aspect-[8/3] rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
                                <img
                                  src={banner.image_url}
                                  alt={banner.title || 'Banner'}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=80';
                                  }}
                                />
                                <span className="absolute top-1 left-1 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                                  #{banner.sort_order ?? index + 1}
                                </span>
                              </div>

                              <div className="min-w-0 space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-extrabold text-sm sm:text-base text-slate-900 truncate">{banner.title || `ব্যানার #${index + 1}`}</h4>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                                    {isActive ? '✓ সক্রিয়' : '✕ নিষ্ক্রিয়'}
                                  </span>
                                </div>

                                {link ? (
                                  <p className="text-xs text-blue-600 flex items-center gap-1 truncate font-medium">
                                    <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                                    <span className="truncate">{link}</span>
                                  </p>
                                ) : (
                                  <p className="text-xs text-slate-400">কোনো লিংক যুক্ত নেই</p>
                                )}

                                <p className="text-[11px] text-slate-400">
                                  ক্রম: {banner.sort_order ?? index + 1} {banner.created_at ? `• ${new Date(banner.created_at).toLocaleDateString('bn-BD')}` : ''}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 sm:gap-2.5 self-end md:self-auto flex-wrap">
                              <div className="flex items-center bg-slate-100 rounded-xl p-0.5">
                                <button type="button" disabled={index === 0} onClick={() => moveBannerOrder(index, 'up')} title="উপরে নিন" className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer">
                                  <ArrowUp className="w-4 h-4" />
                                </button>
                                <button type="button" disabled={index === bannersList.length - 1} onClick={() => moveBannerOrder(index, 'down')} title="নিচে নিন" className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer">
                                  <ArrowDown className="w-4 h-4" />
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => toggleBannerStatus(banner)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'}`}
                              >
                                {isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                              </button>

                              <button type="button" onClick={() => startEditBanner(banner)} className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 transition cursor-pointer" title="সম্পাদনা করুন">
                                <Pencil className="w-4 h-4" />
                              </button>

                              <button type="button" onClick={() => setDeleteConfirmBanner(banner)} className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition cursor-pointer" title="মুছে ফেলুন">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ============================= DELIVERY ZONES ============================= */}
          {page === 'deliveryZones' && (
            <div className="space-y-6">
              <Card className="!p-5 sm:!p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-2">
                  <div>
                    <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <Truck className="w-5 h-5 text-blue-600" />
                      {editingZoneId ? 'ডেলিভারি জোন সম্পাদনা করুন' : 'ডেলিভারি জোন তালিকা'}
                    </h2>
                    {!editingZoneId && (
                      <p className="text-xs text-slate-500 mt-0.5">নতুন জোন যোগ করতে নিচে সম্পাদনা মোড ব্যবহার করুন</p>
                    )}
                  </div>
                  {editingZoneId && (
                    <button type="button" onClick={() => { setEditingZoneId(null); setZoneForm({ name: '', name_bn: '', charge: '60', estimated_days: '১-২ কার্যদিবস' }); }} className="text-xs font-semibold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg">
                      বাতিল
                    </button>
                  )}
                </div>

                {(editingZoneId || !zoneList.length) && (
                  <form onSubmit={handleSaveZone} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">জোনের নাম (বাংলা) <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="যেমন: ঢাকার ভিতরে / ঢাকার বাইরে"
                      value={zoneForm.name_bn}
                      onChange={(e) => setZoneForm((prev) => ({ ...prev, name_bn: e.target.value }))}
                      className={inputCls + ' text-xs'}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">জোনের নাম (English)</label>
                    <input
                      type="text"
                      placeholder="e.g. Inside Dhaka"
                      value={zoneForm.name}
                      onChange={(e) => setZoneForm((prev) => ({ ...prev, name: e.target.value }))}
                      className={inputCls + ' text-xs'}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">ডেলিভারি চার্জ (৳) <span className="text-rose-500">*</span></label>
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="60"
                      value={zoneForm.charge}
                      onChange={(e) => setZoneForm((prev) => ({ ...prev, charge: e.target.value }))}
                      className={inputCls + ' text-xs'}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">সময় / কার্যদিবস</label>
                    <input
                      type="text"
                      placeholder="১-২ কার্যদিবস"
                      value={zoneForm.estimated_days}
                      onChange={(e) => setZoneForm((prev) => ({ ...prev, estimated_days: e.target.value }))}
                      className={inputCls + ' text-xs'}
                    />
                  </div>
                  <div className="sm:col-span-2 lg:col-span-4 flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={zoneSaving}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-50"
                    >
                      {zoneSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      <span>{editingZoneId ? 'জোন আপডেট করুন' : 'জোন সেভ করুন'}</span>
                    </button>
                  </div>
                </form>
                )}
              </Card>

              <Card className="!p-5 sm:!p-6 space-y-4">
                <h3 className="font-extrabold text-base text-slate-900">ডেলিভারি জোন তালিকা ({zoneList.length})</h3>
                {zoneList.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">কোনো ডেলিভারি জোন নেই।</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {zoneList.map((zone) => (
                      <div key={zone.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <h4 className="font-bold text-sm text-slate-900">{zone.name_bn}</h4>
                          <p className="text-xs text-blue-600 font-extrabold">চার্জ: ৳{zone.charge}</p>
                          <p className="text-[11px] text-slate-500">সময়: {zone.estimated_days} {zone.name ? `(${zone.name})` : ''}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingZoneId(zone.id);
                              setZoneForm({
                                name: zone.name || '',
                                name_bn: zone.name_bn || '',
                                charge: String(zone.charge || 0),
                                estimated_days: zone.estimated_days || ''
                              });
                            }}
                            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 transition cursor-pointer"
                            title="সম্পাদনা"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmZone(zone)}
                            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-300 transition cursor-pointer"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          )}


          {/* ============================= FLASH SALES ============================= */}
          {page === 'flashSales' && (
            <div className="space-y-6">
              <Card className="!p-5 sm:!p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                  <div>
                    <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
                      Flash Sale Products ({prods.filter(p => p.is_flash_sale).length})
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">হোম পেজের ফ্ল্যাশ সেল সেকশনে প্রদর্শিত প্রোডাক্টসমূহ পরিচালনা করুন</p>
                  </div>

                  {/* Add Product Dropdown */}
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <select
                      id="flash-sale-product-select"
                      onChange={async (e) => {
                        const prodId = e.target.value;
                        if (!prodId) return;
                        const prod = prods.find((p) => p.id === prodId);
                        if (prod) {
                          await toggleFlashSale(prod);
                          e.target.value = '';
                        }
                      }}
                      className={inputCls + ' sm:w-64 text-xs font-semibold !py-2 bg-slate-50 border-amber-200 focus:ring-amber-500'}
                    >
                      <option value="">+ ফ্ল্যাশ সেলে প্রোডাক্ট যুক্ত করুন...</option>
                      {prods.filter(p => !p.is_flash_sale).map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({money(p.price)})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {prods.filter(p => p.is_flash_sale).length === 0 ? (
                  <div className="text-center py-12">
                    <Zap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-700">কোনো Flash Sale প্রোডাক্ট নেই</p>
                    <p className="text-xs text-slate-400 mt-1">উপরের ড্রপডাউন বা প্রোডাক্টস তালিকার ⚡ বাটনে ক্লিক করে ফ্ল্যাশ সেলে প্রোডাক্ট যুক্ত করুন।</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 mt-4">
                    {prods.filter(p => p.is_flash_sale).map((p) => (
                      <Card key={p.id} className="!p-3 flex items-center gap-3 border-amber-100 bg-amber-50/20">
                        <div className="w-16 h-16 rounded-xl bg-amber-50 overflow-hidden shrink-0 flex items-center justify-center border border-amber-200">
                          {p.image_url ? <img src={p.image_url} alt="" className="w-full h-full object-cover" /> : <Package className="w-6 h-6 text-amber-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate">{p.name}</p>
                          <p className="text-sm font-extrabold text-amber-600">{money(p.price)}</p>
                        </div>
                        <button type="button" onClick={() => toggleFlashSale(p)} className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer" title="Flash Sale থেকে বাদ দিন">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </Card>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* ============================= CUSTOMERS ============================ */}
          {page === 'customers' && (
            <div className="space-y-4">
              <input value={customerQuery} onChange={(e) => setCustomerQuery(e.target.value)} placeholder="Search by name or phone..." className={inputCls + ' sm:max-w-sm bg-white'} />
              {customers.length === 0 ? <Card><Empty text="কোনো কাস্টমার নেই।" /></Card> : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {customers.map((c) => (
                    <Card key={c.phone + c.name} className="!p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0"><p className="font-bold truncate">{c.name}</p><p className="text-sm text-slate-500">{c.phone}</p><p className="text-xs text-slate-400 truncate">{c.address}</p></div>
                        <div className="text-right shrink-0"><p className="font-extrabold text-blue-600">{money(c.spent)}</p><p className="text-xs text-slate-500">{c.count} orders</p>
                          {c.last > 0 && <p className="text-[11px] text-slate-400">Last: {new Date(c.last).toLocaleDateString('en-GB')}</p>}</div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ============================== REPORTS ============================= */}
          {page === 'reports' && (() => {
            const ok = reportOrders.filter((o) => o.status !== 'cancelled');
            const rev = ok.reduce((s, o) => s + (o.total || 0), 0);
            const by = (f: (o: OrderLite) => string) => { const m: Record<string, number> = {}; reportOrders.forEach((o) => { const k = f(o); m[k] = (m[k] || 0) + 1; }); return Object.entries(m).sort((a, b) => b[1] - a[1]); };
            return (
              <div className="space-y-4">
                <Card className="flex flex-col sm:flex-row sm:items-end gap-3">
                  <label className="text-xs font-semibold text-slate-500">From<input type="date" value={reportFrom} onChange={(e) => setReportFrom(e.target.value)} className={inputCls + ' mt-1'} /></label>
                  <label className="text-xs font-semibold text-slate-500">To<input type="date" value={reportTo} onChange={(e) => setReportTo(e.target.value)} className={inputCls + ' mt-1'} /></label>
                  <button type="button" onClick={exportCsv} disabled={reportOrders.length === 0} className="sm:ml-auto inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm px-5 py-2.5 rounded-xl"><Download className="w-4 h-4" />Export CSV</button>
                </Card>
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                  {[['Revenue', money(rev)], ['Orders', String(reportOrders.length)], ['Avg. order value', money(ok.length ? rev / ok.length : 0)], ['Cancelled', String(reportOrders.length - ok.length)]].map(([l, v]) => (
                    <Card key={l}><p className="text-xs text-slate-500">{l}</p><p className="text-xl sm:text-2xl font-extrabold mt-1 break-all">{v}</p></Card>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[['By status', by((o) => o.status || 'pending')], ['By payment method', by((o) => o.payment_method || 'Unknown')]].map(([title, rows]) => (
                    <Card key={title as string}>
                      <h3 className="font-bold mb-3">{title as string}</h3>
                      {(rows as [string, number][]).length === 0 ? <Empty text="ডাটা নেই" /> : (rows as [string, number][]).map(([k, n]) => (
                        <div key={k} className="mb-3">
                          <div className="flex justify-between text-sm mb-1"><span className="capitalize text-slate-700">{k}</span><span className="font-semibold">{n}</span></div>
                          <div className="h-2 rounded-full bg-blue-100"><div className="h-full rounded-full bg-blue-600" style={{ width: `${(n / reportOrders.length) * 100}%` }} /></div>
                        </div>
                      ))}
                    </Card>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* ============================== SETTINGS ============================ */}
          {page === 'settings' && (
            <Card className="max-w-2xl space-y-6">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900 mb-1">ওয়েবসাইট সেটিংস (Website Settings)</h3>
                <p className="text-xs text-slate-500">এখান থেকে ওয়েবসাইটের নাম ও সেলস টার্গেট পরিবর্তন করতে পারবেন।</p>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">
                    ওয়েবসাইটের নাম (Website Name)
                  </label>
                  <input
                    type="text"
                    value={siteNameInput}
                    onChange={(e) => setSiteNameInput(e.target.value)}
                    placeholder="যেমন: Kalkerdeal"
                    className={inputCls}
                  />
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">
                    ওয়েবসাইট সাপোর্ট নাম্বার (Website Number)
                  </label>
                  <input
                    type="text"
                    value={siteNumberInput || ''}
                    onChange={(e) => setSiteNumberInput(e.target.value)}
                    placeholder="যেমন: 01XXXXXXXXX"
                    className={inputCls}
                  />
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">
                    প্রোমো কোড (Promo Code)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCodeInput || ''}
                      onChange={(e) => setPromoCodeInput(e.target.value)}
                      placeholder="যেমন: SAVE10"
                      className={inputCls}
                    />
                    <input
                      type="number"
                      value={promoDiscountInput || ''}
                      onChange={(e) => setPromoDiscountInput(e.target.value)}
                      placeholder="Discount Amount (৳)"
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">
                    বিকাশ মার্চেন্ট / পার্সোনাল নাম্বার (bKash Number)
                  </label>
                  <input
                    type="text"
                    value={bkashNumberInput || ''}
                    onChange={(e) => setBkashNumberInput(e.target.value)}
                    placeholder="01700000000"
                    className={inputCls}
                  />
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">
                    নগদ মার্চেন্ট / পার্সোনাল নাম্বার (Nagad Number)
                  </label>
                  <input
                    type="text"
                    value={nagadNumberInput || ''}
                    onChange={(e) => setNagadNumberInput(e.target.value)}
                    placeholder="01700000000"
                    className={inputCls}
                  />
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">
                    ফ্রি ডেলিভারির ন্যূনতম অর্ডার পরিমাণ (Free Shipping Threshold ৳)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={freeShippingThresholdInput || ''}
                    onChange={(e) => setFreeShippingThresholdInput(e.target.value)}
                    placeholder="যেমন: 2000"
                    className={inputCls}
                  />
                  <p className="text-[11px] text-slate-500 pt-0.5">
                    এই অঙ্কের সমান বা বেশি টাকার অর্ডার করলে কাস্টমার ফ্রি ডেলিভারি পাবেন।
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">ডেলিভারি চার্জ নিয়ন্ত্রণ (Delivery Charges)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        ঢাকার ভিতরে চার্জ (Inside Dhaka ৳)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={insideChargeInput || ''}
                        onChange={(e) => setInsideChargeInput(e.target.value)}
                        placeholder="60"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        ঢাকার বাইরে চার্জ (Outside Dhaka ৳)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={outsideChargeInput || ''}
                        onChange={(e) => setOutsideChargeInput(e.target.value)}
                        placeholder="130"
                        className={inputCls}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">
                    Monthly Sales Target (BDT)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={targetInput}
                    onChange={(e) => setTargetInput(e.target.value)}
                    className={inputCls}
                  />
                  <p className="text-[11px] text-slate-500 pt-0.5">
                    Dashboard-এর Monthly Target গেজ এই অঙ্কের সাথে তুলনা করে।
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={saveSettings}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-md transition cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>সেটিংস সেভ করুন (Save Settings)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoading(true);
                    Promise.all([loadOrders(), loadEvents(), loadSettings()]).finally(() => setLoading(false));
                    notify('ডাটা রিফ্রেশ করা হয়েছে');
                  }}
                  className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                >
                  Refresh Data
                </button>
              </div>
            </Card>
          )}
      </AdminShell>

      {/* Supabase SQL Setup Modal */}
      {showSqlModal && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="font-bold text-sm sm:text-base">Supabase SQL Editor Setup কোড</h3>
                  <p className="text-[11px] text-slate-400">ইমেজ আপলোড, ক্যাটাগরি ও ব্যানার সক্রিয় করার কোড</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowSqlModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="admin-scroll p-4 sm:p-5 overflow-y-auto space-y-3">
              <div className="bg-blue-50 border border-blue-200 text-blue-900 rounded-xl p-3 text-xs leading-relaxed">
                <span className="font-bold block mb-1">কীভাবে চালাবেন?</span>
                ১. নিচের <span className="font-bold">&quot;SQL কোড কপি করুন&quot;</span> বাটনে ক্লিক করুন।<br />
                ২. আপনার Supabase ড্যাশবোর্ডে গিয়ে বামপাশের <b>SQL Editor</b> ট্যাবে যান।<br />
                ৩. কোডটি পেস্ট করে <b>Run</b> বাটনে ক্লিক করুন।
              </div>

              <pre className="admin-scroll bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-72 leading-relaxed selection:bg-blue-600">{SETUP_SQL}</pre>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button type="button" onClick={() => setShowSqlModal(false)} className="px-4 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 border border-slate-300 text-slate-700">
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  try { navigator.clipboard.writeText(SETUP_SQL); } catch { /* ignore */ }
                  setSqlCopied(true);
                  notify('SQL কোড কপি হয়েছে! Supabase SQL Editor এ পেস্ট করে Run করুন।');
                  setTimeout(() => setSqlCopied(false), 3000);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 cursor-pointer"
              >
                {sqlCopied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                {sqlCopied ? 'কপি হয়েছে!' : 'SQL কোড কপি করুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Banner Confirmation Modal */}
      {deleteConfirmBanner && (
        <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-slate-100">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">ব্যানারটি মুছে ফেলতে চান?</h3>
              <p className="text-xs text-slate-500 mt-1">
                &quot;{deleteConfirmBanner.title || 'এই ব্যানারটি'}&quot; স্থায়ীভাবে মুছে ফেলা হবে।
              </p>
            </div>
            <div className="flex items-center gap-3 justify-center pt-2">
              <button type="button" onClick={() => setDeleteConfirmBanner(null)} className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer">
                বাতিল
              </button>
              <button type="button" onClick={() => handleDeleteBanner(deleteConfirmBanner)} className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-500/20 cursor-pointer">
                হ্যাঁ, মুছে ফেলুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Category Confirmation Modal */}
      {deleteConfirmCategory && (
        <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-slate-100">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">ক্যাটাগরি মুছে ফেলতে চান?</h3>
              <p className="text-xs text-slate-500 mt-1">
                &quot;{deleteConfirmCategory.name}&quot; স্থায়ীভাবে মুছে ফেলা হবে।
              </p>
            </div>
            <div className="flex items-center gap-3 justify-center pt-2">
              <button type="button" onClick={() => setDeleteConfirmCategory(null)} className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer">
                বাতিল
              </button>
              <button type="button" onClick={confirmDeleteCategory} disabled={deletingCategory} className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-500/20 cursor-pointer disabled:opacity-50">
                {deletingCategory ? 'মুছে ফেলা হচ্ছে...' : 'হ্যাঁ, মুছে ফেলুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Sub-Category Confirmation Modal */}
      {deleteConfirmSubCategory && (
        <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-slate-100">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">সাব-ক্যাটাগরি মুছে ফেলতে চান?</h3>
              <p className="text-xs text-slate-500 mt-1">
                &quot;{deleteConfirmSubCategory.name_bn || deleteConfirmSubCategory.name}&quot; স্থায়ীভাবে মুছে ফেলা হবে।
              </p>
            </div>
            <div className="flex items-center gap-3 justify-center pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmSubCategory(null)}
                disabled={deletingSubCategory}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={confirmDeleteSubCategory}
                disabled={deletingSubCategory}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-500/20 cursor-pointer disabled:opacity-50"
              >
                {deletingSubCategory ? 'মুছে ফেলা হচ্ছে...' : 'হ্যাঁ, মুছে ফেলুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Product Confirmation Modal */}
      {deleteConfirmProduct && (
        <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-slate-100">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">প্রোডাক্টটি ডিলিট করতে চান?</h3>
              <p className="text-xs text-slate-500 mt-1 break-words">
                &quot;{deleteConfirmProduct.name}&quot; স্থায়ীভাবে মুছে ফেলা হবে। এটি আর ফেরত আনা যাবে না।
              </p>
            </div>
            <div className="flex items-center gap-3 justify-center pt-2">
              <button type="button" onClick={() => setDeleteConfirmProduct(null)} disabled={deletingProduct} className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer disabled:opacity-50">
                বাতিল
              </button>
              <button type="button" onClick={confirmDeleteProduct} disabled={deletingProduct} className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-500/20 cursor-pointer disabled:opacity-50">
                {deletingProduct ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />মুছে ফেলা হচ্ছে...</> : 'হ্যাঁ, ডিলিট করুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Order Confirmation Modal */}
      {deleteConfirmOrder && (
        <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-slate-100">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">অর্ডারটি ডিলিট করতে চান?</h3>
              <p className="text-xs text-slate-500 mt-1 break-words">
                অর্ডার <span className="font-bold text-slate-700">{deleteConfirmOrder.order_number || '#' + (deleteConfirmOrder.id || '').slice(0, 6)}</span>
                {deleteConfirmOrder.customer_name ? ` (${deleteConfirmOrder.customer_name})` : ''} স্থায়ীভাবে মুছে ফেলা হবে। এটি আর ফেরত আনা যাবে না।
              </p>
            </div>
            <div className="flex items-center gap-3 justify-center pt-2">
              <button type="button" onClick={() => setDeleteConfirmOrder(null)} disabled={deletingOrder} className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer disabled:opacity-50">
                বাতিল
              </button>
              <button type="button" onClick={confirmDeleteOrder} disabled={deletingOrder} className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-500/20 cursor-pointer disabled:opacity-50">
                {deletingOrder ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />মুছে ফেলা হচ্ছে...</> : 'হ্যাঁ, ডিলিট করুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Order Modal */}
      {editingOrder && (
        <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    অর্ডার সম্পাদনা করুন
                  </h3>
                  <p className="text-xs text-blue-600 font-mono font-bold">
                    {editingOrder.order_number || '#' + (editingOrder.id || '').slice(0, 6)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingOrder(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOrderEdit} className="space-y-4">
              {/* Customer Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    কাস্টমারের নাম <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={orderEditForm.customer_name}
                    onChange={(e) => setOrderEditForm((prev) => ({ ...prev, customer_name: e.target.value }))}
                    className={inputCls + ' text-xs'}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    মোবাইল নম্বর <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={orderEditForm.phone}
                    onChange={(e) => setOrderEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                    className={inputCls + ' text-xs'}
                  />
                </div>
              </div>

              {/* Delivery Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  সম্পূর্ণ ডেলিভারি ঠিকানা <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={orderEditForm.address}
                  onChange={(e) => setOrderEditForm((prev) => ({ ...prev, address: e.target.value }))}
                  className={inputCls + ' text-xs resize-none'}
                />
              </div>

              {/* Delivery Zone & Delivery Charge */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ডেলিভারি অঞ্চল
                  </label>
                  <select
                    value={orderEditForm.delivery_zone}
                    onChange={(e) => {
                      const newZone = e.target.value;
                      const newCharge = newZone.includes('বাইরে') ? '130' : '60';
                      setOrderEditForm((prev) => ({ ...prev, delivery_zone: newZone, delivery_charge: newCharge }));
                    }}
                    className={inputCls + ' text-xs'}
                  >
                    <option value="ঢাকার ভিতরে">ঢাকার ভিতরে</option>
                    <option value="ঢাকার বাইরে">ঢাকার বাইরে</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ডেলিভারি চার্জ (৳)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={orderEditForm.delivery_charge}
                    onChange={(e) => setOrderEditForm((prev) => ({ ...prev, delivery_charge: e.target.value }))}
                    className={inputCls + ' text-xs'}
                  />
                </div>
              </div>

              {/* Status & Payment Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    অর্ডার স্ট্যাটাস
                  </label>
                  <select
                    value={orderEditForm.status}
                    onChange={(e) => setOrderEditForm((prev) => ({ ...prev, status: e.target.value }))}
                    className={inputCls + ' text-xs capitalize'}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    পেমেন্ট মেথড
                  </label>
                  <select
                    value={orderEditForm.payment_method}
                    onChange={(e) => setOrderEditForm((prev) => ({ ...prev, payment_method: e.target.value }))}
                    className={inputCls + ' text-xs uppercase'}
                  >
                    <option value="cod">Cash on Delivery (COD)</option>
                    <option value="bkash">bKash</option>
                    <option value="nagad">Nagad</option>
                    <option value="card">Card / Online</option>
                  </select>
                </div>
              </div>

              {/* Total Payable Bill */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  সর্বমোট মূল্য (Total Bill ৳)
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={orderEditForm.total}
                  onChange={(e) => setOrderEditForm((prev) => ({ ...prev, total: e.target.value }))}
                  className={inputCls + ' text-xs font-bold text-[#E11D48]'}
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  disabled={orderEditSaving}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition disabled:opacity-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={orderEditSaving}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {orderEditSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>সেভ হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>সংরক্ষণ করুন</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Zone Confirmation Modal */}
      {deleteConfirmZone && (
        <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-slate-100">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">ডেলিভারি জোন ডিলিট করতে চান?</h3>
              <p className="text-xs text-slate-500 mt-1">
                &quot;{deleteConfirmZone.name_bn}&quot; স্থায়ীভাবে মুছে ফেলা হবে।
              </p>
            </div>
            <div className="flex items-center gap-3 justify-center pt-2">
              <button type="button" onClick={() => setDeleteConfirmZone(null)} className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer">
                বাতিল
              </button>
              <button type="button" onClick={confirmDeleteZone} className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-500/20 cursor-pointer">
                হ্যাঁ, মুছে ফেলুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-slate-100">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
              <LogOut className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-slate-900">অ্যাডমিন প্যানেল থেকে লগআউট?</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                আপনি কি নিশ্চিত যে অ্যাডমিন সেশন শেষ করে মূল ওয়েবসাইটে ফিরতে চান?
              </p>
            </div>
            <div className="flex items-center gap-3 justify-center pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  handleLogout();
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-500/20 cursor-pointer transition"
              >
                হ্যাঁ, লগআউট করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-20 lg:bottom-5 right-4 left-4 sm:left-auto z-[90] rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-lg ${toast.ok ? 'bg-slate-900' : 'bg-rose-600'}`}>{toast.msg}</div>
      )}
    </div>
  );
};

export default AdminDashboard;