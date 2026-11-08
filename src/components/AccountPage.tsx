import React, { useState, useEffect } from 'react';
import {
  User, MapPin, Package, Heart, Lock, LogOut, ArrowLeft, Plus, Trash2, Pencil, CheckCircle2, AlertCircle, Loader2, Phone, Mail, ChevronRight, Check
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product } from '../types';

interface AccountPageProps {
  user: any;
  onClose: () => void;
  onLogout: () => void;
  products: Product[];
  wishlistIds: string[];
  onToggleWishlist: (productId: string) => void;
  onAddToCart: (product: Product, quantity?: number) => void;
  onSelectProduct: (product: Product) => void;
}

interface Address {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  address_line: string;
  city: string;
  district: string;
  postal_code?: string;
  is_default: boolean;
  created_at?: string;
}

interface OrderItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
  variant?: string;
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  phone: string;
  address: string;
  delivery_zone: string;
  delivery_charge: number;
  subtotal: number;
  discount: number;
  total: number;
  payment_method: string;
  status: string;
  created_at: string;
  items?: OrderItem[];
  order_items?: OrderItem[];
}

const toBn = (n: number | string) =>
  String(n).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[Number(d)]);

export const AccountPage: React.FC<AccountPageProps> = ({
  user,
  onClose,
  onLogout,
  products,
  wishlistIds,
  onToggleWishlist,
  onAddToCart,
  onSelectProduct,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'orders' | 'wishlist' | 'password'>('profile');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Profile State
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || user?.email?.split('@')[0] || '');
  const [phone, setPhone] = useState(user?.user_metadata?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.user_metadata?.avatar_url || '');

  // Addresses State
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addrForm, setAddrForm] = useState({
    full_name: '',
    phone: '',
    address_line: '',
    city: 'ঢাকা',
    district: 'ঢাকা',
    postal_code: '',
    is_default: false,
  });

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchAddresses();
      fetchOrders();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setFullName(data.full_name || '');
        setPhone(data.phone || '');
        setAvatarUrl(data.avatar_url || '');
      }
    } catch {
      // fallback to auth user meta
    }
  };

  const fetchAddresses = async () => {
    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });

      if (!error && data) {
        setAddresses(data);
      }
    } catch {
      // ignore
    }
  };

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setOrders(data);
      } else {
        // Fallback by phone/email if user_id match fails
        const { data: fallbackData } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .or(`phone.eq.${phone},customer_name.eq.${fullName}`)
          .order('created_at', { ascending: false });
        if (fallbackData) setOrders(fallbackData);
      }
    } catch {
      // ignore
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updates = {
        id: user.id,
        email: user.email,
        full_name: fullName,
        phone,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('profiles').upsert(updates);
      if (error) throw error;

      showToast('প্রোফাইল সফলভাবে আপডেট করা হয়েছে!');
    } catch (err: any) {
      showToast('ত্রুটি: ' + (err.message || 'Update failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (addrForm.is_default && addresses.length > 0) {
        // unset other defaults
        await supabase
          .from('addresses')
          .update({ is_default: false })
          .eq('user_id', user.id);
      }

      if (editingAddressId) {
        const { error } = await supabase
          .from('addresses')
          .update({
            full_name: addrForm.full_name,
            phone: addrForm.phone,
            address_line: addrForm.address_line,
            city: addrForm.city,
            district: addrForm.district,
            postal_code: addrForm.postal_code,
            is_default: addrForm.is_default,
          })
          .eq('id', editingAddressId);
        if (error) throw error;
        showToast('ঠিকানা আপডেট করা হয়েছে');
      } else {
        const { error } = await supabase.from('addresses').insert({
          user_id: user.id,
          full_name: addrForm.full_name,
          phone: addrForm.phone,
          address_line: addrForm.address_line,
          city: addrForm.city,
          district: addrForm.district,
          postal_code: addrForm.postal_code,
          is_default: addresses.length === 0 ? true : addrForm.is_default,
        });
        if (error) throw error;
        showToast('নতুন ঠিকানা যুক্ত হয়েছে');
      }

      setIsEditingAddress(false);
      setEditingAddressId(null);
      setAddrForm({ full_name: '', phone: '', address_line: '', city: 'ঢাকা', district: 'ঢাকা', postal_code: '', is_default: false });
      fetchAddresses();
    } catch (err: any) {
      showToast('ত্রুটি: ' + (err.message || 'Address save failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!window.confirm('এই ঠিকানাটি ডিলিট করতে চান?')) return;
    try {
      const { error } = await supabase.from('addresses').delete().eq('id', id);
      if (error) throw error;
      showToast('ঠিকানা মুছে ফেলা হয়েছে');
      fetchAddresses();
    } catch (err: any) {
      showToast('ত্রুটি: ' + err.message);
    }
  };

  const handleSetDefaultAddress = async (id: string) => {
    try {
      await supabase.from('addresses').update({ is_default: false }).eq('user_id', user.id);
      await supabase.from('addresses').update({ is_default: true }).eq('id', id);
      showToast('ডিফল্ট ঠিকানা পরিবর্তন করা হয়েছে');
      fetchAddresses();
    } catch (err: any) {
      showToast('ত্রুটি: ' + err.message);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showToast('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('পাসওয়ার্ড মিলছে না');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      showToast('পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showToast('ত্রুটি: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const wishlistProducts = products.filter((p) => wishlistIds.includes(p.id));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] bg-slate-900 text-white text-xs sm:text-sm font-bold px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 backdrop-blur border border-slate-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-pink-600 transition"
          >
            <ArrowLeft className="w-4 h-4" /> ওয়েবসাইটে ফিরে যান
          </button>
          <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900">
            আমার অ্যাকাউন্ট
          </h1>
          <button
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold px-3 py-1.5 rounded-full transition"
          >
            <LogOut className="w-3.5 h-3.5" /> লগআউট
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Sidebar / Tabs */}
          <div className="lg:col-span-1 space-y-2">
            <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/80 space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="w-12 h-12 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center font-black text-lg overflow-hidden shrink-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    fullName.charAt(0).toUpperCase() || 'U'
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-extrabold text-sm text-slate-900 truncate">{fullName || 'ব্যবহারকারী'}</h3>
                  <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                </div>
              </div>

              <nav className="space-y-1">
                {[
                  { id: 'profile', label: 'প্রোফাইল তথ্য', icon: User },
                  { id: 'addresses', label: 'ডেলিভারি ঠিকানা', icon: MapPin },
                  { id: 'orders', label: 'আমার অর্ডারসমূহ', icon: Package, badge: orders.length },
                  { id: 'wishlist', label: 'পছন্দের তালিকা', icon: Heart, badge: wishlistIds.length },
                  { id: 'password', label: 'পাসওয়ার্ড পরিবর্তন', icon: Lock },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition ${
                        active
                          ? 'bg-pink-600 text-white shadow-md shadow-pink-500/20'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4" />
                        {tab.label}
                      </span>
                      {typeof tab.badge === 'number' && tab.badge > 0 && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${active ? 'bg-white text-pink-600' : 'bg-slate-100 text-slate-700'}`}>
                          {toBn(tab.badge)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">

            {/* 1. Profile Info Tab */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-6">
                <div>
                  <h2 className="text-lg font-black text-slate-900">ব্যক্তিগত তথ্য</h2>
                  <p className="text-xs text-slate-500 mt-0.5">আপনার নাম, ফোন নম্বর ও প্রোফাইল ছবি আপডেট করুন</p>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-xl">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">পূর্ণ নাম</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">ইমেইল এড্রেস (পরিবর্তনযোগ্য নয়)</label>
                    <input
                      type="email"
                      disabled
                      value={user?.email || ''}
                      className="w-full bg-slate-100 text-slate-500 border border-slate-200 rounded-xl p-3 text-xs cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">ফোন নম্বর</label>
                    <input
                      type="text"
                      placeholder="017xxxxxxxx"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">প্রোফাইল ছবির URL (ঐচ্ছিক)</label>
                    <input
                      type="url"
                      placeholder="https://example.com/avatar.jpg"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs px-6 py-3.5 rounded-xl shadow-lg shadow-pink-500/20 transition disabled:opacity-50"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>সংরক্ষণ করুন</span>
                  </button>
                </form>
              </div>
            )}

            {/* 2. Addresses Tab */}
            {activeTab === 'addresses' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-lg font-black text-slate-900">ডেলিভারি ঠিকানা</h2>
                    <p className="text-xs text-slate-500 mt-0.5">আপনার সেভ করা শিপিং এড্রেসসমূহ</p>
                  </div>
                  {!isEditingAddress && (
                    <button
                      onClick={() => {
                        setEditingAddressId(null);
                        setAddrForm({ full_name: fullName, phone, address_line: '', city: 'ঢাকা', district: 'ঢাকা', postal_code: '', is_default: addresses.length === 0 });
                        setIsEditingAddress(true);
                      }}
                      className="inline-flex items-center gap-1.5 bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition"
                    >
                      <Plus className="w-4 h-4" /> নতুন ঠিকানা যোগ করুন
                    </button>
                  )}
                </div>

                {isEditingAddress ? (
                  <form onSubmit={handleSaveAddress} className="space-y-4 max-w-xl bg-pink-50/50 p-5 rounded-2xl border border-pink-100">
                    <h3 className="text-sm font-black text-slate-900">{editingAddressId ? 'ঠিকানা সম্পাদনা করুন' : 'নতুন ঠিকানা যোগ করুন'}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">প্রাপকের নাম</label>
                        <input
                          type="text"
                          required
                          value={addrForm.full_name}
                          onChange={(e) => setAddrForm({ ...addrForm, full_name: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">ফোন নম্বর</label>
                        <input
                          type="text"
                          required
                          value={addrForm.phone}
                          onChange={(e) => setAddrForm({ ...addrForm, phone: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">পূর্ণ ঠিকানা (বাসা নং, রোড, এলাকা)</label>
                      <textarea
                        required
                        rows={2}
                        value={addrForm.address_line}
                        onChange={(e) => setAddrForm({ ...addrForm, address_line: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">শহর / অঞ্চল</label>
                        <input
                          type="text"
                          value={addrForm.city}
                          onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">জেলা</label>
                        <input
                          type="text"
                          value={addrForm.district}
                          onChange={(e) => setAddrForm({ ...addrForm, district: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="default_addr"
                        checked={addrForm.is_default}
                        onChange={(e) => setAddrForm({ ...addrForm, is_default: e.target.checked })}
                        className="w-4 h-4 text-pink-600 rounded border-slate-300 focus:ring-pink-500"
                      />
                      <label htmlFor="default_addr" className="text-xs font-bold text-slate-700 cursor-pointer">
                        এটি প্রধান (Default) ঠিকানা হিসেবে সেট করুন
                      </label>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition"
                      >
                        সেভ করুন
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingAddress(false)}
                        className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs px-5 py-2.5 rounded-xl transition"
                      >
                        বাতিল
                      </button>
                    </div>
                  </form>
                ) : addresses.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-700">কোনো ঠিকানা সেভ করা নেই</p>
                    <p className="text-xs text-slate-400 mt-1">অর্ডার করার সুবিধার্থে আপনার ডেলিভারি ঠিকানা যোগ করুন।</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((addr) => (
                      <div key={addr.id} className={`p-4 rounded-2xl border transition relative ${addr.is_default ? 'bg-pink-50/40 border-pink-300 shadow-sm' : 'bg-white border-slate-200'}`}>
                        {addr.is_default && (
                          <span className="absolute top-4 right-4 bg-pink-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full">
                            ডিফল্ট
                          </span>
                        )}
                        <h4 className="font-extrabold text-sm text-slate-900">{addr.full_name}</h4>
                        <p className="text-xs text-slate-600 mt-1 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" /> {addr.phone}</p>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{addr.address_line}, {addr.city}, {addr.district}</p>
                        
                        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
                          {!addr.is_default && (
                            <button
                              onClick={() => handleSetDefaultAddress(addr.id)}
                              className="text-pink-600 font-bold hover:underline"
                            >
                              প্রধান করুন
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setEditingAddressId(addr.id);
                              setAddrForm({
                                full_name: addr.full_name,
                                phone: addr.phone,
                                address_line: addr.address_line,
                                city: addr.city || 'ঢাকা',
                                district: addr.district || 'ঢাকা',
                                postal_code: addr.postal_code || '',
                                is_default: addr.is_default,
                              });
                              setIsEditingAddress(true);
                            }}
                            className="text-slate-600 font-bold hover:text-blue-600 inline-flex items-center gap-1 ml-auto"
                          >
                            <Pencil className="w-3.5 h-3.5" /> এডিট
                          </button>
                          <button
                            onClick={() => handleDeleteAddress(addr.id)}
                            className="text-rose-600 font-bold hover:text-rose-700 inline-flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> ডিলিট
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 3. Orders Tab */}
            {activeTab === 'orders' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-6">
                <div>
                  <h2 className="text-lg font-black text-slate-900">আমার অর্ডারসমূহ</h2>
                  <p className="text-xs text-slate-500 mt-0.5">আপনার অতীতের সকল অর্ডারের ইতিহাস ও স্ট্যাটাস</p>
                </div>

                {orders.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-700">কোনো অর্ডার করা হয়নি</p>
                    <p className="text-xs text-slate-400 mt-1">আমাদের কালেকশন থেকে আপনার পছন্দের গ্যাজেট অর্ডার করুন।</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.map((ord) => {
                      const items = ord.order_items || ord.items || [];
                      const statusColor =
                        ord.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                        ord.status === 'cancelled' ? 'bg-rose-100 text-rose-700' :
                        ord.status === 'shipped' ? 'bg-violet-100 text-violet-700' : 'bg-amber-100 text-amber-700';

                      const statusName =
                        ord.status === 'delivered' ? 'ডেলিভারি সম্পন্ন' :
                        ord.status === 'cancelled' ? 'বাতিলকৃত' :
                        ord.status === 'shipped' ? 'শিপমেন্টে আছে' : 'প্রক্রিয়াধীন';

                      return (
                        <div key={ord.id} className="p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-pink-200 transition bg-white space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                            <div>
                              <span className="text-xs font-bold text-slate-500">অর্ডার আইডি:</span>
                              <span className="text-xs font-black text-slate-900 ml-1">#{ord.order_number}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${statusColor}`}>
                                {statusName}
                              </span>
                              <span className="text-xs text-slate-400">
                                {new Date(ord.created_at).toLocaleDateString('en-GB')}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-4">
                            <div className="text-xs text-slate-600">
                              <p className="font-bold text-slate-800">{ord.customer_name} ({ord.phone})</p>
                              <p className="truncate max-w-md">{ord.address}</p>
                              <p className="text-slate-500 mt-0.5">পেমেন্ট: {ord.payment_method === 'COD' ? 'ক্যাশ অন ডেলিভারি' : ord.payment_method}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-xs text-slate-500">মোট মূল্য</p>
                              <p className="text-sm sm:text-base font-black text-pink-600">৳{toBn(ord.total.toLocaleString('en-US'))}</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2">
                            <span className="text-xs text-slate-500 font-medium">{toBn(items.length)} টি আইটেম</span>
                            <button
                              onClick={() => setSelectedOrder(ord)}
                              className="text-xs font-bold text-pink-600 hover:underline inline-flex items-center gap-1"
                            >
                              বিস্তারিত দেখুন <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 4. Wishlist Tab */}
            {activeTab === 'wishlist' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-6">
                <div>
                  <h2 className="text-lg font-black text-slate-900">পছন্দের তালিকা (Wishlist)</h2>
                  <p className="text-xs text-slate-500 mt-0.5">আপনার সেভ করা পছন্দের গ্যাজেটসমূহ</p>
                </div>

                {wishlistProducts.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <Heart className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-700">উইশলিস্ট খালি আছে</p>
                    <p className="text-xs text-slate-400 mt-1">পণ্য ব্রাউজ করার সময় হার্ট আইকনে ক্লিক করে উইশলিস্টে যুক্ত করুন।</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {wishlistProducts.map((p) => (
                      <div key={p.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-sm hover:border-pink-300 transition">
                        <button onClick={() => onSelectProduct(p)} className="flex items-center gap-3 text-left">
                          <img src={p.image_url} alt="" className="w-16 h-16 rounded-xl object-cover bg-slate-50 shrink-0" />
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs text-slate-900 truncate">{p.name_bn || p.name}</h4>
                            <p className="text-sm font-black text-pink-600 mt-1">৳{toBn(p.price)}</p>
                          </div>
                        </button>
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                          <button
                            onClick={() => onAddToCart(p, 1)}
                            className="flex-1 bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs py-2 rounded-xl transition text-center"
                          >
                            কার্টে নিন
                          </button>
                          <button
                            onClick={() => onToggleWishlist(p.id)}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-rose-600 transition"
                            title="রিমুভ করুন"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 5. Password Tab */}
            {activeTab === 'password' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-6">
                <div>
                  <h2 className="text-lg font-black text-slate-900">পাসওয়ার্ড পরিবর্তন</h2>
                  <p className="text-xs text-slate-500 mt-0.5">আপনার অ্যাকাউন্টের নিরাপত্তা নিশ্চিত করতে নতুন পাসওয়ার্ড সেট করুন</p>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">নতুন পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">নতুন পাসওয়ার্ড নিশ্চিত করুন</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs px-6 py-3.5 rounded-xl shadow-lg shadow-pink-500/20 transition disabled:opacity-50"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>পাসওয়ার্ড পরিবর্তন করুন</span>
                  </button>
                </form>
              </div>
            )}

          </div>

        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-base text-slate-900">অর্ডার বিবরণ #{selectedOrder.order_number}</h3>
                <p className="text-xs text-slate-500">{new Date(selectedOrder.created_at).toLocaleString('en-GB')}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="bg-slate-50 p-3 rounded-2xl space-y-1">
                <p><span className="font-bold">গ্রাহক:</span> {selectedOrder.customer_name}</p>
                <p><span className="font-bold">ফোন:</span> {selectedOrder.phone}</p>
                <p><span className="font-bold">ঠিকানা:</span> {selectedOrder.address}</p>
                <p><span className="font-bold">ডেলিভারি জোন:</span> {selectedOrder.delivery_zone}</p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-2">প্রোডাক্টস সমূহ:</h4>
                <div className="space-y-2">
                  {(selectedOrder.order_items || selectedOrder.items || []).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-white">
                      <div>
                        <p className="font-bold text-slate-800">{item.product_name}</p>
                        {item.variant && <p className="text-[11px] text-slate-500">ভ্যারিয়েন্ট: {item.variant}</p>}
                        <p className="text-[11px] text-slate-500">পরিমাণ: {toBn(item.quantity)} × ৳{toBn(item.unit_price)}</p>
                      </div>
                      <p className="font-black text-pink-600">৳{toBn(item.total)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-pink-50/50 p-3.5 rounded-2xl space-y-1.5 border border-pink-100 text-xs">
                <div className="flex justify-between"><span>সাবটোটাল</span><span>৳{toBn(selectedOrder.subtotal)}</span></div>
                <div className="flex justify-between"><span>ডেলিভারি চার্জ</span><span>৳{toBn(selectedOrder.delivery_charge)}</span></div>
                {selectedOrder.discount > 0 && <div className="flex justify-between text-emerald-600 font-bold"><span>ডিসকাউন্ট</span><span>-৳{toBn(selectedOrder.discount)}</span></div>}
                <div className="flex justify-between text-sm font-black pt-2 border-t border-pink-200 text-slate-900">
                  <span>সর্বমোট</span>
                  <span className="text-pink-600">৳{toBn(selectedOrder.total)}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedOrder(null)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-xs transition"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
