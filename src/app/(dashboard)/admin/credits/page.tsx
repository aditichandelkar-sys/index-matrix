'use client';

import React, { useEffect, useState } from 'react';
import DashboardHeader from '@/components/layout/DashboardHeader';
import { Coins, Plus, Minus, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function AdminCreditsControlPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [targetUserId, setTargetUserId] = useState('');
  const [amount, setAmount] = useState(100);
  const [action, setAction] = useState<'ADD' | 'REMOVE'>('ADD');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetch('/api/admin/customers')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.customers) {
          setCustomers(data.customers);
          if (data.customers.length > 0) {
            setTargetUserId(data.customers[0].id);
          }
        }
      });
  }, []);

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || reason.trim().length < 5) {
      setNotification({ type: 'error', text: 'Mandatory audit reason must be at least 5 characters' });
      return;
    }

    setSubmitting(true);
    setNotification(null);

    try {
      const res = await fetch('/api/credits/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId,
          amount: Number(amount),
          action,
          reason,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setNotification({ type: 'error', text: data.error || 'Failed to adjust credits' });
      } else {
        setNotification({
          type: 'success',
          text: `Credits adjusted successfully! Resulting balance: ${data.result.balanceAfter}`,
        });
        setReason('');
      }
    } catch {
      setNotification({ type: 'error', text: 'Network request error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <DashboardHeader
        title="Owner Operations — Manual Credit Controls"
        description="Directly grant, deduct, or refund customer credits with mandatory compliance audit logging"
      />

      <div className="p-6 max-w-3xl space-y-6">
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

        <div className="glass-panel p-8 rounded-2xl border border-white/5 space-y-6">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <span>Audited Credit Adjustment Form</span>
          </div>

          <form onSubmit={handleAdjust} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Select Customer Account</label>
              <select
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#090e1a] border border-white/10 text-white text-xs focus:outline-none focus:border-brand-500"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.email}) — Current Balance: {c.wallet?.balance || 0}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Adjustment Action</label>
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#090e1a] border border-white/10 text-white text-xs focus:outline-none focus:border-brand-500 font-bold"
                >
                  <option value="ADD">ADD CREDITS (+)</option>
                  <option value="REMOVE">REMOVE CREDITS (-)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Number of Credits</label>
                <input
                  type="number"
                  min="1"
                  max="1000000"
                  required
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#090e1a] border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Audit Reason (Mandatory for Compliance)
              </label>
              <textarea
                rows={3}
                required
                minLength={5}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Enterprise promotional grant approved by management"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#090e1a] border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-amber-500/20 transition-all"
            >
              {submitting ? 'Applying Adjustment...' : 'Apply & Record Audit Entry'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
