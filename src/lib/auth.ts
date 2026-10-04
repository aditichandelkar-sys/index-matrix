import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { prisma } from './db';

const JWT_SECRET = new TextEncoder().encode(
  process.env.APP_SECRET || 'index-matrix-super-secret-key-min-32-chars-long-1234567890'
);

const SESSION_COOKIE_NAME = 'index_matrix_session';
const SESSION_EXPIRY = '7d';

export interface UserSessionData {
  id: string;
  email: string;
  name: string;
  role: 'OWNER' | 'CUSTOMER';
  creditMode: 'LIMITED' | 'UNLIMITED';
  status: 'ACTIVE' | 'SUSPENDED';
}

/**
 * Hash plaintext password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

/**
 * Verify plaintext password against bcrypt hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Create a signed JWT session token
 */
export async function createSessionToken(user: UserSessionData): Promise<string> {
  return new SignJWT({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    creditMode: user.creditMode,
    status: user.status
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(SESSION_EXPIRY)
    .sign(JWT_SECRET);
}

/**
 * Verify a session token and return the payload
 */
export async function verifySessionToken(token: string): Promise<UserSessionData | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (!payload.sub || !payload.email) return null;

    return {
      id: payload.sub as string,
      email: payload.email as string,
      name: (payload.name as string) || '',
      role: (payload.role as 'OWNER' | 'CUSTOMER') || 'CUSTOMER',
      creditMode: (payload.creditMode as 'LIMITED' | 'UNLIMITED') || 'LIMITED',
      status: (payload.status as 'ACTIVE' | 'SUSPENDED') || 'ACTIVE'
    };
  } catch {
    return null;
  }
}

/**
 * Get current authenticated user from request cookies
 */
export async function getSessionUser(): Promise<UserSessionData | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = await verifySessionToken(token);
    if (!payload) return null;

    // Check user still exists and is ACTIVE
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        creditMode: true,
        status: true
      }
    });

    if (!user || user.status === 'SUSPENDED') {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as 'OWNER' | 'CUSTOMER',
      creditMode: user.creditMode as 'LIMITED' | 'UNLIMITED',
      status: user.status as 'ACTIVE' | 'SUSPENDED'
    };
  } catch {
    return null;
  }
}

/**
 * Middleware/Route helper to enforce authentication
 */
export async function requireUser(): Promise<UserSessionData> {
  const user = await getSessionUser();
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  return user;
}

/**
 * Middleware/Route helper to enforce OWNER role
 */
export async function requireOwner(): Promise<UserSessionData> {
  const user = await requireUser();
  if (user.role !== 'OWNER') {
    throw new Error('FORBIDDEN');
  }
  return user;
}

export { SESSION_COOKIE_NAME };
