import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { checkGoogleIndexStatus } from '@/lib/serp-checker';

const checkSchema = z.object({
  url: z.string().min(4),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const parsed = checkSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid URL' }, { status: 400 });
    }

    const targetUrl = parsed.data.url.trim();
    const statusReport = await checkGoogleIndexStatus(targetUrl);

    // Update database status if record exists
    const existingUrl = await prisma.url.findFirst({
      where: {
        normalizedUrl: targetUrl,
        project: user.role === 'OWNER' ? {} : { userId: user.id },
      },
    });

    if (existingUrl) {
      const newStatus = statusReport.isIndexed ? 'INDEXED' : 'SUBMITTED';

      await prisma.url.update({
        where: { id: existingUrl.id },
        data: {
          status: newStatus as any,
          lastInspectedAt: new Date(),
          ...(statusReport.isIndexed ? { lastCrawl: new Date() } : {}),
        },
      });

      await prisma.urlStatusHistory.create({
        data: {
          urlId: existingUrl.id,
          newStatus: newStatus as any,
          source: 'GOOGLE_SERP_CHECK',
          reason: statusReport.details,
        },
      });
    }

    return NextResponse.json({
      success: true,
      report: statusReport,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
