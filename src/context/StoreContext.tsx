import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Product, CartItem, Order, User, Voucher, CategoryItem, BannerItem, DeliveryZoneItem } from '../types/store';
import { MOCK_PRODUCTS, MOCK_VOUCHERS } from '../data/mockProducts';
import { supabase } from '../lib/supabase';

interface StoreContextType {
  // Navigation / Route
  currentRoute: string;
  routeParams: Record<string, string>;
  navigateTo: (route: string, params?: Record<string, string>) => void;

  // Products, Banners, Delivery Zones & Site Settings
  siteName: string;
  siteNumber: string;
  promoCode: string;
  promoDiscount: number;
  bkashNumber: string;
  nagadNumber: string;
  monthlyTarget: number;
  insideDhakaCharge: number;
  outsideDhakaCharge: number;
  updateSiteName: (newName: string) => Promise<void>;
  refreshSettings: () => Promise<void>;
  products: Product[];
  categories: CategoryItem[];
  banners: BannerItem[];
  deliveryZones: DeliveryZoneItem[];
  getProductBySlug: (slug: string) => Product | undefined;
  refreshProducts: () => Promise<void>;
  refreshCategories: () => Promise<void>;
  refreshBanners: () => Promise<void>;
  refreshDeliveryZones: () => Promise<void>;

  // Cart
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number, color?: string, size?: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;
  freeShippingThreshold: number;
  freeShippingProgress: number;
  isFreeShippingEligible: boolean;

  // Wishlist
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;

  // Vouchers
  activeVoucher: Voucher | null;
  applyVoucher: (code: string) => { success: boolean; message: string };
  removeVoucher: () => void;
  voucherDiscount: number;

  // Orders
  orders: Order[];
  createOrder: (orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'status'>) => Order;
  updateOrder?: (orderIdOrNumber: string, updates: Partial<Order>) => void;
  getOrderById: (orderNumber: string) => Order | undefined;
  deleteOrder: (orderId: string) => Promise<void>;

  // User & Auth
  user: User | null;
  isAdmin: boolean;
  setAdminStatus: (isAdmin: boolean) => void;
  refreshUserProfile: () => Promise<void>;
  login: (phoneOrEmail: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, phone: string, email?: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAuthOpen: boolean;
  authView: 'signin' | 'register' | 'forgot';
  openAuth: (view?: 'signin' | 'register' | 'forgot') => void;
  closeAuth: () => void;

  // UI Drawers & Modals
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  quickViewProduct: Product | null;
  openQuickView: (product: Product) => void;
  closeQuickView: () => void;
  isMegaMenuOpen: boolean;
  setIsMegaMenuOpen: (open: boolean) => void;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation Routing State
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    try {
      if (typeof window !== 'undefined') {
        const hash = window.location.hash.replace('#', '');
        if (hash) return hash;
        if (window.location.pathname === '/admin') return '/admin';
      }
      return '/';
    } catch {
      return '/';
    }
  });
  const [routeParams, setRouteParams] = useState<Record<string, string>>({});

  useEffect(() => {
    const handleLocationChange = () => {
      let raw = window.location.hash.replace('#', '');
      if (!raw && window.location.pathname === '/admin') {
        raw = '/admin';
      } else if (!raw) {
        raw = '/';
      }
      const [path, queryString] = raw.split('?');
      setCurrentRoute(path || '/');

      const params: Record<string, string> = {};
      if (queryString) {
        new URLSearchParams(queryString).forEach((val, key) => {
          params[key] = val;
        });
      }
      setRouteParams(params);
    };

    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);
    handleLocationChange();
    return () => {
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  const navigateTo = (route: string, params?: Record<string, string>) => {
    let hashUrl = route.startsWith('/') ? route : `/${route}`;
    if (params && Object.keys(params).length > 0) {
      const query = new URLSearchParams(params).toString();
      hashUrl += `?${query}`;
    }
    window.location.hash = hashUrl;
    setCurrentRoute(route);
    setRouteParams(params || {});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Site Settings State (Pure Supabase)
  const [siteName, setSiteName] = useState<string>('Kalkerdeal');
  const [siteNumber, setSiteNumber] = useState<string>('01700-000000');
  const [promoCode, setPromoCode] = useState<string>('CARTAPP250');
  const [promoDiscount, setPromoDiscount] = useState<number>(250);
  const [bkashNumber, setBkashNumber] = useState<string>('01700000000');
  const [nagadNumber, setNagadNumber] = useState<string>('01700000000');
  const [freeShippingThreshold, setFreeShippingThreshold] = useState<number>(2000);
  const [monthlyTarget, setMonthlyTarget] = useState<number>(600000);
  const [insideDhakaCharge, setInsideDhakaCharge] = useState<number>(60);
  const [outsideDhakaCharge, setOutsideDhakaCharge] = useState<number>(130);

  const refreshSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('store_settings').select('key,value');
      if (!error && data && data.length > 0) {
        data.forEach((row: any) => {
          if (!row.key || row.value === undefined || row.value === null) return;
          const val = String(row.value).trim();
          if (row.key === 'site_name' && val) {
            setSiteName(val);
            document.title = `${val} - Online Shopping`;
          }
          if (row.key === 'site_number' && val) setSiteNumber(val);
          if (row.key === 'promo_code' && val) setPromoCode(val);
          if (row.key === 'promo_discount' && val) setPromoDiscount(Number(val) || 0);
          if (row.key === 'bkash_number' && val) setBkashNumber(val);
          if (row.key === 'nagad_number' && val) setNagadNumber(val);
          if (row.key === 'free_shipping_threshold' && val) setFreeShippingThreshold(Number(val) || 0);
          if (row.key === 'monthly_target' && val) setMonthlyTarget(Number(val) || 600000);
          if (row.key === 'inside_dhaka_charge' && val) setInsideDhakaCharge(Number(val) || 60);
          if (row.key === 'outside_dhaka_charge' && val) setOutsideDhakaCharge(Number(val) || 130);
        });
      }
    } catch (err) {
      console.warn('Could not load store_settings from Supabase:', err);
    }
  }, []);

  const updateSiteName = async (newName: string) => {
    const trimmed = newName.trim() || 'Kalkerdeal';
    setSiteName(trimmed);
    document.title = `${trimmed} - Online Shopping`;

    try {
      await supabase.from('store_settings').upsert({ key: 'site_name', value: trimmed }, { onConflict: 'key' });
    } catch (err) {
      console.warn('Could not save site name to Supabase:', err);
    }

    window.dispatchEvent(new CustomEvent('settings_updated'));
  };

  // Products state (loads from Supabase if available, fallbacks to MOCK_PRODUCTS)
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [categories, setCategories] = useState<CategoryItem[]>([]);

  const refreshProducts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const mappedProducts: Product[] = data.map((item: any) => {
          const price = Number(item.price || 0);
          const rawOldPrice = item.old_price !== null && item.old_price !== undefined ? Number(item.old_price) : undefined;
          const oldPrice = rawOldPrice && !isNaN(rawOldPrice) && rawOldPrice > 0 ? rawOldPrice : undefined;
          
          // Calculate discount if missing in DB but old price exists
          const rawDiscount = item.discount_percent !== null && item.discount_percent !== undefined ? Number(item.discount_percent) : undefined;
          const discountPercent = rawDiscount && rawDiscount > 0
            ? rawDiscount
            : (oldPrice && oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : undefined);

          return {
            id: item.id,
            title: item.name || 'Product',
            title_bn: item.name_bn || item.name,
            slug: item.slug || `prod-${item.id}`,
            price,
            oldPrice,
            old_price: oldPrice,
            discountPercent,
            discount_percent: discountPercent,
            rating: item.rating ? Number(item.rating) : 4.8,
            reviewCount: item.review_count || 50,
            soldCount: item.sold_quantity || 12,
            stock: item.stock ?? 50,
            image: item.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
            hoverImage: item.hover_image,
            images: Array.isArray(item.images) && item.images.length > 0 ? item.images : [item.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80'],
            category: item.category || 'general',
            category_id: item.category_id,
            subCategory: item.subcategory || item.subcategory_id,
            brand: item.brand_name || 'Kalkerdeal',
            isFlashSale: Boolean(item.is_flash_sale),
            isFeatured: Boolean(item.is_featured),
            isLatestDrop: Boolean(item.is_latest_drop),
            isBestseller: Boolean(item.is_bestseller),
            isGrocery: Boolean(item.is_grocery),
            isDeal: Boolean(item.is_deal),
            isJustForYou: Boolean(item.is_just_for_you),
            isFast: item.is_fast !== false,
            isVerified: item.is_verified !== false,
            promoBadge: item.badge,
            description: item.description || '',
            description_bn: item.description_bn,
            shortDescription: item.short_description,
            specs: item.specs || {},
            colors: item.colors || [],
            sizes: item.sizes || [],
            inStock: (item.stock === undefined || item.stock > 0)
          };
        });
        setProducts(mappedProducts);
        return;
      }
    } catch (err) {
      console.warn('Could not fetch products from Supabase:', err);
    }
  }, []);

  // Separate two-query category loading to avoid nested select 400 Bad Request errors
  const refreshCategories = useCallback(async () => {
    try {
      const { data: catData, error: catErr } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (catErr) {
        console.warn('Could not fetch categories from Supabase:', catErr.message);
        return;
      }

      if (!catData || catData.length === 0) {
        setCategories([]);
        return;
      }

      let subData: any[] = [];
      try {
        const { data: subs, error: subErr } = await supabase
          .from('subcategories')
          .select('*');
        if (!subErr && subs) {
          subData = subs;
        }
      } catch { /* ignore if table missing */ }

      const mapped: CategoryItem[] = catData
        .filter((c: any) => c.is_active !== false)
        .map((c: any) => {
          const catSubs = subData
            .filter((sc: any) => sc.category_id === c.id || sc.category_slug === c.slug)
            .map((sc: any) => ({
              name: sc.name,
              name_bn: sc.name_bn || sc.name,
              slug: sc.slug
            }));

          return {
            id: String(c.id),
            name: c.name,
            name_bn: c.name_bn || c.name,
            slug: c.slug,
            iconName: c.icon || c.icon_name || 'Tag',
            image: c.image_url || c.image || '',
            subCategories: catSubs
          };
        });

      setCategories(mapped);
    } catch (err) {
      console.warn('Categories fetch error:', err);
    }
  }, []);

  // Banners state (Pure Supabase)
  const [banners, setBanners] = useState<BannerItem[]>([]);

  const refreshBanners = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('sort_order', { ascending: true });

      if (!error && data) {
        if (data.length > 0) {
          const mapped: BannerItem[] = data.map((b: any, idx: number) => ({
            id: String(b.id || `banner-${idx}`),
            image_url: (b.image_url || b.image || '').trim(),
            title: (b.title || '').trim(),
            link_url: (b.link_url || b.link || '').trim(),
            sort_order: Number(b.sort_order) || idx,
            is_active: b.is_active !== false
          })).filter((b: BannerItem) => Boolean(b.image_url));

          setBanners(mapped.filter((b) => b.is_active !== false));
          return;
        } else {
          // Check if initial seeding has already happened
          const { data: sData } = await supabase
            .from('store_settings')
            .select('value')
            .eq('key', 'banners_initialized')
            .maybeSingle();

          if (!sData || sData.value !== 'true') {
            // Seed default banners once into DB
            const defaultBannersPayload = [
              {
                title: 'Tech & Gadgets For Your Everyday Life',
                image_url: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1600&q=80',
                link_url: '/shop',
                sort_order: 1,
                is_active: true
              },
              {
                title: 'Special Mega Discounts & Fast Delivery',
                image_url: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?auto=format&fit=crop&w=1600&q=80',
                link_url: '/shop?filter=on-sale',
                sort_order: 2,
                is_active: true
              }
            ];

            await supabase.from('store_settings').upsert({ key: 'banners_initialized', value: 'true' }, { onConflict: 'key' });
            const { data: seeded } = await supabase.from('banners').insert(defaultBannersPayload).select();

            if (seeded && seeded.length > 0) {
              const mapped: BannerItem[] = seeded.map((b: any, idx: number) => ({
                id: String(b.id || `banner-${idx}`),
                image_url: (b.image_url || b.image || '').trim(),
                title: (b.title || '').trim(),
                link_url: (b.link_url || b.link || '').trim(),
                sort_order: Number(b.sort_order) || idx,
                is_active: b.is_active !== false
              })).filter((b: BannerItem) => Boolean(b.image_url));

              setBanners(mapped.filter((b) => b.is_active !== false));
              return;
            }
          }

          // DB is empty and initial seeding has already happened -> admin deleted all banners!
          setBanners([]);
          return;
        }
      }
    } catch (err) {
      console.warn('Could not fetch banners from Supabase:', err);
    }
  }, []);

  // Delivery Zones state (Pure Supabase single source of truth)
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZoneItem[]>([
    { id: 'zone-dhaka', name: 'Inside Dhaka', name_bn: 'ঢাকার ভিতরে', charge: 60, estimated_days: '১-২ কার্যদিবস', is_active: true },
    { id: 'zone-outside', name: 'Outside Dhaka', name_bn: 'ঢাকার বাইরে', charge: 130, estimated_days: '২-৩ কার্যদিবস', is_active: true }
  ]);

  const refreshDeliveryZones = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('delivery_zones')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (!error && data && data.length > 0) {
        const mapped: DeliveryZoneItem[] = data.map((z: any, idx: number) => ({
          id: String(z.id || `zone-${idx}`),
          name: (z.name || '').trim() || (idx === 0 ? 'Inside Dhaka' : 'Outside Dhaka'),
          name_bn: (z.name_bn || '').trim() || (idx === 0 ? 'ঢাকার ভিতরে' : 'ঢাকার বাইরে'),
          charge: Number(z.charge) || (idx === 0 ? 60 : 130),
          estimated_days: (z.estimated_days || '').trim() || (idx === 0 ? '১-২ কার্যদিবস' : '২-৩ কার্যদিবস'),
          is_active: z.is_active !== false,
          sort_order: z.sort_order ?? (idx + 1)
        }));
        setDeliveryZones(mapped);
      }
    } catch (err) {
      console.warn('Could not fetch delivery zones from Supabase:', err);
    }
  }, []);

  useEffect(() => {
    refreshSettings();
    refreshProducts();
    refreshCategories();
    refreshBanners();
    refreshDeliveryZones();

    // Subscribe to real-time changes on store_settings & delivery_zones
    const settingsChannel = supabase
      .channel('public:store_settings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'store_settings' }, () => {
        refreshSettings();
      })
      .subscribe();

    const zonesChannel = supabase
      .channel('public:delivery_zones')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'delivery_zones' }, () => {
        refreshDeliveryZones();
      })
      .subscribe();

    const bannersChannel = supabase
      .channel('public:banners')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'banners' }, () => {
        refreshBanners();
      })
      .subscribe();

    const productsChannel = supabase
      .channel('public:products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        refreshProducts();
      })
      .subscribe();

    const handleUpdate = () => {
      refreshSettings();
      refreshProducts();
      refreshCategories();
      refreshBanners();
      refreshDeliveryZones();
    };

    window.addEventListener('settings_updated', handleUpdate);
    window.addEventListener('products_updated', handleUpdate);
    window.addEventListener('banners_updated', handleUpdate);
    window.addEventListener('delivery_zones_updated', handleUpdate);
    return () => {
      supabase.removeChannel(settingsChannel);
      supabase.removeChannel(zonesChannel);
      supabase.removeChannel(bannersChannel);
      supabase.removeChannel(productsChannel);
      window.removeEventListener('settings_updated', handleUpdate);
      window.removeEventListener('products_updated', handleUpdate);
      window.removeEventListener('banners_updated', handleUpdate);
      window.removeEventListener('delivery_zones_updated', handleUpdate);
    };
  }, [refreshSettings, refreshProducts, refreshCategories, refreshBanners, refreshDeliveryZones]);

  const getProductBySlug = (slug: string) => {
    return products.find((p) => p.slug === slug || p.id === slug);
  };

  // Cart
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('cartapp_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('cartapp_cart', JSON.stringify(cart));
    } catch {
      /* ignore */
    }
  }, [cart]);

  const addToCart = (product: Product, quantity = 1, color?: string, size?: string) => {
    setCart((prev) => {
      const existingIdx = prev.findIndex((item) => item.product.id === product.id);
      if (existingIdx > -1) {
        const next = [...prev];
        next[existingIdx] = {
          ...next[existingIdx],
          quantity: next[existingIdx].quantity + quantity
        };
        return next;
      }
      return [...prev, { product, quantity, selectedColor: color, selectedSize: size }];
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => setCart([]);

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  // Free shipping rule: free if order >= freeShippingThreshold OR if total items >= 3 ("Buy any 3 ship free")
  const isFreeShippingEligible = cartSubtotal >= freeShippingThreshold || cartCount >= 3;
  const freeShippingProgress = Math.min(100, (cartSubtotal / freeShippingThreshold) * 100);

  // Wishlist
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('cartapp_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('cartapp_wishlist', JSON.stringify(wishlist));
    } catch {
      /* ignore */
    }
  }, [wishlist]);

  const toggleWishlist = async (productId: string) => {
    const isPresent = wishlist.includes(productId);
    const updated = isPresent ? wishlist.filter((id) => id !== productId) : [...wishlist, productId];
    setWishlist(updated);

    // Sync with Supabase if user is logged in
    if (user?.id && user.id.includes('-')) {
      try {
        if (isPresent) {
          await supabase.from('wishlists').delete().eq('user_id', user.id).eq('product_id', productId);
        } else {
          await supabase.from('wishlists').upsert({ user_id: user.id, product_id: productId });
        }
      } catch (err) {
        console.warn('Wishlist sync warning:', err);
      }
    }
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  // Vouchers
  const [activeVoucher, setActiveVoucher] = useState<Voucher | null>(null);

  const applyVoucher = (code: string) => {
    const formatted = code.trim().toUpperCase();
    
    // Check promo code from store_settings
    if (promoCode && formatted === promoCode.toUpperCase()) {
      const customVoucher: Voucher = {
        code: promoCode,
        title: `Promo Coupon (${promoCode})`,
        type: 'fixed',
        discount: promoDiscount || 250,
        minOrder: 0
      };
      setActiveVoucher(customVoucher);
      return { success: true, message: `Promo code ${promoCode} applied successfully!` };
    }

    const found = MOCK_VOUCHERS.find((v) => v.code === formatted);
    if (!found) {
      return { success: false, message: 'Invalid coupon code' };
    }
    if (cartSubtotal < found.minOrder) {
      return {
        success: false,
        message: `Minimum order amount ৳${found.minOrder.toLocaleString()} required for this coupon`
      };
    }
    setActiveVoucher(found);
    return { success: true, message: `Coupon ${found.code} applied successfully!` };
  };

  const removeVoucher = () => setActiveVoucher(null);

  const voucherDiscount = activeVoucher
    ? activeVoucher.type === 'fixed'
      ? activeVoucher.discount
      : Math.round((cartSubtotal * activeVoucher.discount) / 100)
    : 0;

  // Orders
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('cartapp_orders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('cartapp_orders', JSON.stringify(orders));
    } catch {
      /* ignore */
    }
  }, [orders]);

  // Synchronize orders if updated externally (e.g. from Admin Dashboard)
  useEffect(() => {
    const handleSync = () => {
      try {
        const saved = localStorage.getItem('cartapp_orders');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setOrders(parsed);
          }
        }
      } catch {}
    };
    window.addEventListener('cartapp_orders_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('cartapp_orders_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const updateOrder = (orderIdOrNumber: string, updates: Partial<Order>) => {
    setOrders((prev) => {
      const next = prev.map((o) => {
        if (o.id === orderIdOrNumber || o.orderNumber === orderIdOrNumber) {
          return { ...o, ...updates };
        }
        return o;
      });
      try {
        localStorage.setItem('cartapp_orders', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Load orders from Supabase for logged-in user or by phone
  const loadSupabaseOrders = useCallback(async (userId?: string, phone?: string) => {
    try {
      let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (userId && userId.includes('-')) {
        query = query.eq('user_id', userId);
      } else if (phone) {
        query = query.eq('phone', phone);
      } else {
        return;
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        const loadedOrders: Order[] = data.map((o: any) => ({
          id: o.id,
          orderNumber: o.order_number,
          createdAt: o.created_at,
          customerName: o.customer_name,
          phone: o.phone,
          address: o.address,
          district: o.delivery_zone || o.district || 'ঢাকার ভিতরে',
          deliveryMethod: (o.payment_method || 'cod').toLowerCase().includes('bkash') ? 'bkash' : 'cod',
          deliveryCharge: Number(o.delivery_charge || 60),
          subtotal: Number(o.subtotal || 0),
          discount: Number(o.discount || 0),
          total: Number(o.total || 0),
          couponCode: o.coupon_code,
          status: o.status || 'pending',
          items: []
        }));

        setOrders((prev) => {
          const map = new Map();
          [...loadedOrders, ...prev].forEach((item) => map.set(item.orderNumber, item));
          return Array.from(map.values());
        });
      }
    } catch (err) {
      console.warn('Could not load orders from Supabase:', err);
    }
  }, []);

  const createOrder = (orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'status'>): Order => {
    const newOrderNumber = `CA-${Math.floor(100000 + Math.random() * 900000)}`;
    const newOrderId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `ord_${Date.now()}`;
    const newOrder: Order = {
      ...orderData,
      id: newOrderId,
      orderNumber: newOrderNumber,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };

    // 1. Immediately update local state & localStorage for responsive UX
    setOrders((prev) => [newOrder, ...prev]);

    // 2. Insert into Supabase tables asynchronously
    (async () => {
      try {
        const zoneStr =
          orderData.district ||
          (Number(orderData.deliveryCharge) > 60 || String(orderData.deliveryCharge) === '130'
            ? 'ঢাকার বাইরে'
            : 'ঢাকার ভিতরে');

        const dbOrderPayload: Record<string, any> = {
          order_number: newOrderNumber,
          customer_name: orderData.customerName,
          phone: orderData.phone,
          address: orderData.address,
          delivery_zone: zoneStr,
          delivery_charge: orderData.deliveryCharge || 60,
          subtotal: orderData.subtotal || 0,
          discount: orderData.discount || 0,
          total: orderData.total || 0,
          coupon_code: orderData.couponCode || null,
          payment_method: orderData.deliveryMethod === 'cod' ? 'COD' : (orderData.deliveryMethod?.toUpperCase() || 'COD'),
          status: 'pending',
          created_at: new Date().toISOString()
        };

        if (newOrderId && newOrderId.includes('-') && newOrderId.length === 36) {
          dbOrderPayload.id = newOrderId;
        }
        if (user?.id && user.id.includes('-') && user.id.length === 36) {
          dbOrderPayload.user_id = user.id;
        }

        const { data: insData, error: ordErr } = await supabase
          .from('orders')
          .insert([dbOrderPayload])
          .select('id')
          .single();

        if (ordErr) {
          console.error('Supabase orders table insert error:', ordErr.message);
        } else {
          console.log(`Order ${newOrderNumber} successfully persisted in Supabase database!`);

          const assignedOrderId = insData?.id || newOrderId;

          // Insert order items with exact valid schema
          if (assignedOrderId && orderData.items && orderData.items.length > 0) {
            const itemsPayload = orderData.items.map((it) => ({
              order_id: assignedOrderId,
              product_id: it.productId && it.productId.includes('-') && it.productId.length === 36 ? it.productId : null,
              product_name: it.title || 'Product',
              variant: it.variant || null,
              quantity: it.quantity || 1,
              unit_price: it.price || 0,
              total: (it.price || 0) * (it.quantity || 1)
            }));
            await supabase.from('order_items').insert(itemsPayload);
          }

          // Insert tracking milestone
          try {
            await supabase.from('order_trackings').insert([
              {
                order_id: assignedOrderId,
                status_step: 'placed',
                title: 'Order Placed',
                description: 'Order confirmed and entered into the fulfillment system.',
                location: 'Dhaka Sorting Hub',
                courier_name: 'Steadfast Courier'
              }
            ]);
          } catch {}
        }
      } catch (err) {
        console.error('Failed to sync order to Supabase:', err);
      }
    })();

    return newOrder;
  };

  const getOrderById = (orderNumber: string) => {
    return orders.find(
      (o) =>
        o.orderNumber.toLowerCase() === orderNumber.trim().toLowerCase() ||
        o.phone === orderNumber.trim()
    );
  };
  const deleteOrder = async (orderId: string) => {
    try {
      // Delete dependencies first
      await supabase.from('order_items').delete().eq('order_id', orderId);
      await supabase.from('order_trackings').delete().eq('order_id', orderId);
      
      const { error } = await supabase.from('orders').delete().eq('id', orderId);
      if (error) throw error;
      
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch (err) {
      console.error('Failed to delete order:', err);
      throw err;
    }
  };

  // User Auth with Supabase
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('cartapp_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Calculate admin privilege directly from user role or cached admin status
  const isAdmin = Boolean(
    (user && (user.role?.toLowerCase() === 'admin' || user.email?.toLowerCase().includes('admin'))) ||
    localStorage.getItem('cartapp_is_admin') === 'true'
  );

  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem('cartapp_user', JSON.stringify(user));
        if (user.role?.toLowerCase() === 'admin') {
          localStorage.setItem('cartapp_is_admin', 'true');
        } else {
          localStorage.removeItem('cartapp_is_admin');
        }
      } else {
        localStorage.removeItem('cartapp_user');
        localStorage.removeItem('cartapp_is_admin');
      }
    } catch {
      /* ignore */
    }
  }, [user]);

  // Refresh profile from Supabase profiles table to immediately pick up database changes
  const refreshUserProfile = useCallback(async () => {
    try {
      // 1. Check Supabase Auth current user
      const { data: authData } = await supabase.auth.getUser();
      const authUser = authData?.user;

      let profileData: any = null;

      if (authUser) {
        // Query profile by user ID
        const { data: pById } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .maybeSingle();

        if (pById) {
          profileData = pById;
        } else if (authUser.email) {
          // Fallback: Query profile by email in case row was manually created by email
          const { data: pByEmail } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', authUser.email)
            .maybeSingle();
          if (pByEmail) profileData = pByEmail;
        }

        const rawRole = (
          profileData?.role ||
          authUser.user_metadata?.role ||
          authUser.app_metadata?.role ||
          'customer'
        ).toString().toLowerCase().trim();

        const isUserAdmin =
          rawRole === 'admin' ||
          (authUser.email && authUser.email.toLowerCase().includes('admin')) ||
          localStorage.getItem('cartapp_is_admin') === 'true';

        const activeUser: User = {
          id: authUser.id,
          name: profileData?.full_name || authUser.user_metadata?.full_name || 'Valued Customer',
          phone: profileData?.phone || authUser.user_metadata?.phone || '',
          email: authUser.email,
          role: isUserAdmin ? 'admin' : rawRole
        };

        setUser(activeUser);

        if (isUserAdmin) {
          localStorage.setItem('cartapp_is_admin', 'true');
        } else {
          localStorage.removeItem('cartapp_is_admin');
        }

        loadSupabaseOrders(authUser.id, activeUser.phone);
      } else {
        // No Supabase Auth session active; check cached user in localStorage
        const savedUserStr = localStorage.getItem('cartapp_user');
        if (savedUserStr) {
          try {
            const parsedUser: User = JSON.parse(savedUserStr);
            if (parsedUser.email) {
              const { data: pByEmail } = await supabase
                .from('profiles')
                .select('*')
                .eq('email', parsedUser.email)
                .maybeSingle();

              if (pByEmail) {
                const rawRole = (pByEmail.role || 'customer').toString().toLowerCase().trim();
                const isUserAdmin = rawRole === 'admin';
                parsedUser.role = isUserAdmin ? 'admin' : rawRole;
                setUser(parsedUser);
                if (isUserAdmin) {
                  localStorage.setItem('cartapp_is_admin', 'true');
                } else {
                  localStorage.removeItem('cartapp_is_admin');
                }
              }
            }
          } catch {
            /* ignore */
          }
        }
      }
    } catch (err) {
      console.warn('Refresh user profile error:', err);
    }
  }, [loadSupabaseOrders]);

  const setAdminStatus = (status: boolean) => {
    if (status) {
      localStorage.setItem('cartapp_is_admin', 'true');
      localStorage.setItem('muba_admin_active', 'true');
      if (user) {
        setUser({ ...user, role: 'admin' });
      } else {
        setUser({
          id: 'admin_local',
          name: 'Store Administrator',
          phone: '01700-000000',
          email: 'admin@cartapp.com.bd',
          role: 'admin'
        });
      }
    } else {
      localStorage.removeItem('cartapp_is_admin');
      localStorage.removeItem('muba_admin_active');
      if (user) {
        setUser({ ...user, role: 'customer' });
      }
    }
  };

  // Sync Supabase Auth session on mount and route change
  useEffect(() => {
    refreshUserProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event: string, session: any) => {
      if (session?.user) {
        let profile: any = null;
        const { data: pById } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (pById) {
          profile = pById;
        } else if (session.user.email) {
          const { data: pByEmail } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', session.user.email)
            .maybeSingle();
          if (pByEmail) profile = pByEmail;
        }

        const role = (
          profile?.role ||
          session.user.user_metadata?.role ||
          session.user.app_metadata?.role ||
          'customer'
        ).toString().toLowerCase().trim();

        const isUserAdmin =
          role === 'admin' ||
          (session.user.email && session.user.email.toLowerCase().includes('admin')) ||
          localStorage.getItem('cartapp_is_admin') === 'true';

        const activeUser: User = {
          id: session.user.id,
          name: profile?.full_name || session.user.user_metadata?.full_name || 'Valued Customer',
          phone: profile?.phone || session.user.user_metadata?.phone || '',
          email: session.user.email,
          role: isUserAdmin ? 'admin' : role
        };

        setUser(activeUser);
        if (isUserAdmin) {
          localStorage.setItem('cartapp_is_admin', 'true');
        } else {
          localStorage.removeItem('cartapp_is_admin');
        }
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [refreshUserProfile]);

  // Normalize phone / email for Supabase Auth
  const normalizeEmail = (phoneOrEmail: string): string => {
    const clean = phoneOrEmail.trim().toLowerCase();
    if (clean.includes('@')) return clean;
    const digitsOnly = clean.replace(/[^0-9]/g, '');
    return `${digitsOnly || 'user'}@cartapp.com.bd`;
  };

  const login = async (phoneOrEmail: string, password = 'password123'): Promise<{ success: boolean; error?: string }> => {
    const emailToUse = normalizeEmail(phoneOrEmail);
    const pwd = password || 'password123';

    try {
      // 1. Attempt Supabase Auth login
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password: pwd
      });

      if (error) {
        // If user doesn't exist, try creating their account on the fly or report error
        if (error.message.toLowerCase().includes('invalid login credentials')) {
          // Attempt silent auto-signup if user had typed credentials
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: emailToUse,
            password: pwd,
            options: {
              data: {
                full_name: phoneOrEmail.includes('@') ? phoneOrEmail.split('@')[0] : 'Valued Customer',
                phone: phoneOrEmail
              }
            }
          });

          if (!signUpError && signUpData?.user) {
            await supabase.from('profiles').upsert({
              id: signUpData.user.id,
              full_name: phoneOrEmail.includes('@') ? phoneOrEmail.split('@')[0] : 'Valued Customer',
              phone: phoneOrEmail,
              email: emailToUse,
              role: 'customer'
            });

            const newUser: User = {
              id: signUpData.user.id,
              name: phoneOrEmail.includes('@') ? phoneOrEmail.split('@')[0] : 'Valued Customer',
              phone: phoneOrEmail,
              email: emailToUse
            };
            setUser(newUser);
            closeAuth();
            loadSupabaseOrders(signUpData.user.id, phoneOrEmail);
            return { success: true };
          }

          return { success: false, error: 'Invalid email/phone or password. Please check your credentials or register.' };
        }
        return { success: false, error: error.message };
      }

      if (data?.user) {
        // Fetch or create profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle();

        const role = (profile?.role || data.user.user_metadata?.role || 'customer').toLowerCase();
        const activeUser: User = {
          id: data.user.id,
          name: profile?.full_name || data.user.user_metadata?.full_name || (phoneOrEmail.includes('@') ? phoneOrEmail.split('@')[0] : 'Valued Customer'),
          phone: profile?.phone || data.user.user_metadata?.phone || phoneOrEmail,
          email: data.user.email,
          role: role
        };

        // Ensure profile exists in profiles table
        if (!profile) {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            full_name: activeUser.name,
            phone: activeUser.phone,
            email: data.user.email,
            role: 'customer'
          });
        }

        setUser(activeUser);
        if (role === 'admin') {
          localStorage.setItem('cartapp_is_admin', 'true');
        } else {
          localStorage.removeItem('cartapp_is_admin');
        }
        closeAuth();
        loadSupabaseOrders(data.user.id, activeUser.phone);
        return { success: true };
      }

      return { success: false, error: 'Login failed. Please try again.' };
    } catch (err: any) {
      console.error('Login error:', err);
      // Fallback local login for smooth client-side experience
      const isEmail = phoneOrEmail.includes('@');
      const fallbackUser: User = {
        id: `user_${Date.now()}`,
        name: isEmail ? phoneOrEmail.split('@')[0] : 'Valued Customer',
        phone: isEmail ? '01712-345678' : phoneOrEmail,
        email: isEmail ? phoneOrEmail : undefined
      };
      setUser(fallbackUser);
      closeAuth();
      return { success: true };
    }
  };

  const register = async (name: string, phone: string, email?: string, password = 'password123'): Promise<{ success: boolean; error?: string }> => {
    const emailToUse = email ? normalizeEmail(email) : normalizeEmail(phone);
    const pwd = password || 'password123';

    try {
      // 1. Create user in Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: emailToUse,
        password: pwd,
        options: {
          data: {
            full_name: name,
            phone: phone
          }
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data?.user) {
        // 2. Insert into profiles table
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: data.user.id,
          full_name: name,
          phone: phone,
          email: emailToUse,
          role: 'customer'
        });

        if (profileError) {
          console.error('Supabase profile creation error:', profileError.message);
        } else {
          console.log(`User profile for ${name} stored in Supabase profiles!`);
        }

        const newUser: User = {
          id: data.user.id,
          name,
          phone,
          email: email || emailToUse
        };
        setUser(newUser);
        closeAuth();
        return { success: true };
      }

      return { success: false, error: 'Registration failed. Please try again.' };
    } catch (err: any) {
      console.error('Register error:', err);
      // Fallback local registration
      const fallbackUser: User = {
        id: `user_${Date.now()}`,
        name,
        phone,
        email
      };
      setUser(fallbackUser);
      closeAuth();
      return { success: true };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Sign out warning:', err);
    }
    setUser(null);
    try {
      localStorage.removeItem('cartapp_user');
    } catch {
      /* ignore */
    }
  };

  // Modals & Drawers
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authView, setAuthView] = useState<'signin' | 'register' | 'forgot'>('signin');
  const openAuth = (view: 'signin' | 'register' | 'forgot' = 'signin') => {
    setAuthView(view);
    setIsAuthOpen(true);
  };
  const closeAuth = () => setIsAuthOpen(false);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const openQuickView = (product: Product) => setQuickViewProduct(product);
  const closeQuickView = () => setQuickViewProduct(null);

  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <StoreContext.Provider
      value={{
        currentRoute,
        routeParams,
        navigateTo,
        siteName,
        siteNumber,
        promoCode,
        promoDiscount,
        bkashNumber,
        nagadNumber,
        monthlyTarget,
        insideDhakaCharge,
        outsideDhakaCharge,
        updateSiteName,
        refreshSettings,
        products,
        categories,
        banners,
        deliveryZones,
        getProductBySlug,
        refreshProducts,
        refreshCategories,
        refreshBanners,
        refreshDeliveryZones,
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        cartCount,
        cartSubtotal,
        freeShippingThreshold,
        freeShippingProgress,
        isFreeShippingEligible,
        wishlist,
        toggleWishlist,
        isInWishlist,
        activeVoucher,
        applyVoucher,
        removeVoucher,
        voucherDiscount,
        orders,
        createOrder,
        updateOrder,
        getOrderById,
        deleteOrder,
        user,
        isAdmin,
        setAdminStatus,
        refreshUserProfile,
        login,
        register,
        logout,
        isAuthOpen,
        authView,
        openAuth,
        closeAuth,
        isCartOpen,
        openCart,
        closeCart,
        quickViewProduct,
        openQuickView,
        closeQuickView,
        isMegaMenuOpen,
        setIsMegaMenuOpen,
        searchQuery,
        setSearchQuery
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
