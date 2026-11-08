import React from 'react';
import { X, Menu } from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  group: 'main' | 'catalog' | 'marketing' | 'system';
  badge?: number;
  pinned?: boolean;
}

interface AdminShellProps {
  nav: NavItem[];
  page: string;
  onNavigate: (id: string) => void;
  onBackToSite: () => void;
  onLogoutClick: () => void;
  loading: boolean;
  error: string | null;
  children: React.ReactNode;
  navOpen: boolean;
  setNavOpen: (open: boolean) => void;
}

export const AdminShell: React.FC<AdminShellProps> = ({
  nav,
  page,
  onNavigate,
  onBackToSite,
  onLogoutClick,
  loading,
  error,
  children,
  navOpen,
  setNavOpen,
}) => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-900">
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      
      {navOpen && <div className="lg:hidden fixed inset-0 bg-black/40 z-40" onClick={() => setNavOpen(false)} />}
      
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0F172A] text-slate-300 flex flex-col shrink-0 transition-transform duration-300 lg:static lg:translate-x-0 ${navOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
          <span className="text-lg font-bold text-white">Admin</span>
          <button className="lg:hidden p-1.5 rounded-lg hover:bg-slate-800" onClick={() => setNavOpen(false)}><X className="w-5 h-5 text-white" /></button>
        </div>
        <nav className="flex-1 space-y-1 p-4 overflow-y-auto hide-scrollbar">
          {nav.map((n) => (
            <button
              key={n.id}
              onClick={() => { onNavigate(n.id); setNavOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition ${
                page === n.id ? 'bg-[#1D4ED8] text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {n.icon}
              <span className="text-left">{n.label}</span>
              {n.badge !== undefined && n.badge > 0 && (
                <span className="ml-auto text-[10px] font-bold rounded-full bg-[#1D4ED8] text-white px-2 py-0.5">{n.badge}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800 flex flex-col gap-2">
          <button onClick={onBackToSite} className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition">
            <span>ওয়েবসাইটে ফিরুন</span>
          </button>
          <button onClick={onLogoutClick} className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-rose-400 hover:bg-rose-900/50 hover:text-rose-100 transition">
            <span>লগআউট</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto hide-scrollbar">
        {loading && <div className="h-1 bg-[#1D4ED8] animate-pulse" />}
        {error && <div className="m-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3">{error}</div>}
        <header className="sticky top-0 z-30 bg-white px-6 py-4 flex items-center justify-between border-b border-slate-200 lg:hidden">
          <button className="p-2 rounded-lg hover:bg-slate-100" onClick={() => setNavOpen(true)}><Menu className="w-5 h-5" /></button>
          <span className="font-bold text-slate-900">Admin</span>
          <div />
        </header>
        <div className="p-6 sm:p-8">{children}</div>
      </main>
    </div>
  );
};

interface StatCardProps {
  label: string;
  value: string;
  delta: number | null;
  icon: React.ReactNode;
  tone: 'brand' | 'emerald' | 'slate' | 'amber';
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, delta, icon, tone }) => {
  const tones = {
    brand: 'bg-brand text-white',
    emerald: 'bg-emerald-100 text-emerald-700',
    slate: 'bg-slate-100 text-slate-700',
    amber: 'bg-amber-100 text-amber-700',
  };
  
  return (
    <div className="rounded-2xl p-5 bg-white border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-slate-600">{label}</span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${tones[tone]}`}>{icon}</div>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-extrabold">{value}</span>
        {delta !== null && (
            <span className={`text-xs font-bold ${delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {delta >= 0 ? '+' : ''}{delta.toFixed(1)}%
            </span>
        )}
      </div>
    </div>
  );
};
