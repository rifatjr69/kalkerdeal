import React from 'react';
import { Heart, Trash2, ShoppingBag, ArrowRight, ChevronRight } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/common/ProductCard';

export const WishlistPage: React.FC = () => {
  const { wishlist, products, addToCart, toggleWishlist, navigateTo, openCart } = useStore();

  const wishlistedProducts = products.filter((p) => wishlist.includes(p.id));

  const handleAddAllToCart = () => {
    wishlistedProducts.forEach((p) => {
      addToCart(p, 1);
    });
    openCart();
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-6 sm:py-9">
      <div className="max-w-7xl mx-auto px-4">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-6 flex-wrap">
          <button
            type="button"
            onClick={() => navigateTo('/')}
            className="hover:text-[#00A5A8] font-medium"
          >
            Home
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-900 font-semibold">Wishlist</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2.5">
              My Wishlist
              <span className="text-xs sm:text-sm font-semibold text-slate-500 bg-slate-200/70 px-2.5 py-0.5 rounded-full">
                {wishlistedProducts.length} {wishlistedProducts.length === 1 ? 'item' : 'items'}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Your saved favorite products across Kalkerdeal
            </p>
          </div>

          {wishlistedProducts.length > 0 && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleAddAllToCart}
                className="px-5 py-2.5 rounded-xl bg-[#00A5A8] hover:bg-[#008F91] text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                Add All to Cart
              </button>
            </div>
          )}
        </div>

        {wishlistedProducts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-xs max-w-lg mx-auto my-8">
            <div className="w-18 h-18 rounded-full bg-pink-50 text-[#FF2B74] flex items-center justify-center mx-auto mb-4">
              <Heart className="w-9 h-9" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-1.5">
              Your wishlist is empty
            </h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
              Tap the heart icon on any product to save it here for later. You can quickly add items to your cart when ready.
            </p>
            <button
              type="button"
              onClick={() => navigateTo('/shop')}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#00A5A8] hover:bg-[#008F91] text-white text-xs font-bold shadow-xs transition"
            >
              Explore Products
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4">
            {wishlistedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
