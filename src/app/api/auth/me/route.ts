import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ success: false, user: null }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: {
        wallet: true,
        projects: {
          select: { id: true, name: true, domain: true },
          take: 5,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, user: null }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        creditMode: user.creditMode,
        balance: user.creditMode === 'UNLIMITED' ? 'UNLIMITED' : user.wallet?.balance || 0,
        lifetimeUsed: user.wallet?.lifetimeUsed || 0,
        projects: user.projects,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
