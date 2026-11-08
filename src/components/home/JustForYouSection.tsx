import React, { useState } from 'react';
import { ProductCard } from '../common/ProductCard';
import { useStore } from '../../context/StoreContext';

export const JustForYouSection: React.FC = () => {
  const { products } = useStore();
  const [displayCount, setDisplayCount] = useState(12);

  const justForYouProducts = products.filter((p) => p.isJustForYou || true);
  const visibleProducts = justForYouProducts.slice(0, displayCount);
  const hasMore = displayCount < justForYouProducts.length;

  const handleLoadMore = () => {
    setDisplayCount((prev) => Math.min(prev + 12, justForYouProducts.length));
  };

  return (
    <section className="py-6 sm:py-8 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-5">
          Just For You
        </h2>

        {/* Multi-row Product Grid matching Screenshot 6 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-8">
          {visibleProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* Load More Button matching Screenshot 7 */}
        {hasMore && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleLoadMore}
              className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs sm:text-sm px-8 py-3 rounded-2xl shadow-sm hover:shadow transition-all duration-200 cursor-pointer active:scale-95"
            >
              Load More
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
