import React from 'react';
import { Smartphone, Download, QrCode } from 'lucide-react';

export const AppDownloadBanner: React.FC = () => {
  return (
    <section id="app-download" className="py-8 bg-slate-50 border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-gradient-to-r from-[#111827] via-[#1E293B] to-[#0F172A] rounded-3xl p-6 sm:p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
          {/* Left Text */}
          <div className="space-y-3 text-center md:text-left max-w-xl">
            <span className="inline-flex items-center gap-1.5 bg-[#FF2B74]/20 text-[#FF2B74] border border-[#FF2B74]/30 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              <Smartphone className="w-3.5 h-3.5" /> Mobile Experience
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Install Our App for Exclusive Offers &amp; Discounts
            </h3>
            <p className="text-slate-300 text-xs sm:text-sm">
              Scan the QR code or download from app stores. Get <strong className="text-[#FF2B74]">৳250 discount</strong> and free shipping on your first app order!
            </p>
          </div>

          {/* Right Store Badges & QR Code */}
          <div className="flex flex-col sm:flex-row items-center gap-5 shrink-0">
            {/* SVG QR Code */}
            <div className="bg-white p-3 rounded-2xl shadow-md flex flex-col items-center gap-1.5 shrink-0">
              <svg className="w-24 h-24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Clean stylized QR Code */}
                <rect width="100" height="100" fill="white" />
                <rect x="10" y="10" width="28" height="28" rx="4" fill="#0F172A" />
                <rect x="16" y="16" width="16" height="16" rx="2" fill="white" />
                <rect x="20" y="20" width="8" height="8" fill="#0F172A" />
                <rect x="62" y="10" width="28" height="28" rx="4" fill="#0F172A" />
                <rect x="68" y="16" width="16" height="16" rx="2" fill="white" />
                <rect x="72" y="20" width="8" height="8" fill="#0F172A" />
                <rect x="10" y="62" width="28" height="28" rx="4" fill="#0F172A" />
                <rect x="16" y="68" width="16" height="16" rx="2" fill="white" />
                <rect x="20" y="72" width="8" height="8" fill="#0F172A" />
                <rect x="46" y="12" width="8" height="8" rx="2" fill="#FF2B74" />
                <rect x="46" y="28" width="8" height="8" rx="2" fill="#0F172A" />
                <rect x="46" y="46" width="12" height="12" rx="2" fill="#00A5A8" />
                <rect x="65" y="46" width="8" height="8" rx="2" fill="#0F172A" />
                <rect x="80" y="46" width="8" height="8" rx="2" fill="#0F172A" />
                <rect x="46" y="65" width="8" height="12" rx="2" fill="#0F172A" />
                <rect x="62" y="65" width="14" height="8" rx="2" fill="#FF2B74" />
                <rect x="80" y="70" width="8" height="18" rx="2" fill="#0F172A" />
                <rect x="62" y="80" width="12" height="8" rx="2" fill="#0F172A" />
              </svg>
              <span className="text-[10px] font-bold text-slate-700 tracking-tight">Scan to Install</span>
            </div>

            {/* App Store / Google Play Buttons */}
            <div className="flex flex-col gap-2.5">
              <a
                href="#app-download"
                className="bg-black/60 hover:bg-black border border-white/20 text-white px-4 py-2.5 rounded-xl flex items-center gap-3 transition-colors shadow-sm"
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  {/* Apple SVG Logo */}
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.63-.77 1.06-1.85.94-2.93-.91.04-2.02.61-2.67 1.37-.58.67-1.09 1.76-.95 2.81 1.02.08 2.05-.48 2.68-1.25z"/>
                  </svg>
                </div>
                <div className="text-left leading-none">
                  <div className="text-[9px] text-slate-400 uppercase">Download on the</div>
                  <div className="text-xs font-bold text-white">App Store</div>
                </div>
              </a>

              <a
                href="#app-download"
                className="bg-black/60 hover:bg-black border border-white/20 text-white px-4 py-2.5 rounded-xl flex items-center gap-3 transition-colors shadow-sm"
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  {/* Google Play SVG */}
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M3.609 1.814L13.793 12 3.61 22.186c-.367-.384-.61-.926-.61-1.597V3.411c0-.671.243-1.213.61-1.597zM15.207 13.414l2.122 2.121-12.72 7.344 10.598-9.465zm0-2.828L4.609 1.121l12.72 7.344-2.122 2.121zm1.414 1.414l3.182-1.838c1.06-.613 1.06-1.611 0-2.224l-3.182-1.838-2.122 2.121 2.122 2.121 2.122 1.658z"/>
                  </svg>
                </div>
                <div className="text-left leading-none">
                  <div className="text-[9px] text-slate-400 uppercase">GET IT ON</div>
                  <div className="text-xs font-bold text-white">Google Play</div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
