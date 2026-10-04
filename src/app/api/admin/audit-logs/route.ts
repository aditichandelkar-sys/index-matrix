import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireOwner } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await requireOwner();

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(10, parseInt(searchParams.get('limit') || '25', 10)));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (action && action !== 'ALL') {
      where.action = action;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { id: true, email: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err: any) {
    const status = err.message === 'FORBIDDEN' ? 403 : err.message === 'UNAUTHORIZED' ? 401 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
