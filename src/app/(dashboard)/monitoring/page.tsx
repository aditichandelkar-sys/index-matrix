'use client';

import React, { useEffect, useState } from 'react';
import DashboardHeader from '@/components/layout/DashboardHeader';
import { Activity, ShieldCheck, Search, Globe, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

export default function MonitoringPage() {
  const [urls, setUrls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/urls?limit=50');
      const data = await res.json();
      if (data.success) {
        setUrls(data.urls || []);
      }
    } catch {}
    finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="flex-1 flex flex-col">
      <DashboardHeader
        title="URL Indexing & Crawl Monitoring"
        description="Differentiate application HTTP checks, Googlebot crawl dates, and Search Console telemetry"
      >
        <button onClick={loadData} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </DashboardHeader>

      <div className="p-6 max-w-6xl space-y-6">
        {/* Source Distinction Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-panel p-4 rounded-xl border border-white/5 space-y-1">
            <span className="text-[10px] font-mono uppercase text-brand-400 font-bold">1. Application HTTP Check</span>
            <p className="text-xs text-slate-400 leading-relaxed">
              Deterministic, non-invasive probe checking status code, redirect chains, canonicals, and robots meta tags.
            </p>
          </div>
          <div className="glass-panel p-4 rounded-xl border border-white/5 space-y-1">
            <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold">2. Google URL Inspection</span>
            <p className="text-xs text-slate-400 leading-relaxed">
              Official data returned by Google Search Console indicating whether the URL is indexed or discovered.
            </p>
          </div>
          <div className="glass-panel p-4 rounded-xl border border-white/5 space-y-1">
            <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold">3. Actual Googlebot Crawl</span>
            <p className="text-xs text-slate-400 leading-relaxed">
              Real crawl timestamp and user agent reported by Google when Googlebot last visited the page.
            </p>
          </div>
        </div>

        {/* Monitoring Table */}
        <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
          <div className="p-5 border-b border-white/5">
            <h3 className="text-base font-bold text-white">Live URL Indexing Matrix</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#090e1a] text-slate-400 font-mono uppercase text-[10px] border-b border-white/5">
                <tr>
                  <th className="px-5 py-3.5">URL Target</th>
                  <th className="px-4 py-3.5">Application Audit</th>
                  <th className="px-4 py-3.5">GSC Coverage State</th>
                  <th className="px-4 py-3.5">Last Googlebot Crawl</th>
                  <th className="px-4 py-3.5">Indexing Verdict</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {urls.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                      No URLs found to monitor.
                    </td>
                  </tr>
                ) : (
                  urls.map((u) => {
                    const latestInsp = u.inspections?.[0];
                    return (
                      <tr key={u.id} className="hover:bg-white/[0.02]">
                        <td className="px-5 py-3.5 font-medium text-white max-w-xs truncate">
                          <span title={u.normalizedUrl}>{u.normalizedUrl}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          {u.httpStatus ? (
                            <span className="font-mono text-emerald-400">HTTP {u.httpStatus} OK</span>
                          ) : (
                            <span className="text-slate-500 font-mono">Unchecked</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-slate-300">
                          {latestInsp?.coverageState || 'No inspection record'}
                        </td>
                        <td className="px-4 py-3.5 text-slate-400 font-mono text-[11px]">
                          {u.lastCrawl ? new Date(u.lastCrawl).toLocaleDateString() : 'No crawl evidence'}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                              u.status === 'INDEXED'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : u.status === 'BLOCKED'
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                : 'bg-white/5 text-slate-400 border border-white/10'
                            }`}
                          >
                            {u.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
