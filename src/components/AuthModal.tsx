import React, { useState } from 'react';
import { X, Mail, Lock, User, Loader2, Eye, EyeOff, Truck, ShieldCheck, Headphones, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

/*
  InnexBuy ব্র্যান্ড কালার (লোগো থেকে):
  প্রধান পিংক  = #FF0A5C
  গাঢ় পিংক    = #D6064F
  হালকা পিংক   = #FFF0F5
  বর্ডার পিংক  = #FFD0E0
  কালো         = #111111
  পুরো ফাইলে এই হেক্স কোড Find & Replace করলেই রঙ বদলে যাবে।
*/

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

/* InnexBuy লোগো (SVG) — চাইলে নিচের <BrandLogo /> এর বদলে <img src="/logo.png" /> বসাতে পারেন */
const BrandLogo: React.FC<{ className?: string }> = ({ className = 'h-10 w-auto' }) => (
  <svg viewBox="0 0 250 60" className={className} xmlns="http://www.w3.org/2000/svg" role="img" aria-label="InnexBuy">
    {/* স্পিড লাইন */}
    <rect x="0" y="18" width="14" height="4" rx="2" fill="#FF0A5C" />
    <rect x="5" y="27" width="16" height="4" rx="2" fill="#FF0A5C" />
    <rect x="10" y="36" width="11" height="4" rx="2" fill="#FF0A5C" />
    {/* কার্ট হ্যান্ডেল */}
    <path d="M25 7 H30 Q33 7 34 10 L35 14" stroke="#FF0A5C" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    {/* কার্ট বাস্কেট */}
    <path d="M34 14 H58 Q61.5 14 60.5 17.5 L55 34 Q54 37 51 37 H41.5 Z" fill="#FF0A5C" />
    {/* কার্ট বেস */}
    <path d="M41 37 Q36 40.5 41 44 H56" stroke="#FF0A5C" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    {/* চাকা */}
    <circle cx="43" cy="52" r="4.2" fill="#FF0A5C" />
    <circle cx="55" cy="52" r="4.2" fill="#FF0A5C" />
    {/* লেখা */}
    <text x="72" y="42" fontSize="35" fontWeight="900" fill="#111111" fontFamily="'Nunito','Poppins','Inter',system-ui,sans-serif" letterSpacing="-1">
      innexbuy
    </text>
  </svg>
);

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName }
          }
        });
        if (signUpError) throw signUpError;

        if (authData?.user) {
          await supabase.from('profiles').upsert({
            id: authData.user.id,
            email: email,
            full_name: fullName,
            role: 'user',
            updated_at: new Date().toISOString()
          });
        }

        if (authData?.session) {
          onSuccess();
          onClose();
        } else {
          alert('সফলভাবে একাউন্ট তৈরি হয়েছে! অনুগ্রহ করে লগইন করুন।');
          setIsSignUp(false);
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (signInError) throw signInError;
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'অথেন্টিকেশন ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  const inputWrap = 'relative';
  const inputClass =
    'w-full bg-white border border-gray-200 rounded-xl pl-11 pr-4 py-3.5 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF0A5C]/30 focus:border-[#FF0A5C] transition';
  const iconClass = 'absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none';

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl relative grid md:grid-cols-5 animate-in fade-in zoom-in duration-200">

        {/* ক্লোজ বাটন */}
        <button
          onClick={onClose}
          aria-label="বন্ধ করুন"
          className="absolute top-4 right-4 z-20 bg-gray-100 hover:bg-[#FFF0F5] hover:text-[#FF0A5C] text-gray-600 w-10 h-10 rounded-full flex items-center justify-center transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* বাম পাশ: ব্র্যান্ড প্যানেল (শুধু ডেস্কটপে) */}
        <div className="hidden md:flex md:col-span-2 relative flex-col justify-between p-8 text-white bg-gradient-to-br from-[#FF0A5C] via-[#F0074F] to-[#C30547] overflow-hidden">
          <div className="absolute -top-16 -right-16 w-56 h-56 bg-white/10 rounded-full"></div>
          <div className="absolute -bottom-20 -left-12 w-64 h-64 bg-black/10 rounded-full"></div>

          <div className="relative bg-white rounded-2xl px-5 py-4 shadow-xl w-fit">
            <BrandLogo className="h-9 w-auto" />
          </div>

          <div className="relative space-y-5">
            <div>
              <h3 className="text-2xl font-black leading-snug">
                সেরা প্রোডাক্ট,<br />সেরা দামে, দ্রুত ডেলিভারি।
              </h3>
              <p className="text-xs text-white/80 mt-2">
                লগইন করে আপনার অর্ডার ট্র্যাক করুন এবং সহজে শপিং করুন।
              </p>
            </div>

            <ul className="space-y-3 text-xs font-semibold">
              <li className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center"><Truck className="w-4 h-4" /></span>
                সারা দেশে দ্রুত হোম ডেলিভারি
              </li>
              <li className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center"><ShieldCheck className="w-4 h-4" /></span>
                ১০০% নিরাপদ ক্যাশ অন ডেলিভারি
              </li>
              <li className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center"><Headphones className="w-4 h-4" /></span>
                ২৪/৭ কাস্টমার সাপোর্ট
              </li>
            </ul>
          </div>

          <p className="relative text-[11px] text-white/70">© InnexBuy — সর্বস্বত্ব সংরক্ষিত</p>
        </div>

        {/* ডান পাশ: ফর্ম */}
        <div className="md:col-span-3 p-6 sm:p-10 flex flex-col justify-center">

          {/* মোবাইলে লোগো */}
          <div className="md:hidden flex justify-center mb-6">
            <BrandLogo className="h-9 w-auto" />
          </div>

          <div className="space-y-1.5 mb-6">
            <h2 className="text-2xl font-black text-gray-900">
              {isSignUp ? 'নতুন একাউন্ট খুলুন' : 'স্বাগতম! লগইন করুন'}
            </h2>
            <p className="text-xs text-gray-500">
              {isSignUp
                ? 'মাত্র কয়েক সেকেন্ডে রেজিস্টার করে শপিং শুরু করুন।'
                : 'আপনার অর্ডার ও প্রোফাইল ম্যানেজ করতে লগইন করুন।'}
            </p>
          </div>

          {error && (
            <div className="bg-rose-50 text-rose-600 p-3 rounded-xl text-xs font-semibold border border-rose-100 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">

            {isSignUp && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">পূর্ণ নাম</label>
                <div className={inputWrap}>
                  <User className={iconClass} />
                  <input
                    type="text"
                    required
                    placeholder="আপনার নাম"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">ইমেইল এড্রেস</label>
              <div className={inputWrap}>
                <Mail className={iconClass} />
                <input
                  type="email"
                  required
                  placeholder="example@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">পাসওয়ার্ড</label>
              <div className={inputWrap}>
                <Lock className={iconClass} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass + ' pr-12'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="পাসওয়ার্ড দেখান/লুকান"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#FF0A5C] transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FF0A5C] hover:bg-[#D6064F] text-white font-bold py-3.5 px-6 rounded-xl text-sm shadow-lg shadow-[#FF0A5C]/30 transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>{isSignUp ? 'রেজিস্ট্রেশন করুন' : 'লগইন করুন'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-gray-100 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              className="text-xs text-gray-600 font-semibold"
            >
              {isSignUp ? 'ইতিমধ্যে একাউন্ট আছে? ' : 'নতুন কাস্টমার? '}
              <span className="text-[#FF0A5C] font-black hover:underline">
                {isSignUp ? 'লগইন করুন' : 'একাউন্ট খুলুন'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};