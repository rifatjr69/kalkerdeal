import React, { useState, useEffect, useRef } from 'react';
import { Zap, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { ProductCard } from '../common/ProductCard';
import { useStore } from '../../context/StoreContext';

export const FlashSaleSection: React.FC = () => {
  const { products, navigateTo } = useStore();
  const scrollerRef = useRef<HTMLDivElement>(null);

  // Real-time countdown timer (hours, minutes, seconds)
  const [timeLeft, setTimeLeft] = useState({
    hours: 8,
    minutes: 26,
    seconds: 27
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

  // Auto-scroll logic for "auto slide type" effect
  useEffect(() => {
    if (!scrollerRef.current || flashProducts.length === 0) return;
    
    const autoScrollInterval = setInterval(() => {
      if (scrollerRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollerRef.current;
        const maxScroll = scrollWidth - clientWidth;
        
        if (scrollLeft >= maxScroll - 10) {
          scrollerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          scrollerRef.current.scrollBy({ left: clientWidth > 500 ? 320 : 220, behavior: 'smooth' });
        }
      }
    }, 5000);

    return () => clearInterval(autoScrollInterval);
  }, [flashProducts.length]);

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  const scroll = (direction: 'left' | 'right') => {
    if (scrollerRef.current) {
      const amount = direction === 'left' ? -320 : 320;
      scrollerRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  if (flashProducts.length === 0) return null;

  return (
    <section className="py-5 sm:py-8 bg-slate-50/30">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 items-stretch">
          {/* Flash Sale Banner / Timer Card - Compact on mobile */}
          <div className="w-full lg:w-72 rounded-2xl border border-slate-100 bg-white p-4 sm:p-6 lg:p-7 flex flex-row lg:flex-col items-center lg:items-start justify-between lg:justify-center shadow-[0_2px_12px_rgba(0,0,0,0.03)] shrink-0 gap-4">
            <div className="flex items-center lg:flex-col lg:items-start gap-3 lg:gap-4 flex-1">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-50 text-[#0284C7] flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 sm:w-6 sm:h-6 fill-[#0284C7]" />
              </div>

              <div className="min-w-0">
                <h2 className="text-sm sm:text-xl lg:text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">
                  FLASH SALE
                </h2>
                <div className="hidden sm:inline-block bg-[#0284C7] text-white text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider mb-1.5 lg:mb-2">
                  UPTO 23% OFF
                </div>
                <p className="hidden lg:block text-xs font-semibold text-slate-500">
                  Limited time offer!
                </p>
              </div>

              {/* Countdown Timer Boxes */}
              <div className="lg:pt-2">
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <div className="bg-[#111827] text-white font-mono font-bold text-xs sm:text-base px-1.5 py-1 sm:px-2 sm:py-1.5 rounded-lg tabular-nums">
                    {formatNumber(timeLeft.hours)}
                  </div>
                  <span className="font-extrabold text-slate-900 text-xs">:</span>
                  <div className="bg-[#111827] text-white font-mono font-bold text-xs sm:text-base px-1.5 py-1 sm:px-2 sm:py-1.5 rounded-lg tabular-nums">
                    {formatNumber(timeLeft.minutes)}
                  </div>
                  <span className="font-extrabold text-slate-900 text-xs">:</span>
                  <div className="bg-[#111827] text-white font-mono font-bold text-xs sm:text-base px-1.5 py-1 sm:px-2 sm:py-1.5 rounded-lg tabular-nums">
                    {formatNumber(timeLeft.seconds)}
                  </div>
                </div>
              </div>
            </div>

            <div className="shrink-0 lg:w-full lg:pt-4">
              <button
                type="button"
                onClick={() => navigateTo('/shop', { filter: 'flash-sale' })}
                className="bg-[#0284C7] hover:bg-[#0369A1] text-white font-black text-[10px] sm:text-xs py-2 px-3 sm:py-2.5 sm:px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer"
              >
                <span className="hidden sm:inline">View All</span>
                <span className="sm:hidden">See All</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>

          {/* Flash Sale Product Scroller */}
          <div className="flex-1 relative min-w-0">
            {/* Scroll Navigation Arrows (Hidden on mobile) */}
            <div className="hidden sm:flex absolute -top-10 right-0 items-center gap-2 z-10">
              <button
                type="button"
                onClick={() => scroll('left')}
                className="w-7 h-7 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center transition shadow-2xs"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scroll('right')}
                className="w-7 h-7 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center transition shadow-2xs"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div
              ref={scrollerRef}
              className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar scroll-smooth pb-2"
            >
              {flashProducts.map((product) => (
                <div key={product.id} className="w-[165px] sm:w-[220px] lg:w-[240px] shrink-0">
                  <ProductCard product={product} showSoldProgress={true} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
