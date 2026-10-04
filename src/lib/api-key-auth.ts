import { hashSha256 } from './crypto';
import { prisma } from './db';
import { UserSessionData } from './auth';

/**
 * Validates an incoming API key string against stored cryptographic hashes
 */
export async function validateApiKey(rawKey: string): Promise<UserSessionData | null> {
  if (!rawKey || !rawKey.startsWith('im_')) {
    return null;
  }

  const keyHash = hashSha256(rawKey);

  const apiKeyRecord = await prisma.apiKey.findUnique({
    where: { keyHash },
    include: { user: true },
  });

  if (!apiKeyRecord) {
    return null;
  }

  // Check if revoked
  if (apiKeyRecord.revokedAt) {
    return null;
  }

  // Check if expired
  if (apiKeyRecord.expiresAt && apiKeyRecord.expiresAt.getTime() < Date.now()) {
    return null;
  }

  // Check user status
  const user = apiKeyRecord.user;
  if (!user || user.status === 'SUSPENDED') {
    return null;
  }

  // Asynchronously record lastUsedAt
  prisma.apiKey
    .update({
      where: { id: apiKeyRecord.id },
      data: { lastUsedAt: new Date() },
    })
    .catch(() => {});

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as 'OWNER' | 'CUSTOMER',
    creditMode: user.creditMode as 'LIMITED' | 'UNLIMITED',
    status: user.status as 'ACTIVE' | 'SUSPENDED',
  };
}
