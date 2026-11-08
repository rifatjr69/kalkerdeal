import React from 'react';
import { Home, LayoutGrid, MessageCircle, ShoppingBag, User, ShieldCheck } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const MobileBottomNav: React.FC = () => {
  const {
    currentRoute,
    navigateTo,
    cartCount,
    openCart,
    user,
    isAdmin,
    openAuth,
    setIsMegaMenuOpen,
    siteNumber
  } = useStore();

  const cleanPhone = (siteNumber || '01700000000').replace(/[^0-9]/g, '');
  const waNumber = cleanPhone.startsWith('88') ? cleanPhone : `88${cleanPhone}`;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 py-1.5 px-3 lg:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[max(0.375rem,env(safe-area-inset-bottom))]">
      <div className="grid grid-cols-5 items-center">
        {/* Home */}
        <button
          type="button"
          onClick={() => navigateTo('/')}
          className={`flex flex-col items-center gap-1 py-1 transition-colors ${
            currentRoute === '/' ? 'text-[#FF2B74]' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-bold">Home</span>
        </button>

        {/* Categories */}
        <button
          type="button"
          onClick={() => {
            navigateTo('/shop');
            setIsMegaMenuOpen(true);
          }}
          className={`flex flex-col items-center gap-1 py-1 transition-colors ${
            currentRoute.includes('category') || currentRoute === '/shop'
              ? 'text-[#FF2B74]'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <LayoutGrid className="w-5 h-5" />
          <span className="text-[10px] font-bold">Categories</span>
        </button>

        {/* WhatsApp Message */}
        <a
          href={`https://wa.me/${waNumber}`}
          target="_blank"
          rel="noreferrer"
          className="flex flex-col items-center gap-1 py-1 text-emerald-600 hover:text-emerald-700 transition-colors"
        >
          <MessageCircle className="w-5 h-5 fill-emerald-100" />
          <span className="text-[10px] font-bold">Message</span>
        </a>

        {/* Cart */}
        <button
          type="button"
          onClick={openCart}
          className="relative flex flex-col items-center gap-1 py-1 text-slate-500 hover:text-slate-800 transition-colors"
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-2 min-w-4 h-4 px-1 rounded-full bg-[#FF2B74] text-white text-[9px] font-black flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold">Cart</span>
        </button>

        {/* Account / Admin */}
        <button
          type="button"
          onClick={() => {
            if (isAdmin) {
              navigateTo('/admin');
            } else if (user) {
              navigateTo('/track-order');
            } else {
              openAuth('signin');
            }
          }}
          className={`flex flex-col items-center gap-1 py-1 transition-colors ${
            isAdmin
              ? 'text-purple-700'
              : user
              ? 'text-[#00A5A8]'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {isAdmin ? (
            <div className="relative">
              <ShieldCheck className="w-5 h-5" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-purple-600 ring-1 ring-white" />
            </div>
          ) : (
            <User className="w-5 h-5" />
          )}
          <span className="text-[10px] font-bold">
            {isAdmin ? 'Admin' : user ? 'Account' : 'Sign In'}
          </span>
        </button>
      </div>
    </div>
  );
};
