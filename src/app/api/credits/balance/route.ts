import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const userRecord = await prisma.user.findUnique({
      where: { id: user.id },
      include: { wallet: true },
    });

    if (!userRecord) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });

    const isUnlimited = userRecord.creditMode === 'UNLIMITED';

    return NextResponse.json({
      success: true,
      balance: isUnlimited ? 'UNLIMITED' : userRecord.wallet?.balance || 0,
      lifetimeUsed: userRecord.wallet?.lifetimeUsed || 0,
      lifetimePurchased: userRecord.wallet?.lifetimePurchased || 0,
      creditMode: userRecord.creditMode,
      role: userRecord.role,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
