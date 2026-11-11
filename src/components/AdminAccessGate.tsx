import React, { useState } from 'react';
import { ShieldAlert, ShieldCheck, RefreshCw, KeyRound, Copy, Check, ArrowLeft, LogIn, Database, Sparkles } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const AdminAccessGate: React.FC = () => {
  const { user, isAdmin, setAdminStatus, refreshUserProfile, openAuth, navigateTo } = useStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);

  const targetEmail = user?.email || 'your_admin_email@example.com';
  const sqlCommand = `-- Supabase SQL Editor এ এই কমান্ডটি রান করুন:
UPDATE public.profiles
SET role = 'admin'
WHERE email = '${targetEmail}';`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setFeedback(null);
    try {
      await refreshUserProfile();
      // Check after a brief moment
      setTimeout(() => {
        const storedAdmin = localStorage.getItem('cartapp_is_admin') === 'true';
        if (storedAdmin) {
          setFeedback({
            type: 'success',
            message: 'অভিনন্দন! আপনার অ্যাডমিন রোল সফলভাবে শনাক্ত হয়েছে। ড্যাশবোর্ড লোড হচ্ছে...'
          });
        } else {
          setFeedback({
            type: 'info',
            message: `ডাটাবেস চেক সম্পন্ন হয়েছে। বর্তমান প্রোফাইল রোল: "${user?.role || 'customer'}"। Supabase-এ রোল 'admin' সেট করে আবার চেক করুন।`
          });
        }
        setIsRefreshing(false);
      }, 700);
    } catch {
      setFeedback({
        type: 'error',
        message: 'ডাটাবেস সংযোগে সমস্যা হয়েছে। অনুগ্রহ করে ইন্টারনেট ও Supabase কনফিগারেশন চেক করুন।'
      });
      setIsRefreshing(false);
    }
  };

  const handleQuickDemoAdmin = () => {
    setAdminStatus(true);
    setFeedback({
      type: 'success',
      message: 'টেস্ট অ্যাডমিন মোড সক্রিয় হয়েছে! ড্যাশবোর্ডে প্রবেশ করানো হচ্ছে...'
    });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 sm:py-16">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 p-6 sm:p-8 text-white relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">অ্যাডমিন প্যানেল এক্সেস</h1>
              <p className="text-xs text-purple-200">Kalkerdeal Administration Portal & Role Verification</p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Feedback Banner */}
          {feedback && (
            <div
              className={`p-4 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-3 ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : feedback.type === 'info'
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {feedback.type === 'success' ? (
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <Database className="w-5 h-5 text-amber-600 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* User Status Card */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">বর্তমান লগইন স্ট্যাটাস</span>
              <span
                className={`text-[11px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                  user ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {user ? 'লগইন আছেন (Active)' : 'লগইন করা নেই'}
              </span>
            </div>

            {user ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                <div>
                  <div className="text-slate-400 font-medium">নাম</div>
                  <div className="font-bold text-slate-800 text-sm">{user.name}</div>
                </div>
                <div>
                  <div className="text-slate-400 font-medium">ইমেইল</div>
                  <div className="font-bold text-slate-800 truncate">{user.email || '—'}</div>
                </div>
                <div>
                  <div className="text-slate-400 font-medium">মোবাইল</div>
                  <div className="font-bold text-slate-800">{user.phone || '—'}</div>
                </div>
                <div>
                  <div className="text-slate-400 font-medium">ডাটাবেস রোল (Role)</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className={`font-mono font-bold text-xs px-2.5 py-0.5 rounded ${
                        isAdmin
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {user.role || 'customer'}
                    </span>
                    {!isAdmin && (
                      <span className="text-[11px] text-amber-600 font-semibold">(Admin নয়)</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-2 text-xs text-slate-600">
                অ্যাডমিন ভেরিফিকেশনের জন্য প্রথমে আপনার ক্রেডেনশিয়াল দিয়ে লগইন করুন।
              </div>
            )}
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {!user ? (
              <button
                type="button"
                onClick={() => openAuth('signin')}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#FF2B74] hover:bg-[#E11D48] text-white font-bold text-sm shadow-md transition active:scale-95"
              >
                <LogIn className="w-4 h-4" />
                <span>লগইন করুন (Sign In)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-sm shadow-md transition active:scale-95"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'ডাটাবেস চেক করা হচ্ছে...' : 'ডাটাবেস থেকে রোল রিফ্রেশ করুন'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleQuickDemoAdmin}
              className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition active:scale-95"
              title="Click to instantly enable admin mode in this browser"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>টেস্ট অ্যাডমিন এক্সেস</span>
            </button>
          </div>

          {/* Database Setup Helper Guide */}
          <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Database className="w-4 h-4 text-purple-600" />
                <span>Supabase-এ রোল পরিবর্তন করার নিয়ম:</span>
              </div>
              <button
                type="button"
                onClick={handleCopySql}
                className="inline-flex items-center gap-1 px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 shadow-xs transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'কপি হয়েছে!' : 'SQL কপি করুন'}</span>
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Supabase Dashboard এ গিয়ে <strong>SQL Editor</strong> খুলুন এবং নিচের কমান্ডটি রান করুন, অথবা <strong>Table Editor &gt; profiles</strong> এ গিয়ে রোল কলামে <code>admin</code> লিখে সেভ করুন:
            </p>

            <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed">
              {sqlCommand}
            </pre>
          </div>

          {/* Back button */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => navigateTo('/')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>স্টোরফ্রন্ট হোমপেজে ফিরে যান</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
