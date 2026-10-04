'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, UploadCloud, RefreshCw } from 'lucide-react';

interface DashboardHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export default function DashboardHeader({ title, description, children }: DashboardHeaderProps) {
  return (
    <div className="border-b border-white/5 bg-[#090e1a]/60 backdrop-blur-md px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{title}</h1>
        {description && <p className="text-xs text-slate-400 mt-1">{description}</p>}
      </div>

      <div className="flex items-center gap-3">
        {children}
        <Link
          href="/dashboard/import"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold transition-all"
        >
          <UploadCloud className="w-4 h-4 text-cyan-400" />
          <span>Import URLs</span>
        </Link>
      </div>
    </div>
  );
}
