import { describe, it, expect } from 'vitest';
import { encryptText, decryptText, hashSha256, generateRandomToken } from '@/lib/crypto';

describe('Cryptographic Operations & Token Vault', () => {
  it('encrypts and decrypts OAuth tokens accurately using AES-256-GCM', () => {
    const sensitiveToken = 'ya29.a0ARrdaM-sensitive-google-refresh-token-12345';
    const encrypted = encryptText(sensitiveToken);

    expect(encrypted).not.toBe(sensitiveToken);
    expect(encrypted.split(':').length).toBe(3); // iv:tag:ciphertext

    const decrypted = decryptText(encrypted);
    expect(decrypted).toBe(sensitiveToken);
  });

  it('computes deterministic SHA-256 hashes for API key lookup', () => {
    const key = 'im_live_9f82bc7291a03e';
    const hash1 = hashSha256(key);
    const hash2 = hashSha256(key);

    expect(hash1).toBe(hash2);
    expect(hash1.length).toBe(64); // 256 bits hex
  });

  it('generates cryptographically secure random tokens', () => {
    const token1 = generateRandomToken(32);
    const token2 = generateRandomToken(32);

    expect(token1).not.toBe(token2);
    expect(token1.length).toBe(64);
  });
});
