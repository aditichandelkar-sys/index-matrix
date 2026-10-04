import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Mail, MessageSquare, Terminal } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#070b14]">
      <Navbar />
      <main className="flex-1 py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-xs font-mono uppercase tracking-widest text-brand-400 mb-2">Get in Touch</h1>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Contact INDEX MATRIX Support
            </h2>
            <p className="mt-3 text-slate-400 text-xs">
              Reach out to our engineering and support specialists for enterprise inquiries, quota adjustments, or technical guidance.
            </p>
          </div>

          <div className="glass-panel p-8 rounded-2xl border border-white/5 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 rounded-xl bg-surface-200/50 border border-white/5 space-y-2">
                <Mail className="w-5 h-5 text-brand-400" />
                <h4 className="text-sm font-bold text-white">General & Support</h4>
                <p className="text-xs text-slate-400">support@indexmatrix.io</p>
              </div>
              <div className="p-4 rounded-xl bg-surface-200/50 border border-white/5 space-y-2">
                <Terminal className="w-5 h-5 text-cyan-400" />
                <h4 className="text-sm font-bold text-white">API & Engineering</h4>
                <p className="text-xs text-slate-400">engineering@indexmatrix.io</p>
              </div>
            </div>

            <form className="space-y-4 pt-4 border-t border-white/5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Your Name</label>
                <input
                  type="text"
                  required
                  placeholder="Jane Doe"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#090e1a] border border-white/10 text-white text-xs focus:outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Work Email</label>
                <input
                  type="email"
                  required
                  placeholder="jane@company.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#090e1a] border border-white/10 text-white text-xs focus:outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Message</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Tell us about your requirements or question..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#090e1a] border border-white/10 text-white text-xs focus:outline-none focus:border-brand-500"
                />
              </div>
              <button
                type="button"
                className="w-full bg-brand-600 hover:bg-brand-500 text-white font-semibold py-3 rounded-xl text-xs shadow-lg shadow-brand-500/25 transition-all"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
