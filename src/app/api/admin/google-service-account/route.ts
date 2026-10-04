import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import {
  getMasterServiceAccount,
  saveMasterServiceAccount,
  getGoogleServiceAccountToken,
  ServiceAccountCredentials,
} from '@/lib/google-service-account';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const creds = await getMasterServiceAccount();
    if (!creds) {
      return NextResponse.json({
        success: true,
        isConfigured: false,
      });
    }

    return NextResponse.json({
      success: true,
      isConfigured: true,
      clientEmail: creds.client_email,
      projectId: creds.project_id || 'Unknown',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'OWNER') {
      return NextResponse.json({ success: false, error: 'Unauthorized: Only System Owner can configure Service Accounts' }, { status: 403 });
    }

    const body = await req.json();
    let credentials: ServiceAccountCredentials;

    if (typeof body.jsonContent === 'string') {
      try {
        credentials = JSON.parse(body.jsonContent);
      } catch {
        return NextResponse.json({ success: false, error: 'Invalid JSON format in uploaded credentials' }, { status: 400 });
      }
    } else if (body.client_email && body.private_key) {
      credentials = body as ServiceAccountCredentials;
    } else {
      return NextResponse.json({ success: false, error: 'Missing client_email or private_key' }, { status: 400 });
    }

    if (!credentials.client_email || !credentials.private_key) {
      return NextResponse.json({ success: false, error: 'Credentials must contain client_email and private_key' }, { status: 400 });
    }

    // Test credentials by requesting a live token from Google
    try {
      const testToken = await getGoogleServiceAccountToken(credentials);
      if (!testToken) {
        throw new Error('Google returned empty access token');
      }
    } catch (testErr: any) {
      return NextResponse.json(
        {
          success: false,
          error: `Google verification failed: ${testErr.message}. Make sure Google Indexing API is enabled in Google Cloud Console.`,
        },
        { status: 400 }
      );
    }

    // Save validated credentials
    await saveMasterServiceAccount(credentials);

    return NextResponse.json({
      success: true,
      message: `Successfully connected Google Service Account: ${credentials.client_email}`,
      clientEmail: credentials.client_email,
      projectId: credentials.project_id,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
