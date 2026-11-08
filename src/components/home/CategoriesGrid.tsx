import React from 'react';
import { CATEGORIES } from '../../data/mockProducts';
import { useStore } from '../../context/StoreContext';

export const CategoriesGrid: React.FC = () => {
  const { navigateTo, categories } = useStore();
  const displayCategories = categories.length > 0 ? categories : CATEGORIES;

  return (
    <section className="py-6 sm:py-8 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Categories
          </h2>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3 sm:gap-4">
          {displayCategories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => navigateTo('/shop', { category: cat.slug })}
              className="bg-white hover:bg-slate-50/80 border border-slate-100 hover:border-slate-200 rounded-2xl p-4 flex flex-col items-center text-center gap-3 transition-all duration-200 hover:shadow-md group cursor-pointer"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-50 border border-slate-200/60 group-hover:bg-[#FFF1F5] group-hover:border-[#FF2B74]/40 flex items-center justify-center p-3 transition-transform duration-200 group-hover:scale-110">
                <img
                  src={cat.image}
                  alt={cat.name_bn || cat.name}
                  loading="lazy"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-xs sm:text-[13px] font-bold text-slate-800 group-hover:text-[#FF2B74] transition-colors leading-tight line-clamp-2">
                {cat.name_bn || cat.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
