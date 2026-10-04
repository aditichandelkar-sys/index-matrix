import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireOwner } from '@/lib/auth';

export async function GET() {
  try {
    await requireOwner();
    const settings = await prisma.systemSetting.findMany({
      orderBy: { key: 'asc' },
    });
    return NextResponse.json({ success: true, settings });
  } catch (err: any) {
    const status = err.message === 'FORBIDDEN' ? 403 : err.message === 'UNAUTHORIZED' ? 401 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const owner = await requireOwner();
    const body = await req.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ success: false, error: 'Key and value required' }, { status: 400 });
    }

    const updated = await prisma.systemSetting.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) },
    });

    await prisma.auditLog.create({
      data: {
        userId: owner.id,
        action: 'UPDATE_SYSTEM_SETTING',
        details: JSON.stringify({ key, value }),
      },
    });

    return NextResponse.json({ success: true, setting: updated });
  } catch (err: any) {
    const status = err.message === 'FORBIDDEN' ? 403 : err.message === 'UNAUTHORIZED' ? 401 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
