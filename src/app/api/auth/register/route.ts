import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { hashPassword, createSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';
import { addCredits } from '@/lib/credit-ledger';

const registerSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').trim(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, password, name } = parsed.data;

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    // Create user and wallet in a transaction
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: 'CUSTOMER',
        creditMode: 'LIMITED',
        status: 'ACTIVE',
        wallet: {
          create: {
            balance: 0,
            lifetimeUsed: 0,
            lifetimePurchased: 0,
          },
        },
      },
      include: { wallet: true },
    });

    // Grant 50 free welcome credits
    await addCredits({
      userId: user.id,
      amount: 50,
      type: 'BONUS',
      idempotencyKey: `welcome_bonus_${user.id}`,
      reason: 'Welcome bonus for new customer registration',
    });

    // Create default starter project
    await prisma.project.create({
      data: {
        userId: user.id,
        name: 'My First Project',
        domain: 'example.com',
        description: 'Default project created on registration',
      },
    });

    // Create session token
    const token = await createSessionToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: 'CUSTOMER',
      creditMode: 'LIMITED',
      status: 'ACTIVE',
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        creditMode: user.creditMode,
        balance: 50,
      },
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
