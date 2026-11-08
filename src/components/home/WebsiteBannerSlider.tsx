import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const WebsiteBannerSlider: React.FC = () => {
  const { banners, navigateTo, refreshBanners } = useStore();
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    refreshBanners();
  }, [refreshBanners]);

  // Filter only active banners with valid image URLs
  const activeBanners = (banners || []).filter(
    (b) => b.is_active !== false && b.image_url && b.image_url.trim() !== ''
  );

  // Fallback banners if none loaded
  const displayBanners = activeBanners.length > 0 ? activeBanners : [
    {
      id: 'default-banner-1',
      title: 'Mega Tech & Electronics Sale',
      image_url: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1600&q=80',
      link_url: '/shop'
    },
    {
      id: 'default-banner-2',
      title: 'Special Discounts & Express Delivery',
      image_url: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?auto=format&fit=crop&w=1600&q=80',
      link_url: '/shop?filter=on-sale'
    }
  ];

  // Auto slide every 5 seconds
  useEffect(() => {
    if (displayBanners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayBanners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [displayBanners.length]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + displayBanners.length) % displayBanners.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % displayBanners.length);
  };

  const handleBannerClick = (linkUrl?: string) => {
    if (!linkUrl) return;
    if (linkUrl.startsWith('http://') || linkUrl.startsWith('https://')) {
      window.open(linkUrl, '_blank');
    } else {
      navigateTo(linkUrl);
    }
  };

  if (displayBanners.length === 0) return null;

  const currentBanner = displayBanners[currentIndex] || displayBanners[0];

  return (
    <section className="pt-3 pb-2 sm:py-4 bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        <div
          onClick={() => handleBannerClick(currentBanner.link_url)}
          className={`relative w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm hover:shadow-md border border-slate-200/80 bg-slate-900 group transition-all duration-300 ${
            currentBanner.link_url ? 'cursor-pointer' : ''
          }`}
        >
          {/* Main Slider Image Container */}
          <div className="relative w-full h-[160px] xs:h-[200px] sm:h-[280px] md:h-[340px] lg:h-[400px]">
            <img
              src={currentBanner.image_url}
              alt={currentBanner.title || 'Website Banner'}
              className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.01]"
              onError={(e) => {
                // Fallback image if custom image URL breaks
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1600&q=80';
              }}
            />

            {/* Gradient Overlay for Title Legibility */}
            {currentBanner.title && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-4 sm:p-6 md:p-8">
                <div className="max-w-xl space-y-1 sm:space-y-2">
                  <span className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-[10px] sm:text-xs font-bold px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full shadow-sm uppercase tracking-wider">
                    <Sparkles className="w-3 h-3" />
                    Featured Offer
                  </span>
                  <h2 className="text-base sm:text-2xl md:text-3xl font-extrabold text-white leading-tight drop-shadow-md">
                    {currentBanner.title}
                  </h2>
                </div>
              </div>
            )}
          </div>

          {/* Controls: Next / Prev Arrows (Visible if > 1 banner) */}
          {displayBanners.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous Banner"
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/80 hover:bg-white text-slate-800 flex items-center justify-center shadow-md transition-all duration-200 hover:scale-110 active:scale-95 z-10 backdrop-blur-xs"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
              </button>

              <button
                type="button"
                onClick={handleNext}
                aria-label="Next Banner"
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/80 hover:bg-white text-slate-800 flex items-center justify-center shadow-md transition-all duration-200 hover:scale-110 active:scale-95 z-10 backdrop-blur-xs"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
              </button>

              {/* Pagination Dots */}
              <div className="absolute bottom-2.5 sm:bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 sm:gap-2 z-10 bg-slate-900/40 backdrop-blur-xs px-3 py-1 sm:px-4 sm:py-1.5 rounded-full border border-white/20">
                {displayBanners.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentIndex(idx);
                    }}
                    aria-label={`Go to slide ${idx + 1}`}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      idx === currentIndex ? 'w-6 sm:w-7 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
};
