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

export function enrichProducts(products: Product[]): Product[] {
  return (products || []).map((p) => {
    const rawOld = p.old_price ?? (p as any).oldPrice;
    const oldPriceNum = rawOld !== undefined && rawOld !== null ? Number(rawOld) : undefined;
    const oldPrice = oldPriceNum && !isNaN(oldPriceNum) && oldPriceNum > 0 ? oldPriceNum : undefined;

    const rawDiscount = p.discount_percent ?? (p as any).discountPercent;
    const calculatedDiscount =
      rawDiscount !== undefined && rawDiscount !== null && Number(rawDiscount) > 0
        ? Number(rawDiscount)
        : oldPrice && oldPrice > p.price
        ? Math.round(((oldPrice - p.price) / oldPrice) * 100)
        : undefined;

    return {
      ...p,
      images: p.images && p.images.length > 0 ? p.images : p.image_url ? [p.image_url] : [],
      old_price: oldPrice,
      oldPrice: oldPrice,
      discount_percent: calculatedDiscount,
      discountPercent: calculatedDiscount,
      stock: typeof p.stock === 'number' ? p.stock : 50,
      rating: typeof p.rating === 'number' ? p.rating : 4.8,
      review_count: typeof p.review_count === 'number' ? p.review_count : 35,
    };
  });
}




