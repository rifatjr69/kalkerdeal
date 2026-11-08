import React, { useState, useMemo, useEffect } from 'react';
import {
  Filter, Grid3X3, LayoutList, ChevronRight, X,
  RotateCcw, SlidersHorizontal, Check, Search
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/common/ProductCard';
import { CATEGORIES, BRANDS } from '../data/mockProducts';

export const ShopPage: React.FC = () => {
  const { products, routeParams, navigateTo, searchQuery, setSearchQuery } = useStore();

  // URL / route params
  const initialCategory = routeParams.category || '';
  const initialSubCategory = routeParams.subCategory || '';
  const initialBrand = routeParams.brand || '';
  const initialFilter = routeParams.filter || '';

  // Local filter states
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>(initialSubCategory);
  const [selectedBrands, setSelectedBrands] = useState<string[]>(initialBrand ? [initialBrand] : []);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [minRating, setMinRating] = useState<number>(0);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [onSaleOnly, setOnSaleOnly] = useState<boolean>(false);
  const [freeDeliveryOnly, setFreeDeliveryOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc' | 'rating' | 'discount'>('default');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Sync state if routeParams change
  useEffect(() => {
    if (routeParams.category !== undefined) {
      setSelectedCategory(routeParams.category);
    }
    if (routeParams.subCategory !== undefined) {
      setSelectedSubCategory(routeParams.subCategory);
    }
    if (routeParams.brand !== undefined) {
      setSelectedBrands(routeParams.brand ? [routeParams.brand] : []);
    }
    if (routeParams.filter) {
      if (routeParams.filter === 'lowest_price') {
        setSortBy('price-asc');
      } else if (routeParams.filter === 'latest_drops') {
        // filter for latest drops
      } else if (routeParams.filter === 'glow_go' || routeParams.filter === 'skin_care') {
        setSelectedCategory('health-beauty');
      }
    }
  }, [routeParams]);

  // Max price calculation from products
  const maxAvailablePrice = useMemo(() => {
    return Math.max(...products.map((p) => p.price), 100000);
  }, [products]);

  // Filtering products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category filter
      if (selectedCategory && selectedCategory !== 'all') {
        if (p.category !== selectedCategory) return false;
      }
      // Sub-category filter
      if (selectedSubCategory) {
        if (p.subCategory !== selectedSubCategory) return false;
      }
      // Brand filter
      if (selectedBrands.length > 0) {
        if (!selectedBrands.includes(p.brand)) return false;
      }
      // Price range filter
      if (p.price < priceRange[0] || p.price > priceRange[1]) return false;
      // Rating filter
      if (minRating > 0 && (p.rating || 0) < minRating) return false;
      // In stock
      if (inStockOnly && !p.inStock) return false;
      // On sale
      if (onSaleOnly && (!p.discountPercent || p.discountPercent <= 0)) return false;
      // Free delivery
      if (freeDeliveryOnly && !p.promoBadge?.toLowerCase().includes('free delivery') && p.price < 2000) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = p.title.toLowerCase().includes(q);
        const matchesCategory = p.category.toLowerCase().includes(q);
        const matchesBrand = p.brand.toLowerCase().includes(q);
        const matchesDesc = p.description.toLowerCase().includes(q);
        if (!matchesTitle && !matchesCategory && !matchesBrand && !matchesDesc) return false;
      }

      // Quick filter presets
      if (initialFilter === 'latest_drops' && !p.isLatestDrop) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'discount') return (b.discountPercent || 0) - (a.discountPercent || 0);
      return 0; // default
    });
  }, [
    products,
    selectedCategory,
    selectedSubCategory,
    selectedBrands,
    priceRange,
    minRating,
    inStockOnly,
    onSaleOnly,
    freeDeliveryOnly,
    searchQuery,
    sortBy,
    initialFilter
  ]);

  const resetAllFilters = () => {
    setSelectedCategory('');
    setSelectedSubCategory('');
    setSelectedBrands([]);
    setPriceRange([0, maxAvailablePrice]);
    setMinRating(0);
    setInStockOnly(false);
    setOnSaleOnly(false);
    setFreeDeliveryOnly(false);
    setSortBy('default');
    setSearchQuery('');
    navigateTo('/shop');
  };

  const hasActiveFilters =
    Boolean(selectedCategory) ||
    Boolean(selectedSubCategory) ||
    selectedBrands.length > 0 ||
    priceRange[0] > 0 ||
    priceRange[1] < maxAvailablePrice ||
    minRating > 0 ||
    inStockOnly ||
    onSaleOnly ||
    freeDeliveryOnly ||
    Boolean(searchQuery);

  const currentCategoryObj = CATEGORIES.find((c) => c.slug === selectedCategory);

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-5 sm:py-7">
      <div className="max-w-7xl mx-auto px-4">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-4 flex-wrap">
          <button
            type="button"
            onClick={() => navigateTo('/')}
            className="hover:text-[#00A5A8] font-medium"
          >
            Home
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('');
              setSelectedSubCategory('');
              navigateTo('/shop');
            }}
            className={selectedCategory ? 'hover:text-[#00A5A8]' : 'text-slate-900 font-semibold'}
          >
            Shop
          </button>
          {currentCategoryObj && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <button
                type="button"
                onClick={() => setSelectedSubCategory('')}
                className={selectedSubCategory ? 'hover:text-[#00A5A8]' : 'text-slate-900 font-semibold'}
              >
                {currentCategoryObj.name}
              </button>
            </>
          )}
          {selectedSubCategory && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <span className="text-slate-900 font-semibold capitalize">
                {selectedSubCategory.replace(/-/g, ' ')}
              </span>
            </>
          )}
        </nav>

        {/* Header Title + Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              {selectedCategory
                ? currentCategoryObj?.name || 'Category'
                : searchQuery
                ? `Results for "${searchQuery}"`
                : 'All Products'}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Showing <span className="font-semibold text-slate-900">{filteredProducts.length}</span> items across verified stores
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {/* Mobile Filter Button */}
            <button
              type="button"
              onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition"
            >
              <Filter className="w-3.5 h-3.5 text-slate-600" />
              Filters
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-[#FF2B74]" />
              )}
            </button>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 hidden sm:inline whitespace-nowrap">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label="Sort products"
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00A5A8] transition"
              >
                <option value="default">Featured / Default</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Customer Rating</option>
                <option value="discount">Biggest Discount</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="hidden sm:flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'grid' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Grid View"
                aria-label="Grid View"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'list' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500 hover:text-slate-900'
                }`}
                title="List View"
                aria-label="List View"
              >
                <LayoutList className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap mb-5">
            <span className="text-xs text-slate-400 font-medium">Active Filters:</span>
            {selectedCategory && (
              <span className="inline-flex items-center gap-1.5 bg-pink-50 border border-pink-200 text-[#FF2B74] text-xs font-semibold px-2.5 py-1 rounded-full">
                {currentCategoryObj?.name || selectedCategory}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('');
                    setSelectedSubCategory('');
                  }}
                  className="hover:opacity-70"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedSubCategory && (
              <span className="inline-flex items-center gap-1.5 bg-teal-50 border border-teal-200 text-[#00A5A8] text-xs font-semibold px-2.5 py-1 rounded-full capitalize">
                {selectedSubCategory.replace(/-/g, ' ')}
                <button
                  type="button"
                  onClick={() => setSelectedSubCategory('')}
                  className="hover:opacity-70"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedBrands.map((b) => (
              <span
                key={b}
                className="inline-flex items-center gap-1.5 bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-full"
              >
                Brand: {b}
                <button
                  type="button"
                  onClick={() => setSelectedBrands(selectedBrands.filter((item) => item !== b))}
                  className="hover:opacity-70"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {(priceRange[0] > 0 || priceRange[1] < maxAvailablePrice) && (
              <span className="inline-flex items-center gap-1.5 bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                ৳{priceRange[0].toLocaleString()} - ৳{priceRange[1].toLocaleString()}
                <button
                  type="button"
                  onClick={() => setPriceRange([0, maxAvailablePrice])}
                  className="hover:opacity-70"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {minRating > 0 && (
              <span className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                ★ {minRating} & above
                <button
                  type="button"
                  onClick={() => setMinRating(0)}
                  className="hover:opacity-70"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {inStockOnly && (
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                In Stock Only
                <button
                  type="button"
                  onClick={() => setInStockOnly(false)}
                  className="hover:opacity-70"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {onSaleOnly && (
              <span className="inline-flex items-center gap-1.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                On Sale
                <button
                  type="button"
                  onClick={() => setOnSaleOnly(false)}
                  className="hover:opacity-70"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {freeDeliveryOnly && (
              <span className="inline-flex items-center gap-1.5 bg-cyan-50 border border-cyan-200 text-cyan-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                Free Delivery
                <button
                  type="button"
                  onClick={() => setFreeDeliveryOnly(false)}
                  className="hover:opacity-70"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={resetAllFilters}
              className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-semibold ml-2 hover:underline"
            >
              <RotateCcw className="w-3 h-3" />
              Reset All
            </button>
          </div>
        )}

        {/* Main Content Layout: Sidebar + Products Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Desktop Left Sidebar Filters */}
          <aside className="hidden lg:block bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-6 sticky top-24">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#00A5A8]" />
                Filters
              </span>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="text-xs text-rose-500 hover:text-rose-600 font-semibold"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Categories Filter */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5">
                Categories
              </h3>
              <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('');
                    setSelectedSubCategory('');
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition text-left ${
                    !selectedCategory
                      ? 'bg-pink-50 text-[#FF2B74] font-bold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>All Categories</span>
                  <span className="text-[11px] text-slate-400">{products.length}</span>
                </button>
                {CATEGORIES.map((cat) => {
                  const count = products.filter((p) => p.category === cat.slug).length;
                  const isSelected = selectedCategory === cat.slug;
                  return (
                    <div key={cat.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCategory(cat.slug);
                          setSelectedSubCategory('');
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition text-left ${
                          isSelected
                            ? 'bg-pink-50 text-[#FF2B74] font-bold'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span className="truncate">{cat.name}</span>
                        <span className="text-[11px] text-slate-400">{count}</span>
                      </button>

                      {/* Sub-categories expansion if this category is selected */}
                      {isSelected && cat.subCategories.length > 0 && (
                        <div className="ml-3 pl-2 border-l border-slate-200 mt-1 space-y-1">
                          {cat.subCategories.map((sub) => {
                            const isSubSelected = selectedSubCategory === sub.slug;
                            const subCount = products.filter((p) => p.subCategory === sub.slug).length;
                            return (
                              <button
                                key={sub.slug}
                                type="button"
                                onClick={() => setSelectedSubCategory(isSubSelected ? '' : sub.slug)}
                                className={`w-full flex items-center justify-between px-2 py-1 rounded text-[11px] transition text-left ${
                                  isSubSelected
                                    ? 'text-[#00A5A8] font-bold bg-teal-50'
                                    : 'text-slate-500 hover:text-slate-800'
                                }`}
                              >
                                <span className="truncate">{sub.name}</span>
                                <span className="text-[10px] text-slate-400">{subCount}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Price Filter */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5">
                Price Range (৳)
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs">
                  <div className="flex-1 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">Min</span>
                    <input
                      type="number"
                      value={priceRange[0]}
                      onChange={(e) => setPriceRange([Number(e.target.value) || 0, priceRange[1]])}
                      className="w-full bg-transparent text-slate-800 font-semibold focus:outline-none"
                    />
                  </div>
                  <span className="text-slate-400">-</span>
                  <div className="flex-1 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">Max</span>
                    <input
                      type="number"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value) || 0])}
                      className="w-full bg-transparent text-slate-800 font-semibold focus:outline-none"
                    />
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max={maxAvailablePrice}
                  step="500"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                  className="w-full accent-[#00A5A8] cursor-pointer"
                />
              </div>
            </div>

            {/* Brands Filter */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5">
                Top Brands
              </h3>
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {BRANDS.map((brand) => {
                  const isChecked = selectedBrands.includes(brand.name);
                  return (
                    <label
                      key={brand.id}
                      className="flex items-center gap-2 px-1 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedBrands([...selectedBrands, brand.name]);
                          } else {
                            setSelectedBrands(selectedBrands.filter((b) => b !== brand.name));
                          }
                        }}
                        className="rounded text-[#00A5A8] focus:ring-[#00A5A8] accent-[#00A5A8] w-3.5 h-3.5"
                      />
                      <span className="truncate">{brand.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Quick Status Toggles */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Availability & Offers
              </h3>
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="rounded text-[#00A5A8] focus:ring-[#00A5A8] accent-[#00A5A8] w-3.5 h-3.5"
                />
                In Stock Only
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={onSaleOnly}
                  onChange={(e) => setOnSaleOnly(e.target.checked)}
                  className="rounded text-[#FF2B74] focus:ring-[#FF2B74] accent-[#FF2B74] w-3.5 h-3.5"
                />
                On Sale / Discounted
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={freeDeliveryOnly}
                  onChange={(e) => setFreeDeliveryOnly(e.target.checked)}
                  className="rounded text-[#00A5A8] focus:ring-[#00A5A8] accent-[#00A5A8] w-3.5 h-3.5"
                />
                Free Delivery Available
              </label>
            </div>

            {/* Rating Filter */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5">
                Minimum Rating
              </h3>
              <div className="space-y-1">
                {[4, 3, 2].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setMinRating(minRating === r ? 0 : r)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition text-left ${
                      minRating === r
                        ? 'bg-amber-50 text-amber-900 font-bold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-1 text-amber-500 font-medium">
                      {'★'.repeat(r)}
                      {'☆'.repeat(5 - r)}
                      <span className="text-slate-700 text-xs ml-1 font-normal">& up</span>
                    </span>
                    {minRating === r && <Check className="w-3.5 h-3.5 text-amber-600" />}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Product Grid / List Section */}
          <div className="lg:col-span-3">
            {filteredProducts.length > 0 ? (
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4'
                    : 'space-y-3'
                }
              >
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    layout={viewMode}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
                <div className="w-16 h-16 rounded-full bg-pink-50 text-[#FF2B74] flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-800 mb-1">
                  No matching products found
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
                  We could not find any products matching your current filters. Try relaxing your filters or searching with a different term.
                </p>
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00A5A8] hover:bg-[#008F91] text-white text-xs font-semibold shadow-xs transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filters Slide-Over Drawer */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileFilterOpen(false)}
          />
          <div className="relative ml-auto w-full max-w-xs bg-white h-full shadow-2xl p-5 overflow-y-auto z-10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Filter className="w-4 h-4 text-[#00A5A8]" />
                  Filters
                </h3>
                <button
                  type="button"
                  onClick={() => setMobileFilterOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Categories */}
              <div className="mb-6">
                <h4 className="text-xs font-bold text-slate-800 mb-2">Category</h4>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setSelectedSubCategory('');
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none"
                >
                  <option value="">All Categories</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mobile Price */}
              <div className="mb-6">
                <h4 className="text-xs font-bold text-slate-800 mb-2">
                  Max Price: ৳{priceRange[1].toLocaleString()}
                </h4>
                <input
                  type="range"
                  min="0"
                  max={maxAvailablePrice}
                  step="500"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                  className="w-full accent-[#00A5A8]"
                />
              </div>

              {/* Mobile Quick Toggles */}
              <div className="space-y-2 mb-6">
                <label className="flex items-center gap-2 text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    className="accent-[#00A5A8]"
                  />
                  In Stock Only
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={onSaleOnly}
                    onChange={(e) => setOnSaleOnly(e.target.checked)}
                    className="accent-[#FF2B74]"
                  />
                  On Sale
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={freeDeliveryOnly}
                    onChange={(e) => setFreeDeliveryOnly(e.target.checked)}
                    className="accent-[#00A5A8]"
                  />
                  Free Delivery Available
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex gap-2">
              <button
                type="button"
                onClick={resetAllFilters}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#00A5A8] text-white text-xs font-semibold shadow-xs"
              >
                Apply ({filteredProducts.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
