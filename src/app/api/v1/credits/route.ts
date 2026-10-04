import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { validateApiKey } from '@/lib/api-key-auth';

function getApiKeyFromHeaders(req: NextRequest): string | null {
  const auth = req.headers.get('authorization');
  if (auth && auth.startsWith('Bearer ')) {
    return auth.slice(7).trim();
  }
  return req.headers.get('x-api-key') || null;
}

export async function GET(req: NextRequest) {
  const rawKey = getApiKeyFromHeaders(req);
  const user = await validateApiKey(rawKey || '');
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or missing API key.' } },
      { status: 401 }
    );
  }

  const wallet = await prisma.creditWallet.findUnique({
    where: { userId: user.id },
  });

  return NextResponse.json({
    success: true,
    data: {
      creditMode: user.creditMode,
      balance: user.creditMode === 'UNLIMITED' ? 'UNLIMITED' : wallet?.balance || 0,
      lifetimeUsed: wallet?.lifetimeUsed || 0,
    },
  });
}
