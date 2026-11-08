import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { HERO_SLIDES, generateProductSvg } from '../../data/mockProducts';
import { useStore } from '../../context/StoreContext';

export const HeroSection: React.FC = () => {
  const { navigateTo } = useStore();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Autoplay carousel every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
  const prevSlide = () =>
    setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);

  const slide = HERO_SLIDES[currentSlide];

  return (
    <section className="py-4 sm:py-6 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 items-stretch">
          {/* Main Hero Carousel (Left 2 Columns) */}
          <div className="lg:col-span-2 relative rounded-3xl overflow-hidden shadow-sm bg-gradient-to-br from-[#831843] via-[#701A75] to-[#4C1D95] text-white p-6 sm:p-10 flex flex-col justify-between min-h-[340px] sm:min-h-[420px]">
            {/* Slide Content */}
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="max-w-md space-y-3 sm:space-y-4">
                <span className="inline-block bg-[#FDE047] text-slate-900 text-xs sm:text-[13px] font-black px-3.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                  {slide.tag}
                </span>

                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white whitespace-pre-line drop-shadow-sm">
                  {slide.title}
                </h1>

                <p className="text-white/80 text-xs sm:text-base font-medium">
                  {slide.subtitle}
                </p>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => navigateTo(slide.btnLink)}
                    className="inline-flex items-center gap-2 bg-white text-[#FF2B74] hover:bg-slate-100 font-extrabold text-xs sm:text-sm px-6 py-3 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <span>{slide.btnText}</span>
                  </button>
                </div>
              </div>

              {/* Floating Product Circles matching reference */}
              <div className="hidden sm:flex items-center gap-2 lg:gap-3 shrink-0 self-center">
                {slide.previewItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/95 p-3 flex flex-col items-center justify-center shadow-xl border-2 border-white/50 backdrop-blur-xs transition-transform duration-300 hover:scale-110"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-12 h-12 object-contain"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Slider Controls: Indicators & Navigation Arrows */}
            <div className="relative z-10 flex items-center justify-between pt-6 mt-auto">
              {/* Pagination Dots */}
              <div className="flex items-center gap-2">
                {HERO_SLIDES.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentSlide(idx)}
                    aria-label={`Go to slide ${idx + 1}`}
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      idx === currentSlide ? 'w-8 bg-white' : 'w-2.5 bg-white/40 hover:bg-white/70'
                    }`}
                  />
                ))}
              </div>

              {/* Circular Arrow Buttons matching reference */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={prevSlide}
                  aria-label="Previous slide"
                  className="w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center transition shadow-md hover:scale-105 active:scale-95"
                >
                  <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
                </button>
                <button
                  type="button"
                  onClick={nextSlide}
                  aria-label="Next slide"
                  className="w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center transition shadow-md hover:scale-105 active:scale-95"
                >
                  <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>
          </div>

          {/* 2 Stacked Side Banners (Desktop Only) */}
          <div className="hidden lg:flex flex-col gap-4">
            {/* Top Promo Banner: Save 15% with bKash */}
            <div
              onClick={() => navigateTo('/shop', { promo: 'bkash' })}
              className="flex-1 rounded-3xl bg-gradient-to-r from-[#7C3AED] via-[#9333EA] to-[#EC4899] text-white p-6 flex items-center justify-between shadow-sm cursor-pointer hover:shadow-md transition-all group"
            >
              <div className="space-y-2 max-w-[200px]">
                <span className="inline-block bg-[#FDE047] text-slate-900 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  PAY ONLINE
                </span>
                <h3 className="text-xl font-black leading-tight text-white group-hover:text-yellow-200 transition-colors">
                  Save 15% with bKash
                </h3>
                <p className="text-xs text-white/80">
                  On prepaid orders over Tk 999
                </p>
              </div>

              <div className="w-20 h-20 rounded-full bg-white/95 p-3 flex items-center justify-center shadow-lg border border-white/50 group-hover:scale-110 transition-transform">
                <img
                  src={generateProductSvg('powerbank')}
                  alt="bKash promo item"
                  className="w-14 h-14 object-contain"
                />
              </div>
            </div>

            {/* Bottom Promo Banner: Buy any 3 ship free */}
            <div
              onClick={() => navigateTo('/shop', { promo: 'free-delivery' })}
              className="flex-1 rounded-3xl bg-gradient-to-r from-[#0D9488] via-[#059669] to-[#0284C7] text-white p-6 flex items-center justify-between shadow-sm cursor-pointer hover:shadow-md transition-all group"
            >
              <div className="space-y-2 max-w-[200px]">
                <span className="inline-block bg-[#FDE047] text-slate-900 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  FREE DELIVERY
                </span>
                <h3 className="text-xl font-black leading-tight text-white group-hover:text-emerald-200 transition-colors">
                  Buy any 3 ship free
                </h3>
                <p className="text-xs text-white/80">
                  Across Bangladesh, no minimum
                </p>
              </div>

              <div className="w-20 h-20 rounded-full bg-white/95 p-3 flex items-center justify-center shadow-lg border border-white/50 group-hover:scale-110 transition-transform">
                <img
                  src={generateProductSvg('diaper')}
                  alt="Free shipping promo"
                  className="w-14 h-14 object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
