'use client';

import React, { useEffect, useState } from 'react';
import DashboardHeader from '@/components/layout/DashboardHeader';
import { Key, Plus, Copy, Check, Trash2, AlertCircle, RefreshCw, ShieldAlert } from 'lucide-react';

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newKeyData, setNewKeyData] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadKeys = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/api-keys');
      const data = await res.json();
      if (data.success) setKeys(data.keys || []);
    } catch {}
    finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKeys();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to create key');
      } else {
        setNewKeyData(data.key);
        setName('');
        setShowModal(false);
        loadKeys();
      }
    } catch {
      setError('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this API key? This action is immediate and cannot be undone.')) return;
    await fetch(`/api/api-keys/${id}`, { method: 'DELETE' });
    loadKeys();
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col">
      <DashboardHeader
        title="Public REST API Keys"
        description="Authenticate programmatic requests to /api/v1/* with hashed cryptographic keys"
      >
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md shadow-brand-500/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Generate API Key</span>
        </button>
      </DashboardHeader>

      <div className="p-6 max-w-5xl space-y-6">
        {/* Newly Created Key Alert (Shown once!) */}
        {newKeyData && (
          <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 space-y-3 animate-in fade-in">
            <div className="flex items-center gap-2 font-bold text-sm text-white">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <span>Copy Your New API Key Now</span>
            </div>
            <p className="text-xs text-slate-300">
              This API key will <strong>never be shown again</strong>. For your security, INDEX MATRIX stores only cryptographic SHA-256 hashes of your keys.
            </p>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-black/70 border border-white/10 font-mono text-xs text-white">
              <span className="flex-1 select-all break-all">{newKeyData.rawKey}</span>
              <button
                onClick={() => handleCopy(newKeyData.rawKey)}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                title="Copy to clipboard"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <button
              onClick={() => setNewKeyData(null)}
              className="text-xs text-slate-400 hover:text-white underline pt-1"
            >
              I have saved this key safely
            </button>
          </div>
        )}

        {/* Existing Keys Table */}
        <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Active Keys ({keys.length})</h3>
            <button onClick={loadKeys} className="p-1.5 rounded-lg text-slate-400 hover:text-white">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#090e1a] text-slate-400 font-mono uppercase text-[10px] border-b border-white/5">
                <tr>
                  <th className="px-5 py-3.5">Name</th>
                  <th className="px-4 py-3.5">Prefix</th>
                  <th className="px-4 py-3.5">Created</th>
                  <th className="px-4 py-3.5">Last Used</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {keys.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                      No API keys generated yet. Click &apos;Generate API Key&apos; to create one.
                    </td>
                  </tr>
                ) : (
                  keys.map((k) => (
                    <tr key={k.id} className="hover:bg-white/[0.02]">
                      <td className="px-5 py-3.5 font-bold text-white">{k.name}</td>
                      <td className="px-4 py-3.5 font-mono text-cyan-300 text-xs">{k.keyPrefix}</td>
                      <td className="px-4 py-3.5 text-slate-400 text-[11px]">
                        {new Date(k.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3.5 text-slate-400 text-[11px]">
                        {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                            k.revokedAt
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {k.revokedAt ? 'REVOKED' : 'ACTIVE'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {!k.revokedAt && (
                          <button
                            onClick={() => handleRevoke(k.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Revoke key"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="glass-panel p-6 rounded-2xl border border-white/10 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-white">Generate API Key</h3>
            {error && <div className="text-xs text-rose-400">{error}</div>}
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Key Name / Description</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. CI/CD GitHub Actions Pipeline"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#090e1a] border border-white/10 text-white text-xs focus:outline-none focus:border-brand-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold"
                >
                  {submitting ? 'Generating...' : 'Generate Key'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
