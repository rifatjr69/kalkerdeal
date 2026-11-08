import React, { useState } from 'react';
import { Heart, Check, Zap, ShoppingBag } from 'lucide-react';
import { Product } from '../../types/store';
import { useStore } from '../../context/StoreContext';

interface ProductCardProps {
  product: Product;
  showSoldProgress?: boolean;
  layout?: 'grid' | 'list';
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  showSoldProgress = false,
  layout = 'grid'
}) => {
  const {
    navigateTo,
    addToCart,
    isInWishlist,
    toggleWishlist,
  } = useStore();

  const [isHovered, setIsHovered] = useState(false);
  const inWishlist = isInWishlist(product.id);

  const handleCardClick = () => {
    navigateTo(`/product/${product.slug}`);
  };

  const handleOrderNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!product.inStock) return;
    addToCart(product, 1);
    navigateTo('/checkout');
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  // Calculate discount percentage if old price exists and percent is not set
  const discountPercent = product.discountPercent || (product.oldPrice && product.oldPrice > product.price
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : undefined);

  // Soft circle color based on product ID or index for screenshot look
  const getCircleBg = () => {
    if (product.id.includes('1') || product.id.includes('5')) return 'bg-[#E0F2FE]/60';
    if (product.id.includes('2') || product.id.includes('6')) return 'bg-[#EEF2FF]/70';
    if (product.id.includes('3') || product.id.includes('7')) return 'bg-[#FEF3C7]/60';
    if (product.id.includes('4') || product.id.includes('8')) return 'bg-[#DCFCE7]/60';
    return 'bg-[#F1F5F9]';
  };

  return (
    <div
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative bg-white border border-slate-100 rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between transition-all duration-300 hover:shadow-lg cursor-pointer h-full"
    >
      {/* Top Image Section */}
      <div className="relative w-full aspect-square flex items-center justify-center mb-2 overflow-hidden rounded-xl bg-slate-50/40">
        {/* Circular background circle matching screenshot */}
        <div className={`absolute inset-2 sm:inset-3 rounded-full ${getCircleBg()} transition-transform duration-500 group-hover:scale-110`} />

        {/* Top-left Promo Ribbon (like "dl / 3, FREE DELIVE...") */}
        {product.promoBadge ? (
          <div className="absolute top-1 left-0 z-20 bg-gradient-to-r from-[#FF2B74] to-[#E11D48] text-white text-[9px] font-bold px-2 py-0.5 rounded-r-full shadow-xs max-w-[125px] truncate">
            {product.promoBadge}
          </div>
        ) : discountPercent && discountPercent >= 20 ? (
          <div className="absolute top-1 left-0 z-20 bg-gradient-to-r from-[#FF2B74] to-[#E11D48] text-white text-[9px] font-bold px-2 py-0.5 rounded-r-full shadow-xs">
            SAVE {discountPercent}%
          </div>
        ) : null}

        {/* Wishlist Button - Top Right with circle white background matching screenshot */}
        <div className="absolute top-1.5 right-1.5 z-20">
          <button
            type="button"
            onClick={handleWishlistClick}
            aria-label="Wishlist"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white shadow-xs border border-slate-100 flex items-center justify-center text-slate-400 hover:text-[#FF2B74] transition-colors"
          >
            <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${inWishlist ? 'fill-[#FF2B74] text-[#FF2B74]' : ''}`} />
          </button>
        </div>

        {/* Product Image */}
        <img
          src={isHovered && product.hoverImage ? product.hoverImage : product.image}
          alt={product.title}
          loading="lazy"
          className={`relative z-10 w-[84%] h-[84%] object-contain transition-transform duration-500 group-hover:scale-105 ${
            !product.inStock ? 'opacity-50 grayscale' : ''
          }`}
        />

        {/* Out of Stock Overlay */}
        {!product.inStock && (
          <div className="absolute inset-0 z-20 bg-white/75 backdrop-blur-[1px] flex items-center justify-center">
            <span className="bg-slate-900 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              Out of stock
            </span>
          </div>
        )}

        {/* Rating Badge - Bottom Left of Image matching screenshot */}
        {product.rating && (
          <div className="absolute bottom-1 left-1 z-20 flex items-center rounded overflow-hidden shadow-xs border border-amber-500/20">
            <div className="bg-[#F97316] text-white text-[10px] font-bold px-1.5 py-0.5 flex items-center gap-0.5">
              <span>{product.rating.toFixed(1)}</span>
              <span className="text-[9px]">★</span>
            </div>
            {product.reviewCount !== undefined && (
              <div className="bg-white text-slate-700 text-[10px] font-bold px-1 py-0.5">
                {product.reviewCount}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Product Info Section */}
      <div className="flex-1 flex flex-col justify-between">
        {/* Title line with inline badges matching screenshot */}
        <div className="mb-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            {product.isFast && (
              <span className="inline-flex items-center gap-0.5 bg-[#FF2B74] text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded uppercase tracking-tighter shrink-0">
                <Zap className="w-2.5 h-2.5 fill-current" /> FAST
              </span>
            )}
            {product.isVerified && (
              <span className="inline-flex items-center gap-0.5 bg-[#1E3A8A] text-white text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0">
                <Check className="w-2.5 h-2.5 stroke-[3]" /> Verified
              </span>
            )}
            <h3 className="text-[12px] sm:text-[13px] font-semibold text-slate-800 line-clamp-1 leading-snug">
              {product.title}
            </h3>
          </div>
        </div>

        {/* Price Row: Discount % + Old Price + New Price */}
        <div className="mt-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            {discountPercent && discountPercent > 0 && (
              <span className="text-[11px] sm:text-[12px] font-bold text-[#FF2B74] flex items-center">
                ↓{discountPercent}%
              </span>
            )}
            {product.oldPrice && product.oldPrice > product.price && (
              <span className="text-[10px] sm:text-[11px] text-slate-400 line-through tabular-nums">
                ৳{product.oldPrice.toLocaleString()}
              </span>
            )}
            <span className="text-[14px] sm:text-[16px] font-black text-[#D6175F] tabular-nums">
              ৳{product.price.toLocaleString()}
            </span>
          </div>

          {/* FREE delivery indicator matching screenshot */}
          <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium mt-0.5">
            FREE delivery
          </p>

          {/* Order Now Button (Light Cyan/Teal background with Darker Cyan text) matching screenshot */}
          <div className="mt-2.5">
            <button
              type="button"
              onClick={handleOrderNow}
              disabled={!product.inStock}
              className={`w-full ${
                product.inStock
                  ? 'bg-[#CBE8F2] hover:bg-[#B3DFED] active:scale-[0.98] text-[#0284C7]'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              } font-bold text-[12px] sm:text-[13px] py-1.5 sm:py-2 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer`}
            >
              <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0284C7]" />
              <span>Order Now</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

