import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Truck, ArrowLeft, CheckCircle2,
  Clock, MapPin, Phone, User as UserIcon, Tag,
  ChevronRight, AlertCircle, ShoppingBag, DollarSign
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Order } from '../types/store';
import { supabase } from '../lib/supabase';

export const CheckoutPage: React.FC = () => {
  const {
    cart,
    cartSubtotal,
    cartCount,
    isFreeShippingEligible,
    activeVoucher,
    voucherDiscount,
    applyVoucher,
    createOrder,
    navigateTo,
    user,
    deliveryZones = [],
    freeShippingThreshold,
    bkashNumber,
    nagadNumber,
    insideDhakaCharge,
    outsideDhakaCharge,
    refreshDeliveryZones,
    refreshSettings
  } = useStore();

  // Fresh data fetch and real-time subscription on Checkout page mount
  useEffect(() => {
    refreshDeliveryZones();
    refreshSettings();

    const channel = supabase
      .channel('checkout-page-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'delivery_zones' }, () => {
        refreshDeliveryZones();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'store_settings' }, () => {
        refreshSettings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshDeliveryZones, refreshSettings]);

  // Find Admin configured charges for Inside Dhaka and Outside Dhaka with strict matching
  const isInsideZone = (z: any) => {
    if (z.district === 'Dhaka') return true;
    const bn = z.name_bn || '';
    const en = (z.name || '').toLowerCase();
    if (bn.includes('ভিতরে')) return true;
    if (bn.includes('ঢাকা') && !bn.includes('বাইরে')) return true;
    if (en.includes('inside')) return true;
    if (en.includes('dhaka') && !en.includes('outside')) return true;
    return false;
  };

  const isOutsideZone = (z: any) => {
    if (z.district === 'Outside Dhaka') return true;
    const bn = z.name_bn || '';
    const en = (z.name || '').toLowerCase();
    if (bn.includes('বাইরে')) return true;
    if (en.includes('outside') || en.includes('suburban')) return true;
    return false;
  };

  const insideZone = deliveryZones.find(isInsideZone) || deliveryZones[0];
  const outsideZone = deliveryZones.find(isOutsideZone) || deliveryZones.find((z) => z.id !== insideZone?.id) || deliveryZones[1];

  const insideCharge = insideZone ? Number(insideZone.charge) || insideDhakaCharge : insideDhakaCharge;
  const insideDays = insideZone?.estimated_days || '১-২ কার্যদিবস';

  const outsideCharge = outsideZone ? Number(outsideZone.charge) || outsideDhakaCharge : outsideDhakaCharge;
  const outsideDays = outsideZone?.estimated_days || '২-৩ কার্যদিবস';

  // Delivery location selection: 'inside' | 'outside' (default: inside Dhaka)
  const [deliveryLocation, setDeliveryLocation] = useState<'inside' | 'outside'>('inside');

  // Customer Form State: simple Name, Phone, and Address
  const [fullName, setFullName] = useState(user?.name || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || '');
  const [streetAddress, setStreetAddress] = useState('');
  const [promoInput, setPromoInput] = useState('');

  // Default Payment is Cash on Delivery (COD)
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bkash' | 'nagad'>('cod');
  const [trxId, setTrxId] = useState('');

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  // Active delivery fee calculation based on Admin panel charges
  const selectedZoneCharge = deliveryLocation === 'inside' ? insideCharge : outsideCharge;
  const deliveryCharge = isFreeShippingEligible ? 0 : selectedZoneCharge;
  const selectedZoneName = deliveryLocation === 'inside' ? 'ঢাকার ভিতরে' : 'ঢাকার বাইরে';
  const selectedZoneDays = deliveryLocation === 'inside' ? insideDays : outsideDays;

  const totalDiscount = voucherDiscount || 0;
  const grandTotal = Math.max(0, cartSubtotal - totalDiscount + deliveryCharge);

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!fullName.trim()) {
      errors.fullName = 'আপনার নাম লিখুন';
    }
    if (!phoneNumber.trim()) {
      errors.phoneNumber = 'মোবাইল নম্বর দেওয়া আবশ্যক';
    } else if (!/^(?:\+8801|01)[3-9]\d{8}$/.test(phoneNumber.replace(/[-\s]/g, ''))) {
      errors.phoneNumber = 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)';
    }
    if (!streetAddress.trim()) {
      errors.streetAddress = 'সম্পূর্ণ ডেলিভারি ঠিকানা লিখুন (বাসা/রোড/এলাকা)';
    }
    if ((paymentMethod === 'bkash' || paymentMethod === 'nagad') && !trxId.trim()) {
      alert('অনলাইন পেমেন্টের জন্য ট্রানজেকশন আইডি (TrxID) দেওয়া আবশ্যক');
      errors.trxId = 'TrxID দিন';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }

    if (cart.length === 0) {
      alert('আপনার কার্টে কোনো প্রোডাক্ট নেই');
      navigateTo('/shop');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const order = createOrder({
        customerName: fullName.trim(),
        phone: phoneNumber.trim(),
        address: paymentMethod !== 'cod' ? `${streetAddress.trim()} [TrxID: ${trxId.trim().toUpperCase()}]` : streetAddress.trim(),
        district: selectedZoneName,
        deliveryMethod: paymentMethod,
        deliveryCharge,
        subtotal: cartSubtotal,
        discount: totalDiscount,
        total: grandTotal,
        couponCode: activeVoucher?.code,
        items: cart.map((item) => ({
          productId: item.product.id,
          title: item.product.title,
          price: item.product.price,
          quantity: item.quantity,
          image: item.product.image,
          variant: item.selectedSize || item.selectedColor
        }))
      });

      setIsSubmitting(false);
      setPlacedOrder(order);
    }, 700);
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-5 sm:py-8">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-4 sm:mb-6">
          <button
            type="button"
            onClick={() => navigateTo('/')}
            className="hover:text-[#00A5A8] font-medium"
          >
            Home
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <button
            type="button"
            onClick={() => navigateTo('/cart')}
            className="hover:text-[#00A5A8] font-medium"
          >
            Cart
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-900 font-bold">Checkout</span>
        </nav>

        {/* Page Title */}
        <div className="mb-5 sm:mb-6">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900">
            Secure Checkout (অর্ডার সম্পন্ন করুন)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            নিচের সহজ ফর্মটি পূরণ করে কনফার্ম বাটনে ক্লিক করলেই আপনার অর্ডার সম্পন্ন হবে
          </p>
        </div>

        {cart.length === 0 && !placedOrder ? (
          <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 text-center max-w-md mx-auto shadow-sm">
            <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-slate-800">আপনার কার্ট খালি</h2>
            <p className="text-xs text-slate-500 mt-1 mb-5">
              অর্ডার করার জন্য অনুগ্রহ করে পছন্দের প্রোডাক্ট নির্বাচন করুন।
            </p>
            <button
              type="button"
              onClick={() => navigateTo('/')}
              className="px-6 py-2.5 rounded-xl bg-[#00A5A8] hover:bg-[#008f92] text-white text-xs font-bold transition shadow-sm"
            >
              প্রোডাক্ট দেখুন
            </button>
          </div>
        ) : (
          <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Simple Customer & Shipping Info (8 cols on lg) */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-5">
              {/* Card 1: কাস্টমার ও ডেলিভারি তথ্য */}
              <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs">
                <div className="flex items-center gap-2.5 pb-3.5 border-b border-slate-100 mb-4 sm:mb-5">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-teal-50 text-[#00A5A8] flex items-center justify-center font-black text-xs sm:text-sm shrink-0">
                    ১
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-slate-900">
                      কাস্টমার ও ডেলিভারি তথ্য
                    </h2>
                    <p className="text-[11px] sm:text-xs text-slate-400">
                      আপনার নাম, মোবাইল নম্বর ও ঠিকানা দিন
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Name & Phone in 2 columns on desktop */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        আপনার নাম <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="যেমন: মোঃ সাকিব হোসেন"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className={`w-full bg-slate-50 border rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00A5A8] ${
                            formErrors.fullName ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                          }`}
                        />
                        <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      </div>
                      {formErrors.fullName && (
                        <p className="text-[11px] text-rose-500 mt-1">{formErrors.fullName}</p>
                      )}
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        মোবাইল নম্বর <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          placeholder="০১৭XXXXXXXX"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className={`w-full bg-slate-50 border rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00A5A8] ${
                            formErrors.phoneNumber ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                          }`}
                        />
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      </div>
                      {formErrors.phoneNumber && (
                        <p className="text-[11px] text-rose-500 mt-1">{formErrors.phoneNumber}</p>
                      )}
                    </div>
                  </div>

                  {/* Delivery Location Selection: Exactly 2 clean selectable cards */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      ডেলিভারি লোকেশন নির্বাচন করুন <span className="text-rose-500">*</span>
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Inside Dhaka Card */}
                      <div
                        onClick={() => setDeliveryLocation('inside')}
                        className={`p-3.5 rounded-2xl border-2 cursor-pointer transition flex items-center justify-between ${
                          deliveryLocation === 'inside'
                            ? 'border-[#00A5A8] bg-teal-50/50 shadow-xs ring-1 ring-[#00A5A8]'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                              deliveryLocation === 'inside'
                                ? 'border-[#00A5A8] bg-[#00A5A8]'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {deliveryLocation === 'inside' && (
                              <div className="w-2 h-2 rounded-full bg-white" />
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">ঢাকার ভিতরে</p>
                            <p className="text-[11px] text-slate-500">{insideDays}</p>
                          </div>
                        </div>
                        <span className="text-xs font-black text-[#00A5A8]">
                          ৳{insideCharge}
                        </span>
                      </div>

                      {/* Outside Dhaka Card */}
                      <div
                        onClick={() => setDeliveryLocation('outside')}
                        className={`p-3.5 rounded-2xl border-2 cursor-pointer transition flex items-center justify-between ${
                          deliveryLocation === 'outside'
                            ? 'border-[#00A5A8] bg-teal-50/50 shadow-xs ring-1 ring-[#00A5A8]'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                              deliveryLocation === 'outside'
                                ? 'border-[#00A5A8] bg-[#00A5A8]'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {deliveryLocation === 'outside' && (
                              <div className="w-2 h-2 rounded-full bg-white" />
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">ঢাকার বাইরে</p>
                            <p className="text-[11px] text-slate-500">{outsideDays}</p>
                          </div>
                        </div>
                        <span className="text-xs font-black text-[#00A5A8]">
                          ৳{outsideCharge}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Street Address */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      সম্পূর্ণ ডেলিভারি ঠিকানা <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <textarea
                        rows={2}
                        placeholder="বাসা নম্বর, রোড নম্বর, এলাকা, থানা ও জেলা লিখুন..."
                        value={streetAddress}
                        onChange={(e) => setStreetAddress(e.target.value)}
                        className={`w-full bg-slate-50 border rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00A5A8] ${
                          formErrors.streetAddress ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                        }`}
                      />
                    </div>
                    {formErrors.streetAddress && (
                      <p className="text-[11px] text-rose-500 mt-1">{formErrors.streetAddress}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Card 2: পেমেন্ট মেথড (ডিফল্ট ক্যাশ অন ডেলিভারি) */}
              <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xs">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-xs sm:text-sm shrink-0">
                    ২
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-slate-900">
                      পেমেন্ট পদ্ধতি (Payment Method)
                    </h2>
                  </div>
                </div>

                {/* Payment Methods Selection */}
                <div className="space-y-3">
                  {/* COD (Default) */}
                  <label
                    onClick={() => setPaymentMethod('cod')}
                    className={`flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl border transition cursor-pointer ${
                      paymentMethod === 'cod'
                        ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-slate-900">ক্যাশ অন ডেলিভারি (Cash on Delivery)</span>
                        <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">ডিফল্ট</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">পণ্য হাতে পেয়ে চেক করে সম্পূর্ণ মূল্য পরিশোধ করুন।</p>
                    </div>
                  </label>

                  {/* bKash Online Payment */}
                  <label
                    onClick={() => setPaymentMethod('bkash')}
                    className={`flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl border transition cursor-pointer ${
                      paymentMethod === 'bkash'
                        ? 'border-pink-500 bg-pink-50/40 ring-1 ring-pink-500'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'bkash'}
                      onChange={() => setPaymentMethod('bkash')}
                      className="mt-0.5 text-pink-600 focus:ring-pink-500"
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-slate-900">বিকাশ অনলাইন পেমেন্ট (bKash)</span>
                        <span className="text-[10px] font-extrabold bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full">বিকাশ</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        আমাদের বিকাশ পার্সোনাল বা মার্চেন্ট নম্বরে টাকা পাঠিয়ে নিচের বক্সে আপনার ট্রানজেকশন আইডি (TrxID) দিন।
                      </p>
                      <div className="p-2.5 rounded-xl bg-white border border-pink-200 text-xs font-mono font-bold text-pink-700 flex items-center justify-between">
                        <span>বিকাশ নম্বর: {bkashNumber || '01700000000'}</span>
                      </div>
                      {paymentMethod === 'bkash' && (
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">ট্রানজেকশন আইডি (TrxID) <span className="text-rose-500">*</span></label>
                          <input
                            type="text"
                            placeholder="যেমন: 9J74H3K2L1"
                            value={trxId}
                            onChange={(e) => setTrxId(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono uppercase focus:outline-none focus:ring-2 focus:ring-pink-500"
                          />
                        </div>
                      )}
                    </div>
                  </label>

                  {/* Nagad Online Payment */}
                  <label
                    onClick={() => setPaymentMethod('nagad')}
                    className={`flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl border transition cursor-pointer ${
                      paymentMethod === 'nagad'
                        ? 'border-orange-500 bg-orange-50/40 ring-1 ring-orange-500'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'nagad'}
                      onChange={() => setPaymentMethod('nagad')}
                      className="mt-0.5 text-orange-600 focus:ring-orange-500"
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-slate-900">নগদ অনলাইন পেমেন্ট (Nagad)</span>
                        <span className="text-[10px] font-extrabold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">নগদ</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        আমাদের নগদ নম্বরে টাকা পাঠিয়ে নিচের বক্সে আপনার ট্রানজেকশন আইডি (TrxID) দিন।
                      </p>
                      <div className="p-2.5 rounded-xl bg-white border border-orange-200 text-xs font-mono font-bold text-orange-700 flex items-center justify-between">
                        <span>নগদ নম্বর: {nagadNumber || '01700000000'}</span>
                      </div>
                      {paymentMethod === 'nagad' && (
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">ট্রানজেকশন আইডি (TrxID) <span className="text-rose-500">*</span></label>
                          <input
                            type="text"
                            placeholder="যেমন: 9J74H3K2L1"
                            value={trxId}
                            onChange={(e) => setTrxId(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono uppercase focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Right Column: Order Summary & Confirm Button (4-5 cols on lg) */}
            <div className="lg:col-span-5 xl:col-span-4 space-y-4">
              <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs sticky top-24">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-3.5 pb-3 border-b border-slate-100 flex items-center justify-between">
                  <span>অর্ডার সারসংক্ষেপ</span>
                  <span className="text-xs text-slate-500 font-semibold">{cartCount} টি পণ্য</span>
                </h3>

                {/* Items Mini List */}
                <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 pr-1 mb-4 space-y-2">
                  {cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex items-center justify-between gap-3 pt-2 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={item.product.image}
                          alt={item.product.title}
                          className="w-10 h-10 object-contain rounded-lg bg-slate-100 p-1 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 truncate">{item.product.title}</p>
                          <p className="text-[11px] text-slate-400">পরিমাণ: {item.quantity}</p>
                        </div>
                      </div>
                      <span className="font-bold text-slate-900 shrink-0">
                        ৳{(item.product.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
                
                {/* Promo Code Input */}
                <div className="py-3 border-t border-slate-100">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">আপনার কাছে কি প্রোমো কোড আছে?</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="প্রোমো কোড লিখুন"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                            onChange={(e) => setPromoInput(e.target.value)}
                        />
                        <button
                            type="button"
                            onClick={() => {
                                const res = applyVoucher(promoInput);
                                alert(res.message);
                            }}
                            className="bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-xl"
                        >
                            প্রয়োগ
                        </button>
                    </div>
                </div>

                {/* Pricing Breakdown */}
                <div className="space-y-2.5 text-xs pt-3 border-t border-slate-100">
                  <div className="flex justify-between text-slate-600">
                    <span>পণ্যের মোট মূল্য (Subtotal)</span>
                    <span className="font-bold text-slate-900">৳{cartSubtotal.toLocaleString()}</span>
                  </div>

                  {voucherDiscount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>কুপন ছাড় ({activeVoucher?.code})</span>
                      <span>-৳{voucherDiscount.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-600 items-center">
                    <div className="flex items-center gap-1.5">
                      <span>ডেলিভারি চার্জ</span>
                      <span className="text-[10px] text-slate-400 font-medium">({selectedZoneName})</span>
                    </div>
                    <span className="font-bold text-slate-900">
                      {isFreeShippingEligible ? (
                        <span className="text-[#00A5A8]">ফ্রি (৳০)</span>
                      ) : (
                        `৳${deliveryCharge}`
                      )}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
                    <span className="text-sm font-bold text-slate-900">সর্বমোট প্রদেয় বিল</span>
                    <span className="text-xl sm:text-2xl font-black text-[#E11D48] tabular-nums">
                      ৳{grandTotal.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Confirm Order Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-5 py-3.5 px-4 rounded-xl bg-[#00A5A8] hover:bg-[#008f92] text-white font-extrabold text-sm sm:text-base shadow-md shadow-teal-600/20 transition transform active:scale-98 flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      অর্ডার সম্পন্ন হচ্ছে...
                    </span>
                  ) : (
                    <span>Confirm & Place Order →</span>
                  )}
                </button>

                {/* Trust and Safety Badges */}
                <div className="mt-4 pt-3.5 border-t border-slate-100 space-y-1.5">
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>পণ্য হাতে পেয়ে দেখে মূল্য পরিশোধের সুবিধা</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <Truck className="w-4 h-4 text-[#00A5A8] shrink-0" />
                    <span>{selectedZoneName} আনুমানিক {selectedZoneDays} এর মধ্যে ডেলিভারি</span>
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Order Placed Success Confirmation Modal */}
      {placedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="text-center mb-5">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                অর্ডার সফলভাবে সম্পন্ন হয়েছে!
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                আপনার অর্ডারের জন্য ধন্যবাদ। আমাদের প্রতিনিধি শীঘ্রই যোগাযোগ করবেন।
              </p>
            </div>

            {/* Receipt Summary */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 text-xs text-slate-700 mb-6">
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">অর্ডার নম্বর (Order ID)</span>
                <span className="font-extrabold text-[#00A5A8] font-mono">
                  {placedOrder.orderNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">কাস্টমার</span>
                <span className="font-semibold">{placedOrder.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">মোবাইল</span>
                <span className="font-semibold">{placedOrder.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ডেলিভারি ঠিকানা</span>
                <span className="font-semibold text-right max-w-[200px] truncate">
                  {placedOrder.address} ({placedOrder.district})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">পেমেন্ট মেথড</span>
                <span className="font-bold text-emerald-700 uppercase">Cash on Delivery</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-900">সর্বমোট প্রদেয় বিল</span>
                <span className="font-black text-sm sm:text-base text-[#E11D48]">
                  ৳{placedOrder.total.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => navigateTo(`/track-order?orderId=${placedOrder.orderNumber}`)}
                className="flex-1 py-3 px-4 rounded-xl bg-[#00A5A8] hover:bg-[#008F91] text-white text-xs font-bold transition shadow-xs"
              >
                অর্ডার ট্র্যাক করুন
              </button>
              <button
                type="button"
                onClick={() => navigateTo('/')}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition"
              >
                হোম পেজে ফিরে যান
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
