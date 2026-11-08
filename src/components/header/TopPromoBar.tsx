import React, { useState, useEffect } from 'react';
import { Smartphone, X } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const TopPromoBar: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  const { navigateTo, promoCode, freeShippingThreshold } = useStore();

  if (!isVisible) return null;

  return (
    <div className="bg-[#FF2B74] text-white text-xs py-1.5 px-3 sm:px-4 overflow-hidden">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex-1 min-w-0 text-left flex items-center gap-1.5">
          <Smartphone className="w-3.5 h-3.5 shrink-0 hidden sm:inline" />
          <span className="font-semibold tracking-wide text-[11px] sm:text-xs truncate">
            ৳{freeShippingThreshold ? freeShippingThreshold.toLocaleString() : '2,000'}+ অর্ডারে ফ্রি ডেলিভারি!
          </span>
          {promoCode && (
            <span className="text-white/80 hidden md:inline text-xs shrink-0">
              (কুপন কোড: <strong className="text-yellow-200">{promoCode}</strong>)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={() => navigateTo('/#app-download')}
            className="bg-white text-[#FF2B74] hover:bg-slate-50 text-[10px] sm:text-[11px] font-extrabold px-2.5 sm:px-3 py-0.5 rounded-full shadow-sm transition-transform active:scale-95 shrink-0"
          >
            Get the app
          </button>
          <button
            type="button"
            onClick={() => setIsVisible(false)}
            aria-label="Close promo banner"
            className="text-white/80 hover:text-white transition p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
