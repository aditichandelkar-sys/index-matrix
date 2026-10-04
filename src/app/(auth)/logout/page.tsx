'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/logout', { method: 'POST' }).finally(() => {
      router.push('/login');
      router.refresh();
    });
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070b14] text-slate-400 text-xs">
      Signing out...
    </div>
  );
}
