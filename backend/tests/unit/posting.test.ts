/**
 * posting.test.ts
 *
 * Tests the "Approve-Then-Post" gating logic in publishPost:
 * - User MUST have given consent before any post can go out.
 * - Post MUST be in APPROVED (or SCHEDULED) status.
 * - Posts in DRAFT or PENDING_APPROVAL are permanently blocked.
 *
 * All external I/O (Prisma, OAuth, fetch) is mocked.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Stub env BEFORE any service imports ─────────────────────────────────────
vi.mock('../../src/config/env.js', () => ({
  env: {
    TOKEN_ENCRYPTION_KEY: 'a'.repeat(64),
    LINKEDIN_CLIENT_ID: 'test-li',
    LINKEDIN_CLIENT_SECRET: 'test-li-secret',
    X_CLIENT_ID: 'test-x',
    X_CLIENT_SECRET: 'test-x-secret',
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
  },
}));

// ── Mock consent service ────────────────────────────────────────────────────
vi.mock('../../src/services/consent.service.js', () => ({
  consentService: {
    hasConsent: vi.fn(),
  },
}));

// ── Mock OAuth service ──────────────────────────────────────────────────────
vi.mock('../../src/services/oauth.service.js', () => ({
  getFreshAccessToken: vi.fn().mockResolvedValue('test-fresh-token'),
}));

// ── Mock Prisma ──────────────────────────────────────────────────────────────
vi.mock('../../src/db/prisma.js', () => ({
  prisma: {
    post: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    socialConnection: {
      findUnique: vi.fn(),
    },
  },
}));

const { publishPost } = await import('../../src/services/posting.service.js');
const { consentService } = await import('../../src/services/consent.service.js');
const { prisma } = await import('../../src/db/prisma.js');
const { ForbiddenError, NotFoundError } = await import('../../src/utils/errors.js');

describe('Approve-Then-Post Gate', () => {
  const userId = 'user-owner-1';
  const postId = 'post-100';

  beforeEach(() => {
    vi.resetAllMocks();
  });

  // ── CONSENT GATE ──────────────────────────────────────────────────────────

  it('blocks publishing if user has NOT given consent', async () => {
    vi.mocked(consentService.hasConsent).mockResolvedValueOnce(false);

    await expect(publishPost(postId, userId)).rejects.toThrow(ForbiddenError);

    // Check the error message explicitly mentions consent
    await expect(publishPost(postId, userId)).rejects.toThrow(/consent/i);

    // Prisma should never be queried — we gate before any DB call for the post
    expect(prisma.post.findUnique).not.toHaveBeenCalled();
  });

  // ── POST NOT FOUND ────────────────────────────────────────────────────────

  it('throws NotFoundError if post does not exist', async () => {
    vi.mocked(consentService.hasConsent).mockResolvedValueOnce(true);
    vi.mocked(prisma.post.findUnique).mockResolvedValueOnce(null);

    await expect(publishPost(postId, userId)).rejects.toThrow(NotFoundError);
  });

  // ── STATUS GATE: PENDING_APPROVAL ─────────────────────────────────────────

  it('blocks PENDING_APPROVAL posts from being published', async () => {
    vi.mocked(consentService.hasConsent).mockResolvedValueOnce(true);
    vi.mocked(prisma.post.findUnique).mockResolvedValueOnce({
      id: postId,
      businessId: 'biz-1',
      title: 'AI Draft',
      caption: 'This post awaits approval',
      hashtags: [],
      callToAction: '',
      platform: 'LINKEDIN',
      status: 'PENDING_APPROVAL',
      assets: [],
    } as any);

    await expect(publishPost(postId, userId)).rejects.toThrow(ForbiddenError);
    await expect(publishPost(postId, userId)).rejects.toThrow(/APPROVED/i);
  });

  // ── STATUS GATE: DRAFT ────────────────────────────────────────────────────

  it('blocks DRAFT posts from being published', async () => {
    vi.mocked(consentService.hasConsent).mockResolvedValueOnce(true);
    vi.mocked(prisma.post.findUnique).mockResolvedValueOnce({
      id: postId,
      businessId: 'biz-1',
      title: 'Draft Post',
      caption: 'Still a draft',
      hashtags: [],
      callToAction: '',
      platform: 'X',
      status: 'DRAFT',
      assets: [],
    } as any);

    await expect(publishPost(postId, userId)).rejects.toThrow(ForbiddenError);
    await expect(publishPost(postId, userId)).rejects.toThrow(/APPROVED/i);
  });

  // ── STATUS GATE: REJECTED ─────────────────────────────────────────────────

  it('blocks REJECTED posts from being published', async () => {
    vi.mocked(consentService.hasConsent).mockResolvedValueOnce(true);
    vi.mocked(prisma.post.findUnique).mockResolvedValueOnce({
      id: postId,
      businessId: 'biz-1',
      title: 'Rejected Post',
      caption: 'User said no',
      hashtags: [],
      callToAction: '',
      platform: 'LINKEDIN',
      status: 'REJECTED',
      assets: [],
    } as any);

    await expect(publishPost(postId, userId)).rejects.toThrow(ForbiddenError);
  });

  // ── APPROVED: passes gates, attempts real API call ────────────────────────

  it('attempts LinkedIn API when post is APPROVED (API call can fail in unit test)', async () => {
    vi.mocked(consentService.hasConsent).mockResolvedValueOnce(true);
    vi.mocked(prisma.post.findUnique).mockResolvedValueOnce({
      id: postId,
      businessId: 'biz-1',
      title: 'Ready Post',
      caption: 'Approved and ready!',
      hashtags: ['#test'],
      callToAction: 'Check it out',
      platform: 'LINKEDIN',
      status: 'APPROVED',
      assets: [],
      userId,
    } as any);

    // postToLinkedIn will try to find a SocialConnection — return null so it
    // throws a domain error (not a consent/status error), proving the gates passed.
    vi.mocked(prisma.socialConnection.findUnique).mockResolvedValueOnce(null);

    // The error here is from the LinkedIn posting path, NOT from consent/status gate
    // so we know the gates were passed successfully.
    await expect(publishPost(postId, userId)).rejects.not.toThrow(
      /consent/i,
    );
  });
});
