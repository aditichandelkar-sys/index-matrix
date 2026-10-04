'use client';

import React, { useEffect, useState } from 'react';
import DashboardHeader from '@/components/layout/DashboardHeader';
import { Sliders, RefreshCw, CheckCircle2, AlertCircle, Save } from 'lucide-react';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/system-settings');
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings || []);
      }
    } catch {}
    finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (key: string) => {
    try {
      const res = await fetch('/api/admin/system-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value: editValue }),
      });
      const data = await res.json();
      if (data.success) {
        setNotification({ type: 'success', text: `System setting "${key}" updated.` });
        setEditingKey(null);
        loadSettings();
      }
    } catch {
      setNotification({ type: 'error', text: 'Failed to update setting' });
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <DashboardHeader
        title="Owner Operations — Global System Settings"
        description="Configure operational credit costs, platform thresholds, and runtime rules"
      />

      <div className="p-6 max-w-4xl space-y-6">
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

        <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Configurable Operation Costs & Rules</h3>
            <button onClick={loadSettings} className="p-1.5 rounded-lg text-slate-400 hover:text-white">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="divide-y divide-white/5">
            {settings.map((s) => (
              <div key={s.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="font-mono text-xs font-bold text-cyan-300">{s.key}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{s.description}</div>
                </div>

                <div className="flex items-center gap-3">
                  {editingKey === s.key ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="px-3 py-1.5 rounded-xl bg-[#090e1a] border border-brand-500 text-white font-mono text-xs w-28 focus:outline-none"
                      />
                      <button
                        onClick={() => handleSave(s.key)}
                        className="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingKey(null)}
                        className="px-2 py-1.5 text-xs text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-sm text-white px-3 py-1 rounded-lg bg-[#090e1a] border border-white/5">
                        {s.value}
                      </span>
                      <button
                        onClick={() => {
                          setEditingKey(s.key);
                          setEditValue(s.value);
                        }}
                        className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
