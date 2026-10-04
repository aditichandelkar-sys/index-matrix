'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardHeader from '@/components/layout/DashboardHeader';
import {
  Globe,
  Search,
  Filter,
  RefreshCw,
  Zap,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  SlidersHorizontal,
  Info,
  Layers,
  ArrowRight,
  Activity,
} from 'lucide-react';

function UrlsManagerContent() {
  const searchParams = useSearchParams();
  const initialProjectId = searchParams.get('projectId') || '';
  const initialUrlId = searchParams.get('id') || '';

  const [urls, setUrls] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectId, setProjectId] = useState(initialProjectId);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUrls, setTotalUrls] = useState(0);

  // Detail drawer / modal
  const [selectedUrl, setSelectedUrl] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadUrls = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        ...(projectId ? { projectId } : {}),
        ...(statusFilter !== 'ALL' ? { status: statusFilter } : {}),
        ...(searchQuery ? { search: searchQuery } : {}),
      });

      const res = await fetch(`/api/urls?${query.toString()}`);
      const data = await res.json();
      if (data.success) {
        setUrls(data.urls || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalUrls(data.pagination?.total || 0);

        // If initial ID provided, auto-open detail
        if (initialUrlId && !selectedUrl) {
          const matched = data.urls?.find((u: any) => u.id === initialUrlId);
          if (matched) setSelectedUrl(matched);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      if (data.success) setProjects(data.projects || []);
    } catch {}
  };

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    loadUrls();
  }, [projectId, statusFilter, page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadUrls();
  };

  const handleAnalyze = async (urlId: string) => {
    setActionLoading(urlId);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/urls/${urlId}/analyze`, { method: 'POST' });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setActionMessage({
          type: 'error',
          text: data.error?.message || data.error || 'Failed to analyze URL',
        });
      } else {
        setActionMessage({
          type: 'success',
          text: `Analysis complete! HTTP ${data.analysis?.httpStatus}, ${data.analysis?.issues?.length || 0} issue(s) detected.`,
        });
        loadUrls();
      }
    } catch {
      setActionMessage({ type: 'error', text: 'Network request error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleInspect = async (urlId: string) => {
    setActionLoading(urlId);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/urls/${urlId}/inspect`, { method: 'POST' });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setActionMessage({
          type: 'error',
          text: data.error?.message || data.error || 'Inspection failed',
        });
      } else {
        setActionMessage({
          type: 'success',
          text: `Google URL Inspection verdict: ${data.inspection?.verdict} (${data.inspection?.coverageState || 'No coverage data'})`,
        });
        loadUrls();
      }
    } catch {
      setActionMessage({ type: 'error', text: 'Network request error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSupportedSubmit = async (urlId: string, mode: string = 'FAST_INDEX') => {
    setActionLoading(urlId);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/urls/${urlId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setActionMessage({
          type: 'error',
          text: data.error?.message || data.error || 'Workflow rejected',
        });
      } else {
        setActionMessage({
          type: 'success',
          text: data.message || 'Workflow notification submitted successfully!',
        });
        loadUrls();
      }
    } catch {
      setActionMessage({ type: 'error', text: 'Network request error' });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <DashboardHeader
        title="URL Intelligence Table"
        description="Monitor indexing health, technical diagnostics, and Search Console telemetry"
      />

      <div className="p-6 space-y-4">
        {/* Status notification */}
        {actionMessage && (
          <div
            className={`p-4 rounded-xl border text-xs flex items-center justify-between animate-in fade-in ${
              actionMessage.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
            }`}
          >
            <span>{actionMessage.text}</span>
            <button
              onClick={() => setActionMessage(null)}
              className="text-slate-400 hover:text-white text-xs ml-4"
            >
              ✕
            </button>
          </div>
        )}

        {/* Filter Bar */}
        <div className="glass-panel p-4 rounded-2xl border border-white/5 flex flex-col md:flex-row gap-3 items-center justify-between">
          <form onSubmit={handleSearch} className="flex items-center gap-2 w-full md:w-auto flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by URL path or domain..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#090e1a] border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold"
            >
              Search
            </button>
          </form>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Project Filter */}
            <select
              value={projectId}
              onChange={(e) => {
                setProjectId(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl bg-[#090e1a] border border-white/10 text-white text-xs focus:outline-none focus:border-brand-500"
            >
              <option value="">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.domain})
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl bg-[#090e1a] border border-white/10 text-white text-xs focus:outline-none focus:border-brand-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="IMPORTED">IMPORTED</option>
              <option value="ANALYZED">ANALYZED</option>
              <option value="INDEXED">INDEXED</option>
              <option value="NOT_INDEXED">NOT_INDEXED</option>
              <option value="BLOCKED">BLOCKED</option>
              <option value="SUBMITTED">SUBMITTED</option>
              <option value="ERROR">ERROR</option>
            </select>

            <button
              onClick={loadUrls}
              title="Refresh"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* URLs Table */}
        <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#090e1a] text-slate-400 font-mono uppercase text-[10px] border-b border-white/5">
                <tr>
                  <th className="px-5 py-3.5">URL Target</th>
                  <th className="px-4 py-3.5">Project</th>
                  <th className="px-4 py-3.5">Analysis</th>
                  <th className="px-4 py-3.5">Google Status</th>
                  <th className="px-3 py-3.5">HTTP</th>
                  <th className="px-4 py-3.5">Last Checked</th>
                  <th className="px-3 py-3.5">Credits</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-brand-400" />
                      Loading URL registry...
                    </td>
                  </tr>
                ) : urls.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-slate-500">
                      No URLs match the current filter.
                    </td>
                  </tr>
                ) : (
                  urls.map((u) => {
                    const isRowLoading = actionLoading === u.id;
                    const latestInspection = u.inspections?.[0];

                    return (
                      <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-3.5 max-w-sm truncate font-medium text-white">
                          <button
                            onClick={() => setSelectedUrl(u)}
                            className="text-left hover:text-brand-300 truncate max-w-xs block"
                            title={u.normalizedUrl}
                          >
                            {u.normalizedUrl}
                          </button>
                          <span className="text-[10px] text-slate-400 font-mono block truncate">
                            {u.matchedProperty ? `GSC: ${u.matchedProperty.propertyUrl}` : 'No GSC Property Linked'}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-slate-400 text-xs truncate max-w-[120px]">
                          {u.project?.name || 'Default'}
                        </td>

                        <td className="px-4 py-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                              u.status === 'ANALYZED'
                                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                                : u.status === 'BLOCKED' || u.status === 'ERROR'
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                : 'bg-white/5 text-slate-400 border border-white/10'
                            }`}
                          >
                            {u.status}
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          {latestInspection ? (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                                latestInspection.verdict === 'PASS'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}
                              title={latestInspection.coverageState || ''}
                            >
                              {latestInspection.verdict}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-mono text-[10px]">UNINSPECTED</span>
                          )}
                        </td>

                        <td className="px-3 py-3.5 font-mono text-xs">
                          {u.httpStatus ? (
                            <span className={u.httpStatus === 200 ? 'text-emerald-400' : 'text-rose-400'}>
                              {u.httpStatus}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>

                        <td className="px-4 py-3.5 text-slate-400 text-[11px]">
                          {u.lastAnalyzedAt ? new Date(u.lastAnalyzedAt).toLocaleDateString() : 'Never'}
                        </td>

                        <td className="px-3 py-3.5 text-slate-400 font-mono text-xs">
                          {u.creditsUsed}
                        </td>

                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Analyze button (1 credit) */}
                            <button
                              onClick={() => handleAnalyze(u.id)}
                              disabled={isRowLoading}
                              title="Run Technical SEO Audit (1 credit)"
                              className="px-2 py-1 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 text-brand-300 text-[11px] font-medium transition-colors"
                            >
                              Audit
                            </button>

                            {/* GSC Inspect button (2 credits) */}
                            <button
                              onClick={() => handleInspect(u.id)}
                              disabled={isRowLoading}
                              title="Search Console URL Inspection (2 credits)"
                              className="px-2 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-[11px] font-medium transition-colors"
                            >
                              Inspect
                            </button>

                            {/* Fast Push to Googlebot (1 credit) */}
                            <button
                              onClick={() => handleSupportedSubmit(u.id, 'FAST_INDEX')}
                              disabled={isRowLoading}
                              title="⚡ Push to Googlebot (Multi-Vector Fast Index)"
                              className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-[11px] font-medium transition-colors flex items-center gap-1"
                            >
                              <Zap className="w-3 h-3 fill-current" />
                              Fast Push
                            </button>

                            {/* View detail button */}
                            <button
                              onClick={() => setSelectedUrl(u)}
                              title="View URL Details & Issue Breakdown"
                              className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] font-medium transition-colors"
                            >
                              Details
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="p-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-400 bg-[#090e1a]">
            <span>
              Showing {urls.length} of {totalUrls} registered URLs
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 text-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono text-xs text-slate-300">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 text-white"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* URL DETAIL DRAWER / MODAL */}
      {selectedUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="glass-panel p-6 rounded-2xl border border-white/10 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl space-y-6">
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase text-brand-400 tracking-wider">URL Diagnostic Card</span>
                <h3 className="text-base font-bold text-white mt-1 break-all">{selectedUrl.normalizedUrl}</h3>
              </div>
              <button
                onClick={() => setSelectedUrl(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {/* Quick Actions in Detail View */}
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={() => handleAnalyze(selectedUrl.id)}
                className="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" /> Re-Audit Technicals (1 cr)
              </button>
              <button
                onClick={() => handleInspect(selectedUrl.id)}
                className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <Search className="w-3.5 h-3.5" /> GSC URL Inspection (2 cr)
              </button>
              <button
                onClick={() => handleSupportedSubmit(selectedUrl.id)}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <Activity className="w-3.5 h-3.5" /> Execute Supported Workflow
              </button>
            </div>

            {/* Latest Analysis Results */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase font-mono text-slate-400">Technical SEO Audit</h4>
              {selectedUrl.analyses?.[0] ? (
                <div className="p-4 rounded-xl bg-[#090e1a] border border-white/5 space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-400">HTTP Status:</span>{' '}
                      <span className="font-mono text-white">{selectedUrl.analyses[0].httpStatus}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Audit Verdict:</span>{' '}
                      <span
                        className={
                          selectedUrl.analyses[0].passedAudit ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'
                        }
                      >
                        {selectedUrl.analyses[0].passedAudit ? 'PASSED' : 'ACTION REQUIRED'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Detected Issues:</span>
                    <div className="mt-2 space-y-1.5">
                      {JSON.parse(selectedUrl.analyses[0].issues || '[]').length === 0 ? (
                        <span className="text-emerald-400 text-xs">No technical blockers detected.</span>
                      ) : (
                        JSON.parse(selectedUrl.analyses[0].issues).map((iss: any, i: number) => (
                          <div
                            key={i}
                            className={`p-2.5 rounded-lg border text-xs ${
                              iss.severity === 'CRITICAL'
                                ? 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                                : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                            }`}
                          >
                            <div className="font-bold">{iss.issue}: {iss.explanation}</div>
                            <div className="text-[11px] text-slate-300 mt-0.5">Recommendation: {iss.recommendedFix}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-[#090e1a] text-slate-500 text-xs">
                  No technical audit recorded yet. Click &apos;Audit&apos; to run one.
                </div>
              )}
            </div>

            {/* Google Search Console Status */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase font-mono text-slate-400">Google Search Console Status</h4>
              {selectedUrl.inspections?.[0] ? (
                <div className="p-4 rounded-xl bg-[#090e1a] border border-white/5 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Indexing Verdict:</span>
                    <span className="font-bold text-white font-mono">{selectedUrl.inspections[0].verdict}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Coverage State:</span>
                    <span className="text-slate-300">{selectedUrl.inspections[0].coverageState || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Inspected At:</span>
                    <span className="text-slate-400">{new Date(selectedUrl.inspections[0].inspectedAt).toLocaleString()}</span>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-[#090e1a] text-slate-500 text-xs">
                  No GSC inspection performed yet. Click &apos;Inspect&apos; to query official API.
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-white/5 flex justify-end">
              <button
                onClick={() => setSelectedUrl(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function UrlsManagerPage() {
  return (
    <Suspense fallback={<div className="p-6 text-xs text-slate-400">Loading URL intelligence table...</div>}>
      <UrlsManagerContent />
    </Suspense>
  );
}
