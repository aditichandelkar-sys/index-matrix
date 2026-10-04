import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const key = await prisma.apiKey.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!key) {
      return NextResponse.json({ success: false, error: 'API key not found' }, { status: 404 });
    }

    await prisma.apiKey.update({
      where: { id: params.id },
      data: { revokedAt: new Date() },
    });

    return NextResponse.json({ success: true, message: 'API key revoked' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
