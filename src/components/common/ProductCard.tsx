import React, { useState } from 'react';
import { Heart, Eye, Check, Zap, ShoppingBag } from 'lucide-react';
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
    openQuickView
  } = useStore();

  const [isHovered, setIsHovered] = useState(false);
  const inWishlist = isInWishlist(product.id);

  const handleCardClick = () => {
    navigateTo(`/product/${product.slug}`);
  };

  const handleDirectOrder = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!product.inStock) return;
    addToCart(product, 1);
    navigateTo('/checkout');
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  const handleQuickViewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    openQuickView(product);
  };

  return (
    <div
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative bg-white border border-slate-100 hover:border-slate-200 rounded-2xl p-3 sm:p-4 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] cursor-pointer"
    >
      {/* Top Badges & Actions */}
      <div className="relative w-full aspect-square flex items-center justify-center mb-3 overflow-hidden rounded-xl bg-slate-50">
        {/* Circular soft background matching reference */}
        <div className="absolute inset-2 sm:inset-3 rounded-full bg-slate-200/60 transition-transform duration-300 group-hover:scale-105" />

        {/* Product Image */}
        <img
          src={isHovered && product.hoverImage ? product.hoverImage : product.image}
          alt={product.title}
          loading="lazy"
          className={`relative z-10 w-4/5 h-4/5 object-contain transition-transform duration-300 group-hover:scale-105 ${
            !product.inStock ? 'opacity-50 grayscale' : ''
          }`}
        />

        {/* Out of Stock Overlay */}
        {!product.inStock && (
          <div className="absolute inset-0 z-20 bg-white/70 backdrop-blur-[1px] flex items-center justify-center">
            <span className="bg-slate-900 text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Out of stock
            </span>
          </div>
        )}

        {/* Top-Left Badges */}
        <div className="absolute top-2 left-2 z-20 flex flex-col items-start gap-1">
          {product.discountPercent && product.discountPercent > 0 && (
            <span className="bg-[#E11D48] text-white text-[11px] font-bold px-2 py-0.5 rounded-md shadow-sm">
              -{product.discountPercent}%
            </span>
          )}
          {product.promoBadge && (
            <span className="bg-[#BE123C] text-white text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider shadow-sm">
              {product.promoBadge}
            </span>
          )}
        </div>

        {/* Top-Right Action Buttons */}
        <div className="absolute top-2 right-2 z-20 flex flex-col gap-1.5">
          <button
            type="button"
            onClick={handleWishlistClick}
            aria-label="Add to wishlist"
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-sm ${
              inWishlist
                ? 'bg-[#FFF1F5] text-[#FF2B74]'
                : 'bg-white/90 text-slate-400 hover:text-[#FF2B74] hover:bg-white'
            }`}
          >
            <Heart className={`w-4 h-4 ${inWishlist ? 'fill-[#FF2B74]' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleQuickViewClick}
            aria-label="Quick view"
            className="w-8 h-8 rounded-full bg-white/90 text-slate-400 hover:text-slate-800 hover:bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>

        {/* Rating Chip on image bottom-left if rated */}
        {product.rating && (
          <div className="absolute bottom-2 left-2 z-20 flex items-center gap-1 bg-[#F97316] text-white text-[10px] sm:text-[11px] font-bold px-1.5 py-0.5 rounded-md shadow-sm">
            <span>{product.rating.toFixed(1)}</span>
            <span className="text-[10px]">★</span>
            {product.reviewCount !== undefined && (
              <span className="text-white/80 border-l border-white/30 pl-1">
                {product.reviewCount}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          {/* Badges row above/inline with Title */}
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            {product.isFast && (
              <span className="inline-flex items-center gap-0.5 bg-[#BE123C] text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">
                <Zap className="w-2.5 h-2.5 fill-current" /> FAST
              </span>
            )}
            {product.isVerified && (
              <span className="inline-flex items-center gap-0.5 bg-[#1E3A8A] text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                <Check className="w-2.5 h-2.5 stroke-[3]" /> Verified
              </span>
            )}
          </div>

          {/* Product Title */}
          <h3 className="text-xs sm:text-[13px] font-semibold text-slate-800 line-clamp-2 leading-snug group-hover:text-[#00A5A8] transition-colors mb-2">
            {product.title}
          </h3>
        </div>

        <div>
          {/* Price Block */}
          <div className="flex items-baseline gap-1.5 flex-wrap mb-1">
            {product.discountPercent && product.discountPercent > 0 && (
              <span className="text-[11px] font-bold text-[#E11D48]">
                ↓ {product.discountPercent}%
              </span>
            )}
            {product.oldPrice && (
              <span className="text-[11px] sm:text-xs text-slate-400 line-through tabular-nums">
                ৳{product.oldPrice.toLocaleString()}
              </span>
            )}
            <span className="text-sm sm:text-base font-extrabold text-[#E11D48] tabular-nums">
              ৳{product.price.toLocaleString()}
            </span>
          </div>

          {/* Flash Sale Sold progress bar */}
          {showSoldProgress && product.soldCount !== undefined && (
            <div className="mb-2">
              <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                <span>{product.soldCount} items sold</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-[#0F172A] h-full rounded-full"
                  style={{ width: `${Math.min(100, (product.soldCount / 300) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Free Delivery Tag */}
          <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium mb-3">
            FREE delivery
          </p>

          {/* Direct Order Now Button (Direct checkout) */}
          {!product.inStock ? (
            <button
              type="button"
              onClick={handleCardClick}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold text-xs py-2 rounded-xl transition-colors"
            >
              Out of stock
            </button>
          ) : (
            <button
              type="button"
              onClick={handleDirectOrder}
              className="w-full bg-[#FF2B74] hover:bg-[#E11D48] text-white font-extrabold text-xs sm:text-[13px] py-2 px-2 rounded-xl transition-all shadow-xs hover:shadow-md active:scale-[0.98] flex items-center justify-center gap-1.5"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Order Now</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
