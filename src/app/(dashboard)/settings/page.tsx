'use client';

import React, { useEffect, useState } from 'react';
import DashboardHeader from '@/components/layout/DashboardHeader';
import { User, ShieldCheck, Mail, Key, CheckCircle2 } from 'lucide-react';

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setUser(data.user);
      });
  }, []);

  return (
    <div className="flex-1 flex flex-col">
      <DashboardHeader
        title="Account & Security Settings"
        description="Manage your user profile, security credentials, and organization details"
      />

      <div className="p-6 max-w-4xl space-y-6">
        <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-6">
          <h3 className="text-base font-bold text-white">Profile Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-[#090e1a] border border-white/5 space-y-1">
              <span className="text-slate-400">Account Name</span>
              <div className="font-semibold text-white text-sm">{user?.name || 'Loading...'}</div>
            </div>
            <div className="p-4 rounded-xl bg-[#090e1a] border border-white/5 space-y-1">
              <span className="text-slate-400">Email Address</span>
              <div className="font-semibold text-white text-sm font-mono">{user?.email}</div>
            </div>
            <div className="p-4 rounded-xl bg-[#090e1a] border border-white/5 space-y-1">
              <span className="text-slate-400">Account Role</span>
              <div className="font-bold text-cyan-400 text-sm font-mono">{user?.role}</div>
            </div>
            <div className="p-4 rounded-xl bg-[#090e1a] border border-white/5 space-y-1">
              <span className="text-slate-400">Credit Billing Mode</span>
              <div className="font-bold text-amber-400 text-sm font-mono">{user?.creditMode}</div>
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>Security Posture</span>
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Your session is secured using HttpOnly encrypted JWT tokens. Passwords use salted bcrypt hashes with cost factor 12. Google OAuth credentials are encrypted at rest with AES-256-GCM.
          </p>
        </div>
      </div>
    </div>
  );
}
