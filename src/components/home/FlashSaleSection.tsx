import React, { useState, useEffect, useRef } from 'react';
import { Zap, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

// Custom Flash Product Card to match specific requirements
const FlashProductCard: React.FC<{ 
  product: any;
  onCardClick: () => void;
}> = ({ product, onCardClick }) => {
  return (
    <div
      onClick={onCardClick}
      className="flex-none w-[8.2em] sm:w-[11.5em] flex flex-col gap-[0.3em] cursor-pointer group snap-start shrink-0 select-none"
      style={{ isolation: 'isolate' }}
    >
      {/* Image Box */}
      <div className="relative aspect-square bg-white rounded-[1em] overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-white/50 transition-all duration-300 active:scale-95 group-hover:shadow-[0_4px_15px_rgba(0,0,0,0.05)]">
        <img
          src={product.image}
          alt={product.title}
          draggable={false}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 pointer-events-none"
          loading="lazy"
        />
        
        {/* Discount Badge */}
        {product.discountPercent && product.discountPercent > 0 && (
          <div className="absolute top-0 left-0 bg-[var(--fs-pink)] text-white text-[0.65em] sm:text-[0.8em] font-black px-[0.6em] py-[0.25em] rounded-[0_0_0.7em_0] z-10 shadow-sm uppercase tracking-tighter">
            -{product.discountPercent}%
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="flex flex-col gap-[0.05em] px-[0.1em]">
        <h3 className="text-[0.8em] sm:text-[1em] font-semibold text-[var(--fs-ink)] truncate leading-tight group-hover:text-[var(--fs-pink)] transition-colors">
          {product.title}
        </h3>
        
        <div className="flex items-center gap-[0.3em] flex-wrap">
          <span className="text-[1.2em] sm:text-[1.5em] font-extrabold text-[var(--fs-pink)] tabular-nums tracking-tight">
            ৳{product.price.toLocaleString()}
          </span>
          {product.oldPrice && (
            <span className="text-[0.75em] sm:text-[0.9em] text-[#9ca3af] line-through tabular-nums opacity-80">
              ৳{product.oldPrice.toLocaleString()}
            </span>
          )}
        </div>

        {/* Progress Bar Section */}
        {product.soldCount !== undefined && (
          <div className="mt-[0.1em]">
            <div className="h-[0.38em] w-full bg-[var(--fs-track)] rounded-full overflow-hidden mb-[0.2em]">
              <div 
                className="h-full bg-[var(--fs-navy)] rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${Math.min(100, (product.soldCount / 300) * 100)}%` }}
              />
            </div>
            <p className="text-[0.7em] sm:text-[0.85em] text-[var(--fs-muted)] font-bold opacity-90">
              {product.soldCount} sold
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export const FlashSaleSection: React.FC = () => {
  const { products, navigateTo } = useStore();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Mouse drag-to-slide tracker (only active for mouse pointer, not touch)
  const isMouseDown = useRef(false);
  const mouseStartX = useRef(0);
  const scrollStartPos = useRef(0);
  const dragDistance = useRef(0);

  const [timeLeft, setTimeLeft] = useState({
    hours: 10,
    minutes: 46,
    seconds: 9
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 12, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const flashProducts = products.filter((p) => p.isFlashSale);
  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  const checkScrollability = () => {
    if (scrollerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollerRef.current;
      setCanScrollLeft(scrollLeft > 8);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 8);
    }
  };

  useEffect(() => {
    checkScrollability();
    const scroller = scrollerRef.current;
    if (scroller) {
      scroller.addEventListener('scroll', checkScrollability, { passive: true });
      window.addEventListener('resize', checkScrollability);
      return () => {
        scroller.removeEventListener('scroll', checkScrollability);
        window.removeEventListener('resize', checkScrollability);
      };
    }
  }, [flashProducts]);

  const slide = (direction: 'left' | 'right') => {
    if (scrollerRef.current) {
      const cardWidth = window.innerWidth < 640 ? 150 : 220;
      const amount = direction === 'left' ? -cardWidth * 2 : cardWidth * 2;
      scrollerRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  // Mouse Drag handlers - ONLY for actual mouse events, leaving touch events untouched for native smooth swiping
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0 || !scrollerRef.current) return;
    isMouseDown.current = true;
    dragDistance.current = 0;
    mouseStartX.current = e.clientX;
    scrollStartPos.current = scrollerRef.current.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDown.current || !scrollerRef.current) return;
    const delta = e.clientX - mouseStartX.current;
    dragDistance.current = Math.abs(delta);
    if (dragDistance.current > 4) {
      scrollerRef.current.scrollLeft = scrollStartPos.current - delta;
    }
  };

  const handleMouseUp = () => {
    isMouseDown.current = false;
  };

  const handleProductClick = (slug: string) => {
    // Only navigate if user didn't drag with mouse
    if (dragDistance.current > 6) {
      dragDistance.current = 0;
      return;
    }
    navigateTo(`/product/${slug}`);
  };

  if (flashProducts.length === 0) return null;

  return (
    <section 
      className="relative w-full overflow-hidden font-['Plus_Jakarta_Sans',sans-serif] group/section"
      style={{
        fontSize: 'clamp(11px, 3.6vw, 16px)',
        background: 'linear-gradient(180deg, #e6f5fb, #f4f5f9)',
        paddingTop: '1em',
        paddingBottom: '1.2em',
        '--fs-bg-1': '#e6f5fb',
        '--fs-bg-2': '#f4f5f9',
        '--fs-navy': '#0b1f4d',
        '--fs-blue': '#17b2e3',
        '--fs-blue-dark': '#1593c9',
        '--fs-pink': '#d6175f',
        '--fs-ink': '#1a1a2e',
        '--fs-muted': '#6b7280',
        '--fs-track': '#e5e7eb',
        '--fs-black': '#0a0a0a'
      } as React.CSSProperties}
    >
      {/* Left Slider Arrow (visible when scrolled right) */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => slide('left')}
          aria-label="Previous flash sale products"
          className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white/95 text-slate-800 shadow-lg border border-slate-200 flex items-center justify-center hover:bg-white hover:scale-105 active:scale-90 transition-all cursor-pointer backdrop-blur-xs"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />
        </button>
      )}

      {/* Right Slider Arrow */}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => slide('right')}
          aria-label="Next flash sale products"
          className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white/95 text-slate-800 shadow-lg border border-slate-200 flex items-center justify-center hover:bg-white hover:scale-105 active:scale-90 transition-all cursor-pointer backdrop-blur-xs"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />
        </button>
      )}

      {/* Horizontal Scroll / Slide Container */}
      <div 
        ref={scrollerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="flex flex-nowrap gap-[0.7em] sm:gap-[1.2em] overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory px-[1em] py-[0.2em] cursor-grab active:cursor-grabbing"
        style={{
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-x pan-y',
          overscrollBehaviorX: 'contain',
        }}
      >
        {/* Intro Card */}
        <div 
          className="flex-none w-[8em] sm:w-[11.5em] rounded-[1em] p-[1em_0.8em] flex flex-col gap-[0.4em] snap-start shadow-[0_0.2em_1em_rgba(0,0,0,0.03)] shrink-0 select-none"
          style={{ background: 'linear-gradient(135deg, #ffffff, #dff2fa)' }}
        >
          <div className="w-[1.6em] h-[1.6em] text-[#17b2e3] shrink-0">
            <Zap className="w-full h-full fill-current" />
          </div>

          <div className="min-h-0">
            <h2 
              className="text-[1.6em] sm:text-[2.2em] font-[900] italic uppercase leading-[0.85] text-[var(--fs-navy)] tracking-tighter"
              style={{ textShadow: '0.05em 0.05em 0 #8fd8f2' }}
            >
              FLASH<br />SALE
            </h2>
            <div className="text-[var(--fs-blue-dark)] text-[0.8em] sm:text-[1em] font-black italic tracking-tight mt-[0.25em] uppercase">
              UPTO 23% OFF
            </div>
          </div>

          {/* Countdown HH:MM:SS */}
          <div className="flex items-center gap-[0.2em] mt-auto">
            <div className="bg-[var(--fs-black)] text-white font-black text-[0.8em] sm:text-[1em] px-[0.4em] py-[0.25em] rounded-[0.4em] tabular-nums shadow-sm">
              {formatNumber(timeLeft.hours)}
            </div>
            <span className="font-black text-[var(--fs-pink)] text-[0.75em] animate-pulse">:</span>
            <div className="bg-[var(--fs-black)] text-white font-black text-[0.8em] sm:text-[1em] px-[0.4em] py-[0.25em] rounded-[0.4em] tabular-nums shadow-sm">
              {formatNumber(timeLeft.minutes)}
            </div>
            <span className="font-black text-[var(--fs-pink)] text-[0.75em] animate-pulse">:</span>
            <div className="bg-[var(--fs-black)] text-white font-black text-[0.8em] sm:text-[1em] px-[0.4em] py-[0.25em] rounded-[0.4em] tabular-nums shadow-sm">
              {formatNumber(timeLeft.seconds)}
            </div>
          </div>

          <button
            onClick={() => navigateTo('/shop', { filter: 'flash-sale' })}
            className="w-full bg-[var(--fs-blue)] hover:bg-[var(--fs-blue-dark)] text-white text-[0.75em] sm:text-[0.95em] font-black py-[0.7em] rounded-[0.7em] shadow-lg shadow-blue-500/20 transition-all active:scale-[0.96] flex items-center justify-center gap-[0.2em] cursor-pointer"
          >
            <span>View All</span>
            <ArrowRight className="w-[1.1em] h-[1.1em]" />
          </button>
        </div>

        {/* Product Cards */}
        {flashProducts.map((product) => (
          <FlashProductCard 
            key={product.id} 
            product={product} 
            onCardClick={() => handleProductClick(product.slug)}
          />
        ))}
      </div>
    </section>
  );
};



