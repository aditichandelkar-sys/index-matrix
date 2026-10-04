'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TransactionsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/credits');
  }, [router]);

  return (
    <div className="flex-1 flex items-center justify-center p-8 text-slate-400">
      <div className="text-center space-y-2">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs">Loading Transaction Ledger...</p>
      </div>
    </div>
  );
}
