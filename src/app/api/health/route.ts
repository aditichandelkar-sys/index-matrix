import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const startTime = Date.now();
  let dbStatus = 'ok';

  try {
    // Simple query to verify DB responsiveness
    await prisma.systemSetting.findFirst();
  } catch (e: any) {
    dbStatus = `error: ${e.message}`;
  }

  const responseTimeMs = Date.now() - startTime;
  const isHealthy = dbStatus === 'ok';

  return NextResponse.json(
    {
      status: isHealthy ? 'healthy' : 'degraded',
      service: 'index-matrix-core',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      checks: {
        database: dbStatus,
        latencyMs: responseTimeMs,
      },
    },
    { status: isHealthy ? 200 : 503 }
  );
}
