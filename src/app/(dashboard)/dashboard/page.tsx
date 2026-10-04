'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardHeader from '@/components/layout/DashboardHeader';
import {
  Globe,
  CheckCircle2,
  AlertTriangle,
  Search,
  Zap,
  Coins,
  Activity,
  Layers,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  Plus,
} from 'lucide-react';

export default function DashboardOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalUrls: 0,
    analyzedUrls: 0,
    submittedUrls: 0,
    indexedUrls: 0,
    notIndexed: 0,
    blockedUrls: 0,
    errorUrls: 0,
    remainingCredits: '...',
    googleConnections: 0,
    activeJobs: 0,
  });
  const [recentUrls, setRecentUrls] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [urlsRes, credRes, projRes, googleRes] = await Promise.all([
        fetch('/api/urls?limit=10'),
        fetch('/api/credits/balance'),
        fetch('/api/projects'),
        fetch('/api/google/properties'),
      ]);

      const urlsData = await urlsRes.json();
      const credData = await credRes.json();
      const projData = await projRes.json();
      const googleData = await googleRes.json();

      const urls = urlsData.urls || [];
      const total = urlsData.pagination?.total || urls.length;
      const stats = urlsData.stats || {};

      const analyzed = stats.ANALYZED || 0;
      const submitted = stats.SUBMITTED || 0;
      const indexed = stats.INDEXED || 0;
      const notIndexed = stats.NOT_INDEXED || 0;
      const blocked = stats.BLOCKED || 0;
      const errors = stats.ERROR || 0;

      let connCount = 0;
      if (googleData.success && googleData.accounts) {
        connCount = googleData.accounts.length;
      }

      setMetrics({
        totalUrls: total,
        analyzedUrls: analyzed,
        submittedUrls: submitted,
        indexedUrls: indexed,
        notIndexed,
        blockedUrls: blocked,
        errorUrls: errors,
        remainingCredits: credData.creditMode === 'UNLIMITED' ? 'UNLIMITED' : credData.balance?.toLocaleString() || '0',
        googleConnections: connCount,
        activeJobs: 0,
      });

      setRecentUrls(urls);
      setProjects(projData.projects || []);
    } catch (e) {
      console.error('Failed to load dashboard metrics', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const cards = [
    { title: 'Total URLs', value: metrics.totalUrls, icon: Globe, color: 'text-brand-400' },
    { title: 'Analyzed', value: metrics.analyzedUrls, icon: Zap, color: 'text-cyan-400' },
    { title: 'Indexed (GSC)', value: metrics.indexedUrls, icon: CheckCircle2, color: 'text-emerald-400' },
    { title: 'Not Indexed', value: metrics.notIndexed, icon: AlertTriangle, color: 'text-amber-400' },
    { title: 'Blocked', value: metrics.blockedUrls, icon: ShieldCheck, color: 'text-rose-400' },
    { title: 'Submitted', value: metrics.submittedUrls, icon: Activity, color: 'text-indigo-400' },
    { title: 'Remaining Credits', value: metrics.remainingCredits, icon: Coins, color: 'text-amber-300' },
    { title: 'GSC Accounts', value: metrics.googleConnections, icon: Search, color: 'text-cyan-300' },
  ];

  return (
    <div className="flex-1 flex flex-col">
      <DashboardHeader
        title="SEO Workspace Overview"
        description="Real-time URL health metrics, Search Console sync status, and indexing telemetry"
      >
        <button
          onClick={fetchDashboardData}
          disabled={loading}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 transition-colors"
          title="Refresh Metrics"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </DashboardHeader>

      <div className="p-6 space-y-6">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {cards.map((c, i) => (
            <div key={i} className="glass-panel p-4 rounded-xl border border-white/5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium text-slate-400 truncate">{c.title}</span>
                <c.icon className={`w-4 h-4 ${c.color} shrink-0`} />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">{c.value}</span>
            </div>
          ))}
        </div>

        {/* Action Row: Quick Audit / Shortcuts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Start Project Guide */}
          <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-400" />
              <span>Project Workspaces</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Organize URLs by domain, match Search Console properties, and manage automated sitemap imports.
            </p>
            <div className="space-y-2">
              {projects.slice(0, 3).map((p) => (
                <Link
                  key={p.id}
                  href={`/urls?projectId=${p.id}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#090e1a] border border-white/5 hover:border-brand-500/30 text-xs transition-all"
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-white">{p.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{p.domain}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{p._count?.urls || 0} URLs</span>
                </Link>
              ))}
            </div>
            <Link
              href="/projects"
              className="inline-flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 font-semibold"
            >
              <span>Manage All Projects</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Integration Status Box */}
          <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Search className="w-4 h-4 text-cyan-400" />
              <span>Google Search Console Integration</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Link properties via OAuth 2.0 to inspect URLs directly via the official Google URL Inspection API.
            </p>
            <div className="p-3.5 rounded-xl bg-[#090e1a] border border-white/5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Connection Health:</span>
                <span className="text-emerald-400 font-mono font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Inspection API Quota:</span>
                <span className="text-slate-300 font-mono">2,000 / day</span>
              </div>
            </div>
            <Link
              href="/google"
              className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
            >
              <span>View Search Console Properties</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Credit Ledger Summary */}
          <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-400" />
              <span>Credit Ledger & Ledger</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every operation is recorded in an immutable audit ledger. No hidden recurring fees or artificial balances.
            </p>
            <div className="p-3.5 rounded-xl bg-[#090e1a] border border-white/5 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>URL Analysis:</span> <span className="text-white">1 Credit</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Google Inspection:</span> <span className="text-white">2 Credits</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Sitemap Parse:</span> <span className="text-white">5 Credits</span>
              </div>
            </div>
            <Link
              href="/credits"
              className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-semibold"
            >
              <span>View Transaction History</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Live URL Table Section */}
        <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Recent URLs in Workspace</h3>
              <p className="text-xs text-slate-400">Latest analyzed, inspected, and queued pages</p>
            </div>
            <Link
              href="/urls"
              className="text-xs text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1"
            >
              View Full Table <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#090e1a] text-slate-400 font-mono uppercase text-[10px] border-b border-white/5">
                <tr>
                  <th className="px-5 py-3">URL</th>
                  <th className="px-5 py-3">Project</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">HTTP</th>
                  <th className="px-5 py-3">Last Checked</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {recentUrls.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                      No URLs found in this workspace. Click &apos;Import URLs&apos; to get started.
                    </td>
                  </tr>
                ) : (
                  recentUrls.map((u) => (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3.5 font-medium text-white max-w-xs truncate">
                        <span title={u.normalizedUrl}>{u.normalizedUrl}</span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-400">{u.project?.name || 'Default'}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                            u.status === 'INDEXED'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : u.status === 'BLOCKED' || u.status === 'ERROR'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : u.status === 'ANALYZED'
                              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                              : 'bg-white/5 text-slate-400 border border-white/10'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-300">{u.httpStatus || '—'}</td>
                      <td className="px-5 py-3.5 text-slate-400 text-[11px]">
                        {u.lastAnalyzedAt ? new Date(u.lastAnalyzedAt).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link
                          href={`/urls?id=${u.id}`}
                          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-brand-300 hover:text-white font-medium text-[11px] transition-colors"
                        >
                          Details
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
