'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Layers, ArrowRight, Lock, Mail, User, AlertCircle, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to create account');
        setLoading(false);
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070b14] px-4 py-12">
      <div className="max-w-md w-full">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-4 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold tracking-tight text-xl text-white">
              INDEX <span className="text-brand-400">MATRIX</span>
            </span>
          </Link>
          <h2 className="text-2xl font-bold text-white tracking-tight">Create your SaaS account</h2>
          <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Includes 50 Free Welcome Credits</span>
          </div>
        </div>

        {/* Register Card */}
        <div className="glass-panel p-8 rounded-2xl border border-white/10 shadow-2xl">
          {error && (
            <div className="mb-6 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Full Name or Agency Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Alex Rivera"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#090e1a] border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Work Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="alex@company.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#090e1a] border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Password (min. 8 characters)</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#090e1a] border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div className="text-[11px] text-slate-400 leading-normal">
              By creating an account you agree to our{' '}
              <Link href="/terms" className="text-brand-400 hover:underline">
                Terms
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-brand-400 hover:underline">
                Privacy Policy
              </Link>.
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-brand-600 to-cyan-500 hover:from-brand-500 hover:to-cyan-400 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-xs shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 transition-all"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Get Started (Claim 50 Credits)
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/5 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link href="/login" className="text-brand-400 hover:text-brand-300 font-semibold">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
