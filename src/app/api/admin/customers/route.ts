import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireOwner } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await requireOwner();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(10, parseInt(searchParams.get('limit') || '25', 10)));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { email: { contains: search } },
        { name: { contains: search } },
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          creditMode: true,
          status: true,
          createdAt: true,
          wallet: {
            select: {
              balance: true,
              lifetimeUsed: true,
              lifetimePurchased: true,
            },
          },
          _count: {
            select: { projects: true, apiKeys: true, transactions: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      customers,
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

export async function PATCH(req: NextRequest) {
  try {
    const owner = await requireOwner();

    const body = await req.json();
    const { userId, status, creditMode } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    const data: any = {};
    if (status && ['ACTIVE', 'SUSPENDED'].includes(status)) {
      data.status = status;
    }
    if (creditMode && ['LIMITED', 'UNLIMITED'].includes(creditMode)) {
      data.creditMode = creditMode;
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data,
    });

    await prisma.auditLog.create({
      data: {
        userId: owner.id,
        action: 'UPDATE_CUSTOMER_STATUS',
        targetId: userId,
        details: JSON.stringify(data),
      },
    });

    return NextResponse.json({ success: true, customer: updated });
  } catch (err: any) {
    const status = err.message === 'FORBIDDEN' ? 403 : err.message === 'UNAUTHORIZED' ? 401 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
