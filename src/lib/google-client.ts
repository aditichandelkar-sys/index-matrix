import { encryptText, decryptText } from './crypto';
import { prisma } from './db';

const GOOGLE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const SEARCH_CONSOLE_SITES_API = 'https://www.googleapis.com/webmasters/v3/sites';
const URL_INSPECTION_API = 'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect';

export const GOOGLE_OAUTH_SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/webmasters.readonly',
  // Official indexing scope (only used when eligible content is present)
  'https://www.googleapis.com/auth/indexing',
];

/**
 * Builds the Google OAuth 2.0 authorization URL
 */
export function buildGoogleAuthUrl(state: string): string {
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/google/callback';

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: GOOGLE_OAUTH_SCOPES.join(' '),
    access_type: 'offline', // Request refresh token
    prompt: 'consent', // Force consent screen to guarantee refresh token
    state,
  });

  return `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`;
}

export interface GoogleTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  scope: string;
  idToken?: string;
}

/**
 * Exchanges authorization code for access & refresh tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<GoogleTokens> {
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/google/callback';

  // Do not fake OAuth tokens in production!
  if (!clientId || clientId.startsWith('mock-') || !clientSecret || clientSecret.startsWith('mock-')) {
    throw new Error('Google OAuth credentials are NOT_CONFIGURED. Please configure valid GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in environment variables.');
  }

  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google token exchange failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
    scope: data.scope,
    idToken: data.id_token,
  };
}

/**
 * Refreshes an expired Google access token
 */
export async function refreshGoogleAccessToken(accountId: string): Promise<string> {
  const account = await prisma.googleAccount.findUnique({
    where: { id: accountId },
  });

  if (!account || !account.encryptedRefreshToken) {
    throw new Error('Google account or refresh token not found');
  }

  const refreshToken = decryptText(account.encryptedRefreshToken);
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';

  if (clientId.startsWith('mock-') || !clientSecret || clientSecret.startsWith('mock-')) {
    const newAccessToken = 'mock_refreshed_access_token_' + Date.now();
    await prisma.googleAccount.update({
      where: { id: accountId },
      data: {
        encryptedAccessToken: encryptText(newAccessToken),
        tokenExpiresAt: new Date(Date.now() + 3600 * 1000),
      },
    });
    return newAccessToken;
  }

  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    await prisma.googleAccount.update({
      where: { id: accountId },
      data: { status: 'EXPIRED' },
    });
    throw new Error(`Failed to refresh Google token: ${err}`);
  }

  const data = await response.json();
  const newAccessToken = data.access_token;
  const newExpiresAt = new Date(Date.now() + (data.expires_in || 3600) * 1000);

  await prisma.googleAccount.update({
    where: { id: accountId },
    data: {
      encryptedAccessToken: encryptText(newAccessToken),
      tokenExpiresAt: newExpiresAt,
      status: 'ACTIVE',
    },
  });

  return newAccessToken;
}

/**
 * Gets a valid access token for a Google account (auto-refreshing if expired)
 */
export async function getValidAccessToken(accountId: string): Promise<string> {
  const account = await prisma.googleAccount.findUnique({
    where: { id: accountId },
  });

  if (!account) throw new Error('Account not found');

  // If token expires in less than 5 minutes, refresh it
  if (account.tokenExpiresAt.getTime() - Date.now() < 300000) {
    return refreshGoogleAccessToken(accountId);
  }

  return decryptText(account.encryptedAccessToken);
}

export interface SearchConsolePropertyEntry {
  siteUrl: string;
  permissionLevel: string;
}

/**
 * Lists verified Google Search Console properties for an authenticated Google Account
 */
export async function listSearchConsoleProperties(accountId: string): Promise<SearchConsolePropertyEntry[]> {
  const accessToken = await getValidAccessToken(accountId);

  if (accessToken.startsWith('mock_')) {
    throw new Error('CONNECTION_REQUIRED: Live Google account authorization required to retrieve Search Console properties.');
  }

  const res = await fetch(SEARCH_CONSOLE_SITES_API, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to fetch Search Console properties: ${res.status} ${err}`);
  }

  const data = await res.json();
  const siteEntryList = data.siteEntry || [];

  return siteEntryList.map((entry: any) => ({
    siteUrl: entry.siteUrl,
    permissionLevel: entry.permissionLevel || 'siteRestrictedUser',
  }));
}

export interface URLInspectionResponse {
  inspectionResult: {
    verdict: string;
    coverageState?: string;
    robotsTxtState?: string;
    indexingState?: string;
    pageFetchState?: string;
    googleCanonical?: string;
    userCanonical?: string;
    crawledAs?: string;
    lastCrawlTime?: string;
  };
  raw: any;
}

/**
 * Calls the official Google Search Console URL Inspection API
 */
export async function inspectUrlWithGoogle(
  accountId: string,
  inspectionUrl: string,
  siteUrl: string
): Promise<URLInspectionResponse> {
  const accessToken = await getValidAccessToken(accountId);

  if (accessToken.startsWith('mock_')) {
    throw new Error('CONNECTION_REQUIRED: Live Google account authorization required to inspect URLs via official Google URL Inspection API.');
  }

  const res = await fetch(URL_INSPECTION_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inspectionUrl,
      siteUrl,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google URL Inspection API failed: ${res.status} ${err}`);
  }

  const data = await res.json();
  const ir = data.inspectionResult || {};
  const indexStatus = ir.indexStatusResult || {};

  return {
    inspectionResult: {
      verdict: indexStatus.verdict || 'NEUTRAL',
      coverageState: indexStatus.coverageState,
      robotsTxtState: indexStatus.robotsTxtState,
      indexingState: indexStatus.indexingState,
      pageFetchState: indexStatus.pageFetchState,
      googleCanonical: indexStatus.googleCanonical,
      userCanonical: indexStatus.userCanonical,
      crawledAs: indexStatus.crawledAs,
      lastCrawlTime: indexStatus.lastCrawlTime,
    },
    raw: data,
  };
}
