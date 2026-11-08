import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Star, Heart, ShoppingBag, Zap, ShieldCheck, 
  Truck, RefreshCw, CheckCircle2, ChevronRight, Package, 
  Layers, Clock, Award, Share2, Check
} from 'lucide-react';
import { Product } from '../types';
import { ProductCard } from './ProductCard';

interface ProductPageProps {
  product: Product;
  categoryName?: string;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, variant?: string) => void;
  onOrderNow: (product: Product, quantity: number, variant?: string) => void;
  onToggleWishlist: (productId: string) => void;
  isWishlisted: boolean;
  relatedProducts: Product[];
  onSelectProduct?: (product: Product) => void;
}

export const ProductPage: React.FC<ProductPageProps> = ({
  product,
  categoryName,
  onClose,
  onAddToCart,
  onOrderNow,
  onToggleWishlist,
  isWishlisted,
  relatedProducts,
  onSelectProduct
}) => {
  // Ensure we have at least 2 thumbnails for the gallery as specified
  const imageList = React.useMemo(() => {
    const list: string[] = [];
    if (product.images && product.images.length > 0) {
      list.push(...product.images);
    } else if (product.image_url) {
      list.push(product.image_url);
    }
    // If only 1 image, provide a secondary angle/preview fallback
    if (list.length === 1) {
      list.push(list[0]);
    }
    return list;
  }, [product.images, product.image_url]);

  const [selectedImage, setSelectedImage] = useState(imageList[0] || product.image_url);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string>(
    product.sizes && product.sizes.length > 0 ? product.sizes[0] : ''
  );
  const [selectedColor, setSelectedColor] = useState<string>(
    product.colors && product.colors.length > 0 ? product.colors[0] : ''
  );
  const [selectedVariantVariant, setSelectedVariantVariant] = useState<string>(
    product.variants && product.variants.length > 0 ? product.variants[0].value : ''
  );

  const selectedVariant = React.useMemo(() => {
    const parts = [];
    if (product.enable_size && selectedSize) parts.push(`Size: ${selectedSize}`);
    if (product.enable_color && selectedColor) parts.push(`Color: ${selectedColor}`);
    if (parts.length > 0) return parts.join(', ');
    if (product.variants && product.variants.length > 0) return selectedVariantVariant;
    return '';
  }, [product, selectedSize, selectedColor, selectedVariantVariant]);

  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'reviews' | 'shipping'>('desc');
  const [copied, setCopied] = useState(false);

  // Update image when product changes
  useEffect(() => {
    setSelectedImage(imageList[0] || product.image_url);
    setQuantity(1);
    if (product.sizes && product.sizes.length > 0) {
      setSelectedSize(product.sizes[0]);
    }
    if (product.colors && product.colors.length > 0) {
      setSelectedColor(product.colors[0]);
    }
    if (product.variants && product.variants.length > 0) {
      setSelectedVariantVariant(product.variants[0].value);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [product.id, imageList]);

  // Calculate pricing & discount
  const oldPrice = product.old_price && product.old_price > product.price 
    ? product.old_price 
    : Math.round(product.price * 1.35);
  const saveAmount = Math.max(0, oldPrice - product.price);
  const savePercent = oldPrice > 0 ? Math.round((saveAmount / oldPrice) * 100) : 0;

  const cleanId = (product.id || '').replace(/^(prod-|MG-|IB-)/i, '').slice(0, 8).toUpperCase();
  const sku = `IB-${cleanId || '8801'}`;
  const reviewCount = product.review_count ?? 12;
  const ratingScore = product.rating ?? 4.9;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-24 lg:pb-16 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        {/* Top: Back Link & Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-200/80">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-brand transition group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center group-hover:border-brand-border group-hover:bg-brand-soft transition">
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5 text-slate-600 group-hover:text-brand" />
            </div>
            <span>Back to Products</span>
          </button>

          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs text-slate-400 overflow-hidden text-ellipsis whitespace-nowrap">
            <button onClick={onClose} className="hover:text-brand transition text-slate-500">
              Home
            </button>
            <span>/</span>
            <span className="text-slate-500 font-semibold uppercase tracking-wider">
              {categoryName || 'Smart Gadgets'}
            </span>
            <span>/</span>
            <span className="text-slate-800 font-medium truncate max-w-[200px] sm:max-w-xs">
              {product.name}
            </span>
          </div>
        </div>

        {/* Main Product Section: 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left Side: Thumbnail Gallery + Large Main Image (lg:col-span-6) */}
          <div className="lg:col-span-6 flex flex-col-reverse md:flex-row gap-4">
            
            {/* Vertical Thumbnail Gallery */}
            <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto pb-2 md:pb-0 shrink-0">
              {imageList.map((img, index) => {
                const isActive = selectedImage === img;
                return (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(img)}
                    className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 bg-white p-1 transition-all duration-200 flex items-center justify-center relative cursor-pointer ${
                      isActive 
                        ? 'border-brand ring-2 ring-brand/20 shadow-md scale-102' 
                        : 'border-slate-200 hover:border-brand-border opacity-80 hover:opacity-100'
                    }`}
                  >
                    <img 
                      src={img} 
                      alt={`Thumbnail ${index + 1}`} 
                      className="w-full h-full object-cover rounded-xl"
                    />
                  </button>
                );
              })}
            </div>

            {/* Large Main Product Image */}
            <div className="flex-1 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-10 flex items-center justify-center relative overflow-hidden group min-h-[360px] sm:min-h-[460px]">
              {/* Badges on Image */}
              <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5 items-start">
                <span className="bg-brand text-white text-[11px] font-extrabold px-3 py-1 rounded-full shadow-sm shadow-brand/25 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> 100% Original
                </span>
                {product.badge && (
                  <span className="bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                    {product.badge}
                  </span>
                )}
              </div>

              {/* Share button */}
              <button
                onClick={handleCopyLink}
                title="Share product"
                className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/90 hover:bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-brand hover:border-brand-border shadow-sm transition"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
              </button>

              <img
                src={selectedImage}
                alt={product.name}
                className="max-h-[380px] w-auto max-w-full object-contain transition-transform duration-500 group-hover:scale-105"
              />
            </div>

          </div>

          {/* Right Side: Product Details (lg:col-span-6) */}
          <div className="lg:col-span-6 flex flex-col space-y-4">
            
            {/* Small uppercase category label with letter spacing */}
            <div className="text-[11px] font-extrabold uppercase tracking-widest text-brand">
              {categoryName || 'PREMIUM SMART GADGETS'}
            </div>

            {/* Large bold product title */}
            <h1 className="text-2xl sm:text-3xl font-black text-ink tracking-tight leading-snug">
              {product.name}
            </h1>
            {product.name_bn && (
              <p className="text-sm font-semibold text-slate-500 -mt-1">
                {product.name_bn}
              </p>
            )}

            {/* SKU and Star Rating Row */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
              <span className="bg-slate-100 font-bold text-slate-700 px-2.5 py-1 rounded-md">
                SKU: {sku}
              </span>
              <span className="text-slate-300">•</span>
              <div className="flex items-center gap-1">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-4 h-4 ${i < Math.floor(ratingScore) ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}`} 
                    />
                  ))}
                </div>
                <span className="font-bold text-slate-700 ml-1">{ratingScore}</span>
                <span className="text-slate-400 font-medium">({reviewCount} reviews)</span>
              </div>
              <span className="text-slate-300">•</span>
              <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-full flex items-center gap-1 text-[11px]">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> In Stock ({product.stock ?? 50})
              </span>
            </div>

            {/* Divider line */}
            <div className="border-t border-slate-200/90 pt-3" />

            {/* Pricing Section */}
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="text-3xl sm:text-4xl font-black text-brand tracking-tight">
                ৳{product.price.toLocaleString()}
              </span>
              {oldPrice > product.price && (
                <span className="text-lg sm:text-xl text-slate-400 line-through font-semibold">
                  ৳{oldPrice.toLocaleString()}
                </span>
              )}
              {saveAmount > 0 && (
                <span className="bg-brand-soft text-brand border border-brand-border font-black text-xs px-3 py-1 rounded-full shadow-xs">
                  SAVE {savePercent}% (৳{saveAmount.toLocaleString()})
                </span>
              )}
            </div>

            {/* Divider line */}
            <div className="border-t border-slate-200/90 pt-1" />

            {/* Short product description / summary text */}
            <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
              {product.short_description || product.description || 'Experience cutting-edge build quality, certified authentic hardware, and exceptional durability designed for daily active lifestyle.'}
            </p>

            {/* Size Variation */}
            {product.enable_size && product.sizes && product.sizes.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Select Size ({selectedSize}):
                </span>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setSelectedSize(sz)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                        selectedSize === sz
                          ? 'bg-brand text-white border-brand shadow-sm shadow-brand/20'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-brand-border'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Variation */}
            {product.enable_color && product.colors && product.colors.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Select Color ({selectedColor}):
                </span>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((col) => (
                    <button
                      key={col}
                      onClick={() => setSelectedColor(col)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                        selectedColor === col
                          ? 'bg-brand text-white border-brand shadow-sm shadow-brand/20'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-brand-border'
                      }`}
                    >
                      {col}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Legacy Variants fallback */}
            {!product.enable_size && !product.enable_color && product.variants && product.variants.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Select Option:
                </span>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariantVariant(v.value)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                        selectedVariantVariant === v.value
                          ? 'bg-brand text-white border-brand shadow-sm shadow-brand/20'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-brand-border'
                      }`}
                    >
                      {v.name}: {v.value}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Action Row */}
            <div className="pt-3 flex flex-wrap sm:flex-nowrap items-center gap-3">
              {/* Quantity selector (- [1] +) */}
              <div className="flex items-center border-2 border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden h-13 shrink-0">
                <button
                  type="button"
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="px-3.5 py-2 hover:bg-slate-100 text-slate-700 font-bold text-base transition h-full flex items-center justify-center cursor-pointer active:bg-slate-200"
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span className="px-4 py-2 font-black text-slate-900 text-center min-w-[42px] text-sm select-none">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(q => q + 1)}
                  className="px-3.5 py-2 hover:bg-slate-100 text-slate-700 font-bold text-base transition h-full flex items-center justify-center cursor-pointer active:bg-slate-200"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>

              {/* Order Now button (prominent primary CTA) */}
              <button
                type="button"
                onClick={() => onOrderNow(product, quantity, selectedVariant)}
                className="flex-1 bg-brand hover:bg-brand-dark active:scale-[0.98] text-white font-extrabold h-13 px-6 rounded-2xl shadow-lg shadow-brand/25 flex items-center justify-center gap-2 text-sm sm:text-base transition cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>Order Now</span>
              </button>

              {/* Add to Cart button (secondary CTA) */}
              <button
                type="button"
                onClick={() => onAddToCart(product, quantity, selectedVariant)}
                className="flex-1 sm:flex-initial bg-brand-soft hover:bg-[#FFE5EE] text-brand border border-brand-border font-extrabold h-13 px-5 rounded-2xl flex items-center justify-center gap-2 text-sm transition cursor-pointer active:scale-[0.98]"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Cart</span>
              </button>

              {/* Wishlist / heart icon button */}
              <button
                type="button"
                onClick={() => onToggleWishlist(product.id)}
                title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                className={`w-13 h-13 rounded-2xl border-2 transition flex items-center justify-center shrink-0 cursor-pointer ${
                  isWishlisted
                    ? 'border-brand bg-brand-soft text-brand shadow-sm'
                    : 'border-slate-200 hover:border-brand-border text-slate-500 hover:bg-brand-soft/30'
                }`}
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-brand text-brand' : ''}`} />
              </button>
            </div>

            {/* Soft-tinted info box below the buttons with 3 key perks */}
            <div className="bg-gradient-to-r from-brand-soft/90 via-[#FFF5F8]/70 to-white border border-brand-border/80 rounded-2xl p-4 sm:p-5 mt-4 space-y-3 shadow-xs">
              <div className="flex items-center gap-3 text-xs sm:text-sm font-semibold text-slate-800">
                <div className="w-8 h-8 rounded-xl bg-white border border-brand-border/80 flex items-center justify-center text-brand shrink-0 shadow-xs">
                  <Truck className="w-4 h-4" />
                </div>
                <span>Fast Delivery inside Dhaka (24-48 hrs)</span>
              </div>
              <div className="flex items-center gap-3 text-xs sm:text-sm font-semibold text-slate-800">
                <div className="w-8 h-8 rounded-xl bg-white border border-brand-border/80 flex items-center justify-center text-brand shrink-0 shadow-xs">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <span>7 Days Return Policy</span>
              </div>
              <div className="flex items-center gap-3 text-xs sm:text-sm font-semibold text-slate-800">
                <div className="w-8 h-8 rounded-xl bg-white border border-brand-border/80 flex items-center justify-center text-brand shrink-0 shadow-xs">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span>Cash on Delivery Available</span>
              </div>
            </div>

          </div>

        </div>

        {/* Below Product Section: Tabbed Content Area */}
        <div className="mt-14 bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          
          {/* Tabs header */}
          <div className="border-b border-slate-200 px-6 sm:px-8 flex gap-6 sm:gap-10 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab('desc')}
              className={`py-4 text-sm font-extrabold tracking-wide transition border-b-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'desc'
                  ? 'border-brand text-brand'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Description
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`py-4 text-sm font-extrabold tracking-wide transition border-b-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'reviews'
                  ? 'border-brand text-brand'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Reviews ({reviewCount})
            </button>
            <button
              onClick={() => setActiveTab('shipping')}
              className={`py-4 text-sm font-extrabold tracking-wide transition border-b-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'shipping'
                  ? 'border-brand text-brand'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Shipping & Returns
            </button>
          </div>

          {/* Tab Content Body */}
          <div className="p-6 sm:p-10">
            {activeTab === 'desc' && (
              <div className="space-y-6 max-w-4xl">
                <div>
                  <h3 className="text-lg font-black text-ink mb-2">Product Overview</h3>
                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                    {product.description || 'This authentic gadget offers high precision engineering, robust build standards, and high efficiency battery life. Tested and verified directly by Innexbuy for top customer satisfaction.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 space-y-1">
                    <span className="font-extrabold text-xs text-brand uppercase tracking-wider">High Durability</span>
                    <p className="text-xs text-slate-600">Built with impact-resistant premium composite alloy and scratch proof coating.</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 space-y-1">
                    <span className="font-extrabold text-xs text-brand uppercase tracking-wider">Quality Verified</span>
                    <p className="text-xs text-slate-600">Double QC tested before parcel packing to ensure 100% zero factory defects.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'specs' && (
              <div className="max-w-3xl overflow-hidden rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs sm:text-sm">
                  <tbody>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <td className="py-3.5 px-4 font-bold text-slate-700 w-1/3">Brand</td>
                      <td className="py-3.5 px-4 text-slate-900 font-semibold">Innexbuy Official Verified</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="py-3.5 px-4 font-bold text-slate-700">Model / SKU</td>
                      <td className="py-3.5 px-4 text-slate-900 font-semibold">{sku}</td>
                    </tr>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <td className="py-3.5 px-4 font-bold text-slate-700">Category</td>
                      <td className="py-3.5 px-4 text-slate-900 font-semibold">{categoryName || 'Smart Gadget'}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="py-3.5 px-4 font-bold text-slate-700">Stock Availability</td>
                      <td className="py-3.5 px-4 text-emerald-600 font-bold">{product.stock ?? 50} Units Available</td>
                    </tr>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <td className="py-3.5 px-4 font-bold text-slate-700">Warranty</td>
                      <td className="py-3.5 px-4 text-slate-900 font-semibold">7 Days Replacement Warranty & 1 Year Service Warranty</td>
                    </tr>
                    <tr>
                      <td className="py-3.5 px-4 font-bold text-slate-700">Box Contents</td>
                      <td className="py-3.5 px-4 text-slate-900 font-semibold">1x Gadget Unit, Charging Cable, User Manual, Warranty Card</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-6 max-w-4xl">
                {/* Review stats */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-brand-soft/40 rounded-2xl border border-brand-border/60">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl font-black text-ink">{ratingScore}</div>
                    <div>
                      <div className="flex text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <p className="text-xs text-slate-500 font-semibold mt-1">Based on {reviewCount} verified customer ratings</p>
                    </div>
                  </div>
                  <div className="text-xs text-brand font-bold bg-white px-4 py-2 rounded-xl border border-brand-border shadow-xs">
                    ✓ 100% Verified Innexbuy Purchases
                  </div>
                </div>

                <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50/50 text-center space-y-2">
                  <p className="text-sm font-bold text-slate-700">Verified Customer Feedback</p>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    All reviews are submitted by verified buyers who completed their purchase on Innexbuy.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'shipping' && (
              <div className="space-y-4 max-w-3xl text-sm text-slate-700 leading-relaxed">
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/70 space-y-2">
                  <h4 className="font-black text-ink flex items-center gap-2">
                    <Truck className="w-4 h-4 text-brand" /> Delivery Information & Shipping Rates
                  </h4>
                  <ul className="list-disc list-inside text-xs sm:text-sm space-y-1 text-slate-600 pl-1">
                    <li><strong>Inside Dhaka City:</strong> ৳60 (Delivered within 24 to 48 hours).</li>
                    <li><strong>Sub-Dhaka (Savar, Gazipur, Narayanganj):</strong> ৳100 (2-3 business days).</li>
                    <li><strong>Outside Dhaka (Nationwide):</strong> ৳130 (3-5 business days via courier).</li>
                    <li><strong>Cash on Delivery:</strong> Pay only when you inspect the parcel at your doorstep.</li>
                  </ul>
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/70 space-y-2">
                  <h4 className="font-black text-ink flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-brand" /> 7 Days Replacement & Return Policy
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600">
                    If there is any manufacturing defect, damage during transit, or mismatch, simply contact our hotline at <strong>01982-711668</strong> within 7 days of receiving the parcel. We will arrange a replacement or complete refund.
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Related Products Section */}
        {relatedProducts && relatedProducts.length > 0 && (
          <div className="mt-16">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-ink">
                  Related Products
                </h2>
                <p className="text-xs text-slate-500">
                  More trending gadgets from {categoryName || 'this category'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5">
              {relatedProducts.map(relProduct => (
                <ProductCard
                  key={relProduct.id}
                  product={relProduct}
                  onAddToCart={(p) => onAddToCart(p, 1)}
                  onOrderNow={(p) => onOrderNow(p, 1)}
                  onSelectProduct={(p) => {
                    if (onSelectProduct) {
                      onSelectProduct(p);
                    }
                  }}
                  onToggleWishlist={onToggleWishlist}
                  isWishlisted={false}
                />
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Sticky Mobile Purchase Bar at bottom for easy tapping */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 z-30 flex items-center justify-between gap-3 shadow-xl">
        <div className="min-w-0">
          <p className="text-[10px] text-slate-400 font-bold uppercase truncate">{product.name}</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-black text-brand">৳{product.price.toLocaleString()}</span>
            {oldPrice > product.price && (
              <span className="text-xs text-slate-400 line-through">৳{oldPrice.toLocaleString()}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onAddToCart(product, quantity, selectedVariant)}
            className="bg-brand-soft text-brand border border-brand-border font-extrabold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1 active:scale-95"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Cart</span>
          </button>
          <button
            onClick={() => onOrderNow(product, quantity, selectedVariant)}
            className="bg-brand text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-brand/20 flex items-center gap-1.5 active:scale-95"
          >
            <Zap className="w-3.5 h-3.5 fill-white" />
            <span>Order Now</span>
          </button>
        </div>
      </div>

    </div>
  );
};

export default ProductPage;