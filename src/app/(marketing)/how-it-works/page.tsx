import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Shield, Search, Database, Layers } from 'lucide-react';

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#070b14]">
      <Navbar />
      <main className="flex-1 py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-xs font-mono uppercase tracking-widest text-brand-400 mb-2">Workflow Walkthrough</h1>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
              From URL Ingestion to Index Discovery
            </h2>
            <p className="mt-4 text-slate-300 text-sm leading-relaxed">
              Understand the exact architectural stages your URLs undergo inside INDEX MATRIX.
            </p>
          </div>

          <div className="space-y-12 relative before:absolute before:inset-0 before:left-8 before:w-0.5 before:bg-white/10 md:before:left-1/2">
            {[
              {
                step: 'Step 1',
                title: 'Project Setup & Google Search Console Connection',
                desc: 'Create a project for your domain. Connect your Google account using secure OAuth 2.0. INDEX MATRIX synchronizes your authorized Search Console properties (both sc-domain: and URL prefixes) using encrypted token storage.',
              },
              {
                step: 'Step 2',
                title: 'Bulk URL Ingestion & Exact Property Matching',
                desc: 'Upload URLs via single input, raw newline text, CSV, or XML sitemaps. Each URL is validated, normalized to RFC 3986 standards, and tested against your authorized GSC properties using exact matching rules.',
              },
              {
                step: 'Step 3',
                title: 'SSRF-Hardened Deep Technical SEO Audit',
                desc: 'Our analyzer verifies DNS resolution, rejects internal IP ranges, and fetches your page with up to 5 safe redirect hops. It extracts HTTP status, response time, meta robots directives, canonical tags, and robots.txt access rules.',
              },
              {
                step: 'Step 4',
                title: 'Google URL Inspection API Verification',
                desc: 'For URLs inside authorized properties, INDEX MATRIX calls the official Google Search Console URL Inspection API to retrieve Googlebot last crawl date, page fetch state, indexing verdict, and canonical reconciliation.',
              },
              {
                step: 'Step 5',
                title: 'Capability-Aware Indexing Workflows',
                desc: 'For officially eligible JobPosting or BroadcastEvent schemas, trigger direct Indexing API notifications. For standard web pages, submit containing sitemaps and track indexing status changes without violating Google terms.',
              },
            ].map((s, idx) => (
              <div key={idx} className="glass-panel p-8 rounded-2xl border border-white/5 relative z-10">
                <span className="text-xs font-mono font-bold text-brand-400 uppercase tracking-wider">{s.step}</span>
                <h3 className="text-xl font-bold text-white mt-1 mb-2">{s.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold px-8 py-3.5 rounded-xl shadow-xl shadow-brand-500/25"
            >
              Get Started with 50 Free Credits
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
