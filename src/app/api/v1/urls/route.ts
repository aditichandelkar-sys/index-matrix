import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { validateApiKey } from '@/lib/api-key-auth';
import { normalizeUrl } from '@/lib/property-matcher';
import { deductCredits, CREDIT_COSTS } from '@/lib/credit-ledger';
import { analyzeUrl } from '@/lib/analyzer';

const apiAddUrlSchema = z.object({
  projectId: z.string().uuid(),
  url: z.string().min(4),
  autoAnalyze: z.boolean().default(false),
});

function getApiKeyFromHeaders(req: NextRequest): string | null {
  const auth = req.headers.get('authorization');
  if (auth && auth.startsWith('Bearer ')) {
    return auth.slice(7).trim();
  }
  return req.headers.get('x-api-key') || null;
}

export async function GET(req: NextRequest) {
  const rawKey = getApiKeyFromHeaders(req);
  const user = await validateApiKey(rawKey || '');
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or missing API key.' } },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(10, parseInt(searchParams.get('limit') || '20', 10)));
  const skip = (page - 1) * limit;

  const where: any = {
    project: { userId: user.id },
  };
  if (projectId) where.projectId = projectId;

  const [urls, total] = await Promise.all([
    prisma.url.findMany({
      where,
      select: {
        id: true,
        projectId: true,
        originalUrl: true,
        normalizedUrl: true,
        hostname: true,
        status: true,
        httpStatus: true,
        lastAnalyzedAt: true,
        lastInspectedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.url.count({ where }),
  ]);

  return NextResponse.json({
    success: true,
    data: urls,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function POST(req: NextRequest) {
  const rawKey = getApiKeyFromHeaders(req);
  const user = await validateApiKey(rawKey || '');
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or missing API key.' } },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const parsed = apiAddUrlSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0].message } },
        { status: 400 }
      );
    }

    const { projectId, url: rawUrl, autoAnalyze } = parsed.data;

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: user.id },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } },
        { status: 404 }
      );
    }

    const { url: parsedUrl, error } = normalizeUrl(rawUrl);
    if (!parsedUrl || error) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_URL', message: `Malformed URL: ${error}` } },
        { status: 400 }
      );
    }

    const normalizedUrl = parsedUrl.toString();
    const urlRecord = await prisma.url.upsert({
      where: {
        projectId_normalizedUrl: {
          projectId: project.id,
          normalizedUrl,
        },
      },
      update: {},
      create: {
        projectId: project.id,
        originalUrl: rawUrl,
        normalizedUrl,
        hostname: parsedUrl.hostname,
        path: parsedUrl.pathname + parsedUrl.search,
        status: 'IMPORTED',
      },
    });

    let analysisResult = null;
    if (autoAnalyze) {
      const creditResult = await deductCredits({
        userId: user.id,
        amount: CREDIT_COSTS.URL_ANALYSIS,
        operation: 'URL_ANALYSIS',
        referenceId: urlRecord.id,
        idempotencyKey: `api_analyze_${urlRecord.id}_${Date.now()}`,
        reason: 'Auto-analysis via Public API',
      });

      if (!creditResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INSUFFICIENT_CREDITS',
              message: 'Not enough credits to auto-analyze URL.',
            },
          },
          { status: 402 }
        );
      }

      analysisResult = await analyzeUrl(normalizedUrl);
      await prisma.urlAnalysis.create({
        data: {
          urlId: urlRecord.id,
          httpStatus: analysisResult.httpStatus,
          redirectChain: JSON.stringify(analysisResult.redirectChain),
          responseTimeMs: analysisResult.responseTimeMs,
          contentType: analysisResult.contentType,
          title: analysisResult.title,
          metaDescription: analysisResult.metaDescription,
          robotsMeta: analysisResult.robotsMeta,
          canonicalUrl: analysisResult.canonicalUrl,
          xRobotsTag: analysisResult.xRobotsTag,
          robotsTxtStatus: analysisResult.robotsTxtStatus,
          issues: JSON.stringify(analysisResult.issues),
          passedAudit: analysisResult.passedAudit,
          hasStructuredJob: analysisResult.hasStructuredJob,
        },
      });

      await prisma.url.update({
        where: { id: urlRecord.id },
        data: {
          status: 'ANALYZED',
          httpStatus: analysisResult.httpStatus,
          lastAnalyzedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: urlRecord.id,
        normalizedUrl: urlRecord.normalizedUrl,
        status: autoAnalyze ? 'ANALYZED' : urlRecord.status,
        analysis: analysisResult,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: err.message } },
      { status: 500 }
    );
  }
}
