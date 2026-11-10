export interface Product {
  id: string;
  title: string;
  title_bn?: string;
  slug: string;
  price: number;
  oldPrice?: number;
  old_price?: number;
  discountPercent?: number;
  discount_percent?: number;
  rating?: number;
  reviewCount?: number;
  soldCount?: number;
  stock: number;
  image: string;
  hoverImage?: string;
  images?: string[];
  category: string;
  category_id?: string;
  subCategory?: string;
  brand: string;
  isFlashSale?: boolean;
  isFeatured?: boolean;
  isLatestDrop?: boolean;
  isBestseller?: boolean;
  isGrocery?: boolean;
  isDeal?: boolean;
  isJustForYou?: boolean;
  isFast?: boolean;
  isVerified?: boolean;
  promoBadge?: string; // e.g. "Buy 3, Free Delivery", "Best Price"
  description: string;
  description_bn?: string;
  shortDescription?: string;
  specs?: Record<string, string>;
  colors?: string[];
  sizes?: string[];
  variants?: { id: string; name: string; price?: number }[];
  inStock: boolean;
}

export interface CategoryItem {
  id: string;
  name: string;
  name_bn?: string;
  slug: string;
  iconName: string;
  image: string;
  badge?: string;
  subCategories: {
    name: string;
    slug: string;
    subSubCategories?: string[];
  }[];
}

export interface Brand {
  id: string;
  name: string;
  letter: string;
  slug: string;
  color?: string;
}

export interface BannerItem {
  id: string;
  image_url: string;
  title?: string;
  link_url?: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
}

export interface OrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  image: string;
  variant?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  items: OrderItem[];
  customerName: string;
  phone: string;
  address: string;
  district: string;
  deliveryMethod: 'cod' | 'bkash' | 'nagad' | 'card';
  deliveryCharge: number;
  subtotal: number;
  discount: number;
  total: number;
  couponCode?: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
}

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
  role?: string;
  addresses?: {
    id: string;
    name: string;
    phone: string;
    address: string;
    district: string;
    isDefault: boolean;
  }[];
}

export interface DeliveryZoneItem {
  id: string;
  name: string;
  name_bn: string;
  charge: number;
  estimated_days: string;
  is_active?: boolean;
}

export interface Voucher {
  code: string;
  title: string;
  discount: number;
  type: 'fixed' | 'percent';
  minOrder: number;
  expiryDate?: string;
}
