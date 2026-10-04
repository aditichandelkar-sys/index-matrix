import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { CREDIT_PACKAGES } from '@/lib/payments';

export default function PricingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#070b14]">
      <Navbar />
      <main className="flex-1 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-xs font-mono uppercase tracking-widest text-brand-400 mb-2">Credit Pricing</h1>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
              Simple, Transparent Credit Packages
            </h2>
            <p className="mt-4 text-slate-300 text-sm leading-relaxed">
              No subscription lock-in. Credits never expire. Use them for URL audits, Search Console inspections, and sitemap processing at your own pace.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {CREDIT_PACKAGES.map((pkg) => (
              <div
                key={pkg.id}
                className={`glass-panel p-8 rounded-2xl border flex flex-col justify-between relative ${
                  pkg.popular
                    ? 'border-brand-500 shadow-2xl shadow-brand-500/20 bg-brand-950/20'
                    : 'border-white/5'
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-brand-500 to-cyan-400 text-white text-[11px] font-bold py-0.5 px-3 rounded-full uppercase tracking-wider shadow-md">
                    Most Popular
                  </div>
                )}

                <div>
                  <h3 className="text-base font-bold text-white">{pkg.name}</h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-white">${pkg.priceCents / 100}</span>
                    <span className="text-xs text-slate-400">one-time</span>
                  </div>
                  <p className="mt-1 text-xs text-brand-400 font-mono">
                    ${(pkg.priceCents / 100 / pkg.credits).toFixed(3)} / credit
                  </p>

                  <div className="mt-6 pt-6 border-t border-white/5 space-y-3 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span><strong>{pkg.credits.toLocaleString()}</strong> Operation Credits</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>URL Audits: 1 cr each</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>GSC Inspections: 2 cr each</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Sitemap Parsing: 5 cr each</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Public REST API Access</span>
                    </div>
                  </div>
                </div>

                <Link
                  href="/register"
                  className={`mt-8 w-full py-3 rounded-xl text-center text-sm font-semibold transition-all ${
                    pkg.popular
                      ? 'bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-500/30'
                      : 'bg-white/5 hover:bg-white/10 text-white'
                  }`}
                >
                  Buy Package
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-16 max-w-2xl mx-auto glass-panel p-6 rounded-2xl border border-white/5 text-center text-xs text-slate-400 leading-relaxed">
            <h4 className="font-bold text-white text-sm mb-1">Looking for high-volume custom billing?</h4>
            <p>
              We support custom enterprise credit commitments and dedicated queue throughput for agencies processing over 500,000 URLs monthly. Contact our enterprise engineering team.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
