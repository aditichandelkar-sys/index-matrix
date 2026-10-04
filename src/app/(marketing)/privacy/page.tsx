import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#070b14]">
      <Navbar />
      <main className="flex-1 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <h1 className="text-3xl font-extrabold text-white">Privacy Policy</h1>
            <p className="text-xs text-slate-400 mt-2">Last Updated: October 2026</p>
          </div>

          <div className="glass-panel p-8 rounded-2xl border border-white/5 space-y-6 text-xs text-slate-300 leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">1. Information We Collect</h2>
              <p>
                INDEX MATRIX collects account information (email address, full name, encrypted password hash) and Google Search Console OAuth access/refresh tokens. All Google OAuth credentials are encrypted at rest using AES-256-GCM.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">2. Use of Google User Data</h2>
              <p>
                Our use of Google API data strictly adheres to the Google API Services User Data Policy, including Limited Use requirements. We access Search Console data solely to verify property ownership, display URL inspection status, and submit sitemaps at the explicit request of the user. We never sell or share Google user data.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">3. URL Auditing & Data Isolation</h2>
              <p>
                URLs submitted to INDEX MATRIX are associated strictly with your customer workspace. Data is isolated using multi-tenant database constraints. Public HTTP audit requests are performed with SSRF safeguards and never execute arbitrary client scripts.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">4. Data Security</h2>
              <p>
                All communications occur over TLS 1.3 encryption. Passwords use salted bcrypt hashes. API keys are stored exclusively as SHA-256 digests.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
