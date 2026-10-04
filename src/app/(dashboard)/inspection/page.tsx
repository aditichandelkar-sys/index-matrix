'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function InspectionRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/urls');
  }, [router]);

  return (
    <div className="flex-1 flex items-center justify-center p-8 text-slate-400">
      <div className="text-center space-y-2">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs">Loading URL Inspection Workspace...</p>
      </div>
    </div>
  );
}
