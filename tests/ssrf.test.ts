import { describe, it, expect } from 'vitest';
import { isPrivateOrReservedIPv4, isPrivateOrReservedIPv6, validateUrlForSSRF } from '@/lib/ssrf';

describe('SSRF Protection Firewall', () => {
  it('blocks loopback IP addresses (127.0.0.1, 127.0.0.2)', () => {
    expect(isPrivateOrReservedIPv4('127.0.0.1')).toBe(true);
    expect(isPrivateOrReservedIPv4('127.0.0.2')).toBe(true);
    expect(isPrivateOrReservedIPv4('127.255.255.255')).toBe(true);
  });

  it('blocks RFC 1918 private IPv4 ranges', () => {
    // 10.0.0.0/8
    expect(isPrivateOrReservedIPv4('10.0.0.1')).toBe(true);
    expect(isPrivateOrReservedIPv4('10.254.1.10')).toBe(true);
    // 172.16.0.0/12
    expect(isPrivateOrReservedIPv4('172.16.0.1')).toBe(true);
    expect(isPrivateOrReservedIPv4('172.31.255.254')).toBe(true);
    // 192.168.0.0/16
    expect(isPrivateOrReservedIPv4('192.168.1.1')).toBe(true);
    expect(isPrivateOrReservedIPv4('192.168.100.50')).toBe(true);
  });

  it('blocks cloud metadata endpoint (169.254.169.254)', () => {
    expect(isPrivateOrReservedIPv4('169.254.169.254')).toBe(true);
    expect(isPrivateOrReservedIPv4('169.254.0.1')).toBe(true);
  });

  it('allows genuine public IPv4 addresses', () => {
    expect(isPrivateOrReservedIPv4('8.8.8.8')).toBe(false); // Google DNS
    expect(isPrivateOrReservedIPv4('1.1.1.1')).toBe(false); // Cloudflare
    expect(isPrivateOrReservedIPv4('142.250.190.46')).toBe(false);
  });

  it('blocks IPv6 loopback, link-local, and unique local addresses', () => {
    expect(isPrivateOrReservedIPv6('::1')).toBe(true);
    expect(isPrivateOrReservedIPv6('fe80::1')).toBe(true);
    expect(isPrivateOrReservedIPv6('fc00::1')).toBe(true);
    expect(isPrivateOrReservedIPv6('fd12:3456:789a::1')).toBe(true);
  });

  it('rejects unsupported protocols (file, ftp, gopher)', async () => {
    const fileRes = await validateUrlForSSRF('file:///etc/passwd');
    expect(fileRes.isSafe).toBe(false);

    const ftpRes = await validateUrlForSSRF('ftp://speedtest.tele2.net');
    expect(ftpRes.isSafe).toBe(false);

    const gopherRes = await validateUrlForSSRF('gopher://127.0.0.1:70');
    expect(gopherRes.isSafe).toBe(false);
  });

  it('blocks direct localhost URLs', async () => {
    const res = await validateUrlForSSRF('http://localhost:3000/api');
    expect(res.isSafe).toBe(false);
  });

  it('blocks direct cloud metadata target', async () => {
    const res = await validateUrlForSSRF('http://169.254.169.254/latest/meta-data/');
    expect(res.isSafe).toBe(false);
  });
});
