import React, { useState, useEffect, useRef } from 'react';
import { Zap, ArrowRight } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

// Custom Flash Product Card to match specific em-based requirements
const FlashProductCard: React.FC<{ product: any }> = ({ product }) => {
  const { navigateTo } = useStore();

  return (
    <div
      onClick={() => navigateTo(`/product/${product.slug}`)}
      className="flex-none w-[9.8em] flex flex-col gap-[0.45em] cursor-pointer group snap-start"
      style={{ isolation: 'isolate' }}
    >
      {/* Image Box */}
      <div className="relative aspect-square bg-white rounded-[1.1em] overflow-hidden shadow-[0_0.2em_1em_rgba(0,0,0,0.03)] transition-transform duration-300 active:scale-95">
        <img
          src={product.image}
          alt={product.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        
        {/* Discount Badge */}
        {product.discountPercent && product.discountPercent > 0 && (
          <div className="absolute top-0 left-0 bg-[var(--fs-pink)] text-white text-[0.75em] font-bold px-[0.6em] py-[0.25em] rounded-[1.1em_0_1.1em_0] z-10 shadow-sm">
            -{product.discountPercent}%
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="flex flex-col gap-[0.2em] px-[0.2em]">
        <h3 className="text-[0.9em] font-medium text-[var(--fs-ink)] truncate leading-tight">
          {product.title}
        </h3>
        
        <div className="flex items-baseline gap-[0.4em] flex-wrap">
          <span className="text-[1.4em] font-bold text-[var(--fs-pink)] tabular-nums">
            ৳{product.price.toLocaleString()}
          </span>
          {product.oldPrice && (
            <span className="text-[0.85em] text-[#9ca3af] line-through tabular-nums">
              ৳{product.oldPrice.toLocaleString()}
            </span>
          )}
        </div>

        {/* Progress Bar Section */}
        {product.soldCount !== undefined && (
          <div className="mt-[0.2em] space-y-[0.3em]">
            <div className="h-[0.42em] w-full bg-[var(--fs-track)] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[var(--fs-navy)] rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (product.soldCount / 300) * 100)}%` }}
              />
            </div>
            <p className="text-[0.8em] text-[var(--fs-muted)] font-medium">
              {product.soldCount} items sold
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

  // Real-time countdown timer
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

  if (flashProducts.length === 0) return null;

  return (
    <section 
      className="w-full overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]"
      style={{
        fontSize: 'clamp(13px, 3.9vw, 17px)',
        background: 'linear-gradient(180deg, #e6f5fb, #f4f5f9)',
        paddingTop: '1.4em',
        paddingBottom: '1.8em',
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
      <div 
        ref={scrollerRef}
        className="flex gap-[0.9em] overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory px-[1.2em]"
      >
        {/* Intro Card */}
        <div 
          className="flex-none w-[9.8em] rounded-[1.1em] p-[1.1em_0.95em] flex flex-col gap-[0.55em] snap-start shadow-[0_0.4em_1.5em_rgba(0,0,0,0.03)]"
          style={{ background: 'linear-gradient(135deg, #ffffff, #dff2fa)' }}
        >
          <div className="w-[1.9em] h-[1.9em] text-[#17b2e3] shrink-0">
            <Zap className="w-full h-full fill-current" />
          </div>

          <div className="min-h-0">
            <h2 
              className="text-[2em] font-[800] italic uppercase leading-[0.9] text-[var(--fs-navy)]"
              style={{ textShadow: '0.07em 0.07em 0 #8fd8f2' }}
            >
              FLASH<br />SALE
            </h2>
            <div className="text-[var(--fs-blue-dark)] text-[0.85em] font-bold italic tracking-tight mt-[0.3em] uppercase">
              UPTO 23% OFF
            </div>
            <p className="text-[var(--fs-ink)] text-[0.75em] font-medium mt-[0.2em]">
              Don't miss out
            </p>
          </div>

          {/* Countdown HH:MM:SS */}
          <div className="flex items-center gap-[0.3em] mt-auto">
            <div className="bg-[var(--fs-black)] text-white font-bold text-[0.85em] px-[0.45em] py-[0.3em] rounded-[0.5em] tabular-nums">
              {formatNumber(timeLeft.hours)}
            </div>
            <span className="font-bold text-[var(--fs-pink)] text-[0.8em]">:</span>
            <div className="bg-[var(--fs-black)] text-white font-bold text-[0.85em] px-[0.45em] py-[0.3em] rounded-[0.5em] tabular-nums">
              {formatNumber(timeLeft.minutes)}
            </div>
            <span className="font-bold text-[var(--fs-pink)] text-[0.8em]">:</span>
            <div className="bg-[var(--fs-black)] text-white font-bold text-[0.85em] px-[0.45em] py-[0.3em] rounded-[0.5em] tabular-nums">
              {formatNumber(timeLeft.seconds)}
            </div>
          </div>

          <button
            onClick={() => navigateTo('/shop', { filter: 'flash-sale' })}
            className="w-full bg-[var(--fs-blue)] hover:bg-[var(--fs-blue-dark)] text-white text-[0.85em] font-semibold py-[0.8em] rounded-[0.7em] shadow-md transition-all active:scale-[0.97] flex items-center justify-center gap-[0.3em]"
          >
            <span>View All</span>
            <ArrowRight className="w-[1.2em] h-[1.2em]" />
          </button>
        </div>

        {/* Product Cards */}
        {flashProducts.map((product) => (
          <FlashProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
};

