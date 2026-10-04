'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Layers, ShieldCheck, ArrowRight, Menu, X, Cpu } from 'lucide-react';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#070b14]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform duration-200">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold tracking-tight text-lg text-white font-sans flex items-center gap-1.5">
              INDEX <span className="text-brand-400">MATRIX</span>
            </span>
            <span className="text-[10px] tracking-widest text-slate-400 uppercase -mt-1 font-mono">
              SEO URL Intelligence
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <Link href="/features" className="hover:text-brand-400 transition-colors">
            Features
          </Link>
          <Link href="/how-it-works" className="hover:text-brand-400 transition-colors">
            How It Works
          </Link>
          <Link href="/pricing" className="hover:text-brand-400 transition-colors">
            Pricing
          </Link>
          <Link href="/docs" className="hover:text-brand-400 transition-colors">
            Documentation
          </Link>
          <Link href="/faq" className="hover:text-brand-400 transition-colors">
            FAQ
          </Link>
        </nav>

        {/* CTA Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-medium text-slate-300 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5 transition-all"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 text-sm font-semibold bg-gradient-to-r from-brand-600 to-cyan-500 hover:from-brand-500 hover:to-cyan-400 text-white px-4 py-2.5 rounded-xl shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition-all duration-200 active:scale-95"
          >
            Start Analyzing URLs
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-b border-white/10 bg-[#0d1527]/95 px-4 pt-3 pb-6 space-y-3">
          <Link
            href="/features"
            onClick={() => setMobileOpen(false)}
            className="block py-2 text-slate-300 hover:text-white font-medium"
          >
            Features
          </Link>
          <Link
            href="/how-it-works"
            onClick={() => setMobileOpen(false)}
            className="block py-2 text-slate-300 hover:text-white font-medium"
          >
            How It Works
          </Link>
          <Link
            href="/pricing"
            onClick={() => setMobileOpen(false)}
            className="block py-2 text-slate-300 hover:text-white font-medium"
          >
            Pricing
          </Link>
          <Link
            href="/docs"
            onClick={() => setMobileOpen(false)}
            className="block py-2 text-slate-300 hover:text-white font-medium"
          >
            Documentation
          </Link>
          <Link
            href="/faq"
            onClick={() => setMobileOpen(false)}
            className="block py-2 text-slate-300 hover:text-white font-medium"
          >
            FAQ
          </Link>
          <div className="pt-4 border-t border-white/10 flex flex-col gap-2.5">
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="text-center py-2 text-slate-300 hover:text-white font-medium"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              onClick={() => setMobileOpen(false)}
              className="text-center bg-brand-600 hover:bg-brand-500 text-white font-semibold py-2.5 rounded-xl shadow-lg shadow-brand-500/20"
            >
              Start Analyzing URLs
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
