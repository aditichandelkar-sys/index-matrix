import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { ShieldCheck, Search, Database, FileCode, CheckCircle2, Zap, Lock, Cpu, Globe } from 'lucide-react';
import Link from 'next/link';

export default function FeaturesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#070b14]">
      <Navbar />
      <main className="flex-1 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-xs font-mono uppercase tracking-widest text-brand-400 mb-2">Platform Capabilities</h1>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
              Enterprise SEO & Indexing Infrastructure
            </h2>
            <p className="mt-4 text-slate-300 text-sm leading-relaxed">
              Every component in INDEX MATRIX is purpose-built to deliver deterministic data, eliminate false positives, and strictly adhere to Google policies.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass-panel p-8 rounded-2xl border border-white/5 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-white">SSRF-Hardened URL Diagnostics</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Prior to opening any network connection, INDEX MATRIX resolves hostnames via DNS and filters out private RFC 1918 subnets, IPv6 loopbacks, and cloud provider metadata addresses.
              </p>
              <ul className="space-y-2 text-xs text-slate-300 pt-2 border-t border-white/5">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Multi-hop 301/302 redirect chain trace with per-hop SSRF validation
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Response latency and HTTP status code tracking
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> HTML DOM title, description, and canonical tag cross-check
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> X-Robots-Tag HTTP header and robots meta noindex detection
                </li>
              </ul>
            </div>

            <div className="glass-panel p-8 rounded-2xl border border-white/5 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-white">Official Google Search Console Sync</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Seamless OAuth 2.0 connection retrieves your verified domain and URL-prefix properties with encrypted token persistence and automatic token refresh.
              </p>
              <ul className="space-y-2 text-xs text-slate-300 pt-2 border-t border-white/5">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Official Google URL Inspection API verdict & coverage state
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Accurate property matching supporting sc-domain: and URL prefixes
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Live Googlebot crawl date and page fetch state telemetry
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Google-selected vs user-declared canonical comparison
                </li>
              </ul>
            </div>

            <div className="glass-panel p-8 rounded-2xl border border-white/5 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400">
                <FileCode className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-white">XML Sitemap Processing Engine</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Stream and ingest standard XML sitemaps and nested sitemap index hierarchies containing up to 10,000 URLs with automatic deduplication.
              </p>
              <ul className="space-y-2 text-xs text-slate-300 pt-2 border-t border-white/5">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Automated duplicate URL detection and normalization
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Bulk import progress with error reporting
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> CSV and newline-separated raw text upload support
                </li>
              </ul>
            </div>

            <div className="glass-panel p-8 rounded-2xl border border-white/5 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                <Database className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-white">Double-Entry Credit Wallet & API</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Transparent credit billing with zero artificial balances for the owner and strict idempotency protection against double-charging.
              </p>
              <ul className="space-y-2 text-xs text-slate-300 pt-2 border-t border-white/5">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Owner unlimited credit bypass (creditMode: UNLIMITED)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Idempotent webhook verification for Stripe & Razorpay
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Cryptographic SHA-256 hashed API keys for CI/CD pipelines
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-16 text-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold px-8 py-3.5 rounded-xl shadow-xl shadow-brand-500/25"
            >
              Start Analyzing URLs Now
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
