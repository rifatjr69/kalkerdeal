import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductCard } from '../common/ProductCard';
import { useStore } from '../../context/StoreContext';

export const DealsSection: React.FC = () => {
  const { products } = useStore();
  const scrollerRef = useRef<HTMLDivElement>(null);

  const dealProducts = products.filter((p) => p.isDeal);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollerRef.current) {
      const amount = direction === 'left' ? -300 : 300;
      scrollerRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-6 sm:py-8 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Header with Navigation Arrows matching Screenshot 3 */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Deals you can&apos;t miss
          </h2>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scroll('left')}
              aria-label="Previous deals"
              className="w-8 h-8 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center transition shadow-2xs hover:scale-105 active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              aria-label="Next deals"
              className="w-8 h-8 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center transition shadow-2xs hover:scale-105 active:scale-95"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Product Cards Row */}
        <div
          ref={scrollerRef}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6"
        >
          {dealProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};
