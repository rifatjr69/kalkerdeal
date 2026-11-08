import React, { useState } from 'react';
import { X, Heart, ShoppingBag, Plus, Minus, Check, Star, Zap } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const QuickViewModal: React.FC = () => {
  const { quickViewProduct, closeQuickView, addToCart, isInWishlist, toggleWishlist, navigateTo } = useStore();
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');

  if (!quickViewProduct) return null;

  const inWishlist = isInWishlist(quickViewProduct.id);

  const handleAddToCart = () => {
    addToCart(quickViewProduct, quantity, selectedColor, selectedSize);
    closeQuickView();
  };

  const handleFullDetailsClick = () => {
    closeQuickView();
    navigateTo(`/product/${quickViewProduct.slug}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col md:flex-row relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={closeQuickView}
          aria-label="Close"
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left: Product Image */}
        <div className="w-full md:w-1/2 bg-slate-50 p-6 flex items-center justify-center relative">
          <div className="w-64 h-64 rounded-full bg-slate-200/60 p-4 flex items-center justify-center shadow-inner">
            <img
              src={quickViewProduct.image}
              alt={quickViewProduct.title}
              className="w-48 h-48 object-contain"
            />
          </div>

          {quickViewProduct.discountPercent && (
            <span className="absolute top-4 left-4 bg-[#E11D48] text-white text-xs font-black px-2.5 py-1 rounded-md shadow-sm">
              -{quickViewProduct.discountPercent}%
            </span>
          )}
        </div>

        {/* Right: Info & Purchase Controls */}
        <div className="w-full md:w-1/2 p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="text-[11px] font-bold text-[#00A5A8] uppercase tracking-wider">
              {quickViewProduct.brand}
            </div>

            <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
              {quickViewProduct.title}
            </h3>

            {/* Ratings & Sold */}
            <div className="flex items-center gap-3 text-xs text-slate-500">
              {quickViewProduct.rating && (
                <div className="flex items-center gap-1 bg-[#F97316] text-white font-bold px-2 py-0.5 rounded text-[11px]">
                  <span>{quickViewProduct.rating.toFixed(1)}</span>
                  <span>★</span>
                </div>
              )}
              {quickViewProduct.soldCount && (
                <span>{quickViewProduct.soldCount} sold</span>
              )}
            </div>

            {/* Price Block */}
            <div className="flex items-baseline gap-2 pt-1">
              <span className="text-xl sm:text-2xl font-black text-[#E11D48] tabular-nums">
                ৳{quickViewProduct.price.toLocaleString()}
              </span>
              {quickViewProduct.oldPrice && (
                <span className="text-xs text-slate-400 line-through tabular-nums">
                  ৳{quickViewProduct.oldPrice.toLocaleString()}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
              {quickViewProduct.description}
            </p>

            {/* Sizes if available */}
            {quickViewProduct.sizes && quickViewProduct.sizes.length > 0 && (
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1.5">
                  Size
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {quickViewProduct.sizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`px-3 py-1 text-xs font-bold rounded-lg border transition ${
                        selectedSize === size
                          ? 'border-[#FF2B74] bg-[#FFF1F5] text-[#FF2B74]'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-3">
              {/* Stepper */}
              <div className="flex items-center gap-3 bg-slate-100 border border-slate-200 rounded-xl px-3 py-2">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="text-slate-500 hover:text-slate-800"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-bold tabular-nums">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="text-slate-500 hover:text-slate-800"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Add to Cart CTA */}
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!quickViewProduct.inStock}
                className="flex-1 bg-[#00A5A8] hover:bg-[#008F91] text-white font-extrabold text-xs sm:text-sm py-2.5 px-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Cart</span>
              </button>

              {/* Wishlist */}
              <button
                type="button"
                onClick={() => toggleWishlist(quickViewProduct.id)}
                className={`w-10 h-10 rounded-xl border flex items-center justify-center transition ${
                  inWishlist
                    ? 'border-[#FF2B74] bg-[#FFF1F5] text-[#FF2B74]'
                    : 'border-slate-200 text-slate-400 hover:text-[#FF2B74]'
                }`}
              >
                <Heart className={`w-4 h-4 ${inWishlist ? 'fill-[#FF2B74]' : ''}`} />
              </button>
            </div>

            <button
              type="button"
              onClick={handleFullDetailsClick}
              className="w-full text-center text-xs font-bold text-[#FF2B74] hover:underline pt-1"
            >
              View Full Product Details &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
