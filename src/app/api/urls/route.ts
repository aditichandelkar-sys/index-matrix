import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { normalizeUrl, findBestMatchingProperty } from '@/lib/property-matcher';

const addUrlSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  url: z.string().min(4, 'URL is required').trim(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(10, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    const where: any = {};

    // Scope to user's projects unless OWNER
    if (user.role !== 'OWNER') {
      where.project = { userId: user.id };
    }

    if (projectId) {
      where.projectId = projectId;
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (search) {
      where.normalizedUrl = { contains: search };
    }

    const [urls, total] = await Promise.all([
      prisma.url.findMany({
        where,
        include: {
          project: { select: { id: true, name: true, domain: true } },
          matchedProperty: { select: { id: true, propertyUrl: true } },
          analyses: {
            orderBy: { analyzedAt: 'desc' },
            take: 1,
            select: { httpStatus: true, passedAudit: true, issues: true, analyzedAt: true },
          },
          inspections: {
            orderBy: { inspectedAt: 'desc' },
            take: 1,
            select: { verdict: true, coverageState: true, inspectedAt: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.url.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      urls,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const parsed = addUrlSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { projectId, url: rawUrl } = parsed.data;

    // Verify project belongs to user
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ...(user.role === 'OWNER' ? {} : { userId: user.id }),
      },
      include: {
        properties: true,
      },
    });

    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    const { url: parsedUrl, error } = normalizeUrl(rawUrl);
    if (!parsedUrl || error) {
      return NextResponse.json({ success: false, error: `Invalid URL: ${error}` }, { status: 400 });
    }

    const normalizedUrl = parsedUrl.toString();
    const hostname = parsedUrl.hostname;
    const path = parsedUrl.pathname + parsedUrl.search;

    // Check if property matches
    const match = findBestMatchingProperty(normalizedUrl, project.properties);

    const urlRecord = await prisma.url.upsert({
      where: {
        projectId_normalizedUrl: {
          projectId: project.id,
          normalizedUrl,
        },
      },
      update: {
        matchedPropertyId: match.property?.id || null,
      },
      create: {
        projectId: project.id,
        originalUrl: rawUrl,
        normalizedUrl,
        hostname,
        path,
        status: 'IMPORTED',
        matchedPropertyId: match.property?.id || null,
      },
    });

    return NextResponse.json({ success: true, url: urlRecord });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
