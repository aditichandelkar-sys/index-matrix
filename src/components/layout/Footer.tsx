import React from 'react';
import Link from 'next/link';
import { Layers, Shield, Terminal, Globe, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[#05080f] text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
          {/* Brand info */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-cyan-400 flex items-center justify-center">
                <Layers className="w-4 h-4 text-white" />
              </div>
              <span className="font-extrabold tracking-tight text-white text-base">
                INDEX <span className="text-brand-400">MATRIX</span>
              </span>
            </Link>
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              INDEX MATRIX is an independent technical SEO platform engineered for high-precision URL diagnostics,
              Google Search Console synchronization, and auditable indexing workflow tracking.
            </p>
            <div className="p-3 rounded-lg bg-surface-200/50 border border-white/5 text-[11px] text-slate-400 leading-normal">
              <strong className="text-slate-300">Compliance Notice:</strong> Google search indexing is subject solely
              to Google algorithms and policies. INDEX MATRIX does not provide artificial or guaranteed indexing.
            </div>
          </div>

          {/* Product links */}
          <div>
            <h4 className="font-semibold text-white mb-3 text-xs tracking-wider uppercase font-mono">Platform</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/features" className="hover:text-white transition-colors">
                  Technical URL Analyzer
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="hover:text-white transition-colors">
                  Search Console Integration
                </Link>
              </li>
              <li>
                <Link href="/features" className="hover:text-white transition-colors">
                  Sitemap Extraction Engine
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-white transition-colors">
                  Credit Packages
                </Link>
              </li>
              <li>
                <Link href="/docs" className="hover:text-white transition-colors">
                  Public REST API
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold text-white mb-3 text-xs tracking-wider uppercase font-mono">Resources</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/docs" className="hover:text-white transition-colors">
                  Documentation & Guides
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-white transition-colors">
                  Frequently Asked Questions
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Technical Support
                </Link>
              </li>
              <li>
                <Link href="/api/health" target="_blank" className="hover:text-white transition-colors">
                  System Health & Uptime
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-white mb-3 text-xs tracking-wider uppercase font-mono">Legal</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/refund" className="hover:text-white transition-colors">
                  Refund Policy
                </Link>
              </li>
              <li>
                <span className="text-[11px] text-slate-400">SOC2 & GDPR Aligned Security</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} INDEX MATRIX SaaS. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Built for Technical SEO Teams</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span className="text-emerald-400">All Systems Operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
