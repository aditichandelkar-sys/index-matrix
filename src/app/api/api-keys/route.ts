import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { generateRandomToken, hashSha256 } from '@/lib/crypto';

const createKeySchema = z.object({
  name: z.string().min(2, 'Key name must be at least 2 characters').trim(),
});

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const keys = await prisma.apiKey.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        lastUsedAt: true,
        expiresAt: true,
        revokedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, keys });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const parsed = createKeySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
    }

    // Generate API key: im_live_ + 32 random hex chars
    const secret = generateRandomToken(16);
    const rawKey = `im_live_${secret}`;
    const keyPrefix = rawKey.slice(0, 12) + '...';
    const keyHash = hashSha256(rawKey);

    const apiKey = await prisma.apiKey.create({
      data: {
        userId: user.id,
        name: parsed.data.name,
        keyPrefix,
        keyHash,
      },
    });

    return NextResponse.json({
      success: true,
      key: {
        id: apiKey.id,
        name: apiKey.name,
        keyPrefix: apiKey.keyPrefix,
        rawKey, // Returned exactly once at creation time!
        createdAt: apiKey.createdAt,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
