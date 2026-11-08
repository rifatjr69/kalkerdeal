import React from 'react';
import { Heart, Star, ShoppingCart } from 'lucide-react';
import { Product } from '../types';

export interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onOrderNow?: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  onToggleWishlist: (productId: string) => void;
  isWishlisted: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onOrderNow,
  onSelectProduct,
  onToggleWishlist,
  isWishlisted
}) => {
  const calculatedDiscount = 
    product.old_price && product.old_price > product.price
      ? Math.round(((product.old_price - product.price) / product.old_price) * 100)
      : (product.discount_percent || 0);

  const hasDiscount = calculatedDiscount > 0;
  const badgeText = hasDiscount 
    ? `${calculatedDiscount}%` 
    : (product.badge || (product.is_featured ? 'NEW' : null));

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-[rgba(253,1,96,0.1)] hover:border-brand-border transition-all duration-200 flex flex-col justify-between group overflow-hidden relative h-full select-none hover:-translate-y-1">
      
      {/* Top Floating Badges */}
      <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1 items-start pointer-events-none">
        {badgeText && (
          <span className="bg-brand text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase shadow-sm">
            {badgeText}
          </span>
        )}
      </div>

      {/* Wishlist Heart Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleWishlist(product.id);
        }}
        className={`absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 border cursor-pointer ${
          isWishlisted
            ? 'bg-brand-soft text-brand border-brand-border'
            : 'bg-white/90 text-slate-400 hover:text-brand hover:bg-brand-soft border-slate-100'
        }`}
        title="Wishlist"
        aria-label="Wishlist"
      >
        <Heart 
          className={`w-4 h-4 transition-transform duration-200 active:scale-125 ${
            isWishlisted ? 'fill-brand text-brand' : ''
          }`} 
        />
      </button>

      {/* Product Image Container */}
      <div 
        onClick={() => onSelectProduct(product)}
        className="relative w-full aspect-square bg-slate-50 overflow-hidden cursor-pointer flex items-center justify-center p-2"
      >
        <img
          src={product.image_url}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 ease-out"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&q=80&w=600';
          }}
        />
      </div>

      {/* Content Area */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Product Title */}
          <h3 
            onClick={() => onSelectProduct(product)}
            title={product.name}
            className="text-xs sm:text-sm font-semibold text-ink line-clamp-2 leading-snug cursor-pointer transition-colors min-h-[2.5rem] mb-2"
          >
            {product.name}
          </h3>

          {/* Star Rating */}
          <div className="flex items-center gap-1 mb-2">
            <div className="flex items-center text-amber-400 gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-3 h-3 ${
                    star <= Math.round(product.rating || 0)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-200 fill-transparent'
                  }`}
                />
              ))}
            </div>
            <span className="text-[11px] text-slate-400">
              ({product.review_count || 0})
            </span>
          </div>

          {/* Price Row */}
          <div className="flex items-baseline gap-2">
            <span className="text-sm sm:text-base font-bold text-ink">
              ৳{product.price.toLocaleString()}
            </span>
            {product.old_price && product.old_price > product.price && (
              <span className="text-xs text-slate-400 line-through">
                ৳{product.old_price.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 mt-4">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOrderNow ? onOrderNow(product) : onAddToCart(product);
            }}
            className="flex-1 py-2 rounded-lg bg-brand text-white hover:bg-brand-dark transition-all text-xs font-bold uppercase shadow-sm flex items-center justify-center cursor-pointer"
          >
            Buy Now
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
            className="w-10 h-9 rounded-lg bg-brand-soft text-brand border border-brand-border hover:bg-brand-border transition-all flex items-center justify-center cursor-pointer"
            title="Add to Cart"
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
        </div>

      </div>

    </div>
  );
};
