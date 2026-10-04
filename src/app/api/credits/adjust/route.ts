import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireOwner } from '@/lib/auth';
import { addCredits, deductCredits } from '@/lib/credit-ledger';

const adjustSchema = z.object({
  targetUserId: z.string().uuid('Invalid user ID'),
  amount: z.number().int(),
  action: z.enum(['ADD', 'REMOVE']),
  reason: z.string().min(5, 'Mandatory audit reason must be at least 5 characters').trim(),
});

export async function POST(req: NextRequest) {
  try {
    const owner = await requireOwner();

    const body = await req.json();
    const parsed = adjustSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { targetUserId, amount, action, reason } = parsed.data;

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: { wallet: true },
    });

    if (!targetUser) {
      return NextResponse.json({ success: false, error: 'Target customer not found' }, { status: 404 });
    }

    let result;
    const idempotencyKey = `admin_adj_${targetUserId}_${Date.now()}`;

    if (action === 'ADD') {
      result = await addCredits({
        userId: targetUserId,
        amount: Math.abs(amount),
        type: 'ADMIN_ADD',
        idempotencyKey,
        reason: `Admin adjustment by ${owner.email}: ${reason}`,
      });
    } else {
      result = await deductCredits({
        userId: targetUserId,
        amount: Math.abs(amount),
        operation: 'ADMIN_REMOVE',
        idempotencyKey,
        reason: `Admin deduction by ${owner.email}: ${reason}`,
      });
    }

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error || 'Adjustment failed' }, { status: 400 });
    }

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId: owner.id,
        action: 'CREDIT_ADJUSTMENT',
        targetId: targetUserId,
        details: JSON.stringify({
          action,
          amount,
          reason,
          balanceAfter: result.balanceAfter,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (err: any) {
    const status = err.message === 'FORBIDDEN' ? 403 : err.message === 'UNAUTHORIZED' ? 401 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
