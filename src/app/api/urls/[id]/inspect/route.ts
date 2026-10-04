import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { deductCredits, CREDIT_COSTS } from '@/lib/credit-ledger';
import { inspectUrlWithGoogle } from '@/lib/google-client';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const urlRecord = await prisma.url.findFirst({
      where: {
        id: params.id,
        project: user.role === 'OWNER' ? {} : { userId: user.id },
      },
      include: {
        matchedProperty: {
          include: {
            googleAccount: true,
          },
        },
      },
    });

    if (!urlRecord) {
      return NextResponse.json({ success: false, error: 'URL not found' }, { status: 404 });
    }

    if (!urlRecord.matchedProperty || !urlRecord.matchedProperty.googleAccount) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_MATCHED_PROPERTY',
            message: 'This URL does not match an authorized Google Search Console property. Please connect your Google account and link the property to this project first.',
          },
        },
        { status: 400 }
      );
    }

    const property = urlRecord.matchedProperty;
    const googleAccount = property.googleAccount;

    const idempotencyKey = `inspect_${urlRecord.id}_${Date.now()}`;

    // Deduct credits (2 credits for Google Search Console URL inspection)
    const creditResult = await deductCredits({
      userId: user.id,
      amount: CREDIT_COSTS.GOOGLE_INSPECTION,
      operation: 'GOOGLE_INSPECTION',
      referenceId: urlRecord.id,
      idempotencyKey,
      reason: `Google URL Inspection for ${urlRecord.normalizedUrl}`,
    });

    if (!creditResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INSUFFICIENT_CREDITS',
            message: 'Insufficient credits for Google Search Console inspection.',
          },
        },
        { status: 402 }
      );
    }

    // Call official URL Inspection API
    const inspection = await inspectUrlWithGoogle(
      googleAccount.id,
      urlRecord.normalizedUrl,
      property.propertyUrl
    );

    const ir = inspection.inspectionResult;

    // Save inspection record
    const savedInspection = await prisma.googleInspection.create({
      data: {
        urlId: urlRecord.id,
        verdict: ir.verdict || 'NEUTRAL',
        coverageState: ir.coverageState || null,
        indexingState: ir.indexingState || null,
        robotsTxtState: ir.robotsTxtState || null,
        pageFetchState: ir.pageFetchState || null,
        googleCanonical: ir.googleCanonical || null,
        userCanonical: ir.userCanonical || null,
        crawledAs: ir.crawledAs || null,
        lastCrawlTime: ir.lastCrawlTime ? new Date(ir.lastCrawlTime) : null,
        rawResponse: JSON.stringify(inspection.raw),
      },
    });

    // Update status
    let newStatus = urlRecord.status;
    if (ir.verdict === 'PASS' || (ir.coverageState && ir.coverageState.toLowerCase().includes('indexed'))) {
      newStatus = 'INDEXED';
    } else if (ir.verdict === 'FAIL' || (ir.coverageState && ir.coverageState.toLowerCase().includes('not indexed'))) {
      newStatus = 'NOT_INDEXED';
    }

    await prisma.url.update({
      where: { id: urlRecord.id },
      data: {
        status: newStatus as any,
        lastInspectedAt: new Date(),
        lastCrawl: ir.lastCrawlTime ? new Date(ir.lastCrawlTime) : undefined,
        creditsUsed: { increment: creditResult.amountDeducted },
      },
    });

    await prisma.urlStatusHistory.create({
      data: {
        urlId: urlRecord.id,
        newStatus: newStatus as any,
        source: 'GOOGLE_INSPECTION',
        reason: `GSC inspection verdict: ${ir.verdict} (${ir.coverageState || 'No coverage state'})`,
      },
    });

    return NextResponse.json({
      success: true,
      inspection: {
        ...ir,
        id: savedInspection.id,
      },
      newStatus,
      creditsDeducted: creditResult.amountDeducted,
      remainingBalance: creditResult.isUnlimited ? 'UNLIMITED' : creditResult.balanceAfter,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
