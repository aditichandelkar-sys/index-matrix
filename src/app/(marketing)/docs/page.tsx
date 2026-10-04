import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { Terminal, Code2, BookOpen, Key, ShieldCheck } from 'lucide-react';

export default function DocsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#070b14]">
      <Navbar />
      <main className="flex-1 py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h1 className="text-xs font-mono uppercase tracking-widest text-brand-400 mb-2">Developer Documentation</h1>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              INDEX MATRIX Public REST API (v1)
            </h2>
            <p className="mt-3 text-slate-300 text-sm">
              Automate URL imports, trigger technical SEO audits, and query indexing states via standard REST endpoints.
            </p>
          </div>

          <div className="space-y-10">
            {/* Authentication Section */}
            <div className="glass-panel p-8 rounded-2xl border border-white/5 space-y-4">
              <div className="flex items-center gap-2 text-white font-bold text-lg">
                <Key className="w-5 h-5 text-brand-400" />
                <span>API Authentication</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                All requests to <code className="font-mono text-cyan-300">/api/v1/*</code> require a valid API key passed either via the standard Authorization Bearer header or the custom <code className="font-mono text-cyan-300">x-api-key</code> header.
              </p>
              <div className="p-4 rounded-xl bg-black/60 font-mono text-xs text-slate-200 border border-white/5 overflow-x-auto">
                curl -X GET &quot;https://app.indexmatrix.io/api/v1/credits&quot; \<br />
                &nbsp;&nbsp;-H &quot;Authorization: Bearer im_live_your_api_key_here&quot;
              </div>
            </div>

            {/* Submit URL Endpoint */}
            <div className="glass-panel p-8 rounded-2xl border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  POST /api/v1/urls
                </span>
                <span className="text-xs text-slate-500">Deducts 1 Credit (if autoAnalyze=true)</span>
              </div>
              <h3 className="text-base font-bold text-white">Add URL & Optional Auto-Audit</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Adds a URL to your project. When <code className="font-mono text-cyan-300">autoAnalyze: true</code> is passed, performs an immediate SSRF-hardened technical SEO audit and returns full diagnostics.
              </p>
              <div className="p-4 rounded-xl bg-black/60 font-mono text-xs text-slate-200 border border-white/5 overflow-x-auto">
                {`// Request Body (JSON)
{
  "projectId": "7c1264c8-2b81-49b8-a720-3ce48a7051ff",
  "url": "https://example.com/blog/technical-seo",
  "autoAnalyze": true
}

// Successful Response (200 OK)
{
  "success": true,
  "data": {
    "id": "url_39108f9c",
    "normalizedUrl": "https://example.com/blog/technical-seo",
    "status": "ANALYZED",
    "analysis": {
      "httpStatus": 200,
      "responseTimeMs": 142,
      "robotsMeta": "index, follow",
      "canonicalUrl": "https://example.com/blog/technical-seo",
      "passedAudit": true,
      "issues": []
    }
  }
}`}
              </div>
            </div>

            {/* Error Responses */}
            <div className="glass-panel p-8 rounded-2xl border border-white/5 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-brand-400" />
                <span>Deterministic Error Codes</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                When an API error occurs, INDEX MATRIX returns a structured error object with an actionable code and explanation:
              </p>
              <div className="p-4 rounded-xl bg-black/60 font-mono text-xs text-rose-300 border border-rose-500/20 overflow-x-auto">
                {`{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_CREDITS",
    "message": "Not enough credits to auto-analyze URL."
  }
}`}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
