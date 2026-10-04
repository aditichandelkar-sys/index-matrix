import * as jose from 'jose';
import { prisma } from './db';

export interface ServiceAccountCredentials {
  type?: string;
  project_id?: string;
  private_key_id?: string;
  private_key: string;
  client_email: string;
  client_id?: string;
  auth_uri?: string;
  token_uri?: string;
}

export interface GoogleIndexingApiResponse {
  url: string;
  type: 'URL_UPDATED' | 'URL_DELETED';
  notifyTime?: string;
  error?: {
    code: number;
    message: string;
    status: string;
  };
}

/**
 * Obtains an OAuth 2.0 Access Token from Google using a Service Account JSON Key
 * via RFC 7523 JWT Bearer Token flow (signed with RS256)
 */
export async function getGoogleServiceAccountToken(credentials: ServiceAccountCredentials): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const tokenUri = credentials.token_uri || 'https://oauth2.googleapis.com/token';

  // Format private key (handle escaped newlines if passed in JSON or string)
  const cleanPrivateKey = credentials.private_key.replace(/\\n/g, '\n');

  // Import RSA Private Key for RS256 signing
  const privateKeyObj = await jose.importPKCS8(cleanPrivateKey, 'RS256');

  // Build JWT Assertion
  const jwt = await new jose.SignJWT({
    scope: 'https://www.googleapis.com/auth/indexing',
  })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuer(credentials.client_email)
    .setSubject(credentials.client_email)
    .setAudience(tokenUri)
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(privateKeyObj);

  // Exchange JWT Assertion for Google OAuth Access Token
  const tokenResponse = await fetch(tokenUri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    throw new Error(`Google Service Account Token Exchange Failed: ${tokenResponse.status} ${errorText}`);
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

/**
 * Calls the Official Google Indexing API (URL_UPDATED)
 * Endpoint: https://indexing.googleapis.com/v3/urlNotifications:publish
 */
export async function publishToGoogleIndexingApi(
  targetUrl: string,
  credentials: ServiceAccountCredentials,
  type: 'URL_UPDATED' | 'URL_DELETED' = 'URL_UPDATED'
): Promise<GoogleIndexingApiResponse> {
  const accessToken = await getGoogleServiceAccountToken(credentials);

  const res = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: targetUrl,
      type,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    return {
      url: targetUrl,
      type,
      error: data.error || {
        code: res.status,
        message: JSON.stringify(data),
        status: 'ERROR',
      },
    };
  }

  return {
    url: targetUrl,
    type,
    notifyTime: data.urlNotificationMetadata?.latestUpdate?.notifyTime || new Date().toISOString(),
  };
}

/**
 * Retrieves the stored master service account credentials from SystemSetting or .env
 */
export async function getMasterServiceAccount(): Promise<ServiceAccountCredentials | null> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'MASTER_GOOGLE_SERVICE_ACCOUNT' },
    });

    if (setting && setting.value) {
      return JSON.parse(setting.value);
    }

    if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      return JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    }
  } catch {
    // ignore parse error
  }
  return null;
}

/**
 * Saves or updates the master service account credentials
 */
export async function saveMasterServiceAccount(credentials: ServiceAccountCredentials): Promise<void> {
  await prisma.systemSetting.upsert({
    where: { key: 'MASTER_GOOGLE_SERVICE_ACCOUNT' },
    update: {
      value: JSON.stringify(credentials),
      description: `Google Service Account for ${credentials.client_email}`,
    },
    create: {
      key: 'MASTER_GOOGLE_SERVICE_ACCOUNT',
      value: JSON.stringify(credentials),
      description: `Google Service Account for ${credentials.client_email}`,
    },
  });
}
