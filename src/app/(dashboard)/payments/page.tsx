'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardHeader from '@/components/layout/DashboardHeader';
import { CreditCard, CheckCircle2, AlertCircle, RefreshCw, Zap, ExternalLink } from 'lucide-react';
import { CREDIT_PACKAGES } from '@/lib/payments';

function PaymentsContent() {
  const searchParams = useSearchParams();
  const sandboxVerifyParam = searchParams.get('sandbox_verify');

  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/payments/history');
      const data = await res.json();
      if (data.success) setPayments(data.payments || []);
    } catch {}
    finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
    if (sandboxVerifyParam) {
      handleVerifySandbox(sandboxVerifyParam);
    }
  }, []);

  const handleVerifySandbox = async (orderId: string) => {
    try {
      const res = await fetch('/api/payments/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-payment-provider': 'sandbox' },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (data.success) {
        setNotification({
          type: 'success',
          text: `Sandbox Payment Verified! Credits have been credited to your wallet.`,
        });
        loadPayments();
      }
    } catch {
      setNotification({ type: 'error', text: 'Failed to verify payment.' });
    }
  };

  const handlePurchase = async (packageId: string) => {
    setBuyingId(packageId);
    setNotification(null);

    try {
      const res = await fetch('/api/payments/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setNotification({ type: 'error', text: data.error || 'Failed to create payment session' });
        setBuyingId(null);
        return;
      }

      if (data.provider === 'sandbox') {
        // Immediate sandbox verification simulation
        await handleVerifySandbox(data.orderId);
      } else {
        setNotification({
          type: 'success',
          text: `Checkout initiated for Order ID ${data.orderId}. Follow external provider flow.`,
        });
      }
    } catch {
      setNotification({ type: 'error', text: 'Network request error' });
    } finally {
      setBuyingId(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <DashboardHeader
        title="Billing & Credit Purchases"
        description="Top up operation credits with secure, provider-independent payment processing"
      />

      <div className="p-6 max-w-6xl space-y-8">
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

        {/* Pricing Cards */}
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono mb-4">
            Available Credit Packages
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {CREDIT_PACKAGES.map((pkg) => (
              <div
                key={pkg.id}
                className={`glass-panel p-6 rounded-2xl border flex flex-col justify-between relative ${
                  pkg.popular
                    ? 'border-brand-500 shadow-xl shadow-brand-500/15 bg-brand-950/20'
                    : 'border-white/5'
                }`}
              >
                <div>
                  <h4 className="text-sm font-bold text-white">{pkg.name}</h4>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-white">${pkg.priceCents / 100}</span>
                    <span className="text-[11px] text-slate-400">one-time</span>
                  </div>
                  <p className="text-[11px] text-brand-400 font-mono mt-0.5">
                    ${(pkg.priceCents / 100 / pkg.credits).toFixed(3)} / credit
                  </p>

                  <div className="mt-4 pt-4 border-t border-white/5 space-y-2 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span><strong>{pkg.credits.toLocaleString()}</strong> Operation Credits</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Instant Credit Fulfillment</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handlePurchase(pkg.id)}
                  disabled={buyingId === pkg.id}
                  className="mt-6 w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-semibold text-xs shadow-md shadow-brand-500/20 transition-all flex items-center justify-center gap-1.5"
                >
                  {buyingId === pkg.id ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-3.5 h-3.5" />
                      Purchase Package
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Payment History */}
        <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Payment Invoices & Orders</h3>
              <p className="text-xs text-slate-400">Past credit purchases and webhook fulfillment status</p>
            </div>
            <button onClick={loadPayments} className="p-1.5 rounded-lg text-slate-400 hover:text-white">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#090e1a] text-slate-400 font-mono uppercase text-[10px] border-b border-white/5">
                <tr>
                  <th className="px-5 py-3.5">Order ID</th>
                  <th className="px-4 py-3.5">Provider</th>
                  <th className="px-4 py-3.5">Amount</th>
                  <th className="px-4 py-3.5">Credits Granted</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                      No payment records found.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id} className="hover:bg-white/[0.02]">
                      <td className="px-5 py-3.5 font-mono text-white">{p.providerTxId}</td>
                      <td className="px-4 py-3.5 uppercase font-mono text-[10px] text-slate-400">{p.provider}</td>
                      <td className="px-4 py-3.5 font-mono text-white">${(p.amountCents / 100).toFixed(2)}</td>
                      <td className="px-4 py-3.5 font-mono font-bold text-emerald-400">+{p.creditsGranted}</td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                            p.status === 'SUCCESS'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 text-[11px]">
                        {new Date(p.createdAt).toLocaleDateString()}
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

export default function PaymentsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-xs text-slate-400">Loading billing & payments...</div>}>
      <PaymentsContent />
    </Suspense>
  );
}
