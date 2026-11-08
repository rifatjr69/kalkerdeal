import React, { useState, useEffect } from 'react';
import {
  Search, Package, Truck, CheckCircle2, Clock, MapPin,
  Phone, ArrowRight, ShieldCheck, ChevronRight, AlertCircle, FileText
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Order } from '../types/store';

export const OrderTrackingPage: React.FC = () => {
  const { orders, routeParams, navigateTo, siteNumber } = useStore();

  const [searchQuery, setSearchQuery] = useState(routeParams.orderId || '');
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (routeParams.orderId) {
      setSearchQuery(routeParams.orderId);
      performSearch(routeParams.orderId);
    } else if (orders.length > 0) {
      // Default to most recent order if available
      setSearchedOrder(orders[0]);
      setSearchQuery(orders[0].orderNumber);
    }
  }, [routeParams.orderId, orders]);

  const performSearch = (query: string) => {
    const q = query.trim().toLowerCase();
    if (!q) return;

    setHasSearched(true);
    const found = orders.find(
      (o) =>
        o.orderNumber.toLowerCase() === q ||
        o.phone.replace(/[-\s]/g, '') === q.replace(/[-\s]/g, '')
    );

    if (found) {
      setSearchedOrder(found);
    } else {
      // Create a mock simulated order if user typed an order code like CA-xxxxxx so the tracking UI demo is functional
      if (q.startsWith('ca-') || q.length === 11) {
        setSearchedOrder({
          id: 'sim_1',
          orderNumber: q.toUpperCase(),
          createdAt: new Date().toISOString(),
          customerName: 'Customer',
          phone: q.length === 11 ? q : '01712-345678',
          address: 'House 14, Road 7, Banani',
          district: 'Dhaka (Inside City)',
          deliveryMethod: 'cod',
          deliveryCharge: 60,
          subtotal: 3490,
          discount: 0,
          total: 3550,
          status: 'shipped',
          items: [
            {
              productId: 'p_tws_1',
              title: 'ANC Wireless Earbuds Pro',
              price: 3490,
              quantity: 1,
              image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300'
            }
          ]
        });
      } else {
        setSearchedOrder(null);
      }
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchQuery);
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-6 sm:py-9">
      <div className="max-w-4xl mx-auto px-4">
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
          <span className="text-slate-900 font-semibold">Track Order</span>
        </nav>

        {/* Search Banner */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs mb-8 text-center">
          <div className="w-14 h-14 rounded-full bg-teal-50 text-[#00A5A8] flex items-center justify-center mx-auto mb-3">
            <Truck className="w-7 h-7" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mb-1.5">
            Track Your Order
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-6">
            Enter your 8-digit Order Number (e.g. CA-482910) or your registered Phone Number to see real-time delivery status.
          </p>

          <form onSubmit={handleSearchSubmit} className="max-w-lg mx-auto flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Order Number (e.g. CA-482910) or Phone"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-3 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00A5A8]"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-[#00A5A8] hover:bg-[#008F91] text-white text-xs sm:text-sm font-bold shadow-xs transition"
            >
              Track Order
            </button>
          </form>

          {/* Quick Order Suggestions if user has recent orders */}
          {orders.length > 0 && (
            <div className="mt-4 flex items-center justify-center gap-2 flex-wrap text-xs text-slate-500">
              <span>Recent Orders:</span>
              {orders.slice(0, 3).map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => {
                    setSearchQuery(o.orderNumber);
                    setSearchedOrder(o);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-mono text-[11px] font-semibold"
                >
                  {o.orderNumber}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tracking Details View */}
        {searchedOrder ? (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Status Header Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Order Status
                </span>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-black text-slate-900 font-mono">
                    {searchedOrder.orderNumber}
                  </h2>
                  <span className="bg-teal-100 text-[#008F91] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    {searchedOrder.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Placed on {new Date(searchedOrder.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>

              <div className="sm:text-right">
                <span className="text-[11px] text-slate-400 block">Courier Partner</span>
                <span className="text-xs font-bold text-slate-800 flex items-center sm:justify-end gap-1.5 mt-0.5">
                  <Truck className="w-3.5 h-3.5 text-[#00A5A8]" />
                  Steadfast Express (Standard BD)
                </span>
                <span className="text-[11px] text-emerald-600 font-semibold block mt-1">
                  Estimated Delivery: 2–3 Days
                </span>
              </div>
            </div>

            {/* Stepper Timeline */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-6">
                Delivery Timeline
              </h3>

              <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-2.5 sm:before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {/* Step 1: Order Placed */}
                <div className="relative">
                  <div className="absolute -left-6 sm:-left-8 top-0 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center ring-4 ring-white">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">Order Placed</h4>
                    <p className="text-[11px] text-slate-500">Order confirmed and entered into the fulfillment system.</p>
                  </div>
                </div>

                {/* Step 2: Processing */}
                <div className="relative">
                  <div className="absolute -left-6 sm:-left-8 top-0 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center ring-4 ring-white">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">Quality Checked & Packaged</h4>
                    <p className="text-[11px] text-slate-500">Item verified for quality and wrapped with secure bubble wrap packaging.</p>
                  </div>
                </div>

                {/* Step 3: Dispatched to Courier */}
                <div className="relative">
                  <div className={`absolute -left-6 sm:-left-8 top-0 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white ${
                    searchedOrder.status === 'shipped' || searchedOrder.status === 'delivered'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-teal-500 text-white animate-pulse'
                  }`}>
                    <Truck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">Handed Over to Courier Hub</h4>
                    <p className="text-[11px] text-slate-500">Departed Tejgaon Logistics Center en route to your local distribution hub.</p>
                  </div>
                </div>

                {/* Step 4: Delivered */}
                <div className="relative">
                  <div className={`absolute -left-6 sm:-left-8 top-0 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white ${
                    searchedOrder.status === 'delivered'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-200 text-slate-400'
                  }`}>
                    <Package className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">Out for Delivery & Handover</h4>
                    <p className="text-[11px] text-slate-500">Rider will call your mobile before reaching your doorstep.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recipient & Items Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Delivery Address Details */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#00A5A8]" />
                  Shipping Information
                </h3>
                <div className="space-y-2 text-xs text-slate-700">
                  <p><strong className="text-slate-900">Customer:</strong> {searchedOrder.customerName}</p>
                  <p><strong className="text-slate-900">Phone:</strong> {searchedOrder.phone}</p>
                  <p><strong className="text-slate-900">Address:</strong> {searchedOrder.address}</p>
                  <p><strong className="text-slate-900">District:</strong> {searchedOrder.district}</p>
                  <p><strong className="text-slate-900">Payment:</strong> <span className="uppercase font-bold text-[#00A5A8]">{searchedOrder.deliveryMethod}</span></p>
                </div>
              </div>

              {/* Items in this Order */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4 flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#FF2B74]" />
                  Order Summary
                </h3>
                <div className="space-y-3 divide-y divide-slate-100">
                  {searchedOrder.items.map((item, idx) => (
                    <div key={idx} className="pt-2 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-9 h-9 object-contain rounded-lg bg-slate-100 p-0.5"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 truncate">{item.title}</p>
                          <p className="text-[11px] text-slate-400">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <span className="font-bold text-slate-900">
                        ৳{(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                  <div className="pt-3 flex justify-between font-bold text-xs text-slate-900">
                    <span>Total Amount Paid</span>
                    <span className="text-sm font-black text-[#FF2B74]">
                      ৳{searchedOrder.total.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Support hotline footer */}
            <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-[#00A5A8]" />
                <p className="text-xs text-slate-700">
                  Have questions regarding your delivery? Our hotline is active <strong>9 AM - 9 PM Everyday</strong>.
                </p>
              </div>
              <a
                href={`tel:${(siteNumber || '01700-000000').replace(/[^0-9]/g, '')}`}
                className="px-4 py-2 bg-[#00A5A8] hover:bg-[#008F91] text-white text-xs font-bold rounded-xl whitespace-nowrap transition"
              >
                Call {siteNumber || '01700-000000'}
              </a>
            </div>
          </div>
        ) : hasSearched ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-10 text-center shadow-xs">
            <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 mb-1">
              No order found for "{searchQuery}"
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5">
              Please double check the order number or mobile number you entered.
            </p>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold"
            >
              Try Again
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};
