import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { deductCredits, CREDIT_COSTS } from '@/lib/credit-ledger';
import { parseSitemap } from '@/lib/sitemap-parser';
import { normalizeUrl, findBestMatchingProperty } from '@/lib/property-matcher';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const sitemap = await prisma.sitemap.findFirst({
      where: {
        id: params.id,
        project: user.role === 'OWNER' ? {} : { userId: user.id },
      },
      include: {
        project: {
          include: { properties: true },
        },
      },
    });

    if (!sitemap) {
      return NextResponse.json({ success: false, error: 'Sitemap not found' }, { status: 404 });
    }

    const idempotencyKey = `sitemap_${sitemap.id}_${Date.now()}`;

    // Deduct 5 credits for sitemap parsing & ingestion
    const creditResult = await deductCredits({
      userId: user.id,
      amount: CREDIT_COSTS.SITEMAP_PROCESS,
      operation: 'SITEMAP_PROCESS',
      referenceId: sitemap.id,
      idempotencyKey,
      reason: `Sitemap XML processing for ${sitemap.sitemapUrl}`,
    });

    if (!creditResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INSUFFICIENT_CREDITS',
            message: 'Insufficient credits for sitemap processing.',
          },
        },
        { status: 402 }
      );
    }

    // Mark as PROCESSING
    await prisma.sitemap.update({
      where: { id: sitemap.id },
      data: { status: 'PROCESSING' },
    });

    // Parse Sitemap XML
    const parsed = await parseSitemap(sitemap.sitemapUrl);

    if (parsed.error) {
      await prisma.sitemap.update({
        where: { id: sitemap.id },
        data: { status: 'ERROR', errorMessage: parsed.error },
      });
      return NextResponse.json({ success: false, error: parsed.error }, { status: 502 });
    }

    let ingestedCount = 0;
    // Ingest extracted URLs into the project
    for (const rawUrl of parsed.urls) {
      const { url: parsedUrl } = normalizeUrl(rawUrl);
      if (!parsedUrl) continue;

      const normalized = parsedUrl.toString();
      const match = findBestMatchingProperty(normalized, sitemap.project.properties);

      await prisma.url.upsert({
        where: {
          projectId_normalizedUrl: {
            projectId: sitemap.projectId,
            normalizedUrl: normalized,
          },
        },
        update: {
          matchedPropertyId: match.property?.id || null,
        },
        create: {
          projectId: sitemap.projectId,
          originalUrl: rawUrl,
          normalizedUrl: normalized,
          hostname: parsedUrl.hostname,
          path: parsedUrl.pathname + parsedUrl.search,
          status: 'DISCOVERY_PENDING',
          matchedPropertyId: match.property?.id || null,
        },
      });
      ingestedCount++;
    }

    // Update sitemap record
    const updatedSitemap = await prisma.sitemap.update({
      where: { id: sitemap.id },
      data: {
        isIndex: parsed.isIndex,
        urlCount: ingestedCount,
        lastProcessedAt: new Date(),
        status: 'COMPLETED',
        errorMessage: null,
      },
    });

    return NextResponse.json({
      success: true,
      sitemap: updatedSitemap,
      extractedCount: parsed.totalExtracted,
      ingestedCount,
      isIndex: parsed.isIndex,
      creditsDeducted: creditResult.amountDeducted,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
