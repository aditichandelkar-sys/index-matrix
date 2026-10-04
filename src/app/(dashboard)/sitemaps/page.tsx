'use client';

import React, { useEffect, useState } from 'react';
import DashboardHeader from '@/components/layout/DashboardHeader';
import { FileCode, Plus, RefreshCw, CheckCircle2, AlertCircle, ArrowRight, Play } from 'lucide-react';
import Link from 'next/link';

export default function SitemapsPage() {
  const [sitemaps, setSitemaps] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [projectId, setProjectId] = useState('');
  const [sitemapUrl, setSitemapUrl] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [smRes, projRes] = await Promise.all([
        fetch('/api/sitemaps'),
        fetch('/api/projects'),
      ]);
      const smData = await smRes.json();
      const projData = await projRes.json();

      if (smData.success) setSitemaps(smData.sitemaps || []);
      if (projData.success && projData.projects) {
        setProjects(projData.projects);
        if (!projectId && projData.projects.length > 0) {
          setProjectId(projData.projects[0].id);
        }
      }
    } catch {}
    finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddSitemap = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/sitemaps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, sitemapUrl }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setNotification({ type: 'error', text: data.error || 'Failed to add sitemap' });
      } else {
        setNotification({ type: 'success', text: 'Sitemap registered successfully.' });
        setSitemapUrl('');
        setShowAdd(false);
        loadData();
      }
    } catch {
      setNotification({ type: 'error', text: 'Network request error' });
    }
  };

  const handleProcess = async (id: string) => {
    setProcessingId(id);
    setNotification(null);
    try {
      const res = await fetch(`/api/sitemaps/${id}/process`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setNotification({ type: 'error', text: data.error?.message || data.error || 'Failed to process sitemap' });
      } else {
        setNotification({
          type: 'success',
          text: `Sitemap parsed! Ingested ${data.ingestedCount} URLs into project workspace. (Deducted ${data.creditsDeducted} credits)`,
        });
        loadData();
      }
    } catch {
      setNotification({ type: 'error', text: 'Network request error' });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <DashboardHeader
        title="XML Sitemap Management"
        description="Stream, validate, and ingest URLs from sitemap files and sitemap indexes"
      >
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md shadow-brand-500/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Sitemap</span>
        </button>
      </DashboardHeader>

      <div className="p-6 max-w-5xl space-y-6">
        {notification && (
          <div
            className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
              notification.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
            }`}
          >
            <span>{notification.text}</span>
            <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Add Sitemap Modal */}
        {showAdd && (
          <div className="glass-panel p-6 rounded-2xl border border-brand-500/30 space-y-4 shadow-2xl animate-in fade-in">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Register XML Sitemap</h3>
            <form onSubmit={handleAddSitemap} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Target Project</label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-[#090e1a] border border-white/10 text-white text-xs focus:outline-none focus:border-brand-500"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.domain})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">XML Sitemap URL</label>
                <input
                  type="url"
                  required
                  value={sitemapUrl}
                  onChange={(e) => setSitemapUrl(e.target.value)}
                  placeholder="https://example.com/sitemap.xml"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#090e1a] border border-white/10 text-white text-xs focus:outline-none focus:border-brand-500 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="px-3.5 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold"
                >
                  Save Sitemap
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Sitemaps List */}
        <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Registered Sitemaps ({sitemaps.length})</h3>
            <button onClick={loadData} className="p-1.5 rounded-lg text-slate-400 hover:text-white">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#090e1a] text-slate-400 font-mono uppercase text-[10px] border-b border-white/5">
                <tr>
                  <th className="px-5 py-3.5">Sitemap URL</th>
                  <th className="px-4 py-3.5">Project</th>
                  <th className="px-3 py-3.5">Type</th>
                  <th className="px-3 py-3.5">URLs Ingested</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Last Processed</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {sitemaps.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-slate-500">
                      No sitemaps registered yet. Click &apos;Add Sitemap&apos; to import.
                    </td>
                  </tr>
                ) : (
                  sitemaps.map((s) => (
                    <tr key={s.id} className="hover:bg-white/[0.02]">
                      <td className="px-5 py-3.5 font-mono text-white max-w-xs truncate">
                        <span title={s.sitemapUrl}>{s.sitemapUrl}</span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-400">{s.project?.name || 'Default'}</td>
                      <td className="px-3 py-3.5">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-300">
                          {s.isIndex ? 'Sitemap Index' : 'Standard XML'}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 font-mono font-bold text-white">{s.urlCount}</td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                            s.status === 'COMPLETED'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : s.status === 'ERROR'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-400 text-[11px]">
                        {s.lastProcessedAt ? new Date(s.lastProcessedAt).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => handleProcess(s.id)}
                          disabled={processingId === s.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-medium text-[11px] transition-all"
                        >
                          {processingId === s.id ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              Parsing...
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3 fill-current" />
                              Parse (5 cr)
                            </>
                          )}
                        </button>
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
