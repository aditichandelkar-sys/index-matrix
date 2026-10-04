'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardHeader from '@/components/layout/DashboardHeader';
import {
  ShieldAlert,
  Users,
  Coins,
  Sliders,
  Key,
  ArrowRight,
  Database,
  Server,
  Activity,
  CheckCircle2,
} from 'lucide-react';

export default function AdminOverviewPage() {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeWallets: 0,
    totalLogs: 0,
    serviceAccountActive: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAdminSummary() {
      try {
        const [custRes, logsRes, saRes] = await Promise.all([
          fetch('/api/admin/customers').catch(() => null),
          fetch('/api/admin/logs?limit=5').catch(() => null),
          fetch('/api/admin/google-service-account').catch(() => null),
        ]);

        const custData = custRes ? await custRes.json() : null;
        const logsData = logsRes ? await logsRes.json() : null;
        const saData = saRes ? await saRes.json() : null;

        setStats({
          totalCustomers: custData?.customers?.length || 0,
          activeWallets: custData?.customers?.filter((c: any) => c.status === 'ACTIVE').length || 0,
          totalLogs: logsData?.pagination?.total || 0,
          serviceAccountActive: saData?.connected || false,
        });
      } catch (err) {
        console.error('Failed to load admin summary:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAdminSummary();
  }, []);

  const adminModules = [
    {
      title: 'Customer Directory',
      description: 'Inspect all customer accounts, project counts, API keys, and account standing.',
      href: '/admin/customers',
      icon: Users,
      badge: `${stats.totalCustomers} Accounts`,
      color: 'text-brand-400',
    },
    {
      title: 'Credit Controls',
      description: 'Audit balances, issue customer adjustments, grant bonuses, or manage rates.',
      href: '/admin/credits',
      icon: Coins,
      badge: 'Audit & Grants',
      color: 'text-amber-400',
    },
    {
      title: 'Security & Audit Logs',
      description: 'Track admin actions, API key generations, privilege elevations, and system events.',
      href: '/admin/logs',
      icon: ShieldAlert,
      badge: `${stats.totalLogs} Events`,
      color: 'text-rose-400',
    },
    {
      title: 'System Settings',
      description: 'Configure operational parameters, API keys, and default project quotas.',
      href: '/admin/settings',
      icon: Sliders,
      badge: 'Configuration',
      color: 'text-cyan-400',
    },
  ];

  return (
    <div className="flex-1 flex flex-col">
      <DashboardHeader
        title="Owner Operations & System Control"
        description="Comprehensive platform management, user ledger auditing, and security oversight"
      />

      <div className="p-6 max-w-6xl space-y-6">
        {/* System Health Overview Banner */}
        <div className="glass-panel p-6 rounded-2xl border border-amber-500/20 bg-amber-500/5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Owner Control Center</h2>
                <p className="text-xs text-slate-400">
                  You are authenticated with full root administrative privileges. All administrative operations are logged.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                UNLIMITED CREDITS
              </span>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                ACTIVE
              </span>
            </div>
          </div>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {adminModules.map((mod, i) => (
            <Link
              key={i}
              href={mod.href}
              className="glass-panel p-6 rounded-2xl border border-white/5 hover:border-amber-500/30 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <mod.icon className={`w-5 h-5 ${mod.color}`} />
                  </div>
                  <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-lg bg-white/5 text-slate-300 border border-white/5">
                    {mod.badge}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                  {mod.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  {mod.description}
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-400 group-hover:text-white">
                <span className="font-semibold">Open Management Console</span>
                <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
