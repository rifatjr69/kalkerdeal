import React from 'react';
import { X, Trash2, ShoppingBag, Plus, Minus, ArrowRight, Truck } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const CartDrawer: React.FC = () => {
  const {
    isCartOpen,
    closeCart,
    cart,
    updateQuantity,
    removeFromCart,
    cartSubtotal,
    freeShippingThreshold,
    isFreeShippingEligible,
    freeShippingProgress,
    navigateTo
  } = useStore();

  if (!isCartOpen) return null;

  const handleCheckoutClick = () => {
    closeCart();
    navigateTo('/checkout');
  };

  const handleViewCartClick = () => {
    closeCart();
    navigateTo('/cart');
  };

  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - cartSubtotal);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#FF2B74]" />
            <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight uppercase">
              Shopping Cart
            </h2>
            <span className="text-xs bg-[#FF2B74] text-white font-bold px-2 py-0.5 rounded-full">
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          </div>

          <button
            type="button"
            onClick={closeCart}
            aria-label="Close cart"
            className="w-8 h-8 rounded-full hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Shipping Progress Bar */}
        <div className="p-3 sm:p-4 bg-[#FFF1F5] border-b border-[#FFE4EC]">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-1.5">
            <Truck className="w-4 h-4 text-[#FF2B74] shrink-0" />
            {isFreeShippingEligible ? (
              <span className="text-emerald-700">
                🎉 Congratulations! You unlocked <strong>FREE Delivery</strong>!
              </span>
            ) : (
              <span>
                Add <strong className="text-[#FF2B74]">৳{remainingForFreeShipping.toLocaleString()}</strong> more or buy 3 items for FREE delivery!
              </span>
            )}
          </div>
          <div className="w-full bg-white rounded-full h-2 overflow-hidden border border-[#FFD1E1]">
            <div
              className={`h-full transition-all duration-300 ${
                isFreeShippingEligible ? 'bg-emerald-500' : 'bg-[#FF2B74]'
              }`}
              style={{ width: `${isFreeShippingEligible ? 100 : freeShippingProgress}%` }}
            />
          </div>
        </div>

        {/* Cart Line Items */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <ShoppingBag className="w-10 h-10 stroke-[1.5]" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-800">Your cart is empty.</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Looks like you haven&apos;t added any items yet.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  closeCart();
                  navigateTo('/shop');
                }}
                className="bg-[#00A5A8] hover:bg-[#008F91] text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md transition"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product.id}
                className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 relative group"
              >
                {/* Product thumbnail */}
                <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0">
                  <img
                    src={item.product.image}
                    alt={item.product.title}
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 pr-6">
                  <h4 className="text-xs font-bold text-slate-800 line-clamp-1 leading-snug">
                    {item.product.title}
                  </h4>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    ৳{item.product.price.toLocaleString()} each
                  </div>

                  {/* Quantity Stepper & Price */}
                  <div className="flex items-center justify-between mt-2.5">
                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-2 py-1 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="text-slate-500 hover:text-slate-800"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold text-slate-800 tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="text-slate-500 hover:text-slate-800"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="text-xs font-black text-[#E11D48] tabular-nums">
                      ৳{(item.product.price * item.quantity).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeFromCart(item.product.id)}
                  aria-label="Remove item"
                  className="absolute top-2 right-2 text-slate-400 hover:text-rose-500 transition p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer & Checkout */}
        {cart.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-slate-100 bg-white space-y-3">
            <div className="flex items-center justify-between text-slate-600 text-xs">
              <span>Subtotal</span>
              <span className="text-base font-black text-slate-900 tabular-nums">
                ৳{cartSubtotal.toLocaleString()}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleViewCartClick}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-3 rounded-xl transition text-center"
              >
                View Cart
              </button>
              <button
                type="button"
                onClick={handleCheckoutClick}
                className="w-full bg-[#FF2B74] hover:bg-[#E11D48] text-white font-extrabold text-xs py-3 rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
              >
                <span>Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
