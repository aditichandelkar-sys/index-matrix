import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { normalizeUrl } from '@/lib/property-matcher';

const sitemapSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  sitemapUrl: z.string().min(4, 'Sitemap URL is required').trim(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    const sitemaps = await prisma.sitemap.findMany({
      where: {
        ...(projectId ? { projectId } : {}),
        project: user.role === 'OWNER' ? {} : { userId: user.id },
      },
      include: {
        project: { select: { id: true, name: true, domain: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, sitemaps });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const parsed = sitemapSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { projectId, sitemapUrl: rawUrl } = parsed.data;

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ...(user.role === 'OWNER' ? {} : { userId: user.id }),
      },
    });

    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    const { url: parsedUrl, error } = normalizeUrl(rawUrl);
    if (!parsedUrl || error) {
      return NextResponse.json({ success: false, error: 'Invalid Sitemap URL' }, { status: 400 });
    }

    const sitemap = await prisma.sitemap.create({
      data: {
        projectId,
        sitemapUrl: parsedUrl.toString(),
        status: 'PENDING',
      },
    });

    return NextResponse.json({ success: true, sitemap });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
