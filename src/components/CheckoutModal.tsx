import React, { useEffect, useState } from 'react';
import {
  X,
  ShieldCheck,
  Check,
  Truck,
  Phone,
  User,
  MapPin,
  Loader2,
  StickyNote,
  Banknote,
  ShoppingBag
} from 'lucide-react';
import { CartItem, DeliveryZone, Order } from '../types';
import { supabase } from '../lib/supabase';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  deliveryZone: DeliveryZone;
  deliveryZones?: DeliveryZone[];
  setSelectedZone?: (zone: DeliveryZone) => void;
  discountAmount: number;
  couponCode: string;
  onOrderSuccess: (order: Order) => void;
}

/* Innexbuy brand tokens (logo থেকে নেওয়া) */
const BRAND = '#FD0160';
const BRAND_DARK = '#DC015B';
const BRAND_TINT = '#FFF0F5';

const MODAL_CSS = `
  .ib-noscroll { scrollbar-width: none; -ms-overflow-style: none; }
  .ib-noscroll::-webkit-scrollbar { display: none; }
  @keyframes ib-fade-in { from { opacity: 0; } to { opacity: 1; } }
  @keyframes ib-sheet-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
  @keyframes ib-pop-in { from { opacity: 0; transform: scale(.96) translateY(8px); } to { opacity: 1; transform: none; } }
  .ib-overlay { animation: ib-fade-in .2s ease-out both; }
  .ib-sheet { animation: ib-sheet-up .3s cubic-bezier(.22,1,.36,1) both; }
  @media (min-width: 640px) {
    .ib-sheet { animation: ib-pop-in .22s cubic-bezier(.22,1,.36,1) both; }
  }
  @media (prefers-reduced-motion: reduce) {
    .ib-overlay, .ib-sheet { animation: none; }
  }
`;

const inputBase =
  'w-full rounded-xl border bg-white px-3.5 py-3 text-[16px] sm:text-sm font-medium text-gray-900 placeholder:text-gray-400 transition focus:outline-none focus:ring-2';
const inputOk = 'border-gray-200 focus:border-[#FD0160] focus:ring-[#FD0160]/20';
const inputErr = 'border-[#FD0160] bg-[#FFF8FA] focus:ring-[#FD0160]/25';

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cart,
  deliveryZone,
  deliveryZones = [],
  setSelectedZone,
  discountAmount,
  couponCode,
  onOrderSuccess
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [paymentMethod] = useState('COD');
  const [loading, setLoading] = useState(false);
  const [successOrder, setSuccessOrder] = useState<Order | null>(null);
  const [errors, setErrors] = useState<{ name?: string; phone?: string; address?: string }>({});

  useEffect(() => {
    if (isOpen) {
      setSuccessOrder(null);
      setErrors({});
      setLoading(false);
    }
  }, [isOpen]);

  // পেছনের পেজ স্ক্রল বন্ধ + Esc দিয়ে বন্ধ
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose, loading]);

  if (!isOpen) return null;

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const deliveryCharge = deliveryZone ? deliveryZone.charge : 60;
  const total = Math.max(0, subtotal - discountAmount) + deliveryCharge;
  const activeZones = (deliveryZones || []).filter(z => z.is_active !== false);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const validate = () => {
    const next: typeof errors = {};
    if (!name.trim()) next.name = 'আপনার নাম লিখুন।';
    const digits = phone.replace(/\D/g, '');
    if (!phone.trim()) next.phone = 'মোবাইল নম্বর লিখুন।';
    else if (!/^01\d{9}$/.test(digits)) next.phone = '১১ ডিজিটের সঠিক নম্বর দিন (যেমন: 01712345678)।';
    if (!address.trim()) next.address = 'সম্পূর্ণ ঠিকানা লিখুন।';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const buildOrder = (orderNumber: string): Order => ({
    order_number: orderNumber,
    customer_name: name,
    phone,
    address,
    delivery_zone: deliveryZone.name_bn,
    delivery_charge: deliveryCharge,
    subtotal,
    discount: discountAmount,
    total,
    coupon_code: couponCode,
    payment_method: paymentMethod,
    status: 'pending',
    note,
    items: cart.map(item => ({
      product_name: item.product.name,
      variant: item.selectedVariant,
      quantity: item.quantity,
      unit_price: item.product.price,
      total: item.product.price * item.quantity
    }))
  });

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!validate()) return;

    setLoading(true);

    try {
      const orderNumber = 'MB-' + Math.floor(100000 + Math.random() * 900000);
      const newOrder = buildOrder(orderNumber);

      // Try inserting into Supabase if connected
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id || null;

      const { data: insertedOrder, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          user_id: userId,
          customer_name: name,
          phone,
          address,
          delivery_zone: deliveryZone.name_bn,
          delivery_charge: deliveryCharge,
          subtotal,
          discount: discountAmount,
          total,
          coupon_code: couponCode,
          payment_method: paymentMethod,
          status: 'pending',
          note
        })
        .select()
        .single();

      if (!orderError && insertedOrder) {
        // Insert order items
        const isUuid = (val?: string) =>
          !!val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
        const orderItemsPayload = cart.map(item => ({
          order_id: insertedOrder.id,
          product_id: isUuid(item.product.id) ? item.product.id : null,
          product_name: item.product.name,
          variant: item.selectedVariant || null,
          quantity: item.quantity,
          unit_price: item.product.price,
          total: item.product.price * item.quantity
        }));
        await supabase.from('order_items').insert(orderItemsPayload);
      }

      setSuccessOrder(newOrder);
      onOrderSuccess(newOrder);
    } catch (err) {
      console.error('Order submit error:', err);
      // Fallback local success
      const orderNumber = 'MB-' + Math.floor(100000 + Math.random() * 900000);
      const fallbackOrder = buildOrder(orderNumber);
      setSuccessOrder(fallbackOrder);
      onOrderSuccess(fallbackOrder);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="চেকআউট">
      <style>{MODAL_CSS}</style>

      <div
        className="ib-overlay absolute inset-0 bg-black/55 backdrop-blur-[2px]"
        onClick={() => !loading && onClose()}
      />

      {/* মোবাইলে নিচ থেকে উঠে আসা sheet, বড় স্ক্রিনে মাঝখানে modal */}
      <div className="absolute inset-0 flex items-end justify-center sm:items-center sm:p-6 pointer-events-none">
        <div className="ib-sheet pointer-events-auto relative flex max-h-[96dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[90vh] sm:max-w-xl sm:rounded-3xl">
          <div className="h-1 w-full shrink-0" style={{ background: BRAND }} />

          {successOrder ? (
            /* ---------- Success ---------- */
            <div className="ib-noscroll flex-1 overflow-y-auto px-5 py-8 text-center sm:px-8 sm:py-10">
              <div
                className="mx-auto flex h-20 w-20 items-center justify-center rounded-full text-white"
                style={{ background: BRAND, boxShadow: `0 14px 30px -10px ${BRAND}` }}
              >
                <Check className="h-10 w-10" strokeWidth={3} />
              </div>

              <h2 className="mt-6 text-xl font-black text-gray-900 sm:text-2xl">
                অর্ডার সফলভাবে সম্পন্ন হয়েছে!
              </h2>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-gray-500">
                অর্ডার করার জন্য ধন্যবাদ। আমাদের প্রতিনিধি খুব শীঘ্রই আপনার সাথে ফোনে যোগাযোগ করবে।
              </p>

              <dl className="mt-6 space-y-3 rounded-2xl border border-gray-100 bg-gray-50 p-4 text-left text-sm sm:p-5">
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-500">অর্ডার নম্বর</dt>
                  <dd className="font-extrabold" style={{ color: BRAND }}>
                    {successOrder.order_number}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-500">নাম</dt>
                  <dd className="text-right font-bold text-gray-900">{successOrder.customer_name}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-500">মোবাইল</dt>
                  <dd className="font-bold text-gray-900">{successOrder.phone}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="shrink-0 text-gray-500">ঠিকানা</dt>
                  <dd className="line-clamp-2 text-right font-bold text-gray-900">{successOrder.address}</dd>
                </div>
                <div className="flex items-center justify-between gap-4 border-t border-dashed border-gray-300 pt-3">
                  <dt className="font-extrabold text-gray-900">মোট প্রদেয়</dt>
                  <dd className="text-lg font-black" style={{ color: BRAND }}>
                    ৳{successOrder.total.toLocaleString()}
                  </dd>
                </div>
              </dl>

              <button
                onClick={onClose}
                className="mt-6 w-full rounded-2xl px-6 py-3.5 text-sm font-bold text-white transition hover:brightness-95 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#FF0560]"
                style={{ background: BRAND, boxShadow: `0 12px 28px -10px ${BRAND}` }}
              >
                শপিং এ ফিরে যান
              </button>
            </div>
          ) : (
            /* ---------- Checkout form ---------- */
            <form onSubmit={handleSubmitOrder} noValidate className="flex min-h-0 flex-1 flex-col">
              {/* Header */}
              <header className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-100 px-4 py-4 sm:px-7">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
                    style={{ background: BRAND }}
                  >
                    <ShieldCheck className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-extrabold leading-tight text-gray-900 sm:text-lg">
                      চেকআউট ও ডেলিভারি তথ্য
                    </h2>
                    <p className="truncate text-xs text-gray-500">নাম, নম্বর ও ঠিকানা দিয়ে অর্ডার কনফার্ম করুন</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  aria-label="বন্ধ করুন"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition hover:bg-gray-900 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF0560] disabled:opacity-50"
                >
                  <X className="h-5 w-5" />
                </button>
              </header>

              {/* Scrollable fields (scrollbar hidden) */}
              <div className="ib-noscroll flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-5 sm:px-7">
                {/* Name */}
                <div className="space-y-1.5">
                  <label htmlFor="ib-name" className="flex items-center gap-1.5 text-sm font-bold text-gray-800">
                    <User className="h-4 w-4" style={{ color: BRAND }} />
                    আপনার পূর্ণ নাম <span style={{ color: BRAND }}>*</span>
                  </label>
                  <input
                    id="ib-name"
                    type="text"
                    autoComplete="name"
                    placeholder="যেমন: রাশেদ খান"
                    value={name}
                    onChange={e => {
                      setName(e.target.value);
                      if (errors.name) setErrors({ ...errors, name: undefined });
                    }}
                    className={`${inputBase} ${errors.name ? inputErr : inputOk}`}
                  />
                  {errors.name && (
                    <p className="text-xs font-semibold" style={{ color: BRAND_DARK }}>
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label htmlFor="ib-phone" className="flex items-center gap-1.5 text-sm font-bold text-gray-800">
                    <Phone className="h-4 w-4" style={{ color: BRAND }} />
                    মোবাইল নম্বর (১১ ডিজিট) <span style={{ color: BRAND }}>*</span>
                  </label>
                  <input
                    id="ib-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="যেমন: 01712345678"
                    value={phone}
                    onChange={e => {
                      setPhone(e.target.value);
                      if (errors.phone) setErrors({ ...errors, phone: undefined });
                    }}
                    className={`${inputBase} ${errors.phone ? inputErr : inputOk}`}
                  />
                  {errors.phone && (
                    <p className="text-xs font-semibold" style={{ color: BRAND_DARK }}>
                      {errors.phone}
                    </p>
                  )}
                </div>

                {/* Address */}
                <div className="space-y-1.5">
                  <label htmlFor="ib-address" className="flex items-center gap-1.5 text-sm font-bold text-gray-800">
                    <MapPin className="h-4 w-4" style={{ color: BRAND }} />
                    সম্পূর্ণ ঠিকানা <span style={{ color: BRAND }}>*</span>
                  </label>
                  <textarea
                    id="ib-address"
                    rows={3}
                    autoComplete="street-address"
                    placeholder="বাসা/রোড/এলাকা/থানা, যেমন: বাসা ১২, রোড ৪, ধানমন্ডি, ঢাকা"
                    value={address}
                    onChange={e => {
                      setAddress(e.target.value);
                      if (errors.address) setErrors({ ...errors, address: undefined });
                    }}
                    className={`${inputBase} resize-none ${errors.address ? inputErr : inputOk}`}
                  />
                  {errors.address && (
                    <p className="text-xs font-semibold" style={{ color: BRAND_DARK }}>
                      {errors.address}
                    </p>
                  )}
                </div>

                {/* Delivery zone */}
                <div className="space-y-2">
                  <p className="flex items-center gap-1.5 text-sm font-bold text-gray-800">
                    <Truck className="h-4 w-4" style={{ color: BRAND }} />
                    ডেলিভারি অঞ্চল
                  </p>
                  {activeZones.length > 0 ? (
                    <div className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2">
                      {activeZones.map(zone => {
                        const isSelected = deliveryZone?.id === zone.id;
                        return (
                          <button
                            key={zone.id}
                            type="button"
                            onClick={() => setSelectedZone && setSelectedZone(zone)}
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
                    <div
                      className="flex items-center justify-between rounded-xl border px-3.5 py-3 text-sm font-bold text-gray-900"
                      style={{ background: BRAND_TINT, borderColor: `${BRAND}33` }}
                    >
                      <span>{deliveryZone?.name_bn || 'ঢাকার ভিতরে'}</span>
                      <span style={{ color: BRAND }}>৳{deliveryZone?.charge || 60}</span>
                    </div>
                  )}
                </div>

                {/* Note (optional) */}
                <div className="space-y-1.5">
                  <label htmlFor="ib-note" className="flex items-center gap-1.5 text-sm font-bold text-gray-800">
                    <StickyNote className="h-4 w-4" style={{ color: BRAND }} />
                    অর্ডার নোট <span className="text-xs font-medium text-gray-400">(ঐচ্ছিক)</span>
                  </label>
                  <textarea
                    id="ib-note"
                    rows={2}
                    placeholder="কোনো বিশেষ নির্দেশনা থাকলে লিখুন"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    className={`${inputBase} ${inputOk} resize-none`}
                  />
                </div>

                {/* Payment method */}
                <div className="space-y-2">
                  <p className="text-sm font-bold text-gray-800">পেমেন্ট মেথড</p>
                  <div
                    className="flex items-center gap-3 rounded-xl border px-3.5 py-3"
                    style={{ background: BRAND_TINT, borderColor: BRAND }}
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white"
                      style={{ background: BRAND }}
                    >
                      <Banknote className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-extrabold text-gray-900">Cash on Delivery</p>
                      <p className="text-xs text-gray-600">পণ্য হাতে পেয়ে ক্যাশ পরিশোধ করুন</p>
                    </div>
                    <span
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white"
                      style={{ background: BRAND }}
                    >
                      <Check className="h-3 w-3" strokeWidth={3.5} />
                    </span>
                  </div>
                </div>

                {/* Order summary */}
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <p className="mb-3 flex items-center gap-1.5 text-sm font-extrabold text-gray-900">
                    <ShoppingBag className="h-4 w-4" style={{ color: BRAND }} />
                    অর্ডার সারাংশ
                    <span className="text-xs font-medium text-gray-500">({itemCount} টি পণ্য)</span>
                  </p>

                  <ul className="mb-3 space-y-2 border-b border-dashed border-gray-300 pb-3">
                    {cart.map((item, idx) => (
                      <li
                        key={`${item.product.id}-${item.selectedVariant || idx}`}
                        className="flex items-start justify-between gap-3 text-sm"
                      >
                        <span className="min-w-0 text-gray-700">
                          <span className="line-clamp-1 font-semibold text-gray-900">{item.product.name}</span>
                          <span className="text-xs text-gray-500">
                            {item.selectedVariant ? `${item.selectedVariant} · ` : ''}× {item.quantity}
                          </span>
                        </span>
                        <span className="shrink-0 font-bold text-gray-900">
                          ৳{(item.product.price * item.quantity).toLocaleString()}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <dl className="space-y-1.5 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <dt>সাবটোটাল</dt>
                      <dd className="font-bold text-gray-900">৳{subtotal.toLocaleString()}</dd>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between font-semibold" style={{ color: BRAND_DARK }}>
                        <dt>ডিসকাউন্ট{couponCode ? ` (${couponCode})` : ''}</dt>
                        <dd>-৳{discountAmount.toLocaleString()}</dd>
                      </div>
                    )}
                    <div className="flex justify-between text-gray-600">
                      <dt>ডেলিভারি চার্জ</dt>
                      <dd className="font-bold text-gray-900">৳{deliveryCharge}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Sticky footer */}
              <footer className="shrink-0 border-t border-gray-100 bg-white px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.12)] sm:px-7 sm:pt-4 sm:pb-5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-extrabold text-gray-900">সর্বমোট প্রদেয়</span>
                  <span className="text-xl font-black sm:text-2xl" style={{ color: BRAND }}>
                    ৳{total.toLocaleString()}
                  </span>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-bold text-white transition hover:brightness-95 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#FF0560] disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ background: BRAND, boxShadow: `0 12px 28px -10px ${BRAND}` }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> অর্ডার প্রসেসিং হচ্ছে...
                    </>
                  ) : (
                    <span>অর্ডার প্লেস করুন</span>
                  )}
                </button>
              </footer>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};