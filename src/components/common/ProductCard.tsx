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


  return (
    <div
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative bg-white border border-slate-50 rounded-2xl p-2 sm:p-3 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)] cursor-pointer h-full"
    >
      {/* Top Image Section */}
      <div className="relative w-full aspect-square flex items-center justify-center mb-2.5 overflow-hidden rounded-xl bg-slate-50/50">
        {/* Circular background circle */}
        <div className="absolute inset-1.5 sm:inset-3 rounded-full bg-[#E2E8F0]/40 transition-transform duration-500 group-hover:scale-110" />

        {/* Product Image */}
        <img
          src={isHovered && product.hoverImage ? product.hoverImage : product.image}
          alt={product.title}
          loading="lazy"
          className={`relative z-10 w-[90%] h-[90%] object-contain transition-transform duration-500 group-hover:scale-105 ${
            !product.inStock ? 'opacity-50 grayscale' : ''
          }`}
        />

        {/* Out of Stock Overlay */}
        {!product.inStock && (
          <div className="absolute inset-0 z-20 bg-white/70 backdrop-blur-[1px] flex items-center justify-center">
            <span className="bg-slate-900 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              Out of stock
            </span>
          </div>
        )}

        {/* Rating Badge - Bottom Left of Image Area */}
        {product.rating && (
          <div className="absolute bottom-1.5 left-1.5 z-20 flex items-center gap-0.5 bg-[#F97316] text-white text-[9px] sm:text-[11px] font-bold px-1.5 py-0.5 rounded shadow-sm">
            <span>{product.rating.toFixed(1)}</span>
            <span>★</span>
            {product.reviewCount !== undefined && (
              <span className="opacity-90 ml-0.5">{product.reviewCount}</span>
            )}
          </div>
        )}

        {/* Wishlist Button - Top Right of Image Area */}
        <div className="absolute top-1.5 right-1.5 z-20">
          <button
            type="button"
            onClick={handleWishlistClick}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-colors shadow-sm bg-white/90 ${
              inWishlist ? 'text-[#FF2B74]' : 'text-slate-300 hover:text-[#FF2B74]'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${inWishlist ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {/* Product Info */}
      <div className="flex-1 flex flex-col px-0.5">
        {/* Badges Row */}
        <div className="flex items-center gap-1 mb-2">
          {product.isFast && (
            <span className="bg-[#1E40AF] text-white text-[8px] sm:text-[10px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5 uppercase tracking-tighter">
              <Zap className="w-2 h-2 fill-current" /> FAST
            </span>
          )}
          {product.isVerified && (
            <span className="bg-[#1E3A8A] text-white text-[8px] sm:text-[10px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5 uppercase tracking-tighter">
              <Check className="w-2 h-2" /> VERIFIED
            </span>
          )}
        </div>

        <h3 className="text-[12px] sm:text-[14px] font-bold text-slate-800 line-clamp-1 leading-tight mb-1.5">
          {product.title}
        </h3>

        <div className="mt-auto">
          {/* Price Block */}
          <div className="flex flex-col mb-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[16px] sm:text-[19px] font-black text-[#E11D48] tabular-nums">
                ৳{product.price.toLocaleString()}
              </span>
              {product.oldPrice && (
                <span className="text-[11px] sm:text-[13px] text-slate-400 line-through tabular-nums">
                  ৳{product.oldPrice.toLocaleString()}
                </span>
              )}
            </div>
          </div>

          {/* Progress Bar (Flash Sale specific) */}
          {showSoldProgress && product.soldCount !== undefined && (
            <div className="mb-2.5">
              <div className="w-full bg-slate-100 rounded-full h-[6px] overflow-hidden mb-1">
                <div
                  className="bg-[#0F172A] h-full rounded-full"
                  style={{ width: `${Math.min(100, (product.soldCount / 300) * 100)}%` }}
                />
              </div>
              <p className="text-[11px] sm:text-[12px] text-slate-500 font-bold leading-none">
                {product.soldCount} items sold
              </p>
            </div>
          )}

          {/* Order Now Button */}
          <div className="mt-1">
            <button
              type="button"
              onClick={handleDirectOrder}
              disabled={!product.inStock}
              className={`w-full ${
                product.inStock ? 'bg-[#FF2B74] hover:bg-[#E11D48]' : 'bg-slate-200 cursor-not-allowed'
              } text-white text-[11px] sm:text-[14px] font-black py-2 sm:py-2.5 rounded-xl transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-1.5`}
            >
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Order Now</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
