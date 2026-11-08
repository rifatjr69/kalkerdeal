import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Tag } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const CategoryIconStrip: React.FC = () => {
  const { navigateTo, categories } = useStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <section className="bg-white py-5 sm:py-6 border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Header with Navigation Arrows */}
        <div className="flex items-center justify-between mb-4 sm:mb-5">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            ক্যাটাগরি সমূহ
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scroll('left')}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 hover:bg-pink-50 hover:text-[#FF2B74] text-slate-600 flex items-center justify-center transition-all shadow-2xs active:scale-95 cursor-pointer"
              aria-label="Previous categories"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 hover:bg-pink-50 hover:text-[#FF2B74] text-slate-600 flex items-center justify-center transition-all shadow-2xs active:scale-95 cursor-pointer"
              aria-label="Next categories"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Categories Row */}
        <div
          ref={scrollRef}
          className="flex items-center gap-4 sm:gap-6 overflow-x-auto no-scrollbar scroll-smooth py-1 px-1"
        >
          {categories.map((cat) => (
            <button
              key={cat.id || cat.slug}
              type="button"
              onClick={() => navigateTo('/shop', { category: cat.slug })}
              className="flex flex-col items-center gap-2 shrink-0 group focus:outline-none cursor-pointer"
            >
              {/* Circular Avatar Wrapper with Soft Pink Border */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full p-1 bg-white border-2 border-pink-200/90 group-hover:border-[#FF2B74] group-hover:shadow-md transition-all duration-300 flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105">
                {cat.image ? (
                  <img
                    src={cat.image}
                    alt={cat.name_bn || cat.name}
                    loading="lazy"
                    className="w-full h-full object-cover rounded-full"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-pink-50 flex items-center justify-center text-[#FF2B74]">
                    <Tag className="w-8 h-8" />
                  </div>
                )}
              </div>

              {/* Category Title */}
              <span className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-[#FF2B74] text-center line-clamp-1 max-w-[100px] leading-tight transition-colors">
                {cat.name_bn || cat.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
