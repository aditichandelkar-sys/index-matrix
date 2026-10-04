import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        ...(user.role === 'OWNER' ? {} : { userId: user.id }),
      },
      include: {
        properties: true,
        sitemaps: true,
        _count: {
          select: { urls: true },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, project });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        ...(user.role === 'OWNER' ? {} : { userId: user.id }),
      },
    });

    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    await prisma.project.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'Project deleted' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
