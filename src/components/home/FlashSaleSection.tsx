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

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  const flashProducts = products.filter((p) => p.isFlashSale);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollerRef.current) {
      const amount = direction === 'left' ? -320 : 320;
      scrollerRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-6 sm:py-8 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 items-stretch">
          {/* Flash Sale Banner / Timer Card matching Screenshot 1 & 3 */}
          <div className="w-full lg:w-72 rounded-2xl border border-slate-100 bg-white p-6 sm:p-7 flex flex-col justify-between shadow-[0_2px_12px_rgba(0,0,0,0.03)] shrink-0">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center">
                <Zap className="w-6 h-6 fill-[#0284C7]" />
              </div>

              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1.5">
                  FLASH SALE
                </h2>
                <div className="inline-block bg-[#0284C7] text-white text-[11px] font-black px-2.5 py-0.5 rounded uppercase tracking-wider mb-2">
                  UPTO 23% OFF
                </div>
                <p className="text-xs font-semibold text-slate-500">
                  Don&apos;t miss out
                </p>
              </div>

              {/* Countdown Timer Boxes: HH : MM : SS */}
              <div className="pt-2">
                <div className="flex items-center gap-1.5">
                  <div className="bg-[#111827] text-white font-mono font-bold text-base sm:text-lg px-2.5 py-1.5 rounded-lg tabular-nums">
                    {formatNumber(timeLeft.hours)}
                  </div>
                  <span className="font-extrabold text-slate-900">:</span>
                  <div className="bg-[#111827] text-white font-mono font-bold text-base sm:text-lg px-2.5 py-1.5 rounded-lg tabular-nums">
                    {formatNumber(timeLeft.minutes)}
                  </div>
                  <span className="font-extrabold text-slate-900">:</span>
                  <div className="bg-[#111827] text-white font-mono font-bold text-base sm:text-lg px-2.5 py-1.5 rounded-lg tabular-nums">
                    {formatNumber(timeLeft.seconds)}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <button
                type="button"
                onClick={() => navigateTo('/shop', { filter: 'flash-sale' })}
                className="w-full bg-[#0284C7] hover:bg-[#0369A1] text-white font-extrabold text-xs sm:text-sm py-2.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>View All</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Flash Sale Product Scroller */}
          <div className="flex-1 relative min-w-0">
            {/* Scroll Navigation Arrows */}
            <div className="hidden sm:flex absolute -top-10 right-0 items-center gap-2 z-10">
              <button
                type="button"
                onClick={() => scroll('left')}
                aria-label="Previous"
                className="w-7 h-7 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center transition shadow-2xs"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scroll('right')}
                aria-label="Next"
                className="w-7 h-7 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center transition shadow-2xs"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div
              ref={scrollerRef}
              className="grid grid-flow-col auto-cols-[210px] sm:auto-cols-[230px] lg:auto-cols-[240px] gap-4 overflow-x-auto no-scrollbar scroll-smooth pb-2"
            >
              {flashProducts.map((product) => (
                <ProductCard key={product.id} product={product} showSoldProgress={true} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
