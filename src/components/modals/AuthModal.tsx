import React, { useState } from 'react';
import { X, Lock, Phone, Mail, User, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Logo } from '../common/Logo';

export const AuthModal: React.FC = () => {
  const { isAuthOpen, closeAuth, authView, openAuth, login, register } = useStore();

  // Sign In Form State
  const [signInIdentifier, setSignInIdentifier] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Register Form State
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Forgot Password State
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  // Error messages & loading state
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAuthOpen) return null;

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!signInIdentifier.trim()) {
      setError('Please enter your email or phone number');
      return;
    }
    if (!signInPassword) {
      setError('Please enter your password');
      return;
    }
    setIsSubmitting(true);
    const res = await login(signInIdentifier.trim(), signInPassword);
    setIsSubmitting(false);
    if (!res.success && res.error) {
      setError(res.error);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!regName.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!regPhone.trim()) {
      setError('Please enter your phone number');
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (!agreeTerms) {
      setError('Please agree to the Terms & Conditions');
      return;
    }
    setIsSubmitting(true);
    const res = await register(regName.trim(), regPhone.trim(), regEmail.trim() || undefined, regPassword);
    setIsSubmitting(false);
    if (!res.success && res.error) {
      setError(res.error);
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!forgotIdentifier.trim()) {
      setError('Please enter your email or phone number');
      return;
    }
    setForgotSent(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 p-6 sm:p-8 relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={closeAuth}
          aria-label="Close"
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <Logo size="md" />
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* VIEW 1: SIGN IN */}
        {authView === 'signin' && (
          <form onSubmit={handleSignInSubmit} className="space-y-4">
            <div className="text-center mb-4">
              <h3 className="text-xl font-extrabold text-slate-900">Welcome Back</h3>
              <p className="text-xs text-slate-500 mt-1">
                Sign in to manage your orders &amp; wishlist
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Email / Phone Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={signInIdentifier}
                  onChange={(e) => setSignInIdentifier(e.target.value)}
                  placeholder="e.g. 01712000000 or you@mail.com"
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#FF2B74] focus:ring-2 focus:ring-[#FF2B74]/20 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm outline-none transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">Password</label>
                <button
                  type="button"
                  onClick={() => openAuth('forgot')}
                  className="text-xs font-bold text-[#FF2B74] hover:underline"
                >
                  Forgot?
                </button>
              </div>
              <input
                type="password"
                required
                value={signInPassword}
                onChange={(e) => setSignInPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#FF2B74] focus:ring-2 focus:ring-[#FF2B74]/20 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#FF2B74] hover:bg-[#E11D48] text-white font-extrabold text-sm py-3 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </button>

            <div className="text-center pt-2 text-xs text-slate-500">
              New to Cart App?{' '}
              <button
                type="button"
                onClick={() => openAuth('register')}
                className="font-extrabold text-[#00A5A8] hover:underline ml-1"
              >
                Register
              </button>
            </div>
          </form>
        )}

        {/* VIEW 2: CREATE ACCOUNT */}
        {authView === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div className="text-center mb-3">
              <h3 className="text-xl font-extrabold text-slate-900">Create Account</h3>
              <p className="text-xs text-slate-500 mt-1">
                Get ৳250 discount on your first app order!
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Full Name <span className="text-[#FF2B74]">*</span>
              </label>
              <input
                type="text"
                required
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="e.g. Tanvir Ahmed"
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#FF2B74] rounded-xl px-3.5 py-2 text-xs sm:text-sm outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Phone Number <span className="text-[#FF2B74]">*</span>
              </label>
              <input
                type="tel"
                required
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                placeholder="e.g. 01712-000000"
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#FF2B74] rounded-xl px-3.5 py-2 text-xs sm:text-sm outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email Address <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="e.g. tanvir@example.com"
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#FF2B74] rounded-xl px-3.5 py-2 text-xs sm:text-sm outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Password <span className="text-[#FF2B74]">*</span>
              </label>
              <input
                type="password"
                required
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#FF2B74] rounded-xl px-3.5 py-2 text-xs sm:text-sm outline-none transition"
              />
            </div>

            <label className="flex items-start gap-2 pt-1 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-[#FF2B74] focus:ring-[#FF2B74]"
              />
              <span>
                I agree to the <a href="#terms" className="text-[#FF2B74] underline">Terms &amp; Conditions</a> and <a href="#privacy" className="text-[#FF2B74] underline">Privacy Policy</a>
              </span>
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#00A5A8] hover:bg-[#008F91] text-white font-extrabold text-sm py-3 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer mt-2 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Register'
              )}
            </button>

            <div className="text-center pt-2 text-xs text-slate-500">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => openAuth('signin')}
                className="font-extrabold text-[#FF2B74] hover:underline ml-1"
              >
                Sign In
              </button>
            </div>
          </form>
        )}

        {/* VIEW 3: RESET PASSWORD */}
        {authView === 'forgot' && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => openAuth('signin')}
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </button>

            <div className="text-center mb-3">
              <h3 className="text-xl font-extrabold text-slate-900">Reset Password</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Enter the email or phone number of your account. We will send you a link to set a new password.
              </p>
            </div>

            {forgotSent ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="text-sm font-bold text-emerald-900">Password Reset Link Sent!</h4>
                <p className="text-xs text-emerald-700">
                  Please check your inbox / SMS messages for instructions to reset your password.
                </p>
                <button
                  type="button"
                  onClick={() => openAuth('signin')}
                  className="bg-emerald-600 text-white font-bold text-xs px-4 py-2 rounded-xl mt-2 inline-block"
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Email / Phone Number
                  </label>
                  <input
                    type="text"
                    required
                    value={forgotIdentifier}
                    onChange={(e) => setForgotIdentifier(e.target.value)}
                    placeholder="Enter registered phone or email"
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#FF2B74] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm outline-none transition"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#FF2B74] hover:bg-[#E11D48] text-white font-extrabold text-sm py-3 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  Send reset link
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
