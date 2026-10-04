import dns from 'dns';
import { promisify } from 'util';

const resolve4Async = promisify(dns.resolve4);
const resolve6Async = promisify(dns.resolve6);

export interface SSRFValidationResult {
  isSafe: boolean;
  reason?: string;
  resolvedIp?: string;
}

/**
 * Checks if an IPv4 address is in a private, loopback, or reserved range.
 */
export function isPrivateOrReservedIPv4(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) {
    return true; // Malformed IP treated as unsafe
  }

  const [a, b, c, d] = parts;

  // 0.0.0.0/8 - Current network ("this" network)
  if (a === 0) return true;

  // 10.0.0.0/8 - Private-Use
  if (a === 10) return true;

  // 127.0.0.0/8 - Loopback
  if (a === 127) return true;

  // 100.64.0.0/10 - Shared Address Space (Carrier-grade NAT)
  if (a === 100 && b >= 64 && b <= 127) return true;

  // 169.254.0.0/16 - Link-Local / Cloud Metadata (169.254.169.254)
  if (a === 169 && b === 254) return true;

  // 172.16.0.0/12 - Private-Use
  if (a === 172 && b >= 16 && b <= 31) return true;

  // 192.0.0.0/24 - IETF Protocol Assignments
  if (a === 192 && b === 0 && c === 0) return true;

  // 192.0.2.0/24 - TEST-NET-1 (Documentation)
  if (a === 192 && b === 0 && c === 2) return true;

  // 192.168.0.0/16 - Private-Use
  if (a === 192 && b === 168) return true;

  // 198.18.0.0/15 - Benchmarking
  if (a === 198 && (b === 18 || b === 19)) return true;

  // 198.51.100.0/24 - TEST-NET-2
  if (a === 198 && b === 51 && c === 100) return true;

  // 203.0.113.0/24 - TEST-NET-3
  if (a === 203 && b === 0 && c === 113) return true;

  // 224.0.0.0/4 - Multicast
  if (a >= 224 && a <= 239) return true;

  // 240.0.0.0/4 - Reserved for Future Use
  if (a >= 240) return true;

  // 255.255.255.255 - Limited Broadcast
  if (a === 255 && b === 255 && c === 255 && d === 255) return true;

  return false;
}

/**
 * Checks if an IPv6 address is in a private, loopback, or reserved range.
 */
export function isPrivateOrReservedIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase();

  // Loopback ::1
  if (normalized === '::1' || normalized === '0:0:0:0:0:0:0:1') return true;

  // Unspecified ::
  if (normalized === '::' || normalized === '0:0:0:0:0:0:0:0') return true;

  // Unique Local Address fc00::/7 (fc00... to fdff...)
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;

  // Link-Local fe80::/10 (fe80... to febf...)
  if (/^fe[89ab]/.test(normalized)) return true;

  // IPv4-mapped IPv6 (::ffff:x.x.x.x)
  if (normalized.includes('::ffff:')) {
    const ipv4Part = normalized.split('::ffff:')[1];
    if (ipv4Part) {
      return isPrivateOrReservedIPv4(ipv4Part);
    }
  }

  return false;
}

/**
 * Validates a target URL against SSRF attack vectors:
 * - Protocol enforcement (http/https only)
 * - Hostname / IP address validation
 * - DNS resolution verification
 */
export async function validateUrlForSSRF(targetUrl: string): Promise<SSRFValidationResult> {
  let parsed: URL;
  try {
    parsed = new URL(targetUrl);
  } catch {
    return { isSafe: false, reason: 'Malformed or invalid URL syntax' };
  }

  // 1. Protocol allowlist
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { isSafe: false, reason: `Unsupported protocol "${parsed.protocol}". Only HTTP and HTTPS are permitted.` };
  }

  const hostname = parsed.hostname.toLowerCase();

  // 2. Reject standard forbidden hostnames
  if (hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.local')) {
    return { isSafe: false, reason: 'Access to localhost and internal domain targets is forbidden.' };
  }

  // 3. Direct IP checking (if hostname is already an IP)
  const isDirectIPv4 = /^(?:\d{1,3}\.){3}\d{1,3}$/.test(hostname);
  if (isDirectIPv4) {
    if (isPrivateOrReservedIPv4(hostname)) {
      return { isSafe: false, reason: `Direct access to private or reserved IP ${hostname} is blocked.` };
    }
    return { isSafe: true, resolvedIp: hostname };
  }

  const isDirectIPv6 = hostname.startsWith('[') && hostname.endsWith(']');
  if (isDirectIPv6) {
    const stripped = hostname.slice(1, -1);
    if (isPrivateOrReservedIPv6(stripped)) {
      return { isSafe: false, reason: `Direct access to private or reserved IPv6 ${hostname} is blocked.` };
    }
    return { isSafe: true, resolvedIp: stripped };
  }

  // 4. DNS Resolution & IP Inspection
  try {
    const ipv4Addresses = await resolve4Async(hostname).catch(() => [] as string[]);
    const ipv6Addresses = await resolve6Async(hostname).catch(() => [] as string[]);

    if (ipv4Addresses.length === 0 && ipv6Addresses.length === 0) {
      return { isSafe: false, reason: `Failed to resolve DNS for hostname "${hostname}". Domain does not exist or has no valid DNS records.` };
    }

    // Inspect all resolved IPv4 addresses
    for (const ip of ipv4Addresses) {
      if (isPrivateOrReservedIPv4(ip)) {
        return { isSafe: false, reason: `DNS resolution for ${hostname} resolved to protected/internal IP address (${ip}).` };
      }
    }

    // Inspect all resolved IPv6 addresses
    for (const ip of ipv6Addresses) {
      if (isPrivateOrReservedIPv6(ip)) {
        return { isSafe: false, reason: `DNS resolution for ${hostname} resolved to protected/internal IPv6 address (${ip}).` };
      }
    }

    const primaryIp = ipv4Addresses[0] || ipv6Addresses[0];
    return { isSafe: true, resolvedIp: primaryIp };
  } catch (err: any) {
    return { isSafe: false, reason: `DNS resolution error: ${err.message || 'Unknown resolution failure'}` };
  }
}
