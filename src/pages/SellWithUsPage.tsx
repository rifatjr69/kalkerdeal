import React, { useState } from 'react';
import {
  Store, TrendingUp, Truck, ShieldCheck, CreditCard,
  CheckCircle2, ArrowRight, ChevronRight, Users, HelpCircle
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { CATEGORIES, BD_DISTRICTS } from '../data/mockProducts';

import { supabase } from '../lib/supabase';

export const SellWithUsPage: React.FC = () => {
  const { navigateTo } = useStore();

  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]?.name || 'Electronics');
  const [district, setDistrict] = useState('Dhaka (Inside City)');
  const [nidOrTrade, setNidOrTrade] = useState('');

  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName || !ownerName || !phone) {
      alert('Please fill out all required fields');
      return;
    }
    setIsSubmitted(true);

    // Save vendor application in Supabase database
    const vendorSlug = shopName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `shop-${Date.now()}`;
    supabase.from('vendors').insert([
      {
        shop_name: shopName,
        slug: vendorSlug,
        owner_name: ownerName,
        phone,
        email: email || null,
        category,
        district,
        trade_license_nid: nidOrTrade || null,
        status: 'active'
      }
    ]).then(({ error }: any) => {
      if (error) {
        console.warn('Vendor insert into Supabase:', error.message);
      } else {
        console.log(`Vendor ${shopName} successfully stored in Supabase database!`);
      }
    });

    window.scrollTo({ top: 100, behavior: 'smooth' });
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-6 sm:py-9">
      <div className="max-w-5xl mx-auto px-4">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-6 flex-wrap">
          <button
            type="button"
            onClick={() => navigateTo('/')}
            className="hover:text-[#00A5A8] font-medium"
          >
            Home
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-900 font-semibold">Sell With Us</span>
        </nav>

        {/* Hero Section */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 sm:p-12 text-white mb-10 shadow-lg">
          <div className="max-w-2xl">
            <span className="inline-block bg-[#FF2B74] text-white text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full mb-3">
              Cart App Seller Central
            </span>
            <h1 className="text-2xl sm:text-4xl font-black leading-tight mb-3">
              Sell to Millions of Shoppers Across Bangladesh
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6">
              Join thousands of brands, wholesalers, and retail merchants. Start selling in less than 10 minutes with zero upfront listing fees and nationwide logistics support.
            </p>
            <div className="flex items-center gap-6 text-xs text-slate-200">
              <div className="flex items-center gap-1.5 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-[#00A5A8]" /> 0% Commission 1st Month
              </div>
              <div className="flex items-center gap-1.5 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-[#00A5A8]" /> Daily Payouts
              </div>
              <div className="flex items-center gap-1.5 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-[#00A5A8]" /> Doorstep Pickups
              </div>
            </div>
          </div>
        </div>

        {/* 4 Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-pink-50 text-[#FF2B74] flex items-center justify-center mb-3">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              0% Commission
            </h3>
            <p className="text-xs text-slate-500">
              Zero commission fees for your first 30 days of registration. Keep 100% of your earnings.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#00A5A8] flex items-center justify-center mb-3">
              <Truck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Nationwide Logistics
            </h3>
            <p className="text-xs text-slate-500">
              Doorstep pickup from your store or warehouse in 64 districts with verified tracking.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
              <CreditCard className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Fast 48h Payouts
            </h3>
            <p className="text-xs text-slate-500">
              Direct transfer to your Bank Account, bKash Merchant, or Nagad within 48 hours of order delivery.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Dedicated Support
            </h3>
            <p className="text-xs text-slate-500">
              Direct seller hotline and dedicated account manager to assist your inventory expansion.
            </p>
          </div>
        </div>

        {/* Seller Registration Form or Success Message */}
        {isSubmitted ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 text-center shadow-xs max-w-xl mx-auto mb-12">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">
              Registration Received!
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mb-6">
              Thank you, <strong>{ownerName}</strong>! We have received your vendor application for <strong>{shopName}</strong>. Our Merchant Onboarding Team will call you at <strong>{phone}</strong> within 24 business hours to activate your store.
            </p>
            <button
              type="button"
              onClick={() => navigateTo('/')}
              className="px-6 py-2.5 rounded-xl bg-[#00A5A8] text-white text-xs font-bold"
            >
              Back to Storefront
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-xs max-w-2xl mx-auto mb-12">
            <div className="text-center mb-6">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Register as a Seller
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Fill out the form below to create your official seller account
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Store / Shop Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dhaka Gadget Hub"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00A5A8]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Owner's Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mahfuzur Rahman"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00A5A8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="01XXXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00A5A8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Business Email
                  </label>
                  <input
                    type="email"
                    placeholder="owner@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00A5A8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Primary Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00A5A8]"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Pickup Warehouse District
                  </label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00A5A8]"
                  >
                    {BD_DISTRICTS.map((dist) => (
                      <option key={dist} value={dist}>
                        {dist}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Trade License or NID Number
                  </label>
                  <input
                    type="text"
                    placeholder="NID or Trade License No."
                    value={nidOrTrade}
                    onChange={(e) => setNidOrTrade(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00A5A8]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-xl bg-[#FF2B74] hover:bg-[#e02464] text-white font-extrabold text-sm shadow-md transition transform active:scale-98 flex items-center justify-center gap-2 mt-4"
              >
                Submit Store Application →
              </button>

              <p className="text-[11px] text-slate-400 text-center">
                By submitting, you agree to Cart App's Seller Terms of Service & Privacy Policy.
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
