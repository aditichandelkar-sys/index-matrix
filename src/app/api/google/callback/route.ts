import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { exchangeCodeForTokens, listSearchConsoleProperties, GOOGLE_OAUTH_SCOPES } from '@/lib/google-client';
import { encryptText } from '@/lib/crypto';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(new URL(`/dashboard/google?error=${encodeURIComponent(error)}`, req.url));
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL('/dashboard/google?error=missing_code_or_state', req.url));
    }

    const userId = state.split(':')[0];
    if (!userId) {
      return NextResponse.redirect(new URL('/dashboard/google?error=invalid_state', req.url));
    }

    const tokens = await exchangeCodeForTokens(code);

    const email = 'connected-user@google.com'; // In mock or extracted from idToken
    const expiresAt = new Date(Date.now() + tokens.expiresIn * 1000);

    const googleAccount = await prisma.googleAccount.create({
      data: {
        userId,
        email,
        encryptedAccessToken: encryptText(tokens.accessToken),
        encryptedRefreshToken: tokens.refreshToken ? encryptText(tokens.refreshToken) : null,
        tokenExpiresAt: expiresAt,
        scopes: tokens.scope || GOOGLE_OAUTH_SCOPES.join(' '),
        status: 'ACTIVE',
      },
    });

    // Automatically fetch verified Search Console properties
    try {
      const properties = await listSearchConsoleProperties(googleAccount.id);
      for (const prop of properties) {
        await prisma.searchConsoleProperty.upsert({
          where: {
            googleAccountId_propertyUrl: {
              googleAccountId: googleAccount.id,
              propertyUrl: prop.siteUrl,
            },
          },
          update: {
            permissionLevel: prop.permissionLevel,
          },
          create: {
            googleAccountId: googleAccount.id,
            propertyUrl: prop.siteUrl,
            permissionLevel: prop.permissionLevel,
            isVerified: true,
          },
        });
      }
    } catch (e) {
      console.warn('Could not auto-fetch properties immediately:', e);
    }

    return NextResponse.redirect(new URL('/dashboard/google?success=connected', req.url));
  } catch (err: any) {
    return NextResponse.redirect(
      new URL(`/dashboard/google?error=${encodeURIComponent(err.message || 'unknown')}`, req.url)
    );
  }
}
