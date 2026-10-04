'use client';

import React, { useEffect, useState } from 'react';
import DashboardHeader from '@/components/layout/DashboardHeader';
import { ShieldAlert, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/audit-logs?page=${page}&limit=20`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch {}
    finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [page]);

  return (
    <div className="flex-1 flex flex-col">
      <DashboardHeader
        title="Owner Operations — Security & Compliance Audit Logs"
        description="Tamper-evident logs of administrative adjustments, user status changes, and critical operations"
      >
        <button onClick={loadLogs} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </DashboardHeader>

      <div className="p-6 max-w-6xl space-y-6">
        <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
          <div className="p-5 border-b border-white/5">
            <h3 className="text-base font-bold text-white">System Audit Trail</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#090e1a] text-slate-400 font-mono uppercase text-[10px] border-b border-white/5">
                <tr>
                  <th className="px-5 py-3.5">Timestamp</th>
                  <th className="px-4 py-3.5">Operator</th>
                  <th className="px-4 py-3.5">Action</th>
                  <th className="px-4 py-3.5">Target</th>
                  <th className="px-5 py-3.5">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                      No audit log records found.
                    </td>
                  </tr>
                ) : (
                  logs.map((l) => (
                    <tr key={l.id} className="hover:bg-white/[0.02]">
                      <td className="px-5 py-3.5 text-slate-400 text-[11px] whitespace-nowrap">
                        {new Date(l.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-white">{l.user?.email || 'SYSTEM'}</td>
                      <td className="px-4 py-3.5 font-mono text-[10px]">
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold">
                          {l.action}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-400 text-[11px]">{l.targetId || '—'}</td>
                      <td className="px-5 py-3.5 font-mono text-[11px] text-slate-300 max-w-md truncate">
                        {l.details || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-400 bg-[#090e1a]">
            <span>Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="p-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
