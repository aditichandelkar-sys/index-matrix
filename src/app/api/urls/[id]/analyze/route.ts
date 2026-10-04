import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { deductCredits, CREDIT_COSTS } from '@/lib/credit-ledger';
import { analyzeUrl } from '@/lib/analyzer';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const urlRecord = await prisma.url.findFirst({
      where: {
        id: params.id,
        project: user.role === 'OWNER' ? {} : { userId: user.id },
      },
    });

    if (!urlRecord) {
      return NextResponse.json({ success: false, error: 'URL not found' }, { status: 404 });
    }

    const idempotencyKey = `analyze_${urlRecord.id}_${Date.now()}`;

    // Deduct credits (1 credit for URL analysis)
    const creditResult = await deductCredits({
      userId: user.id,
      amount: CREDIT_COSTS.URL_ANALYSIS,
      operation: 'URL_ANALYSIS',
      referenceId: urlRecord.id,
      idempotencyKey,
      reason: `Technical analysis for ${urlRecord.normalizedUrl}`,
    });

    if (!creditResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INSUFFICIENT_CREDITS',
            message: 'You have insufficient credits to perform URL analysis. Please purchase credits or upgrade your plan.',
          },
        },
        { status: 402 }
      );
    }

    // Set status to ANALYZING
    await prisma.url.update({
      where: { id: urlRecord.id },
      data: { status: 'ANALYZING' as any },
    });

    // Execute SSRF-hardened technical URL audit
    const analysis = await analyzeUrl(urlRecord.normalizedUrl);

    // Save analysis record
    const savedAnalysis = await prisma.urlAnalysis.create({
      data: {
        urlId: urlRecord.id,
        httpStatus: analysis.httpStatus,
        redirectChain: JSON.stringify(analysis.redirectChain),
        responseTimeMs: analysis.responseTimeMs,
        contentType: analysis.contentType,
        title: analysis.title,
        metaDescription: analysis.metaDescription,
        robotsMeta: analysis.robotsMeta,
        canonicalUrl: analysis.canonicalUrl,
        xRobotsTag: analysis.xRobotsTag,
        robotsTxtStatus: analysis.robotsTxtStatus,
        issues: JSON.stringify(analysis.issues),
        passedAudit: analysis.passedAudit,
        hasStructuredJob: analysis.hasStructuredJob,
      },
    });

    // Determine new status
    let newStatus = 'ANALYZED';
    if (analysis.issues.some((i) => i.issue === 'NOINDEX' || i.issue === 'ROBOTS_BLOCKED')) {
      newStatus = 'BLOCKED';
    } else if (analysis.httpStatus >= 400 || analysis.httpStatus === 0) {
      newStatus = 'ERROR';
    }

    await prisma.url.update({
      where: { id: urlRecord.id },
      data: {
        status: newStatus as any,
        httpStatus: analysis.httpStatus,
        lastAnalyzedAt: new Date(),
        creditsUsed: { increment: creditResult.amountDeducted },
      },
    });

    await prisma.urlStatusHistory.create({
      data: {
        urlId: urlRecord.id,
        newStatus: newStatus as any,
        source: 'ANALYSIS',
        reason: `Technical analysis completed: HTTP ${analysis.httpStatus}, ${analysis.issues.length} issue(s)`,
      },
    });

    return NextResponse.json({
      success: true,
      analysis: {
        ...analysis,
        id: savedAnalysis.id,
      },
      newStatus,
      creditsDeducted: creditResult.amountDeducted,
      remainingBalance: creditResult.isUnlimited ? 'UNLIMITED' : creditResult.balanceAfter,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
