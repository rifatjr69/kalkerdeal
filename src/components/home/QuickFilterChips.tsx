import React from 'react';
import { Tag, ShieldCheck, Flame, Star, Heart, Store } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const QuickFilterChips: React.FC = () => {
  const { navigateTo } = useStore();

  const chips = [
    {
      label: 'Lowest Price',
      filter: 'lowest-price',
      icon: Tag,
      iconColor: 'text-[#E11D48]',
      iconBg: 'bg-[#FFF1F5]'
    },
    {
      label: '100% Authentic',
      filter: 'authentic',
      icon: ShieldCheck,
      iconColor: 'text-[#059669]',
      iconBg: 'bg-[#ECFDF5]'
    },
    {
      label: 'Latest Drops',
      filter: 'latest',
      icon: Flame,
      iconColor: 'text-[#EA580C]',
      iconBg: 'bg-[#FFF7ED]'
    },
    {
      label: 'Glow & Go',
      filter: 'glow-go',
      icon: Star,
      iconColor: 'text-[#8B5CF6]',
      iconBg: 'bg-[#F5F3FF]'
    },
    {
      label: 'Skin Care',
      filter: 'skin-care',
      icon: Heart,
      iconColor: 'text-[#EC4899]',
      iconBg: 'bg-[#FDF2F8]'
    },
    {
      label: 'Top Stores',
      filter: 'top-stores',
      icon: Store,
      iconColor: 'text-[#0284C7]',
      iconBg: 'bg-[#F0F9FF]'
    }
  ];

  return (
    <section className="py-2 sm:py-4 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {chips.map((chip, idx) => {
            const Icon = chip.icon;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => navigateTo('/shop', { filter: chip.filter })}
                className="bg-white hover:bg-slate-50 border border-slate-100 hover:border-slate-200 rounded-2xl p-3 sm:p-4 flex items-center gap-3 transition-all duration-200 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-md group text-left cursor-pointer"
              >
                <div
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${chip.iconBg} ${chip.iconColor} flex items-center justify-center shrink-0 transition-transform group-hover:scale-110`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs sm:text-[13px] font-bold text-slate-800 group-hover:text-[#FF2B74] transition-colors leading-tight">
                  {chip.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
