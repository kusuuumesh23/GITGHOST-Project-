/**
 * oauth.test.ts
 *
 * Tests AES-256-GCM token encryption (no DB needed) and OAuth CSRF
 * state validation using Prisma mocks.
 *
 * TOKEN_ENCRYPTION_KEY env is stubbed to a deterministic 32-byte hex value
 * so the tests run in any environment (CI, local) without a real .env file.
 */
import { describe, it, expect, vi, beforeAll } from 'vitest';

// ── Stub env BEFORE any service imports ──────────────────────────────────────
vi.mock('../../src/config/env.js', () => ({
  env: {
    TOKEN_ENCRYPTION_KEY: '0'.repeat(64), // 32 zero-bytes — test-only key
    LINKEDIN_CLIENT_ID: 'test-linkedin-id',
    LINKEDIN_CLIENT_SECRET: 'test-linkedin-secret',
    X_CLIENT_ID: 'test-x-id',
    X_CLIENT_SECRET: 'test-x-secret',
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
  },
}));

// ── Stub Prisma ───────────────────────────────────────────────────────────────
vi.mock('../../src/db/prisma.js', () => ({
  prisma: {
    socialConnection: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    userConsent: {
      count: vi.fn(),
    },
  },
}));

// ── Imports (must be after vi.mock calls) ────────────────────────────────────
const { encryptToken, decryptToken, encryptTokenSafe, decryptTokenSafe } =
  await import('../../src/utils/crypto.js');
const { linkedInCallback, xCallback } = await import('../../src/services/oauth.service.js');
const { prisma } = await import('../../src/db/prisma.js');
const { BadRequestError } = await import('../../src/utils/errors.js');

describe('Token Encryption (AES-256-GCM)', () => {
  it('encrypts and decrypts tokens round-trip correctly', () => {
    const rawToken = 'ya29.a0AfH6SMD_secure_token_value_xyz';
    const ciphertext = encryptToken(rawToken);
    expect(decryptToken(ciphertext)).toBe(rawToken);
  });

  it('produces a unique IV per encryption call', () => {
    const rawToken = 'same-token-input';
    const c1 = encryptToken(rawToken);
    const c2 = encryptToken(rawToken);
    // Different IVs → different ciphertexts even for same plaintext
    expect(c1).not.toBe(c2);
    // Both decrypt to original
    expect(decryptToken(c1)).toBe(rawToken);
    expect(decryptToken(c2)).toBe(rawToken);
  });

  it('ciphertext has iv:tag:ciphertext (3-part) format', () => {
    const ct = encryptToken('some-secret');
    const parts = ct.split(':');
    expect(parts).toHaveLength(3);
    // iv is 12 bytes = 24 hex chars; tag is 16 bytes = 32 hex chars
    expect(parts[0]).toHaveLength(24);
    expect(parts[1]).toHaveLength(32);
  });

  it('throws on tampered ciphertext (auth tag mismatch)', () => {
    const ct = encryptToken('tamper-test');
    const [iv, tag, data] = ct.split(':');
    // Flip last 2 chars of ciphertext
    const tampered = `${iv}:${tag}:${data.slice(0, -2)}00`;
    expect(() => decryptToken(tampered)).toThrow();
  });

  it('encryptTokenSafe returns null for null/undefined input', () => {
    expect(encryptTokenSafe(null)).toBeNull();
    expect(encryptTokenSafe(undefined)).toBeNull();
  });

  it('decryptTokenSafe returns null for null/undefined and bad ciphertext', () => {
    expect(decryptTokenSafe(null)).toBeNull();
    expect(decryptTokenSafe(undefined)).toBeNull();
    // Invalid format — should not throw, should return null
    expect(decryptTokenSafe('not-a-valid-ciphertext')).toBeNull();
  });
});

describe('OAuth CSRF State Validation', () => {
  it('linkedInCallback throws BadRequestError when no matching state is found', async () => {
    // findFirst returns null → state is invalid/expired
    vi.mocked(prisma.socialConnection.findFirst).mockResolvedValueOnce(null);

    await expect(
      linkedInCallback('fake_code', 'invalid_or_expired_state'),
    ).rejects.toThrow(BadRequestError);
  });

  it('xCallback throws BadRequestError when no matching state is found', async () => {
    vi.mocked(prisma.socialConnection.findFirst).mockResolvedValueOnce(null);

    await expect(
      xCallback('fake_code', 'invalid_or_expired_state'),
    ).rejects.toThrow(BadRequestError);
  });
});
