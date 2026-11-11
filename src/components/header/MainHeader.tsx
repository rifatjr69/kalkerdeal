import React, { useState, useRef, useEffect } from 'react';
import { Search, User as UserIcon, Heart, ShoppingBag, X, Flame, ChevronRight, LogOut, ShieldCheck } from 'lucide-react';
import { Logo } from '../common/Logo';
import { useStore } from '../../context/StoreContext';

export const MainHeader: React.FC = () => {
  const {
    navigateTo,
    cartCount,
    cartSubtotal,
    openCart,
    wishlist,
    user,
    isAdmin,
    openAuth,
    logout,
    products
  } = useStore();

  const [searchFocused, setSearchFocused] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  // Trending search chips from prompt
  const trendingChips = [
    { label: 'earbuds', hot: true },
    { label: 'sneakers', hot: true },
    { label: 'rice', hot: false },
    { label: 'umbrella', hot: false },
    { label: 'power bank', hot: false },
    { label: 'honey', hot: false },
    { label: 'face wash', hot: false },
    { label: 'smart watch', hot: false }
  ];

  // Live matching products
  const searchResults = searchTerm.trim()
    ? products
        .filter(
          (p) =>
            p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.brand.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .slice(0, 5)
    : [];

  // Close search dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) {
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    setSearchFocused(false);
    navigateTo('/shop', { q: searchTerm.trim() });
  };

  const handleChipClick = (keyword: string) => {
    setSearchTerm(keyword);
    setSearchFocused(false);
    navigateTo('/shop', { q: keyword });
  };

  const handleProductSuggestionClick = (slug: string) => {
    setSearchFocused(false);
    navigateTo(`/product/${slug}`);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        {/* Main Row: Logo, Desktop Search, Actions */}
        <div className="py-2 sm:py-3.5 flex items-center justify-between gap-2 sm:gap-4 lg:gap-8">
          {/* Single Responsive Brand Logo */}
          <Logo onClick={() => navigateTo('/')} size="md" />

          {/* Desktop Search Bar (hidden on mobile, shown on md and above) */}
          <div ref={searchContainerRef} className="hidden md:block flex-1 max-w-xl lg:max-w-2xl relative mx-2 lg:mx-4">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                placeholder="Search products, brands and more..."
                className="w-full bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-slate-800 text-xs sm:text-sm pl-4 pr-12 py-2.5 rounded-full border border-slate-200 focus:border-[#FF2B74] focus:ring-2 focus:ring-[#FF2B74]/20 transition-all outline-none"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  aria-label="Clear search"
                  className="absolute right-12 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="submit"
                aria-label="Search"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#FF2B74] hover:bg-[#E11D48] text-white flex items-center justify-center transition-colors shadow-sm"
              >
                <Search className="w-4 h-4 stroke-[2.5]" />
              </button>
            </form>

            {/* Desktop Search Dropdown */}
            {searchFocused && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 z-50 animate-in fade-in zoom-in-95 duration-150 max-h-[75vh] overflow-y-auto">
                <div className="mb-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 mb-2.5">
                    <Flame className="w-4 h-4 text-[#FF2B74] fill-[#FF2B74]" />
                    <span>Popular Right Now</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {trendingChips.map((chip, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleChipClick(chip.label)}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 hover:bg-[#FFF1F5] hover:text-[#FF2B74] text-slate-700 transition"
                      >
                        {chip.hot && <span className="text-xs">🔥</span>}
                        <span>{chip.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {searchTerm.trim().length > 0 && (
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Matching Products
                    </div>
                    {searchResults.length > 0 ? (
                      <div className="space-y-1">
                        {searchResults.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handleProductSuggestionClick(p.slug)}
                            className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition text-left"
                          >
                            <div className="flex items-center gap-2.5">
                              <img
                                src={p.image}
                                alt=""
                                className="w-8 h-8 rounded-lg object-contain bg-slate-100 p-0.5"
                              />
                              <div>
                                <div className="text-xs font-semibold text-slate-800 line-clamp-1">
                                  {p.title}
                                </div>
                                <div className="text-[11px] font-bold text-[#E11D48]">
                                  ৳{p.price.toLocaleString()}
                                </div>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-300" />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 py-2">
                        No products found matching &quot;{searchTerm}&quot;
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Side Action Controls: Favorite (Wishlist), My Cart, Admin/Account (Last) */}
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 shrink-0">
            {/* 1. Favorite / Wishlist */}
            <button
              type="button"
              onClick={() => navigateTo('/wishlist')}
              aria-label="Wishlist"
              className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 hover:bg-[#FFF1F5] text-slate-700 hover:text-[#FF2B74] flex items-center justify-center transition shrink-0"
              title="My Wishlist / Favorites"
            >
              <Heart className="w-4 h-4" />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FF2B74] text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* 2. My Cart Button */}
            <button
              type="button"
              onClick={openCart}
              aria-label="Shopping Cart"
              className="flex items-center gap-2 group hover:text-[#00A5A8] transition shrink-0"
              title="Shopping Cart"
            >
              <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#FFF1F5] text-[#FF2B74] flex items-center justify-center transition group-hover:scale-105 shrink-0">
                <ShoppingBag className="w-4 h-4" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-[#FF2B74] text-white text-[10px] font-extrabold flex items-center justify-center shadow-xs">
                    {cartCount}
                  </span>
                )}
              </div>
              <div className="hidden sm:block text-left leading-tight">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  My
                </div>
                <div className="text-xs font-extrabold text-slate-900 group-hover:text-[#00A5A8]">
                  Cart
                </div>
              </div>
            </button>

            {/* 3. Account / Admin Profile (Last in the header row) */}
            <div ref={accountMenuRef} className="relative shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (user) {
                    setAccountMenuOpen(!accountMenuOpen);
                  } else {
                    openAuth('signin');
                  }
                }}
                aria-label={isAdmin ? 'Admin Profile' : 'User Account'}
                className="flex items-center gap-2 text-left hover:text-[#FF2B74] transition group"
                title={isAdmin ? 'Admin Profile & Settings' : 'My Account'}
              >
                <div
                  className={`relative w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition shadow-xs ${
                    isAdmin
                      ? 'bg-purple-100 text-purple-700 ring-2 ring-purple-600 hover:bg-purple-200'
                      : 'bg-slate-100 group-hover:bg-[#FFF1F5] text-slate-700 group-hover:text-[#FF2B74]'
                  }`}
                >
                  {isAdmin ? (
                    <ShieldCheck className="w-4 h-4 text-purple-700" />
                  ) : (
                    <UserIcon className="w-4 h-4" />
                  )}

                  {/* Admin Indicator Badge Dot on Profile */}
                  {isAdmin && (
                    <span
                      title="Admin Mode Active"
                      className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-purple-600 ring-2 ring-white"
                    />
                  )}
                </div>

                <div className="hidden lg:block leading-tight">
                  <div className="text-[11px] text-slate-400 font-medium">
                    {isAdmin ? 'Admin' : user ? 'Hello,' : 'Sign In'}
                  </div>
                  <div className="text-xs font-bold text-slate-800 group-hover:text-[#FF2B74] truncate max-w-[100px]">
                    {user ? user.name : 'Account'}
                  </div>
                </div>
              </button>

              {/* Logged in User / Admin Dropdown */}
              {accountMenuOpen && user && (
                <div className="absolute top-full right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                      <span className="truncate">{user.name}</span>
                      {isAdmin && (
                        <span className="text-[9px] font-black bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded tracking-wider">
                          ADMIN
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">{user.phone || user.email}</div>
                  </div>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        setAccountMenuOpen(false);
                        navigateTo('/admin');
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl transition flex items-center gap-2 mb-1 shadow-xs"
                    >
                      <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
                      <span>Admin Dashboard</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setAccountMenuOpen(false);
                      navigateTo('/my-orders');
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg transition"
                  >
                    My Orders & Tracking
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAccountMenuOpen(false);
                      navigateTo('/wishlist');
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg transition"
                  >
                    My Wishlist
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAccountMenuOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition flex items-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Row 2: Mobile Full-Width Search Bar (< 768px) */}
        <div className="md:hidden pb-2.5 pt-0.5 relative">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              placeholder="Search products, brands..."
              className="w-full bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-slate-800 text-xs pl-3.5 pr-11 py-2 rounded-full border border-slate-200 focus:border-[#FF2B74] focus:ring-2 focus:ring-[#FF2B74]/20 transition-all outline-none"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                aria-label="Clear search"
                className="absolute right-11 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="submit"
              aria-label="Search"
              className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#FF2B74] hover:bg-[#E11D48] text-white flex items-center justify-center transition-colors shadow-sm"
            >
              <Search className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </form>

          {/* Mobile Search Dropdown Flyout */}
          {searchFocused && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl shadow-2xl border border-slate-100 p-3.5 z-50 animate-in fade-in zoom-in-95 duration-150 max-h-[60vh] overflow-y-auto">
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <Flame className="w-3.5 h-3.5 text-[#FF2B74] fill-[#FF2B74]" />
                    <span>Popular Searches</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSearchFocused(false)}
                    className="text-[11px] font-semibold text-slate-400 hover:text-slate-600"
                  >
                    Close
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {trendingChips.map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleChipClick(chip.label)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 hover:bg-[#FFF1F5] hover:text-[#FF2B74] text-slate-700 transition"
                    >
                      {chip.hot && <span className="text-[10px]">🔥</span>}
                      <span>{chip.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {searchTerm.trim().length > 0 && (
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Matching Products
                  </div>
                  {searchResults.length > 0 ? (
                    <div className="space-y-1">
                      {searchResults.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleProductSuggestionClick(p.slug)}
                          className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition text-left"
                        >
                          <div className="flex items-center gap-2">
                            <img
                              src={p.image}
                              alt=""
                              className="w-7 h-7 rounded-lg object-contain bg-slate-100 p-0.5 shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-semibold text-slate-800 truncate">
                                {p.title}
                              </div>
                              <div className="text-[11px] font-bold text-[#E11D48]">
                                ৳{p.price.toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 py-2 text-center">
                      No products found
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
