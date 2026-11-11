import React, { useState } from 'react';
import {
  HelpCircle, ShieldCheck, FileText, Phone, Mail, MapPin,
  ChevronDown, ChevronUp, ChevronRight, RotateCcw, Clock, Truck
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

interface StaticPagesProps {
  initialTab?: 'help' | 'about' | 'privacy' | 'terms' | 'return' | 'warranty' | 'emi';
}

export const StaticPages: React.FC<StaticPagesProps> = ({ initialTab = 'help' }) => {
  const { navigateTo, siteNumber, siteName } = useStore();
  const phoneVal = siteNumber || '01700-000000';
  const cleanPhone = phoneVal.replace(/[^0-9]/g, '');
  const [activeTab, setActiveTab] = useState<'help' | 'about' | 'privacy' | 'terms' | 'return' | 'warranty' | 'emi'>(initialTab);

  // Accordion state for FAQs
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How do I place an order on Kalkerdeal?',
      a: 'Browse or search for your desired product, click "Add to Cart" or "Buy Now", review your cart, and proceed to checkout. Enter your delivery address in Bangladesh, choose Cash on Delivery or digital payment (bKash/Nagad/Card), and tap "Confirm Order". You will immediately receive an SMS confirmation with your order number.'
    },
    {
      q: 'What are the delivery charges and delivery times?',
      a: 'Inside Dhaka city, delivery charge is ৳60 and parcels arrive within 24 to 48 hours. Outside Dhaka across all other 63 districts, delivery charge is ৳120 with delivery in 2 to 4 business days. Note: Orders over ৳2,000 or orders containing 3+ items automatically receive FREE Delivery!'
    },
    {
      q: 'How does the 15% bKash offer work?',
      a: 'When you select bKash as your payment method during checkout and your cart subtotal is ৳999 or more, an extra 15% discount is automatically deducted from your total bill immediately.'
    },
    {
      q: 'Can I check the product before paying the delivery rider?',
      a: 'Yes! For all Cash on Delivery shipments, we encourage you to inspect the exterior seal and verify product contents in front of the delivery partner before releasing the cash payment.'
    },
    {
      q: 'What is your 7-Day Replacement Policy?',
      a: 'If you receive a defective, damaged, or incorrect product, notify our Customer Care via phone (09612-000000) or WhatsApp within 7 calendar days of delivery. We will arrange a free reverse pickup and dispatch a brand new replacement.'
    },
    {
      q: 'Do you offer 0% EMI payment facilities?',
      a: 'Yes, on electronics, laptops, mobiles, and large appliances with orders exceeding ৳10,000, 0% EMI is available for 3, 6, 9, or 12 months with leading Bangladesh banks including City Bank, Eastern Bank, BRAC Bank, Standard Chartered, and Mutual Trust Bank.'
    }
  ];

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-6 sm:py-9">
      <div className="max-w-6xl mx-auto px-4">
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
          <span className="text-slate-900 font-semibold capitalize">
            {activeTab === 'help' ? 'Help Center' : activeTab === 'about' ? 'About Us' : 'Policies & Care'}
          </span>
        </nav>

        {/* Tab Selection Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 border-b border-slate-200">
          {[
            { id: 'help', label: 'Help Center & FAQs' },
            { id: 'about', label: 'About Kalkerdeal' },
            { id: 'return', label: 'Return & Refund Policy' },
            { id: 'warranty', label: 'Warranty Policy' },
            { id: 'emi', label: 'EMI Policy' },
            { id: 'privacy', label: 'Privacy Policy' },
            { id: 'terms', label: 'Terms & Conditions' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Help Center & FAQs */}
        {activeTab === 'help' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Help Banner */}
            <div className="bg-gradient-to-r from-teal-700 to-[#00A5A8] rounded-3xl p-6 sm:p-10 text-white shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black mb-2">
                  How can we help you today?
                </h1>
                <p className="text-xs sm:text-sm text-teal-50 max-w-lg">
                  Find quick answers about delivery, payments, returns, and warranty, or speak directly with our Dhaka customer care team.
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-center shrink-0 min-w-[200px]">
                <p className="text-[11px] text-teal-100 font-semibold mb-1">Customer Care Hotline</p>
                <a
                  href={`tel:${cleanPhone}`}
                  className="text-lg font-black text-white hover:underline block"
                >
                  {phoneVal}
                </a>
                <span className="text-[10px] text-teal-200 block mt-0.5">9 AM – 9 PM Everyday</span>
              </div>
            </div>

            {/* FAQs Accordion */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
              <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#00A5A8]" />
                Frequently Asked Questions
              </h2>

              <div className="divide-y divide-slate-100 space-y-3">
                {faqs.map((faq, idx) => {
                  const isOpen = openFaq === idx;
                  return (
                    <div key={idx} className="pt-3">
                      <button
                        type="button"
                        onClick={() => setOpenFaq(isOpen ? null : idx)}
                        className="w-full flex items-center justify-between gap-4 text-left py-2 group focus:outline-none"
                      >
                        <span className={`text-xs sm:text-sm font-bold transition ${
                          isOpen ? 'text-[#00A5A8]' : 'text-slate-800 group-hover:text-slate-900'
                        }`}>
                          {faq.q}
                        </span>
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4 text-[#00A5A8] shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                      </button>
                      {isOpen && (
                        <p className="text-xs text-slate-600 leading-relaxed pb-3 pt-1 animate-in fade-in">
                          {faq.a}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: About Us */}
        {activeTab === 'about' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-xs space-y-6 text-xs sm:text-sm text-slate-600 leading-relaxed animate-in fade-in">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              About Kalkerdeal
            </h1>
            <p>
              Welcome to <strong>Kalkerdeal</strong> (kalkerdeal.com), Bangladesh's premier multi-vendor e-commerce destination. We connect conscious consumers with authentic brand manufacturers, local wholesalers, and trusted retail merchants under a unified, reliable platform.
            </p>
            <p>
              Headquartered in Tejgaon, Dhaka, Kalkerdeal was built from the ground up to solve the core challenges of Bangladeshi online shopping: ensuring 100% genuine products, eliminating counterfeit tech and cosmetics, offering upfront cash-on-delivery inspection, and providing same-day and next-day express logistics across all 64 districts.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
              <div className="p-4 rounded-2xl bg-pink-50 border border-pink-100">
                <h3 className="font-bold text-slate-900 mb-1 text-xs sm:text-sm">Authenticity First</h3>
                <p className="text-xs text-slate-600">Strict merchant verification ensuring every smartphone, gadget, and grocery item is 100% original.</p>
              </div>
              <div className="p-4 rounded-2xl bg-teal-50 border border-teal-100">
                <h3 className="font-bold text-slate-900 mb-1 text-xs sm:text-sm">Nationwide Reach</h3>
                <p className="text-xs text-slate-600">Integrated courier hubs covering Dhaka, Chattogram, Sylhet, Rajshahi, and rural upazilas.</p>
              </div>
              <div className="p-4 rounded-2xl bg-purple-50 border border-purple-100">
                <h3 className="font-bold text-slate-900 mb-1 text-xs sm:text-sm">Instant Customer Care</h3>
                <p className="text-xs text-slate-600">Dedicated phone hotline and WhatsApp support available 7 days a week, 9 AM to 9 PM.</p>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Corporate Headquarters</h3>
              <div className="space-y-1.5 text-xs text-slate-600">
                <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#00A5A8]" /> House 12, Road 5, Tejgaon, Dhaka-1208, Bangladesh</p>
                <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-[#00A5A8]" /> {phoneVal} (9 am - 9 pm Everyday)</p>
                <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-[#00A5A8]" /> support@kalkerdeal.com</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Return & Refund Policy */}
        {activeTab === 'return' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-xs space-y-5 text-xs sm:text-sm text-slate-600 leading-relaxed animate-in fade-in">
            <h1 className="text-2xl font-black text-slate-900">Return & Refund Policy</h1>
            <p>At Kalkerdeal, we want you to shop with total peace of mind. Every product purchased through our website or mobile app is covered under our <strong>7-Day Easy Return & Replacement Guarantee</strong>.</p>
            <h3 className="font-bold text-slate-900 text-sm">Conditions for Returns:</h3>
            <ul className="list-disc pl-5 space-y-1.5 text-xs">
              <li>The item must be unused, in the same condition received, and in its original retail packaging.</li>
              <li>All original warranty cards, accessories, manuals, and free gifts must be included.</li>
              <li>Perishable goods (e.g. fresh dairy or vegetables) must be reported within 24 hours of delivery.</li>
            </ul>
            <h3 className="font-bold text-slate-900 text-sm">Refund Process:</h3>
            <p>Once your returned item is received at our Tejgaon sorting facility and passed quality inspection, your refund will be processed within 3 to 7 working days via original payment method (bKash, Nagad, or Bank Transfer).</p>
          </div>
        )}

        {/* Tab 4: Warranty Policy */}
        {activeTab === 'warranty' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-xs space-y-5 text-xs sm:text-sm text-slate-600 leading-relaxed animate-in fade-in">
            <h1 className="text-2xl font-black text-slate-900">Warranty Policy</h1>
            <p>All electronics, home appliances, and certified gadgets on Kalkerdeal carry official manufacturer or vendor brand warranty. Warranty terms (e.g. 1 Year Official Brand Warranty, 6 Months Service Warranty) are explicitly stated on each product's specification page.</p>
            <h3 className="font-bold text-slate-900 text-sm">How to Claim Warranty:</h3>
            <p>Keep your Kalkerdeal invoice or order number. You can either visit any authorized brand service center in Bangladesh or contact Kalkerdeal Customer Support to schedule a courier pickup for warranty servicing.</p>
          </div>
        )}

        {/* Tab 5: EMI Policy */}
        {activeTab === 'emi' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-xs space-y-5 text-xs sm:text-sm text-slate-600 leading-relaxed animate-in fade-in">
            <h1 className="text-2xl font-black text-slate-900">Equal Monthly Installments (EMI)</h1>
            <p>We provide 0% interest EMI options on cart values of ৳10,000 or higher using credit cards issued by eligible Bangladeshi banks.</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
              {['City Bank (Amex)', 'BRAC Bank', 'Eastern Bank (EBL)', 'Standard Chartered', 'Mutual Trust Bank', 'Dutch-Bangla Bank', 'Prime Bank', 'UCB'].map((b) => (
                <div key={b} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center font-bold text-xs text-slate-700">
                  {b}
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 pt-2">Installment tenures are available for 3, 6, 9, or 12 months with zero hidden processing charges.</p>
          </div>
        )}

        {/* Tab 6: Privacy Policy */}
        {activeTab === 'privacy' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-xs space-y-5 text-xs sm:text-sm text-slate-600 leading-relaxed animate-in fade-in">
            <h1 className="text-2xl font-black text-slate-900">Privacy Policy</h1>
            <p>Kalkerdeal is dedicated to safeguarding your personal data and privacy. We only collect the information necessary to fulfill your orders, process payments, and improve your shopping experience.</p>
            <p>We never sell, rent, or disclose your personal details to third-party marketing companies. All payment data is handled through SSL-encrypted, PCI-DSS compliant financial gateways.</p>
          </div>
        )}

        {/* Tab 7: Terms & Conditions */}
        {activeTab === 'terms' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-xs space-y-5 text-xs sm:text-sm text-slate-600 leading-relaxed animate-in fade-in">
            <h1 className="text-2xl font-black text-slate-900">Terms & Conditions</h1>
            <p>By accessing or purchasing from Kalkerdeal, you agree to comply with our general user terms, order placement rules, and fair usage guidelines.</p>
            <p>All prices listed on the platform are in Bangladeshi Taka (৳) and include applicable government taxes. Kalkerdeal reserves the right to cancel orders in case of stock unavailability, pricing errors, or suspected fraudulent activity.</p>
          </div>
        )}
      </div>
    </div>
  );
};
