import React, { useState, useEffect } from 'react';
import { ChevronRight, ArrowRight } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { supabase } from '../../lib/supabase';
import { CategoryItem } from '../../types/store';

interface MegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MegaMenu: React.FC<MegaMenuProps> = ({ isOpen, onClose }) => {
  const { navigateTo } = useStore();
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string>('');

  useEffect(() => {
    async function fetchCategories() {
      const { data, error } = await supabase
        .from('categories')
        .select(`
          id, name, name_bn, slug, icon, image_url,
          subcategories(id, name, name_bn, slug)
        `)
        .eq('is_active', true)
        .order('sort_order');

      if (!error && data) {
        const mapped: CategoryItem[] = data.map((c: any) => ({
          id: c.id,
          name: c.name,
          name_bn: c.name_bn,
          slug: c.slug,
          iconName: c.icon || 'Tag',
          image: c.image_url || '',
          subCategories: c.subcategories.map((sc: any) => ({
            name: sc.name,
            name_bn: sc.name_bn,
            slug: sc.slug
          }))
        }));
        setCategories(mapped);
        if (mapped.length > 0 && !activeCategoryId) setActiveCategoryId(mapped[0].id);
      }
    }
    if (isOpen) fetchCategories();
  }, [isOpen]);

  if (!isOpen || categories.length === 0) return null;

  const activeCategory = categories.find((c) => c.id === activeCategoryId) || categories[0];

  const handleCategoryClick = (catSlug: string) => {
    onClose();
    navigateTo(`/shop`, { category: catSlug });
  };

  const handleSubCategoryClick = (catSlug: string, subSlug: string) => {
    onClose();
    navigateTo(`/shop`, { category: catSlug, subCategory: subSlug });
  };

  return (
    <div
      onMouseLeave={onClose}
      className="fixed top-[120px] left-4 right-4 z-50 mx-auto w-auto max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex animate-in fade-in zoom-in-95 duration-150"
      style={{ maxHeight: 'calc(100vh - 160px)' }}
    >
      {/* Left Column: Categories List */}
      <div className="w-72 bg-slate-50 border-r border-slate-100 p-2 overflow-y-auto custom-scrollbar">
        {categories.map((cat) => {
          const isActive = cat.id === activeCategoryId;
          return (
            <button
              key={cat.id}
              type="button"
              onMouseEnter={() => setActiveCategoryId(cat.id)}
              onClick={() => handleCategoryClick(cat.slug)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left mb-1 ${
                isActive
                  ? 'bg-[#FFF1F5] text-[#FF2B74] font-bold shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-6 h-6 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center p-0.5 shrink-0">
                  <img src={cat.image} alt="" className="w-4 h-4 object-contain" />
                </span>
                <span className="truncate">{cat.name_bn || cat.name}</span>
              </div>
              <ChevronRight
                className={`w-3.5 h-3.5 shrink-0 ${
                  isActive ? 'text-[#FF2B74]' : 'text-slate-400'
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* Right Column: Sub-Categories & Details */}
      <div className="flex-1 p-6 bg-white overflow-y-auto custom-scrollbar flex flex-col justify-between">
        <div>
          {/* Active Category Header with Shop all link */}
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">
              {activeCategory.name_bn || activeCategory.name}
            </h3>
            <button
              type="button"
              onClick={() => handleCategoryClick(activeCategory.slug)}
              className="text-xs font-bold text-[#00A5A8] hover:text-[#008F91] flex items-center gap-1 transition"
            >
              <span>Shop all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Subcategories Grid */}
          <div className="grid grid-cols-3 gap-6">
            {activeCategory.subCategories.map((sub) => (
              <div key={sub.slug} className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleSubCategoryClick(activeCategory.slug, sub.slug)}
                  className="text-xs font-bold text-slate-900 hover:text-[#FF2B74] transition text-left block"
                >
                  {(sub as any).name_bn || sub.name}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom banner in mega menu */}
        <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between bg-slate-50 p-3 rounded-xl">
          <div className="text-xs text-slate-600">
            Looking for something specific in <strong className="text-slate-800">{activeCategory.name_bn || activeCategory.name}</strong>?
          </div>
          <button
            type="button"
            onClick={() => handleCategoryClick(activeCategory.slug)}
            className="text-xs font-extrabold text-[#FF2B74] hover:underline"
          >
            Explore all items &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};
