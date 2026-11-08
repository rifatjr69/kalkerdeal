import React, { useState, useEffect, useRef } from 'react';
import { Zap, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { ProductCard } from '../common/ProductCard';
import { useStore } from '../../context/StoreContext';

export const FlashSaleSection: React.FC = () => {
  const { products, navigateTo } = useStore();
  const scrollerRef = useRef<HTMLDivElement>(null);

  // Real-time countdown timer (hours, minutes, seconds)
  const [timeLeft, setTimeLeft] = useState({
    hours: 10,
    minutes: 7,
    seconds: 52
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        }
        if (prev.minutes > 0) {
          return { ...prev, minutes: 59, seconds: 59 };
        }
        if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 12, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const flashProducts = products.filter((p) => p.isFlashSale);


  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  const scroll = (direction: 'left' | 'right') => {
    if (scrollerRef.current) {
      const amount = direction === 'left' ? -320 : 320;
      scrollerRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  if (flashProducts.length === 0) return null;

  return (
    <section className="py-3 sm:py-6 bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header (Desktop only) */}
        <div className="hidden sm:flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-blue-500 fill-blue-500" />
            <h2 className="text-lg font-black text-[#0F172A] tracking-tight">FLASH SALE</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll('left')}
              className="w-7 h-7 rounded-full border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 transition shadow-sm"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-7 h-7 rounded-full border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 transition shadow-sm"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Horizontal Scrollable Container */}
        <div
          ref={scrollerRef}
          className="flex gap-1 sm:gap-4 overflow-x-auto no-scrollbar scroll-smooth snap-x pb-2 px-1"
        >
          {/* Header Card - First element in the scroll on mobile */}
          <div className="w-[115px] sm:w-[240px] lg:w-[260px] shrink-0 bg-white rounded-2xl border border-slate-100 p-2 sm:p-5 flex flex-col justify-start shadow-[0_4px_20px_rgba(0,0,0,0.03)] snap-start">
            <div className="space-y-1 sm:space-y-3">
              <div className="w-5 h-5 sm:w-10 sm:h-10 rounded-full bg-slate-50 text-[#0EA5E9] flex items-center justify-center">
                <Zap className="w-3 h-3 sm:w-5 sm:h-5 fill-[#0EA5E9]" />
              </div>

              <div>
                <h2 className="text-[12px] sm:text-2xl font-black text-[#1E3A8A] italic tracking-tighter leading-none mb-0.5">
                  FLASH SALE
                </h2>
                <div className="text-[#0EA5E9] text-[7px] sm:text-[13px] font-black italic tracking-tight mb-0.5 sm:mb-2">
                  UPTO 23% OFF
                </div>
                <p className="text-[7px] sm:text-[12px] font-bold text-slate-500">
                  Don't miss out
                </p>
              </div>

              {/* Timer Boxes */}
              <div className="flex items-center gap-0.5 sm:gap-1.5 py-0.5 sm:py-1">
                <div className="bg-[#1A1A1A] text-white font-bold text-[7px] sm:text-[14px] px-1 py-0.5 sm:px-2 sm:py-1.5 rounded-md sm:rounded-lg tabular-nums">
                  {formatNumber(timeLeft.hours)}
                </div>
                <span className="font-black text-[#E11D48] text-[7px] sm:text-sm">:</span>
                <div className="bg-[#1A1A1A] text-white font-bold text-[7px] sm:text-[14px] px-1 py-0.5 sm:px-2 sm:py-1.5 rounded-md sm:rounded-lg tabular-nums">
                  {formatNumber(timeLeft.minutes)}
                </div>
                <span className="font-black text-[#E11D48] text-[7px] sm:text-sm">:</span>
                <div className="bg-[#1A1A1A] text-white font-bold text-[7px] sm:text-[14px] px-1 py-0.5 sm:px-2 sm:py-1.5 rounded-md sm:rounded-lg tabular-nums">
                  {formatNumber(timeLeft.seconds)}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigateTo('/shop', { filter: 'flash-sale' })}
              className="mt-2 sm:mt-6 bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-black text-[8px] sm:text-[14px] py-1 sm:py-3 px-1.5 sm:px-4 rounded-lg sm:rounded-xl shadow-sm transition-all flex items-center justify-center gap-0.5 cursor-pointer w-full"
            >
              <span>View All</span>
              <ArrowRight className="w-2 h-2 sm:w-4 sm:h-4" />
            </button>
          </div>

          {/* Product Cards */}
          {flashProducts.map((product) => (
            <div key={product.id} className="w-[120px] sm:w-[240px] lg:w-[260px] shrink-0 snap-start">
              <ProductCard product={product} showSoldProgress={true} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

