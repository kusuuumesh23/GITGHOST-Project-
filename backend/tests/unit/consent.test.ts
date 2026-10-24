import { describe, it, expect, vi, beforeEach } from 'vitest';
import { consentService, CURRENT_CONSENT_VERSION } from '../../src/services/consent.service.js';

// ── Mock Prisma so no real DB is hit ──────────────────────────────────────────
vi.mock('../../src/db/prisma.js', () => ({
  prisma: {
    userConsent: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      deleteMany: vi.fn(),
    },
    socialConnection: {
      updateMany: vi.fn(),
    },
  },
}));

// Lazy import to access the mocked version
const { prisma } = await import('../../src/db/prisma.js');

describe('User Consent Service', () => {
  const userId = 'test-user-123';

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('hasConsent should return false when no consent record exists', async () => {
    vi.mocked(prisma.userConsent.count).mockResolvedValueOnce(0);
    const result = await consentService.hasConsent(userId);
    expect(result).toBe(false);
    expect(prisma.userConsent.count).toHaveBeenCalledWith({ where: { userId } });
  });

  it('hasConsent should return true when a consent record exists', async () => {
    vi.mocked(prisma.userConsent.count).mockResolvedValueOnce(1);
    const result = await consentService.hasConsent(userId);
    expect(result).toBe(true);
  });

  it('recordConsent (alias for giveConsent) should upsert consent with audit metadata', async () => {
    const mockRecord = {
      id: 'consent-1',
      userId,
      consentVersion: CURRENT_CONSENT_VERSION,
      consentText: 'This app will create social media posts for you.',
      agreedAt: new Date(),
      ipAddress: '192.168.1.5',
      userAgent: 'VitestAgent',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(prisma.userConsent.upsert).mockResolvedValueOnce(mockRecord as any);

    const result = await consentService.recordConsent(userId, {
      ipAddress: '192.168.1.5',
      userAgent: 'VitestAgent',
    });

    expect(result).toBeDefined();
    expect(result.userId).toBe(userId);
    expect(result.consentVersion).toBe(CURRENT_CONSENT_VERSION);
    expect(prisma.userConsent.upsert).toHaveBeenCalledWith({
      where: { userId },
      update: expect.objectContaining({
        consentVersion: CURRENT_CONSENT_VERSION,
        ipAddress: '192.168.1.5',
        userAgent: 'VitestAgent',
      }),
      create: expect.objectContaining({
        userId,
        consentVersion: CURRENT_CONSENT_VERSION,
      }),
    });
  });

  it('giveConsent should store ip and user agent for audit trail', async () => {
    const now = new Date();
    vi.mocked(prisma.userConsent.upsert).mockResolvedValueOnce({
      id: 'consent-2',
      userId,
      consentVersion: CURRENT_CONSENT_VERSION,
      consentText: 'This app will create social media posts for you.',
      agreedAt: now,
      ipAddress: '10.0.0.1',
      userAgent: 'Mozilla/5.0 (Vitest)',
      createdAt: now,
      updatedAt: now,
    } as any);

    await consentService.giveConsent(userId, {
      ipAddress: '10.0.0.1',
      userAgent: 'Mozilla/5.0 (Vitest)',
    });

    const call = vi.mocked(prisma.userConsent.upsert).mock.calls[0][0];
    expect(call.update.ipAddress).toBe('10.0.0.1');
    expect(call.update.userAgent).toBe('Mozilla/5.0 (Vitest)');
  });

  it('revokeConsent should delete the consent record and mark all connections DISCONNECTED', async () => {
    const mockExisting = {
      id: 'consent-1',
      userId,
      consentVersion: CURRENT_CONSENT_VERSION,
      consentText: 'text',
      agreedAt: new Date(),
      ipAddress: null,
      userAgent: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(prisma.userConsent.findUnique).mockResolvedValueOnce(mockExisting as any);
    vi.mocked(prisma.userConsent.deleteMany).mockResolvedValueOnce({ count: 1 });
    vi.mocked(prisma.socialConnection.updateMany).mockResolvedValueOnce({ count: 2 });

    const result = await consentService.revokeConsent(userId);

    expect(result).toEqual({ revoked: true });
    expect(prisma.userConsent.deleteMany).toHaveBeenCalledWith({ where: { userId } });
    expect(prisma.socialConnection.updateMany).toHaveBeenCalledWith({
      where: { userId },
      data: expect.objectContaining({
        status: 'DISCONNECTED',
        encryptedAccessToken: null,
        encryptedRefreshToken: null,
      }),
    });
  });

  it('revokeConsent should throw NotFoundError if no consent record exists', async () => {
    vi.mocked(prisma.userConsent.findUnique).mockResolvedValueOnce(null);
    await expect(consentService.revokeConsent(userId)).rejects.toThrow('No consent record found');
  });
});
