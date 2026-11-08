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
      className="group relative bg-white border border-slate-50 rounded-2xl p-1.5 sm:p-2 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_8px_25px_rgba(0,0,0,0.05)] cursor-pointer h-full"
    >
      {/* Top Image Section */}
      <div className="relative w-full aspect-square flex items-center justify-center mb-1.5 overflow-hidden rounded-xl bg-slate-50/50">
        {/* Circular background circle */}
        <div className="absolute inset-1 sm:inset-2.5 rounded-full bg-[#E2E8F0]/30 transition-transform duration-500 group-hover:scale-110" />

        {/* Product Image */}
        <img
          src={isHovered && product.hoverImage ? product.hoverImage : product.image}
          alt={product.title}
          loading="lazy"
          className={`relative z-10 w-[82%] h-[82%] object-contain transition-transform duration-500 group-hover:scale-105 ${
            !product.inStock ? 'opacity-50 grayscale' : ''
          }`}
        />

        {/* Out of Stock Overlay */}
        {!product.inStock && (
          <div className="absolute inset-0 z-20 bg-white/70 backdrop-blur-[1px] flex items-center justify-center">
            <span className="bg-slate-900 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
              Out of stock
            </span>
          </div>
        )}

        {/* Rating Badge - Bottom Left of Image Area */}
        {product.rating && (
          <div className="absolute bottom-0.5 left-0.5 z-20 flex items-center gap-0.5 bg-[#F97316] text-white text-[7px] sm:text-[8px] font-bold px-1.5 py-0.5 rounded shadow-sm">
            <span>{product.rating.toFixed(1)}</span>
            <span>★</span>
            {product.reviewCount !== undefined && (
              <span className="opacity-90 ml-0.5">{product.reviewCount}</span>
            )}
          </div>
        )}

        {/* Wishlist Button - Top Right of Image Area */}
        <div className="absolute top-0.5 right-0.5 z-20">
          <button
            type="button"
            onClick={handleWishlistClick}
            className={`w-5.5 h-5.5 rounded-full flex items-center justify-center transition-colors shadow-sm bg-white/90 ${
              inWishlist ? 'text-[#FF2B74]' : 'text-slate-300 hover:text-[#FF2B74]'
            }`}
          >
            <Heart className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${inWishlist ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {/* Product Info */}
      <div className="flex-1 flex flex-col px-0.5">
        {/* Badges Row - Matches Image */}
        <div className="flex items-center gap-1 mb-1">
          {product.isFast && (
            <span className="bg-[#1E40AF] text-white text-[7px] font-black px-1 py-0.5 rounded flex items-center gap-0.5 uppercase tracking-tighter">
              <Zap className="w-1.5 h-1.5 fill-current" /> FAST
            </span>
          )}
          {product.isVerified && (
            <span className="bg-[#1E3A8A] text-white text-[7px] font-black px-1 py-0.5 rounded flex items-center gap-0.5 uppercase tracking-tighter">
              <Check className="w-1.5 h-1.5" /> VERIFIED
            </span>
          )}
        </div>

        <h3 className="text-[10px] sm:text-[11px] font-bold text-slate-800 line-clamp-1 leading-none mb-1">
          {product.title}
        </h3>

        <div className="mt-auto">
          {/* Price Block */}
          <div className="flex flex-col mb-1.5">
            <div className="flex items-baseline gap-1">
              <span className="text-[15px] sm:text-[17px] font-black text-[#E11D48] tabular-nums">
                ৳{product.price.toLocaleString()}
              </span>
              {product.oldPrice && (
                <span className="text-[9px] sm:text-[11px] text-slate-400 line-through tabular-nums">
                  ৳{product.oldPrice.toLocaleString()}
                </span>
              )}
            </div>
          </div>

          {/* Progress Bar (Flash Sale specific) */}
          {showSoldProgress && product.soldCount !== undefined && (
            <div className="mb-2">
              <div className="w-full bg-slate-100 rounded-full h-[5px] overflow-hidden mb-1">
                <div
                  className="bg-[#0F172A] h-full rounded-full"
                  style={{ width: `${Math.min(100, (product.soldCount / 300) * 100)}%` }}
                />
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-bold leading-none">
                {product.soldCount} items sold
              </p>
            </div>
          )}

          {/* Order Now Button - Pink & Icon */}
          <div className="mt-1">
            <button
              type="button"
              onClick={handleDirectOrder}
              disabled={!product.inStock}
              className={`w-full ${
                product.inStock ? 'bg-[#FF2B74] hover:bg-[#E11D48]' : 'bg-slate-200 cursor-not-allowed'
              } text-white text-[10px] sm:text-[12px] font-black py-2 rounded-lg transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-1.5`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Order Now</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

