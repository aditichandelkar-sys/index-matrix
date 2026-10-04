import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';

export default function FAQPage() {
  const faqs = [
    {
      q: 'What is INDEX MATRIX?',
      a: 'INDEX MATRIX is a technical SEO platform designed for website owners and growth engineers to audit crawl accessibility, connect Google Search Console properties, inspect indexing status via official APIs, and process XML sitemaps efficiently.',
    },
    {
      q: 'Does INDEX MATRIX guarantee that Google will index my URLs?',
      a: 'No. Search indexing is determined solely by Google search algorithms based on crawl budget, content quality, relevance, and policy compliance. INDEX MATRIX ensures that your pages have zero technical indexing blockers, synchronizes with Google Search Console, and executes official supported workflows.',
    },
    {
      q: 'What is the Google Indexing API restriction?',
      a: 'Per official Google Search guidelines, the Google Indexing API is strictly limited to pages containing JobPosting or BroadcastEvent structured data. Submitting ordinary pages (such as blog posts, homepage URLs, product listings) violates Google policy and can harm domain reputation. For standard pages, INDEX MATRIX utilizes official Search Console URL Inspection and XML Sitemap discovery.',
    },
    {
      q: 'How does credit billing work?',
      a: 'Every operation has a fixed, transparent credit cost (URL Analysis: 1 credit; Google Inspection: 2 credits; Sitemap Processing: 5 credits). You purchase credits once; they never expire. All transactions are logged in an immutable double-entry ledger.',
    },
    {
      q: 'Can I audit URLs on websites I do not own?',
      a: 'Yes. Our SSRF-hardened technical URL analyzer can audit any publicly accessible URL for HTTP response status, redirect chains, canonical mismatch, and meta robots tags without requiring Google Search Console verification.',
    },
    {
      q: 'What payment methods are supported?',
      a: 'We support international credit/debit cards via Stripe and Razorpay, with instant credit fulfillment via verified webhooks.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#070b14]">
      <Navbar />
      <main className="flex-1 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-xs font-mono uppercase tracking-widest text-brand-400 mb-2">Help Center</h1>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-6">
            {faqs.map((f, idx) => (
              <div key={idx} className="glass-panel p-6 rounded-2xl border border-white/5 space-y-2">
                <h3 className="text-base font-bold text-white">{f.q}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
