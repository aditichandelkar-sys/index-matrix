import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

const projectSchema = z.object({
  name: z.string().min(2, 'Project name is required').trim(),
  domain: z.string().min(3, 'Domain is required').toLowerCase().trim(),
  description: z.string().optional(),
});

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const projects = await prisma.project.findMany({
      where: user.role === 'OWNER' ? {} : { userId: user.id },
      include: {
        _count: {
          select: { urls: true, sitemaps: true, properties: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, projects });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = projectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
    }

    // Clean domain: strip http:// or https:// if provided
    let cleanDomain = parsed.data.domain.replace(/^https?:\/\//i, '').replace(/\/.*$/, '');

    const project = await prisma.project.create({
      data: {
        userId: user.id,
        name: parsed.data.name,
        domain: cleanDomain,
        description: parsed.data.description || null,
      },
    });

    return NextResponse.json({ success: true, project });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
