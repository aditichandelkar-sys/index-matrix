'use client';

import React, { useEffect, useState } from 'react';
import DashboardHeader from '@/components/layout/DashboardHeader';
import { Users, Search, RefreshCw, ShieldAlert, CheckCircle2, Sliders, AlertCircle } from 'lucide-react';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/customers?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.success) {
        setCustomers(data.customers || []);
      }
    } catch {}
    finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      const res = await fetch('/api/admin/customers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status: nextStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setNotification({ type: 'success', text: `Customer account updated to ${nextStatus}` });
        loadCustomers();
      }
    } catch {
      setNotification({ type: 'error', text: 'Failed to update customer status' });
    }
  };

  const handleToggleCreditMode = async (userId: string, currentMode: string) => {
    const nextMode = currentMode === 'LIMITED' ? 'UNLIMITED' : 'LIMITED';
    try {
      const res = await fetch('/api/admin/customers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, creditMode: nextMode }),
      });
      const data = await res.json();
      if (data.success) {
        setNotification({ type: 'success', text: `Customer creditMode set to ${nextMode}` });
        loadCustomers();
      }
    } catch {
      setNotification({ type: 'error', text: 'Failed to update credit mode' });
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <DashboardHeader
        title="Owner Operations — Customer Directory"
        description="Search customers, view credit balances, manage account suspensions and credit modes"
      />

      <div className="p-6 max-w-6xl space-y-6">
        {notification && (
          <div
            className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
              notification.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
            }`}
          >
            <span>{notification.text}</span>
            <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Search Bar */}
        <div className="glass-panel p-4 rounded-2xl border border-white/5 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by customer email or organization name..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#090e1a] border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>
          <button
            onClick={loadCustomers}
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold"
          >
            Filter
          </button>
        </div>

        {/* Customers Table */}
        <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Registered Customer Accounts ({customers.length})</h3>
            <button onClick={loadCustomers} className="p-1.5 rounded-lg text-slate-400 hover:text-white">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#090e1a] text-slate-400 font-mono uppercase text-[10px] border-b border-white/5">
                <tr>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-4 py-3.5">Role</th>
                  <th className="px-4 py-3.5">Credit Mode</th>
                  <th className="px-4 py-3.5">Balance</th>
                  <th className="px-4 py-3.5">Projects</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Owner Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                      No customer accounts found matching criteria.
                    </td>
                  </tr>
                ) : (
                  customers.map((c) => (
                    <tr key={c.id} className="hover:bg-white/[0.02]">
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-white">{c.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{c.email}</div>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-[10px]">
                        <span className={c.role === 'OWNER' ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                          {c.role}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-[10px]">
                        <button
                          onClick={() => handleToggleCreditMode(c.id, c.creditMode)}
                          title="Click to toggle creditMode"
                          className="hover:underline text-cyan-300"
                        >
                          {c.creditMode}
                        </button>
                      </td>
                      <td className="px-4 py-3.5 font-mono font-bold text-white">
                        {c.creditMode === 'UNLIMITED' ? 'UNLIMITED' : c.wallet?.balance || 0}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-400">{c._count?.projects || 0}</td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                            c.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => handleToggleStatus(c.id, c.status)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                            c.status === 'ACTIVE'
                              ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300'
                              : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300'
                          }`}
                        >
                          {c.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
