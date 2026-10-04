'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardHeader from '@/components/layout/DashboardHeader';
import { Coins, Plus, RefreshCw, ArrowUpRight, ArrowDownLeft, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';

export default function CreditsPage() {
  const [balanceData, setBalanceData] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadData = async () => {
    setLoading(true);
    try {
      const [balRes, txRes] = await Promise.all([
        fetch('/api/credits/balance'),
        fetch(`/api/credits/ledger?page=${page}&limit=15${typeFilter !== 'ALL' ? `&type=${typeFilter}` : ''}`),
      ]);
      const balData = await balRes.json();
      const txData = await txRes.json();

      if (balData.success) setBalanceData(balData);
      if (txData.success) {
        setTransactions(txData.transactions || []);
        setTotalPages(txData.pagination?.totalPages || 1);
      }
    } catch {}
    finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, typeFilter]);

  const isUnlimited = balanceData?.creditMode === 'UNLIMITED';

  return (
    <div className="flex-1 flex flex-col">
      <DashboardHeader
        title="Credit Wallet & Audit Ledger"
        description="Immutable double-entry transaction history for every billable SEO operation"
      >
        {!isUnlimited && (
          <Link
            href="/dashboard/payments"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md shadow-brand-500/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Purchase Credits</span>
          </Link>
        )}
      </DashboardHeader>

      <div className="p-6 space-y-6 max-w-6xl">
        {/* Balance Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Current Available Balance</span>
              <Coins className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-3xl font-extrabold text-white">
              {isUnlimited ? 'UNLIMITED' : balanceData?.balance?.toLocaleString() || 0}
            </div>
            <div className="text-[11px] text-slate-500">
              {isUnlimited ? 'System Owner Access (Bypass Billing)' : 'Consumable operation units'}
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Lifetime Credits Expended</span>
              <ArrowUpRight className="w-5 h-5 text-rose-400" />
            </div>
            <div className="text-3xl font-extrabold text-white">
              {balanceData?.lifetimeUsed?.toLocaleString() || 0}
            </div>
            <div className="text-[11px] text-slate-500">Total audits & inspections performed</div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Lifetime Purchased</span>
              <ArrowDownLeft className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-3xl font-extrabold text-white">
              {balanceData?.lifetimePurchased?.toLocaleString() || 0}
            </div>
            <div className="text-[11px] text-slate-500">Verified payment credit grants</div>
          </div>
        </div>

        {/* Ledger Filter & Table */}
        <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
          <div className="p-5 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white">Transaction Audit Ledger</h3>
              <p className="text-xs text-slate-400">Every credit adjustment with timestamp and reason</p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-1.5 rounded-xl bg-[#090e1a] border border-white/10 text-white text-xs focus:outline-none focus:border-brand-500"
              >
                <option value="ALL">All Types</option>
                <option value="PURCHASE">PURCHASE</option>
                <option value="USAGE">USAGE</option>
                <option value="BONUS">BONUS</option>
                <option value="ADMIN_ADD">ADMIN_ADD</option>
                <option value="ADMIN_REMOVE">ADMIN_REMOVE</option>
                <option value="REFUND">REFUND</option>
              </select>

              <button onClick={loadData} className="p-1.5 rounded-lg text-slate-400 hover:text-white">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#090e1a] text-slate-400 font-mono uppercase text-[10px] border-b border-white/5">
                <tr>
                  <th className="px-5 py-3.5">Timestamp</th>
                  <th className="px-4 py-3.5">Type</th>
                  <th className="px-4 py-3.5">Amount</th>
                  <th className="px-4 py-3.5">Balance After</th>
                  <th className="px-5 py-3.5">Reason / Operation</th>
                  <th className="px-5 py-3.5 font-mono">Idempotency Key</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                      Loading ledger entries...
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-slate-500">
                      No transactions recorded.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => {
                    const isCredit = tx.amount > 0;
                    return (
                      <tr key={tx.id} className="hover:bg-white/[0.02]">
                        <td className="px-5 py-3.5 text-slate-400 text-[11px] whitespace-nowrap">
                          {new Date(tx.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                              tx.type === 'PURCHASE' || tx.type === 'BONUS' || tx.type === 'ADMIN_ADD'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : tx.type === 'REFUND'
                                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {tx.type}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-mono font-bold">
                          <span className={isCredit ? 'text-emerald-400' : 'text-rose-400'}>
                            {isCredit ? `+${tx.amount}` : tx.amount}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-white">{tx.balanceAfter}</td>
                        <td className="px-5 py-3.5 text-slate-300 max-w-sm truncate">{tx.reason || 'Operation'}</td>
                        <td className="px-5 py-3.5 font-mono text-[10px] text-slate-500 max-w-[140px] truncate">
                          {tx.idempotencyKey || '—'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-400 bg-[#090e1a]">
            <span>Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="p-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
