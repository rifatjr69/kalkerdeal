import React, { useRef, useEffect } from 'react';
import {
  LayoutGrid, ChevronDown, ShoppingBag, Shirt, Sparkles,
  Smartphone, Headphones, Home, Store, Heart
} from 'lucide-react';
import { MegaMenu } from './MegaMenu';
import { useStore } from '../../context/StoreContext';

export const CategoryNav: React.FC = () => {
  const { isMegaMenuOpen, setIsMegaMenuOpen, navigateTo } = useStore();
  const navRef = useRef<HTMLDivElement>(null);

  // Close mega menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setIsMegaMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setIsMegaMenuOpen]);

  const quickLinks = [
    { label: 'Groceries', slug: 'groceries-essentials', icon: ShoppingBag },
    { label: "Men's Fashion", slug: 'mens-fashion', icon: Shirt },
    { label: "Women's Fashion", slug: 'womens-fashion', icon: Sparkles },
    { label: 'Mobiles', slug: 'mobiles-cameras', icon: Smartphone },
    { label: 'Electronics', slug: 'computers-laptops', icon: Headphones },
    { label: 'Home & Living', slug: 'home-living', icon: Home },
    { label: 'Beauty', slug: 'health-beauty', icon: Heart }
  ];

  return (
    <div className="bg-white border-b border-slate-100 relative z-30 hidden lg:block">
      <div ref={navRef} className="max-w-7xl mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          {/* All Categories Mega Menu Trigger Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsMegaMenuOpen(!isMegaMenuOpen)}
              className={`flex items-center gap-2 py-3 px-3.5 text-xs font-bold rounded-xl transition-all ${
                isMegaMenuOpen
                  ? 'bg-[#FFF1F5] text-[#FF2B74]'
                  : 'text-slate-800 hover:text-[#FF2B74]'
              }`}
            >
              <LayoutGrid className="w-4 h-4 text-[#FF2B74]" />
              <span className="tracking-wide">All Categories</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  isMegaMenuOpen ? 'rotate-180 text-[#FF2B74]' : 'text-slate-400'
                }`}
              />
            </button>

            {/* Mega Menu Dropdown */}
            <MegaMenu isOpen={isMegaMenuOpen} onClose={() => setIsMegaMenuOpen(false)} />
          </div>

          {/* Quick Category Links */}
          <nav className="flex items-center gap-5">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <button
                  key={link.slug}
                  type="button"
                  onClick={() => navigateTo('/shop', { category: link.slug })}
                  className="flex items-center gap-1.5 py-3 text-xs font-semibold text-slate-600 hover:text-[#FF2B74] transition whitespace-nowrap"
                >
                  <Icon className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#FF2B74]" />
                  <span>{link.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sell With Us Right Link */}
        <button
          type="button"
          onClick={() => navigateTo('/sell-with-us')}
          className="flex items-center gap-1.5 py-3 text-xs font-bold text-[#00A5A8] hover:text-[#008F91] transition"
        >
          <Store className="w-4 h-4" />
          <span>Sell With Us</span>
        </button>
      </div>
    </div>
  );
};
