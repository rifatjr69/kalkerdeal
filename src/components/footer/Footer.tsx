import React from 'react';
import {
  MapPin, Phone, Mail, Facebook, Youtube, Linkedin, Instagram
} from 'lucide-react';
import { Logo } from '../common/Logo';
import { useStore } from '../../context/StoreContext';

export const Footer: React.FC = () => {
  const { navigateTo, siteName, siteNumber } = useStore();

  const cleanPhone = (siteNumber || '01700-000000').replace(/[^0-9]/g, '');

  const aboutLinks = [
    { label: 'About Us', path: '/about-us' },
    { label: 'Our Blog', path: '/blog' },
    { label: 'Cookies Policy', path: '/policies/cookies' },
    { label: 'Join the Affiliate Program', path: '/affiliate' },
    { label: 'Sell With Us', path: '/sell-with-us' }
  ];

  const customerCareLinks = [
    { label: 'Return & Refund Policy', path: '/policies/returns' },
    { label: 'Privacy Policy', path: '/policies/privacy' },
    { label: 'Terms & Conditions', path: '/policies/terms' },
    { label: 'Warranty Policy', path: '/policies/warranty' },
    { label: 'Help Center', path: '/help-center' },
    { label: 'EMI Policy', path: '/policies/emi' }
  ];

  return (
    <footer className="bg-white border-t border-slate-200 pt-12 pb-24 lg:pb-12 text-slate-600 text-xs">
      <div className="max-w-7xl mx-auto px-4">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Col 1 & 2: Brand Info & Contact */}
          <div className="lg:col-span-2 space-y-4">
            <Logo onClick={() => navigateTo('/')} size="md" />

            <div className="space-y-2.5 pt-2 text-slate-500 text-xs">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>House 12, Road 5, Tejgaon, Dhaka-1208, Bangladesh</span>
              </div>

              <div className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <a href={`tel:${cleanPhone}`} className="font-semibold text-slate-800 hover:text-[#FF2B74]">
                    {siteNumber || '01700-000000'}
                  </a>
                  <div className="text-[11px] text-slate-400">9 am - 9 pm (Everyday)</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <a href="mailto:admin@cartapp.demotheme.xyz" className="hover:text-[#FF2B74]">
                  admin@cartapp.demotheme.xyz
                </a>
              </div>
            </div>

            {/* Social Icons matching Screenshot 7 */}
            <div className="pt-2">
              <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                Follow us on
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Facebook"
                  className="w-8 h-8 rounded-full border border-slate-200 bg-slate-50 hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2] text-slate-600 flex items-center justify-center transition"
                >
                  <Facebook className="w-3.5 h-3.5" />
                </a>

                {/* TikTok custom icon */}
                <a
                  href="https://tiktok.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="TikTok"
                  className="w-8 h-8 rounded-full border border-slate-200 bg-slate-50 hover:bg-black hover:text-white hover:border-black text-slate-600 flex items-center justify-center transition"
                >
                  <span className="font-black text-xs leading-none">♪</span>
                </a>

                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="YouTube"
                  className="w-8 h-8 rounded-full border border-slate-200 bg-slate-50 hover:bg-[#FF0000] hover:text-white hover:border-[#FF0000] text-slate-600 flex items-center justify-center transition"
                >
                  <Youtube className="w-3.5 h-3.5" />
                </a>

                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="LinkedIn"
                  className="w-8 h-8 rounded-full border border-slate-200 bg-slate-50 hover:bg-[#0A66C2] hover:text-white hover:border-[#0A66C2] text-slate-600 flex items-center justify-center transition"
                >
                  <Linkedin className="w-3.5 h-3.5" />
                </a>

                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                  className="w-8 h-8 rounded-full border border-slate-200 bg-slate-50 hover:bg-[#E4405F] hover:text-white hover:border-[#E4405F] text-slate-600 flex items-center justify-center transition"
                >
                  <Instagram className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Col 3: About Us */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-900 tracking-tight">About Us</h4>
            <ul className="space-y-2">
              {aboutLinks.map((link) => (
                <li key={link.path}>
                  <button
                    type="button"
                    onClick={() => navigateTo(link.path)}
                    className="hover:text-[#FF2B74] transition"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Customer Care */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-900 tracking-tight">Customer Care</h4>
            <ul className="space-y-2">
              {customerCareLinks.map((link) => (
                <li key={link.path}>
                  <button
                    type="button"
                    onClick={() => navigateTo(link.path)}
                    className="hover:text-[#FF2B74] transition"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 5: Install App */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-900 tracking-tight">Install App</h4>
            <p className="text-[11px] text-slate-400">for Exclusive Discounts</p>

            <div className="flex items-start gap-3">
              {/* QR Code */}
              <div className="w-16 h-16 bg-white border border-slate-200 rounded-xl p-1.5 shadow-2xs shrink-0">
                <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
                  <rect width="100" height="100" fill="white" />
                  <rect x="5" y="5" width="30" height="30" rx="3" fill="#0F172A" />
                  <rect x="12" y="12" width="16" height="16" fill="white" />
                  <rect x="16" y="16" width="8" height="8" fill="#0F172A" />
                  <rect x="65" y="5" width="30" height="30" rx="3" fill="#0F172A" />
                  <rect x="72" y="12" width="16" height="16" fill="white" />
                  <rect x="76" y="16" width="8" height="8" fill="#0F172A" />
                  <rect x="5" y="65" width="30" height="30" rx="3" fill="#0F172A" />
                  <rect x="12" y="72" width="16" height="16" fill="white" />
                  <rect x="16" y="76" width="8" height="8" fill="#0F172A" />
                  <rect x="45" y="15" width="10" height="10" rx="2" fill="#FF2B74" />
                  <rect x="45" y="45" width="10" height="10" rx="2" fill="#00A5A8" />
                  <rect x="65" y="55" width="25" height="10" rx="2" fill="#0F172A" />
                  <rect x="45" y="75" width="45" height="15" rx="2" fill="#0F172A" />
                </svg>
              </div>

              {/* Store Buttons */}
              <div className="space-y-1.5 flex-1">
                <a
                  href="#app-download"
                  className="bg-black hover:bg-slate-800 text-white px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition text-[10px]"
                >
                  <div className="leading-tight">
                    <div className="text-[8px] text-slate-400">Download on the</div>
                    <div className="font-bold">App Store</div>
                  </div>
                </a>
                <a
                  href="#app-download"
                  className="bg-black hover:bg-slate-800 text-white px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition text-[10px]"
                >
                  <div className="leading-tight">
                    <div className="text-[8px] text-slate-400">GET IT ON</div>
                    <div className="font-bold">Google Play</div>
                  </div>
                </a>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 font-medium">
              Get ৳250 discount on your first app order
            </p>
          </div>
        </div>

        {/* Payment Methods Strip matching Screenshot 7 */}
        <div className="border-t border-slate-100 pt-6 pb-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <span>Payment Methods</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
            {/* Amex */}
            <span className="bg-[#002663] text-white font-extrabold text-[10px] px-2 py-1 rounded">
              AMEX
            </span>
            {/* Mastercard */}
            <span className="bg-[#EB001B] text-white font-extrabold text-[10px] px-2 py-1 rounded">
              Mastercard
            </span>
            {/* Visa */}
            <span className="bg-[#1A1F71] text-white font-extrabold text-[10px] px-2 py-1 rounded">
              VISA
            </span>
            {/* bKash */}
            <span className="bg-[#E2136E] text-white font-bold text-[10px] px-2 py-1 rounded">
              bKash
            </span>
            {/* Upay */}
            <span className="bg-[#0D723B] text-white font-bold text-[10px] px-2 py-1 rounded">
              Upay
            </span>
            {/* Cash on Delivery */}
            <span className="bg-slate-800 text-white font-bold text-[10px] px-2 py-1 rounded">
              Cash on Delivery
            </span>
            {/* SSLCOMMERZ */}
            <span className="text-[10px] text-slate-400 font-semibold border border-slate-200 px-2 py-1 rounded">
              Powered by SSLCOMMERZ
            </span>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-slate-100 pt-6 text-center text-slate-400 text-xs">
          © {new Date().getFullYear()} {siteName}. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
};
