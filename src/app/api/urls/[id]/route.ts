import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const url = await prisma.url.findFirst({
      where: {
        id: params.id,
        project: user.role === 'OWNER' ? {} : { userId: user.id },
      },
      include: {
        project: { select: { id: true, name: true, domain: true } },
        matchedProperty: true,
        analyses: {
          orderBy: { analyzedAt: 'desc' },
          take: 5,
        },
        inspections: {
          orderBy: { inspectedAt: 'desc' },
          take: 5,
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!url) {
      return NextResponse.json({ success: false, error: 'URL not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, url });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const url = await prisma.url.findFirst({
      where: {
        id: params.id,
        project: user.role === 'OWNER' ? {} : { userId: user.id },
      },
    });

    if (!url) {
      return NextResponse.json({ success: false, error: 'URL not found' }, { status: 404 });
    }

    await prisma.url.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'URL removed' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
