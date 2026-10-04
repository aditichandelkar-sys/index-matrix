import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#070b14]">
      <Navbar />
      <main className="flex-1 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <h1 className="text-3xl font-extrabold text-white">Terms of Service</h1>
            <p className="text-xs text-slate-400 mt-2">Effective: October 2026</p>
          </div>

          <div className="glass-panel p-8 rounded-2xl border border-white/5 space-y-6 text-xs text-slate-300 leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">1. Acceptance of Terms</h2>
              <p>
                By creating an account or accessing INDEX MATRIX, you agree to comply with these Terms of Service, applicable laws, and third-party API policies (including Google Search Console terms).
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">2. No Guaranteed Indexing Disclaimer</h2>
              <p>
                INDEX MATRIX is an independent technical analysis and diagnostic tool. Search engines (including Google) operate proprietary algorithms that evaluate crawling priority, content quality, and relevance. INDEX MATRIX does NOT guarantee search placement, indexing speed, or ranking outcomes.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">3. Acceptable Use Policy</h2>
              <p>
                You may not use INDEX MATRIX to perform denial-of-service probes, scan internal network addresses, impersonate Google crawlers, or submit content violating search engine spam policies. Any abusive behavior results in immediate account suspension.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">4. Credit System & Billing</h2>
              <p>
                Operation credits are deducted per billable action. Purchased credits do not expire while your account remains active. All transactions are logged in an immutable audit ledger.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
