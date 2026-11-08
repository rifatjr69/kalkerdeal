export interface Category {
  id?: string;
  name: string;
  name_en?: string;
  name_bn?: string;
  slug: string;
  icon?: string;
  image_url?: string;
  sub_label?: string;
  sort_order?: number;
  is_active?: boolean;
  created_at?: string;
}

export interface SubCategory {
  id: string;
  category_id: string;
  name: string;
  name_bn?: string;
  slug?: string;
  image_url?: string;
  display_order?: number;
  is_active?: boolean;
  created_at?: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  value: string;
  price?: number;
}

export interface Product {
  id: string;
  name: string;
  name_bn?: string;
  slug?: string;
  price: number;
  old_price?: number;
  discount_percent?: number;
  badge?: string | null;
  rating?: number;
  review_count?: number;
  stock?: number;
  image_url: string;
  images?: string[];
  category_id?: string | null;
  subcategory_id?: string | null;
  category?: string;
  description?: string;
  description_bn?: string;
  short_description?: string;
  is_featured?: boolean;
  is_flash_sale?: boolean;
  enable_size?: boolean;
  enable_color?: boolean;
  sizes?: string[];
  colors?: string[];
  variants?: ProductVariant[];
  created_at?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedVariant?: string;
}

export interface Banner {
  id?: string;
  image_url: string;
  title?: string | null;
  description?: string | null;
  link_url?: string | null;
  link?: string | null;
  sort_order?: number;
  is_active?: boolean;
  created_at?: string;
}

export interface DeliveryZone {
  id: string;
  name: string;
  name_bn: string;
  district?: string;
  charge: number;
  estimated_days: string;
  is_active?: boolean;
}

export interface Coupon {
  id?: string;
  code: string;
  type: 'fixed' | 'percent';
  value: number;
  min_order: number;
}

export interface OrderItem {
  product_id?: string;
  product_name: string;
  variant?: string;
  quantity: number;
  unit_price: number;
  total: number;
  image_url?: string;
  image?: string;
}

export interface Order {
  id?: string;
  order_number: string;
  user_id?: string | null;
  customer_name: string;
  phone: string;
  address: string;
  delivery_zone: string;
  delivery_charge: number;
  subtotal: number;
  discount: number;
  total: number;
  coupon_code?: string;
  payment_method?: string;
  status: string;
  note?: string;
  items?: OrderItem[];
  order_items?: OrderItem[];
  created_at?: string;
}

export interface FlashSale {
  id?: string;
  title: string;
  title_bn?: string;
  end_time: string;
  is_active: boolean;
  discount_badge?: string;
  products?: Product[];
}

const PRODUCT_SUBCATEGORY_MAP_KEY = 'muba_product_subcategory_map';

export interface ProductCategoryOverride {
  category_id?: string | null;
  subcategory_id?: string | null;
}

export function saveLocalProductSubCategoryOverrides(
  productIds: string[],
  patch: ProductCategoryOverride
): void {
  if (!productIds || productIds.length === 0) return;
  try {
    const raw = localStorage.getItem(PRODUCT_SUBCATEGORY_MAP_KEY);
    const map: Record<string, ProductCategoryOverride> = raw ? JSON.parse(raw) : {};
    productIds.forEach((id) => {
      if (!id) return;
      map[id] = {
        ...(map[id] || {}),
        ...patch,
      };
    });
    localStorage.setItem(PRODUCT_SUBCATEGORY_MAP_KEY, JSON.stringify(map));
  } catch {
    /* ignore storage errors */
  }
}

export function clearLocalProductSubCategoryOverrides(productIds: string[]): void {
  if (!productIds || productIds.length === 0) return;
  try {
    const raw = localStorage.getItem(PRODUCT_SUBCATEGORY_MAP_KEY);
    if (!raw) return;
    const map: Record<string, ProductCategoryOverride> = JSON.parse(raw);
    let changed = false;
    productIds.forEach((id) => {
      if (id && id in map) {
        delete map[id];
        changed = true;
      }
    });
    if (changed) {
      localStorage.setItem(PRODUCT_SUBCATEGORY_MAP_KEY, JSON.stringify(map));
    }
  } catch {
    /* ignore storage errors */
  }
}

export function applyLocalProductCategoryOverrides(products: Product[]): Product[] {
  if (!products || products.length === 0) return [];
  let map: Record<string, ProductCategoryOverride> = {};
  try {
    const raw = localStorage.getItem(PRODUCT_SUBCATEGORY_MAP_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') map = parsed;
    }
  } catch {
    /* ignore */
  }

  const hasOverrides = Object.keys(map).length > 0;
  if (!hasOverrides) return products;

  return products.map((p) => {
    const ov = map[p.id];
    if (!ov) return p;
    return {
      ...p,
      category_id: ov.category_id !== undefined ? ov.category_id : p.category_id,
      subcategory_id: ov.subcategory_id !== undefined ? ov.subcategory_id : p.subcategory_id,
    };
  });
}

export function enrichProducts(products: Product[]): Product[] {
  return applyLocalProductCategoryOverrides(products || []).map((p) => ({
    ...p,
    images: p.images && p.images.length > 0 ? p.images : p.image_url ? [p.image_url] : [],
    old_price:
      p.old_price ||
      (p.discount_percent && p.discount_percent > 0
        ? Math.round(p.price / (1 - p.discount_percent / 100))
        : undefined),
    stock: typeof p.stock === 'number' ? p.stock : 50,
    rating: typeof p.rating === 'number' ? p.rating : 4.8,
    review_count: typeof p.review_count === 'number' ? p.review_count : 35,
  }));
}

