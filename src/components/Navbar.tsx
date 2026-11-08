import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ShoppingBag, Search, Heart, User, Phone, X,
  PackageCheck, ChevronRight, Settings, MoreVertical
} from 'lucide-react';
import { Product, CartItem, Category, SubCategory } from '../types';
import { HeaderCategoryNav } from './HeaderCategoryNav';
import { scrollToProducts } from '../lib/scroll';

export type NavSubCategory = SubCategory;

interface NavbarProps {
  categories?: Category[];
  subCategories?: NavSubCategory[];
  selectedSubCategory?: string | null;
  setSelectedSubCategory?: (id: string | null) => void;
  cart: CartItem[];
  wishlist: string[];
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onOpenAuth: () => void;
  onOpenAccount?: () => void;
  onOpenTracking: () => void;
  onOpenSqlModal?: () => void;
  onOpenAdmin: () => void;
  onCloseProductDetail?: () => void;
  isLoadingCategories?: boolean;
  products: Product[];
  onSelectProduct: (product: Product) => void;
  activeTab: 'home' | 'shop';
  setActiveTab: (tab: 'home' | 'shop') => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  user: any;
  isAdmin: boolean;
}

const STORE_NAME = 'innexbuy';
const HOTLINE = '01887816106';

const toBn = (n: number | string) =>
  String(n).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[Number(d)]);

const Logo = () => (
  <div className="flex items-center gap-2 whitespace-nowrap py-1">
    <img
      src="/assets/aistudio/Innexbuy_Pink_Cart_Logo_61749946.png"
      alt="Innexbuy"
      className="h-8 sm:h-10 w-auto object-contain"
    />
  </div>
);

const SearchBox: React.FC<{
  products: Product[];
  onSelect: (p: Product) => void;
  placeholder: string;
  className?: string;
}> = ({ products, onSelect, placeholder, className = '' }) => {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return products
      .filter(
        (p) =>
          (p.name || '').toLowerCase().includes(s) ||
          (p.name_bn || '').toLowerCase().includes(s) ||
          (p.short_description || '').toLowerCase().includes(s)
      )
      .slice(0, 6);
  }, [q, products]);

  const showDropdown = open && q.trim().length > 0;

  return (
    <div ref={ref} className={`relative w-full ${className}`}>
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-800 pointer-events-none" />
      <input
        type="text"
        inputMode="search"
        enterKeyHint="search"
        aria-label="প্রোডাক্ট খুঁজুন"
        placeholder={placeholder}
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        className={`w-full h-9 sm:h-10 bg-white border-2 rounded-full pl-10 pr-10 text-sm text-slate-800 placeholder-slate-400 focus:outline-none transition ${
          open ? 'border-[#FD0160]' : 'border-[#FFD1E1]'
        }`}
      />
      {q && (
        <button
          type="button"
          onClick={() => {
            setQ('');
            setOpen(false);
          }}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-pink-50 hover:bg-pink-100 text-slate-500 flex items-center justify-center transition cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-pink-100 overflow-hidden z-50 max-h-[70vh] overflow-y-auto">
          {results.length > 0 ? (
            <div className="py-1.5">
              <p className="px-4 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                প্রোডাক্ট সাজেশন ({toBn(results.length)})
              </p>
              {results.map((product) => (
                <button
                  type="button"
                  key={product.id}
                  onClick={() => {
                    onSelect(product);
                    setOpen(false);
                    setQ('');
                  }}
                  className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-pink-50 active:bg-pink-100 text-left transition border-b border-slate-50 last:border-0 cursor-pointer"
                >
                  <img
                    src={product.image_url}
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    className="w-11 h-11 object-cover rounded-lg border border-slate-100 bg-slate-50 shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.visibility = 'hidden';
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {product.name_bn || product.name}
                    </p>
                    <p className="text-xs font-bold text-[#FD0160] tabular-nums">
                      ৳{toBn(Number(product.price || 0).toLocaleString('en-US'))}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                </button>
              ))}
            </div>
          ) : (
            <div className="p-5 text-center text-sm text-slate-500">
              কোনো গ্যাজেট পাওয়া যায়নি &quot;{q}&quot;
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const Navbar: React.FC<NavbarProps> = ({
  categories = [],
  subCategories = [],
  selectedSubCategory = null,
  setSelectedSubCategory,
  cart,
  wishlist,
  onOpenCart,
  onOpenWishlist,
  onOpenAuth,
  onOpenAccount,
  onOpenTracking,
  onOpenAdmin,
  onCloseProductDetail,
  isLoadingCategories = false,
  products,
  onSelectProduct,
  activeTab,
  setActiveTab,
  selectedCategory,
  setSelectedCategory,
  user,
  isAdmin,
}) => {
  const [moreOpen, setMoreOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const clearSub = () => setSelectedSubCategory?.(null);

  const goHome = () => {
    setActiveTab('home');
    setSelectedCategory('all');
    clearSub();
    onCloseProductDetail?.();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeMore = () => setMoreOpen(false);

  const handleAccountAction = () => {
    if (!user) {
      onOpenAuth();
    } else if (isAdmin) {
      onOpenAdmin();
    } else if (onOpenAccount) {
      onOpenAccount();
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!moreOpen) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoreOpen(false);
    };
    const onResize = () => {
      if (window.innerWidth >= 768) setMoreOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    };
  }, [moreOpen]);

  const MenuItem: React.FC<{
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    tone?: 'default' | 'admin';
  }> = ({ icon, label, onClick, tone = 'default' }) => {
    const toneClass =
      tone === 'admin'
        ? 'text-purple-700 bg-purple-50 hover:bg-purple-100'
        : 'text-slate-800 hover:bg-slate-50 active:bg-slate-100';
    return (
      <button
        type="button"
        role="menuitem"
        onClick={() => {
          onClick();
          closeMore();
        }}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition cursor-pointer ${toneClass}`}
      >
        <span className="w-5 h-5 flex items-center justify-center shrink-0">{icon}</span>
        <span className="flex-1 text-left">{label}</span>
        <ChevronRight className="w-4 h-4 opacity-40 shrink-0" />
      </button>
    );
  };

  return (
    <header
      className={`sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b transition-shadow duration-200 ${
        isScrolled
          ? 'border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.08)]'
          : 'border-slate-100 shadow-[0_1px_8px_rgba(15,23,42,0.04)]'
      }`}
    >
      {/* ===================== PART 1: TOP ROW (Unchanged Layout & Controls) ===================== */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-[68px] gap-2 sm:gap-4">
          {/* Logo */}
          <div className="flex items-center min-w-0 shrink-0">
            <button
              type="button"
              onClick={goHome}
              aria-label={`${STORE_NAME} Home`}
              className="focus:outline-none focus-visible:ring-2 focus-visible:ring-[#185824] rounded-lg min-w-0 cursor-pointer"
            >
              <Logo />
            </button>
          </div>

          {/* Desktop SHOP link + Search Bar */}
          <div className="hidden md:flex items-center gap-5 flex-1 justify-center">
            <button
              type="button"
              onClick={() => {
                setActiveTab('shop');
                setSelectedCategory('all');
                clearSub();
                onCloseProductDetail?.();
                scrollToProducts();
              }}
              className="text-[13px] font-bold tracking-wide text-slate-800 hover:text-[#FD0160] transition cursor-pointer whitespace-nowrap"
            >
              SHOP
            </button>
            <div className="flex-1 max-w-[420px]">
              <SearchBox
                products={products}
                onSelect={onSelectProduct}
                placeholder="স্মার্টওয়াচ, ইয়ারবাড বা পাওয়ার ব্যাংক খুঁজুন..."
              />
            </div>
          </div>

          {/* Right Actions: Track, Wishlist, Login/Account, Bag */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={onOpenTracking}
              title="অর্ডার ট্র্যাক করুন"
              aria-label="Track order"
              className="hidden lg:inline-flex items-center justify-center w-10 h-10 rounded-full text-slate-700 hover:text-[#FD0160] hover:bg-pink-50 transition cursor-pointer"
            >
              <PackageCheck className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={onOpenWishlist}
              aria-label="Wishlist"
              className="relative inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-700 text-white text-[11px] font-black tracking-wide w-9 h-9 sm:w-auto sm:h-10 sm:px-4 justify-center rounded-full transition cursor-pointer"
            >
              <Heart className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
              <span className="hidden sm:inline">WISHLIST</span>
              {wishlist.length > 0 && (
                <>
                  <span className="hidden sm:inline tabular-nums">({toBn(wishlist.length)})</span>
                  <span className="sm:hidden absolute -top-1 -right-1 bg-[#FD0160] text-white text-[9px] font-bold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center ring-2 ring-white tabular-nums">
                    {wishlist.length > 99 ? '99+' : toBn(wishlist.length)}
                  </span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleAccountAction}
              aria-label="Account"
              className="hidden sm:inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-black tracking-wide h-10 px-4 justify-center rounded-full transition cursor-pointer whitespace-nowrap"
            >
              {!user ? 'LOGIN' : isAdmin ? 'ADMIN' : 'ACCOUNT'}
            </button>

            <button
              type="button"
              onClick={onOpenCart}
              aria-label="Cart"
              className="relative inline-flex items-center gap-1.5 sm:gap-2 bg-[#FD0160] text-white text-[11px] font-black tracking-wide w-9 h-9 sm:w-auto sm:h-10 sm:px-4 justify-center rounded-full shadow-sm hover:opacity-90 active:opacity-80 transition cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">BAG</span>
              <span className="hidden sm:flex bg-white text-[#FD0160] rounded-full min-w-[20px] h-5 px-1 items-center justify-center text-[10px] font-black tabular-nums">
                {totalCartItems > 99 ? '99+' : toBn(totalCartItems)}
              </span>
              {totalCartItems > 0 && (
                <span className="sm:hidden absolute -top-1 -right-1 bg-slate-900 text-white text-[9px] font-bold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center ring-2 ring-white tabular-nums">
                  {totalCartItems > 99 ? '99+' : toBn(totalCartItems)}
                </span>
              )}
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={onOpenAdmin}
                aria-label="Admin panel"
                title="অ্যাডমিন প্যানেল"
                className="hidden md:inline-flex items-center justify-center w-10 h-10 rounded-full bg-purple-50 text-purple-700 hover:bg-purple-100 transition cursor-pointer"
              >
                <Settings className="w-[18px] h-[18px]" />
              </button>
            )}

            {/* Mobile More Menu */}
            <div ref={moreRef} className="relative md:hidden">
              <button
                type="button"
                onClick={() => setMoreOpen((v) => !v)}
                aria-label="More options"
                aria-haspopup="menu"
                aria-expanded={moreOpen}
                className={`inline-flex items-center justify-center w-9 h-9 rounded-full transition cursor-pointer ${
                  moreOpen
                    ? 'bg-pink-50 text-[#FD0160]'
                    : 'text-slate-800 hover:bg-slate-100 active:bg-slate-200'
                }`}
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              {moreOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-50 origin-top-right"
                >
                  <button
                    type="button"
                    onClick={() => {
                      handleAccountAction();
                      closeMore();
                    }}
                    className="w-full flex items-center gap-3 p-3 mb-1 rounded-xl bg-gradient-to-r from-pink-50 to-white border border-pink-100 text-left cursor-pointer"
                  >
                    <span className="w-10 h-10 rounded-full bg-[#FD0160] flex items-center justify-center text-white shrink-0">
                      <User className="w-5 h-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-slate-900 truncate">
                        {user
                          ? user.user_metadata?.full_name || user.email || 'আমার একাউন্ট'
                          : 'স্বাগতম!'}
                      </span>
                      <span className="block text-[11px] font-medium text-[#FD0160]">
                        {!user ? 'লগইন / সাইন আপ করুন' : isAdmin ? 'অ্যাডমিন প্যানেল' : 'একাউন্ট দেখুন'}
                      </span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                  </button>

                  <MenuItem
                    icon={<PackageCheck className="w-[18px] h-[18px] text-slate-500" />}
                    label="অর্ডার ট্র্যাকিং"
                    onClick={onOpenTracking}
                  />
                  {isAdmin && (
                    <MenuItem
                      icon={<Settings className="w-[18px] h-[18px]" />}
                      label="অ্যাডমিন প্যানেল"
                      onClick={onOpenAdmin}
                      tone="admin"
                    />
                  )}

                  <div className="h-px bg-slate-100 my-2" />
                  <a
                    href={`tel:${HOTLINE}`}
                    onClick={closeMore}
                    role="menuitem"
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#FD0160] text-white text-[13px] font-bold shadow-sm active:opacity-80"
                  >
                    <Phone className="w-4 h-4" /> কল করুন: {HOTLINE}
                  </a>
                  <p className="text-center text-[10px] text-slate-400 font-medium mt-2 mb-0.5">
                    ১০০% আসল প্রডাক্ট • ৭ দিনের রিপ্লেসমেন্ট
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="pb-2 md:hidden">
          <SearchBox
            products={products}
            onSelect={onSelectProduct}
            placeholder="স্মার্টওয়াচ, ইয়ারবাড খুঁজুন..."
          />
        </div>
      </div>

      {/* ===================== PART 2: BOTTOM ROW (Category + Sub-Category Nav) ===================== */}
      <HeaderCategoryNav
        categories={categories}
        subCategories={subCategories}
        products={products}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedSubCategory={selectedSubCategory}
        setSelectedSubCategory={setSelectedSubCategory}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        closeProductDetail={onCloseProductDetail}
        onOpenTracking={onOpenTracking}
        isLoading={isLoadingCategories}
      />
    </header>
  );
};