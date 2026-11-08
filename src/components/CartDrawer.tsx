import React, { useEffect, useState } from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, Tag, Truck, Minus, Plus, Check } from 'lucide-react';
import { CartItem, DeliveryZone, Coupon } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (productId: string, delta: number, variant?: string) => void;
  onRemoveItem: (productId: string, variant?: string) => void;
  deliveryZones: DeliveryZone[];
  selectedZone: DeliveryZone;
  setSelectedZone: (zone: DeliveryZone) => void;
  onProceedToCheckout: (discountAmount: number, couponCode: string) => void;
  coupons: Coupon[];
}

/* Innexbuy brand tokens (logo থেকে নেওয়া) */
const BRAND = '#FF0560';
const BRAND_DARK = '#D6004F';
const BRAND_TINT = '#FFF1F6';

const DRAWER_CSS = `
  .ib-noscroll { scrollbar-width: none; -ms-overflow-style: none; }
  .ib-noscroll::-webkit-scrollbar { display: none; }
  @keyframes ib-slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
  @keyframes ib-fade-in { from { opacity: 0; } to { opacity: 1; } }
  .ib-panel { animation: ib-slide-in .28s cubic-bezier(.22,1,.36,1) both; }
  .ib-overlay { animation: ib-fade-in .2s ease-out both; }
  @media (prefers-reduced-motion: reduce) {
    .ib-panel, .ib-overlay { animation: none; }
  }
`;

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  deliveryZones,
  selectedZone,
  setSelectedZone,
  onProceedToCheckout,
  coupons
}) => {
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState('');

  // Drawer খোলা থাকলে পেছনের পেজ স্ক্রল বন্ধ + Esc দিয়ে বন্ধ
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  // সাবটোটাল কমে গিয়ে min_order এর নিচে গেলে কুপন আর কাজ করবে না
  const couponStillValid = !!appliedCoupon && subtotal >= appliedCoupon.min_order;
  const activeCoupon = couponStillValid ? appliedCoupon : null;

  let discountAmount = 0;
  if (activeCoupon) {
    discountAmount =
      activeCoupon.type === 'percent'
        ? (subtotal * activeCoupon.value) / 100
        : activeCoupon.value;
    discountAmount = Math.min(Math.round(discountAmount), subtotal);
  }

  const deliveryCharge = selectedZone ? selectedZone.charge : 60;
  const total = Math.max(0, subtotal - discountAmount) + deliveryCharge;
  const activeZones = (deliveryZones || []).filter(z => z.is_active !== false);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    const code = couponCodeInput.trim().toUpperCase();
    if (!code) return;
    const found = coupons.find(c => c.code.toUpperCase() === code);
    if (!found) {
      setCouponError('কুপন কোডটি সঠিক নয়।');
      return;
    }
    if (subtotal < found.min_order) {
      setCouponError(`এই কুপনের জন্য ন্যূনতম ৳${found.min_order.toLocaleString()} অর্ডার করতে হবে।`);
      return;
    }
    setAppliedCoupon(found);
    setCouponCodeInput('');
  };

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="শপিং কার্ট">
      <style>{DRAWER_CSS}</style>

      {/* Overlay */}
      <div
        className="ib-overlay absolute inset-0 bg-black/55 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Panel: মোবাইলে full width, বড় স্ক্রিনে 440px */}
      <aside className="ib-panel absolute inset-y-0 right-0 flex h-[100dvh] w-full flex-col bg-white shadow-2xl sm:max-w-[440px]">
        {/* Brand accent line */}
        <div className="h-1 w-full shrink-0" style={{ background: BRAND }} />

        {/* Header */}
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-100 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
              style={{ background: BRAND }}
            >
              <ShoppingBag className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-base font-extrabold leading-tight text-gray-900 sm:text-lg">
                আপনার শপিং কার্ট
              </h2>
              <p className="text-xs font-medium text-gray-500">
                {itemCount > 0 ? `${itemCount} টি পণ্য` : 'কোনো পণ্য নেই'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition hover:bg-gray-900 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF0560]"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* Scrollable body (scrollbar hidden) */}
        <div className="ib-noscroll flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6">
          {cart.length === 0 ? (
            <div className="flex h-full min-h-[320px] flex-col items-center justify-center text-center">
              <div
                className="mb-5 flex h-24 w-24 items-center justify-center rounded-full"
                style={{ background: BRAND_TINT, color: BRAND }}
              >
                <ShoppingBag className="h-10 w-10" strokeWidth={1.75} />
              </div>
              <h3 className="text-base font-extrabold text-gray-900">আপনার কার্টটি খালি আছে</h3>
              <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-gray-500">
                পছন্দের স্মার্টওয়াচ বা ইয়ারবাড কার্টে যোগ করুন, তারপর এখান থেকেই অর্ডার করুন।
              </p>
              <button
                onClick={onClose}
                className="mt-6 rounded-xl px-7 py-3 text-sm font-bold text-white shadow-lg transition hover:brightness-95 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ background: BRAND, boxShadow: `0 10px 24px -8px ${BRAND}99` }}
              >
                শপিং শুরু করুন
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Items */}
              <ul className="space-y-3">
                {cart.map((item, idx) => (
                  <li
                    key={`${item.product.id}-${item.selectedVariant || idx}`}
                    className="flex gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:gap-4"
                  >
                    <img
                      src={item.product.image_url}
                      alt={item.product.name}
                      className="h-20 w-20 shrink-0 rounded-xl border border-gray-100 bg-gray-50 object-cover sm:h-24 sm:w-24"
                    />

                    <div className="flex min-w-0 flex-1 flex-col justify-between">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="line-clamp-2 text-sm font-bold leading-snug text-gray-900">
                            {item.product.name}
                          </h4>
                          {item.selectedVariant && (
                            <span
                              className="mt-1 inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold"
                              style={{ background: BRAND_TINT, color: BRAND_DARK }}
                            >
                              {item.selectedVariant}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => onRemoveItem(item.product.id, item.selectedVariant)}
                          aria-label="রিমুভ করুন"
                          title="রিমুভ"
                          className="-mr-1 -mt-1 shrink-0 rounded-lg p-1.5 text-gray-400 transition hover:bg-rose-50 hover:text-[#FF0560]"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-2 flex items-center justify-between gap-2">
                        <div className="flex items-center rounded-full bg-gray-100 p-0.5">
                          <button
                            onClick={() => onUpdateQuantity(item.product.id, -1, item.selectedVariant)}
                            aria-label="কমান"
                            className="flex h-7 w-7 items-center justify-center rounded-full text-gray-700 transition hover:bg-white hover:shadow-sm"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="min-w-[28px] text-center text-sm font-bold text-gray-900">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.product.id, 1, item.selectedVariant)}
                            aria-label="বাড়ান"
                            className="flex h-7 w-7 items-center justify-center rounded-full text-gray-700 transition hover:bg-white hover:shadow-sm"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="text-right">
                          <p className="text-sm font-black" style={{ color: BRAND }}>
                            ৳{(item.product.price * item.quantity).toLocaleString()}
                          </p>
                          {item.quantity > 1 && (
                            <p className="text-[11px] text-gray-400">
                              ৳{item.product.price.toLocaleString()} / পিস
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Delivery Zone */}
              <section className="space-y-2.5">
                <h3 className="flex items-center gap-1.5 text-sm font-extrabold text-gray-900">
                  <Truck className="h-4 w-4" style={{ color: BRAND }} />
                  ডেলিভারি এলাকা
                </h3>
                {activeZones.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2 min-[380px]:grid-cols-2">
                    {activeZones.map(zone => {
                      const isSelected = selectedZone?.id === zone.id;
                      return (
                        <button
                          key={zone.id}
                          type="button"
                          onClick={() => setSelectedZone(zone)}
                          aria-pressed={isSelected}
                          className={`rounded-xl border p-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF0560] ${
                            isSelected
                              ? 'border-[#FF0560] bg-[#FFF1F6]'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate text-sm font-bold text-gray-900">{zone.name_bn}</span>
                            <span
                              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                                isSelected ? 'border-[#FF0560] bg-[#FF0560]' : 'border-gray-300 bg-white'
                              }`}
                            >
                              {isSelected && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3.5} />}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center justify-between text-xs">
                            <span className="text-gray-500">{zone.estimated_days}</span>
                            <span className="font-extrabold" style={{ color: isSelected ? BRAND : '#111827' }}>
                              ৳{zone.charge}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-800">
                    এই মুহূর্তে কোনো ডেলিভারি অপশন চালু নেই।
                  </div>
                )}
              </section>

              {/* Coupon */}
              <section className="space-y-2.5">
                <h3 className="flex items-center gap-1.5 text-sm font-extrabold text-gray-900">
                  <Tag className="h-4 w-4" style={{ color: BRAND }} />
                  কুপন কোড
                </h3>

                {activeCoupon ? (
                  <div
                    className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5"
                    style={{ background: BRAND_TINT, borderColor: `${BRAND}33` }}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white"
                        style={{ background: BRAND }}
                      >
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-extrabold text-gray-900">{activeCoupon.code}</p>
                        <p className="text-xs font-semibold" style={{ color: BRAND_DARK }}>
                          ৳{discountAmount.toLocaleString()} ছাড় পাচ্ছেন
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setAppliedCoupon(null)}
                      className="shrink-0 text-xs font-bold text-gray-600 underline underline-offset-2 hover:text-gray-900"
                    >
                      বাদ দিন
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="কুপন কোড লিখুন"
                      value={couponCodeInput}
                      onChange={e => {
                        setCouponCodeInput(e.target.value);
                        if (couponError) setCouponError('');
                      }}
                      className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm uppercase placeholder:normal-case placeholder:text-gray-400 focus:border-[#FF0560] focus:outline-none focus:ring-2 focus:ring-[#FF0560]/20"
                    />
                    <button
                      type="submit"
                      className="shrink-0 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-black active:scale-95"
                    >
                      প্রয়োগ
                    </button>
                  </form>
                )}

                {couponError && (
                  <p className="text-xs font-semibold" style={{ color: BRAND_DARK }}>
                    {couponError}
                  </p>
                )}
                {appliedCoupon && !couponStillValid && (
                  <p className="text-xs font-semibold text-amber-700">
                    {appliedCoupon.code} কুপনের জন্য ন্যূনতম ৳{appliedCoupon.min_order.toLocaleString()} অর্ডার দরকার।
                  </p>
                )}
              </section>
            </div>
          )}
        </div>

        {/* Sticky footer: শুধু হিসাব + বাটন, তাই ছোট স্ক্রিনেও জায়গা থাকে */}
        {cart.length > 0 && (
          <footer className="shrink-0 border-t border-gray-100 bg-white px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.12)] sm:px-6">
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-600">
                <dt>সাবটোটাল</dt>
                <dd className="font-bold text-gray-900">৳{subtotal.toLocaleString()}</dd>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between font-semibold" style={{ color: BRAND_DARK }}>
                  <dt>ডিসকাউন্ট</dt>
                  <dd>-৳{discountAmount.toLocaleString()}</dd>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <dt className="truncate pr-2">
                  ডেলিভারি{selectedZone?.name_bn ? ` (${selectedZone.name_bn})` : ''}
                </dt>
                <dd className="font-bold text-gray-900">৳{deliveryCharge}</dd>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-dashed border-gray-200 pt-3">
                <dt className="text-sm font-extrabold text-gray-900">মোট প্রদেয়</dt>
                <dd className="text-xl font-black sm:text-2xl" style={{ color: BRAND }}>
                  ৳{total.toLocaleString()}
                </dd>
              </div>
            </dl>

            <button
              onClick={() => {
                onProceedToCheckout(discountAmount, activeCoupon?.code || '');
                onClose();
              }}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-bold text-white transition hover:brightness-95 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#FF0560]"
              style={{ background: BRAND, boxShadow: `0 12px 28px -10px ${BRAND}` }}
            >
              <span>অর্ডার কনফার্ম করুন</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </footer>
        )}
      </aside>
    </div>
  );
};