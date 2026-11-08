import React, { useState, useEffect } from 'react';
import {
  Heart, Share2, ShieldCheck, Check, Truck, RotateCcw,
  ShieldAlert, Plus, Minus, Star, ChevronRight, Zap, ArrowLeft
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/common/ProductCard';
import { CATEGORIES } from '../data/mockProducts';
import { CategoryItem, Product } from '../types/store';

interface ProductDetailPageProps {
  slug: string;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ slug }) => {
  const {
    products,
    getProductBySlug,
    addToCart,
    isInWishlist,
    toggleWishlist,
    navigateTo,
    openCart
  } = useStore();

  const product = getProductBySlug(slug) || products[0];
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'reviews'>('desc');
  const [selectedImage, setSelectedImage] = useState<string>(product.image);
  const [copiedShare, setCopiedShare] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string>(product.sizes ? product.sizes[0] : '');

  // Flash sale timer for PDP
  const [timeLeft, setTimeLeft] = useState({ hours: 8, minutes: 26, seconds: 0 });

  useEffect(() => {
    setSelectedImage(product.image);
    setQuantity(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [product]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 12, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const inWishlist = isInWishlist(product.id);

  const handleAddToCart = () => {
    addToCart(product, quantity, undefined, selectedSize);
    openCart();
  };

  const handleBuyNow = () => {
    addToCart(product, quantity, undefined, selectedSize);
    navigateTo('/checkout');
  };

  const handleShare = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    } catch {
      /* ignore */
    }
  };

  // Find category breadcrumb info
  const categoryItem = CATEGORIES.find((c: CategoryItem) => c.slug === product.category);
  const subCategoryItem = categoryItem?.subCategories.find((s: { slug: string; name: string }) => s.slug === product.subCategory);

  const relatedProducts = products
    .filter((p: Product) => p.category === product.category && p.id !== product.id)
    .slice(0, 6);

  // Additional gallery thumbnails
  const galleryThumbnails = product.images && product.images.length > 0
    ? product.images
    : [product.image, product.image, product.image, product.image];

  return (
    <div className="bg-white py-1 sm:py-8 min-h-screen">
      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        {/* Breadcrumb Trail */}
        <nav className="flex items-center gap-1.5 text-[10px] sm:text-xs text-slate-500 mb-2 sm:mb-4 lg:mb-6 flex-wrap">
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
            onClick={() => navigateTo('/shop', { category: product.category })}
            className="hover:text-[#00A5A8] font-medium"
          >
            {categoryItem ? categoryItem.name : 'Category'}
          </button>
          {subCategoryItem && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <button
                type="button"
                onClick={() =>
                  navigateTo('/shop', {
                    category: product.category,
                    subCategory: subCategoryItem.slug
                  })
                }
                className="hover:text-[#00A5A8] font-medium"
              >
                {subCategoryItem.name}
              </button>
            </>
          )}
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-900 font-semibold truncate max-w-xs sm:max-w-md">
            {product.title}
          </span>
        </nav>

        {/* Product Purchase Module Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-12 items-start mb-6 lg:mb-16">
          {/* Left Column: Vertical Thumbnails + Big Preview (Screenshot 8) */}
          <div className="lg:col-span-7 flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 items-center sm:items-start">
            {/* Vertical Thumbnails */}
            <div className="flex sm:flex-col gap-3 shrink-0 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0">
              {galleryThumbnails.map((img: string, idx: number) => {
                const isSelected = selectedImage === img && idx === 0;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImage(img)}
                    className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-slate-50 p-1 flex items-center justify-center transition-all ${
                      isSelected
                        ? 'border-2 border-[#FF2B74] shadow-sm'
                        : 'border border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-contain" />
                  </button>
                );
              })}
            </div>

            {/* Big Main Image Container */}
            <div className="flex-1 w-full aspect-square rounded-2xl sm:rounded-3xl bg-slate-50 border border-slate-100 relative p-3 sm:p-8 flex items-center justify-center shadow-xs">
              {/* Circular Soft Backdrop */}
              <div className="absolute inset-8 sm:inset-12 rounded-full bg-slate-200/50 shadow-inner" />

              {/* Discount Badge on Image */}
              {product.discountPercent && product.discountPercent > 0 && (
                <div className="absolute top-6 left-6 z-10 w-12 h-12 rounded-full bg-[#EA580C] text-white flex flex-col items-center justify-center font-bold text-[11px] leading-tight shadow-md">
                  <span>{product.discountPercent}%</span>
                  <span>off</span>
                </div>
              )}

              {/* Wishlist & Share Buttons on Image */}
              <div className="absolute top-6 right-6 z-10 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleWishlist(product.id)}
                  aria-label="Save to wishlist"
                  className={`w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center transition-colors ${
                    inWishlist ? 'text-[#FF2B74]' : 'text-slate-400 hover:text-[#FF2B74]'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${inWishlist ? 'fill-current' : ''}`} />
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  aria-label="Share product"
                  className="w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center text-slate-400 hover:text-slate-800 transition-colors"
                >
                  {copiedShare ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Share2 className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Main Product Image */}
              <img
                src={selectedImage}
                alt={product.title}
                className="relative z-10 w-3/4 h-3/4 object-contain transition-transform duration-300 hover:scale-105"
              />
            </div>
          </div>

          <div className="lg:col-span-5 space-y-3 sm:space-y-5">
            {/* Brand & Verified Badge */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigateTo('/shop', { brand: product.brand.toLowerCase() })}
                className="text-xs sm:text-sm font-extrabold text-[#0284C7] hover:underline"
              >
                {product.brand}
              </button>
              {product.isVerified && (
                <span className="inline-flex items-center gap-1 bg-[#1E3A8A] text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                  <Check className="w-2.5 h-2.5 stroke-[3]" /> Verified
                </span>
              )}
            </div>

            {/* Product Title */}
            <h1 className="text-lg sm:text-2xl font-black text-slate-900 leading-snug tracking-tight">
              {product.title}
            </h1>

            {/* Ratings & Reviews & Sold count */}
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <div className="flex items-center gap-1">
                <span className="font-bold text-slate-900">{product.rating || 4.2}</span>
                <div className="flex items-center text-[#F59E0B]">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < Math.floor(product.rating || 4.2)
                          ? 'fill-current'
                          : 'fill-slate-200 text-slate-200'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-blue-600 ml-1">
                  ({product.reviewCount || 2} reviews)
                </span>
              </div>
              <span className="text-slate-300">|</span>
              <span>{product.soldCount || 120} sold</span>
            </div>

            {/* Price Block */}
            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-100 space-y-0.5 sm:space-y-1">
              <div className="flex items-baseline gap-2.5">
                {product.discountPercent && (
                  <span className="text-sm font-black text-[#E11D48]">
                    ↓ {product.discountPercent}%
                  </span>
                )}
                {product.oldPrice && (
                  <span className="text-sm text-slate-400 line-through tabular-nums">
                    ৳{product.oldPrice.toLocaleString()}
                  </span>
                )}
                <span className="text-xl sm:text-3xl font-black text-[#E11D48] tabular-nums">
                  ৳{product.price.toLocaleString()}
                </span>
              </div>
              <p className="text-[11px] text-emerald-700 font-semibold">
                ✓ In Stock ({product.stock} units available)
              </p>
            </div>

            {/* Sizes if applicable */}
            {product.sizes && product.sizes.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                  Select Size
                </label>
                <div className="flex items-center gap-2">
                  {product.sizes.map((s: string) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSelectedSize(s)}
                      className={`px-3.5 py-1.5 text-xs font-bold rounded-xl border transition ${
                        selectedSize === s
                          ? 'border-[#FF2B74] bg-[#FFF1F5] text-[#FF2B74]'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector matching Screenshot 8 */}
            <div className="flex items-center gap-3 py-1 sm:py-2">
              <span className="text-xs font-bold text-slate-700">Quantity:</span>
              <div className="flex items-center gap-3 bg-slate-100 border border-slate-200 rounded-lg sm:rounded-xl px-2.5 py-1 sm:px-3 sm:py-1.5">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="text-slate-500 hover:text-slate-800"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-bold tabular-nums min-w-4 text-center">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="text-slate-500 hover:text-slate-800"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>


            {/* Vouchers Section matching Screenshot 8 */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">Vouchers</span>
                <span className="text-[#FF2B74] font-bold text-[11px] cursor-pointer hover:underline">
                  Collect All
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-[#E0F2FE] text-[#0284C7] border border-[#BAE6FD] text-[11px] font-bold px-2.5 py-1 rounded-lg">
                  5% off
                </span>
                <span className="bg-[#E0F2FE] text-[#0284C7] border border-[#BAE6FD] text-[11px] font-bold px-2.5 py-1 rounded-lg">
                  ৳100 off
                </span>
                <span className="bg-[#FFF1F5] text-[#FF2B74] border border-[#FFD1E1] text-[11px] font-bold px-2.5 py-1 rounded-lg">
                  Free Delivery on ৳2000
                </span>
              </div>
            </div>

            {/* Action Buttons: Buy Now & Add to Cart */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-1 sm:pt-2">
              <button
                type="button"
                onClick={handleBuyNow}
                className="w-full bg-[#E11D48] hover:bg-[#BE123C] text-white font-extrabold text-[12px] sm:text-sm py-3 sm:py-3.5 rounded-xl sm:rounded-2xl shadow-md transition-transform active:scale-95 cursor-pointer"
              >
                Buy Now
              </button>

              <button
                type="button"
                onClick={handleAddToCart}
                className="w-full bg-[#00A5A8] hover:bg-[#008F91] text-white font-extrabold text-[12px] sm:text-sm py-3 sm:py-3.5 rounded-xl sm:rounded-2xl shadow-md transition-transform active:scale-95 cursor-pointer"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>

        {/* Tabs Section: Description, Specifications, Reviews */}
        <div className="border-t border-slate-200 pt-6 lg:pt-10 mb-8 lg:mb-16">
          <div className="flex items-center gap-8 border-b border-slate-200 mb-6 text-sm font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('desc')}
              className={`pb-3 transition-colors border-b-2 -mb-[2px] ${
                activeTab === 'desc'
                  ? 'border-[#FF2B74] text-[#FF2B74]'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              Description
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('specs')}
              className={`pb-3 transition-colors border-b-2 -mb-[2px] ${
                activeTab === 'specs'
                  ? 'border-[#FF2B74] text-[#FF2B74]'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              Specifications
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('reviews')}
              className={`pb-3 transition-colors border-b-2 -mb-[2px] ${
                activeTab === 'reviews'
                  ? 'border-[#FF2B74] text-[#FF2B74]'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              Customer Reviews ({product.reviewCount || 2})
            </button>
          </div>

          {/* Tab 1: Description */}
          {activeTab === 'desc' && (
            <div className="prose prose-slate max-w-none text-xs sm:text-sm text-slate-600 leading-relaxed space-y-4">
              <p>{product.description}</p>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <h4 className="font-bold text-slate-800 mb-2">Key Highlights:</h4>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li>Original verified product with manufacturer warranty</li>
                  <li>Nationwide home delivery with real-time package tracking</li>
                  <li>Safe payment through Cash on Delivery or bKash with instant discount</li>
                  <li>Easy 7-day return policy for peace of mind</li>
                </ul>
              </div>
            </div>
          )}

          {/* Tab 2: Specifications */}
          {activeTab === 'specs' && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 max-w-2xl">
              <table className="w-full text-xs text-left">
                <tbody className="divide-y divide-slate-100">
                  <tr className="bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-700 w-1/3">Brand</td>
                    <td className="px-4 py-3 text-slate-600">{product.brand}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-bold text-slate-700">Category</td>
                    <td className="px-4 py-3 text-slate-600">{categoryItem?.name}</td>
                  </tr>
                  {product.specs &&
                    Object.entries(product.specs).map(([key, val]: [string, string]) => (
                      <tr key={key} className="even:bg-slate-50">
                        <td className="px-4 py-3 font-bold text-slate-700">{key}</td>
                        <td className="px-4 py-3 text-slate-600">{String(val)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Tab 3: Reviews */}
          {activeTab === 'reviews' && (
            <div className="space-y-6 max-w-3xl">
              {/* Review Summary */}
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-6">
                <div className="text-center">
                  <div className="text-3xl font-black text-slate-900">
                    {(product.rating || 4.2).toFixed(1)}
                  </div>
                  <div className="flex text-[#F59E0B] text-xs justify-center my-1">
                    ★★★★★
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Based on {product.reviewCount || 2} reviews
                  </div>
                </div>
              </div>

              {/* Sample Reviews */}
              <div className="space-y-4">
                <div className="p-4 rounded-2xl border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-xs text-slate-800">
                      Zubair Hossain <span className="text-emerald-600 font-normal ml-1">✓ Verified Buyer</span>
                    </div>
                    <span className="text-[11px] text-slate-400">2 days ago</span>
                  </div>
                  <div className="text-[#F59E0B] text-xs">★★★★★</div>
                  <p className="text-xs text-slate-600">
                    Delivered very fast inside Dhaka. Packaging was premium and product quality matches the pictures 100%!
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-xs text-slate-800">
                      Rashedul Islam <span className="text-emerald-600 font-normal ml-1">✓ Verified Buyer</span>
                    </div>
                    <span className="text-[11px] text-slate-400">1 week ago</span>
                  </div>
                  <div className="text-[#F59E0B] text-xs">★★★★☆</div>
                  <p className="text-xs text-slate-600">
                    Great deal for the price. Support on WhatsApp was very helpful.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="border-t border-slate-200 pt-10">
            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-6">
              Related Products
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {relatedProducts.map((p: Product) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
