import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function RefundPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#070b14]">
      <Navbar />
      <main className="flex-1 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <h1 className="text-3xl font-extrabold text-white">Refund Policy</h1>
            <p className="text-xs text-slate-400 mt-2">Effective: October 2026</p>
          </div>

          <div className="glass-panel p-8 rounded-2xl border border-white/5 space-y-6 text-xs text-slate-300 leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">1. Credit Purchases</h2>
              <p>
                Credits purchased on INDEX MATRIX represent consumable usage units for compute, API inspection queries, and sitemap processing. Unused credits from any purchase may be refunded within 14 days of purchase upon written request to support@indexmatrix.io.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">2. Consumed Credits</h2>
              <p>
                Once credits have been expended to perform server-side URL analyses, official Search Console URL inspections, or XML sitemap ingestions, those consumed credits are non-refundable, as compute resources and third-party API quotas have already been utilized.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">3. Technical Errors & System Adjustments</h2>
              <p>
                In the event of a platform system malfunction or failed job execution caused by INDEX MATRIX internal infrastructure, our automated retry and audit engine ensures credits are automatically credited back or adjusted by system administrators.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
