'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardHeader from '@/components/layout/DashboardHeader';
import { FolderGit2, Plus, Globe, Trash2, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      if (data.success) {
        setProjects(data.projects || []);
      }
    } catch {
      // Error handling
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, domain, description }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to create project');
        setSubmitting(false);
        return;
      }

      setName('');
      setDomain('');
      setDescription('');
      setShowModal(false);
      loadProjects();
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project and all its URLs?')) return;
    await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    loadProjects();
  };

  return (
    <div className="flex-1 flex flex-col">
      <DashboardHeader
        title="Project Workspaces"
        description="Manage domain properties, team access, and indexing scope"
      >
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md shadow-brand-500/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </DashboardHeader>

      <div className="p-6">
        {loading ? (
          <div className="py-20 flex justify-center items-center text-slate-400 text-xs">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading projects...
          </div>
        ) : projects.length === 0 ? (
          <div className="glass-panel p-12 rounded-2xl border border-white/5 text-center max-w-lg mx-auto space-y-4">
            <div className="w-12 h-12 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center mx-auto">
              <FolderGit2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">No Projects Found</h3>
            <p className="text-xs text-slate-400">
              Create your first project workspace to start organizing URLs, connecting Search Console properties, and processing sitemaps.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-brand-600 hover:bg-brand-500 text-white font-semibold px-4 py-2 rounded-xl text-xs"
            >
              Create Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {projects.map((p) => (
              <div
                key={p.id}
                className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col justify-between hover:border-brand-500/30 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="p-2 rounded-lg bg-brand-500/10 text-brand-400">
                      <FolderGit2 className="w-5 h-5" />
                    </span>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="text-lg font-bold text-white">{p.name}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-brand-400 font-mono mt-1">
                    <Globe className="w-3.5 h-3.5" />
                    <span>{p.domain}</span>
                  </div>

                  {p.description && (
                    <p className="text-xs text-slate-400 mt-3 line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>
                  )}

                  <div className="mt-5 pt-4 border-t border-white/5 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded-lg bg-[#090e1a]">
                      <div className="font-bold text-white font-mono">{p._count?.urls || 0}</div>
                      <div className="text-[10px] text-slate-400">URLs</div>
                    </div>
                    <div className="p-2 rounded-lg bg-[#090e1a]">
                      <div className="font-bold text-white font-mono">{p._count?.sitemaps || 0}</div>
                      <div className="text-[10px] text-slate-400">Sitemaps</div>
                    </div>
                    <div className="p-2 rounded-lg bg-[#090e1a]">
                      <div className="font-bold text-white font-mono">{p._count?.properties || 0}</div>
                      <div className="text-[10px] text-slate-400">GSC Link</div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-2">
                  <Link
                    href={`/urls?projectId=${p.id}`}
                    className="flex-1 text-center py-2 px-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-all"
                  >
                    View URLs
                  </Link>
                  <Link
                    href={`/import?projectId=${p.id}`}
                    className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-medium text-xs transition-all"
                  >
                    Import
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="glass-panel p-6 rounded-2xl border border-white/10 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Create New Project</h3>
            <p className="text-xs text-slate-400 mb-4">Set up a workspace for your target website or domain</p>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Acme Tech Blog"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#090e1a] border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Domain or Hostname</label>
                <input
                  type="text"
                  required
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="e.g. example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#090e1a] border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-brand-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Main production website and knowledge base"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#090e1a] border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md shadow-brand-500/20"
                >
                  {submitting ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
