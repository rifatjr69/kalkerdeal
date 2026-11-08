import React from 'react';
import { Zap, Phone, HelpCircle, Package, Store } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const UtilityBar: React.FC = () => {
  const { navigateTo, siteNumber } = useStore();

  const cleanPhone = (siteNumber || '01700-000000').replace(/[^0-9]/g, '');

  return (
    <div className="bg-[#111827] text-slate-300 text-[11px] sm:text-xs py-2 px-4 border-b border-slate-800 hidden md:block">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left Announcement */}
        <div className="flex items-center gap-1.5 text-slate-300">
          <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          <span>Save more on our app — exclusive offers every day</span>
        </div>

        {/* Right Links */}
        <div className="flex items-center gap-6 font-medium">
          <button
            onClick={() => navigateTo('/help-center')}
            className="hover:text-white transition flex items-center gap-1"
          >
            <HelpCircle className="w-3 h-3 text-slate-400" />
            <span>Help Center</span>
          </button>

          <button
            onClick={() => navigateTo('/track-order')}
            className="hover:text-white transition flex items-center gap-1"
          >
            <Package className="w-3 h-3 text-slate-400" />
            <span>Track Order</span>
          </button>

          <button
            onClick={() => navigateTo('/sell-with-us')}
            className="hover:text-white transition flex items-center gap-1 text-[#00A5A8]"
          >
            <Store className="w-3 h-3 text-[#00A5A8]" />
            <span className="font-bold">Sell With Us</span>
          </button>

          <a
            href={`tel:${cleanPhone}`}
            className="hover:text-white transition flex items-center gap-1 text-slate-200 font-semibold"
          >
            <Phone className="w-3 h-3 text-slate-400" />
            <span>{siteNumber || '01700-000000'}</span>
          </a>
        </div>
      </div>
    </div>
  );
};
