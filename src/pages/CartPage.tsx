import React, { useState } from 'react';
import {
  Trash2, Plus, Minus, ArrowRight, ShoppingBag, ShieldCheck,
  Truck, RotateCcw, Tag, CheckCircle2, ChevronRight
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/common/ProductCard';

export const CartPage: React.FC = () => {
  const {
    cart,
    updateQuantity,
    removeFromCart,
    clearCart,
    cartSubtotal,
    cartCount,
    freeShippingThreshold,
    freeShippingProgress,
    isFreeShippingEligible,
    activeVoucher,
    applyVoucher,
    removeVoucher,
    voucherDiscount,
    navigateTo,
    products
  } = useStore();

  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);

  // Delivery estimation: 0 if free, else standard Dhaka ৳60
  const deliveryFee = isFreeShippingEligible ? 0 : 60;
  const grandTotal = Math.max(0, cartSubtotal - voucherDiscount + deliveryFee);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const res = applyVoucher(couponInput);
    if (res.success) {
      setCouponSuccess(res.message);
      setCouponError(null);
      setCouponInput('');
    } else {
      setCouponError(res.message);
      setCouponSuccess(null);
    }
  };

  const handleProceed = () => {
    navigateTo('/checkout');
  };

  const recommendedProducts = products.filter((p) => p.isBestseller).slice(0, 4);

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-6 sm:py-9">
      <div className="max-w-7xl mx-auto px-4">
        {/* Breadcrumb Trail */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-6 flex-wrap">
          <button
            type="button"
            onClick={() => navigateTo('/')}
            className="hover:text-[#00A5A8] font-medium"
          >
            Home
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-900 font-semibold">Shopping Cart</span>
        </nav>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2.5">
            Shopping Cart
            <span className="text-sm font-semibold text-slate-500 bg-slate-200/70 px-2.5 py-0.5 rounded-full">
              {cartCount} {cartCount === 1 ? 'item' : 'items'}
            </span>
          </h1>

          {cart.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="text-xs text-rose-500 hover:text-rose-700 font-semibold flex items-center gap-1 hover:underline"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Cart
            </button>
          )}
        </div>

        {cart.length === 0 ? (
          /* Empty Cart State */
          <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-xs max-w-2xl mx-auto my-8">
            <div className="w-20 h-20 rounded-full bg-pink-50 text-[#FF2B74] flex items-center justify-center mx-auto mb-5">
              <ShoppingBag className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Your cart is empty</h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-6">
              Looks like you haven't added anything to your cart yet. Explore our trending electronics, fashion, groceries, and daily essentials!
            </p>
            <button
              type="button"
              onClick={() => navigateTo('/shop')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#00A5A8] hover:bg-[#008F91] text-white text-sm font-bold shadow-md transition transform active:scale-95"
            >
              Start Shopping
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left 2 Cols: Cart Items List + Shipping Progress */}
            <div className="lg:col-span-2 space-y-4">
              {/* Free Shipping Progress Indicator */}
              <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200/80 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center justify-between text-xs font-bold mb-2">
                  <div className="flex items-center gap-2 text-[#008F91]">
                    <Truck className="w-4 h-4 shrink-0 text-[#00A5A8]" />
                    <span>
                      {isFreeShippingEligible
                        ? '🎉 You unlocked FREE Delivery across Bangladesh!'
                        : `Add ৳${(freeShippingThreshold - cartSubtotal).toLocaleString()} more for FREE Delivery!`}
                    </span>
                  </div>
                  <span className="text-slate-600 font-semibold tabular-nums">
                    {Math.round(freeShippingProgress)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-teal-200/60 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#00A5A8] rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${freeShippingProgress}%` }}
                  />
                </div>
                <p className="text-[11px] text-teal-700 mt-1.5 font-medium">
                  Tip: Buy any 3 items or order over ৳2,000 to get free nationwide shipping!
                </p>
              </div>

              {/* Items Card */}
              <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs divide-y divide-slate-100">
                {cart.map((item) => {
                  const itemTotal = item.product.price * item.quantity;
                  return (
                    <div
                      key={`${item.product.id}-${item.selectedColor || ''}-${item.selectedSize || ''}`}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition hover:bg-slate-50/50"
                    >
                      {/* Product Thumbnail & Details */}
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div
                          onClick={() => navigateTo(`/product/${item.product.slug}`)}
                          className="w-18 h-18 sm:w-20 sm:h-20 rounded-xl bg-slate-100 flex items-center justify-center p-1.5 shrink-0 cursor-pointer overflow-hidden border border-slate-200/60"
                        >
                          <img
                            src={item.product.image}
                            alt={item.product.title}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => navigateTo(`/product/${item.product.slug}`)}
                            className="text-xs sm:text-sm font-bold text-slate-900 hover:text-[#00A5A8] transition text-left line-clamp-2"
                          >
                            {item.product.title}
                          </button>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                            <span>Brand: <strong className="text-slate-700">{item.product.brand}</strong></span>
                            {item.selectedSize && <span>· Size: <strong className="text-slate-700">{item.selectedSize}</strong></span>}
                            {item.selectedColor && <span>· Color: <strong className="text-slate-700">{item.selectedColor}</strong></span>}
                          </div>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-sm font-extrabold text-[#FF2B74]">
                              ৳{item.product.price.toLocaleString()}
                            </span>
                            {item.product.oldPrice && (
                              <span className="text-xs text-slate-400 line-through">
                                ৳{item.product.oldPrice.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Stepper + Total + Remove Action */}
                      <div className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        {/* Quantity Stepper */}
                        <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-10 text-center text-xs font-bold text-slate-900">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Item Subtotal */}
                        <div className="text-right min-w-[80px]">
                          <span className="text-xs text-slate-400 block sm:hidden">Total</span>
                          <span className="text-sm font-black text-slate-900">
                            ৳{itemTotal.toLocaleString()}
                          </span>
                        </div>

                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.product.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Coupon Form */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-[#00A5A8]" />
                  Have a Coupon or Promo Voucher?
                </h3>
                {activeVoucher ? (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <div>
                        <p className="text-xs font-bold text-emerald-900">
                          Coupon "{activeVoucher.code}" Applied!
                        </p>
                        <p className="text-[11px] text-emerald-700">
                          You saved ৳{voucherDiscount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeVoucher}
                      className="text-xs text-rose-600 font-bold hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Try 'CARTAPP250' or 'SAVE15'"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00A5A8] uppercase tracking-wider"
                    />
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition whitespace-nowrap"
                    >
                      Apply
                    </button>
                  </form>
                )}
                {couponError && (
                  <p className="text-xs text-rose-500 mt-2 font-medium">{couponError}</p>
                )}
                {couponSuccess && (
                  <p className="text-xs text-emerald-600 mt-2 font-medium">{couponSuccess}</p>
                )}
              </div>
            </div>

            {/* Right Column: Order Summary Card */}
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs sticky top-24">
                <h2 className="text-base font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100">
                  Order Summary
                </h2>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal ({cartCount} items)</span>
                    <span className="font-bold text-slate-900">৳{cartSubtotal.toLocaleString()}</span>
                  </div>

                  {voucherDiscount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Voucher Discount</span>
                      <span>-৳{voucherDiscount.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-600">
                    <div className="flex items-center gap-1">
                      <span>Estimated Shipping</span>
                      {isFreeShippingEligible && (
                        <span className="text-[10px] font-bold text-[#00A5A8] bg-teal-50 px-1.5 py-0.5 rounded">
                          FREE
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-slate-900">
                      {isFreeShippingEligible ? '৳0' : `৳${deliveryFee}`}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
                    <span className="text-sm font-bold text-slate-900">Estimated Total</span>
                    <div className="text-right">
                      <span className="text-xl font-black text-[#FF2B74]">
                        ৳{grandTotal.toLocaleString()}
                      </span>
                      <span className="block text-[10px] text-slate-400">Inclusive of VAT</span>
                    </div>
                  </div>
                </div>

                {/* Checkout CTA */}
                <button
                  type="button"
                  onClick={handleProceed}
                  className="w-full mt-6 py-3.5 px-4 rounded-xl bg-[#FF2B74] hover:bg-[#e02464] text-white font-extrabold text-sm shadow-md transition transform active:scale-98 flex items-center justify-center gap-2"
                >
                  Proceed to Checkout
                  <ArrowRight className="w-4 h-4" />
                </button>

                <p className="text-[11px] text-center text-slate-400 mt-3">
                  Cash on Delivery & bKash Instant Payment available
                </p>

                {/* Trust Badges */}
                <div className="mt-6 pt-5 border-t border-slate-100 space-y-2.5">
                  <div className="flex items-center gap-2.5 text-xs text-slate-600">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>100% Authentic Brand Guarantee</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-600">
                    <RotateCcw className="w-4 h-4 text-[#00A5A8] shrink-0" />
                    <span>7 Days Easy Return & Refund</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-600">
                    <Truck className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>Nationwide Express 2–4 Days Delivery</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recommended Products Carousel Below */}
        {recommendedProducts.length > 0 && (
          <div className="mt-14 pt-8 border-t border-slate-200">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                You Might Also Like
              </h3>
              <button
                type="button"
                onClick={() => navigateTo('/shop')}
                className="text-xs font-bold text-[#00A5A8] hover:underline"
              >
                Explore All →
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {recommendedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
