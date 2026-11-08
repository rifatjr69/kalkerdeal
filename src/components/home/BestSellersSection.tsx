import React from 'react';
import { ChevronRight } from 'lucide-react';
import { ProductCard } from '../common/ProductCard';
import { useStore } from '../../context/StoreContext';

export const BestSellersSection: React.FC = () => {
  const { products, navigateTo } = useStore();
  const bestsellerProducts = products.filter((p) => p.isBestseller).slice(0, 6);

  return (
    <section className="py-6 sm:py-8 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Header with See all link */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Best Sellers
          </h2>

          <button
            type="button"
            onClick={() => navigateTo('/shop', { filter: 'bestseller' })}
            className="text-xs sm:text-sm font-bold text-[#00A5A8] hover:text-[#008F91] flex items-center gap-1 transition"
          >
            <span>See all</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* 6 Product Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {bestsellerProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};
