import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const targetUserId = searchParams.get('userId');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(10, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    const where: any = {};

    // Customers only see their own transactions; Owners can inspect any or all
    if (user.role === 'OWNER') {
      if (targetUserId) {
        where.userId = targetUserId;
      }
    } else {
      where.userId = user.id;
    }

    if (type && type !== 'ALL') {
      where.type = type;
    }

    const [transactions, total] = await Promise.all([
      prisma.creditTransaction.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.creditTransaction.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
