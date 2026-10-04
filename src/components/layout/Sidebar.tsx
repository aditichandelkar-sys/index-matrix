'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Layers,
  LayoutDashboard,
  FolderGit2,
  Globe,
  UploadCloud,
  FileCode,
  Search,
  Activity,
  Coins,
  CreditCard,
  Key,
  Settings,
  Users,
  ShieldAlert,
  Sliders,
  LogOut,
  Sparkles,
  ChevronRight,
  Zap,
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          setUser(data.user);
        }
      })
      .catch(() => {});
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const isOwner = user?.role === 'OWNER';
  const isUnlimited = user?.creditMode === 'UNLIMITED';

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: '⚡ Quick Indexer', href: '/quick-index', icon: Zap },
    { label: 'Projects', href: '/projects', icon: FolderGit2 },
    { label: 'URLs', href: '/urls', icon: Globe },
    { label: 'Bulk Import', href: '/import', icon: UploadCloud },
    { label: 'Google Connections', href: '/google', icon: Search },
    { label: 'XML Sitemaps', href: '/sitemaps', icon: FileCode },
    { label: 'Indexing Jobs', href: '/jobs', icon: Activity },
    { label: 'Monitoring', href: '/monitoring', icon: Activity },
    { label: 'Credit Wallet', href: '/credits', icon: Coins },
    { label: 'Billing & Payments', href: '/payments', icon: CreditCard },
    { label: 'API Keys', href: '/api-keys', icon: Key },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  const adminItems = [
    { label: 'All Customers', href: '/admin/customers', icon: Users },
    { label: 'Credit Controls', href: '/admin/credits', icon: Coins },
    { label: 'Audit Logs', href: '/admin/logs', icon: ShieldAlert },
    { label: 'System Settings', href: '/admin/settings', icon: Sliders },
  ];

  return (
    <aside className="w-64 bg-[#090e1a] border-r border-white/5 flex flex-col h-screen sticky top-0 shrink-0">
      {/* Brand */}
      <div className="p-5 border-b border-white/5 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-cyan-400 flex items-center justify-center shadow-md shadow-brand-500/20">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold tracking-tight text-sm text-white font-sans">
              INDEX <span className="text-brand-400">MATRIX</span>
            </span>
            <span className="text-[9px] tracking-widest text-slate-400 uppercase font-mono">
              Control Center
            </span>
          </div>
        </Link>
      </div>

      {/* Credit Balance Card */}
      <div className="p-4 mx-3 mt-3 rounded-xl bg-surface-200/50 border border-white/5">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span>Credit Balance</span>
          {isUnlimited ? (
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 font-bold border border-brand-500/30">
              OWNER
            </span>
          ) : (
            <Link href="/dashboard/payments" className="text-brand-400 hover:text-brand-300 font-semibold text-[11px]">
              + Buy More
            </Link>
          )}
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl font-extrabold text-white">
            {isUnlimited ? 'UNLIMITED' : user?.balance?.toLocaleString() || 0}
          </span>
          {!isUnlimited && <span className="text-[11px] text-slate-400">credits</span>}
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 px-3 py-1">
          Workspace
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-brand-600/15 text-brand-300 border border-brand-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <item.icon className={`w-4 h-4 ${isActive ? 'text-brand-400' : 'text-slate-500'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* Owner Controls */}
        {isOwner && (
          <div className="pt-4 space-y-1">
            <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400/80 px-3 py-1 flex items-center justify-between">
              <span>Owner Operations</span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            </div>
            {adminItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <item.icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* User Footer & Logout */}
      <div className="p-3 border-t border-white/5 flex items-center justify-between bg-[#070b14]/50">
        <div className="flex flex-col min-w-0 pr-2">
          <span className="text-xs font-semibold text-white truncate">{user?.name || 'Loading...'}</span>
          <span className="text-[10px] text-slate-400 font-mono truncate">{user?.email}</span>
        </div>
        <button
          onClick={handleLogout}
          title="Sign out"
          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
