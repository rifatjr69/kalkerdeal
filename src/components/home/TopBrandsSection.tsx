import React from 'react';
import { BRANDS } from '../../data/mockProducts';
import { useStore } from '../../context/StoreContext';

export const TopBrandsSection: React.FC = () => {
  const { navigateTo } = useStore();

  return (
    <section className="py-6 sm:py-8 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-5">
          Top Brands
        </h2>

        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-4">
          {BRANDS.slice(0, 8).map((brand) => (
            <button
              key={brand.id}
              type="button"
              onClick={() => navigateTo('/shop', { brand: brand.slug })}
              className="bg-white hover:bg-slate-50 border border-slate-100 hover:border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center gap-3 transition-all duration-200 hover:shadow-md group cursor-pointer"
            >
              {/* Circular Letter Avatar matching reference */}
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#E0F7FA] text-[#00A5A8] flex items-center justify-center font-black text-xl sm:text-2xl transition-transform duration-200 group-hover:scale-110 shadow-2xs">
                {brand.letter}
              </div>

              {/* Brand Name */}
              <span className="text-xs sm:text-[13px] font-bold text-slate-800 group-hover:text-[#00A5A8] transition-colors text-center line-clamp-1">
                {brand.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
