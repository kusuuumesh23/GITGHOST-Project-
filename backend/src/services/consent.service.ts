import { prisma } from '../db/prisma.js';
import { NotFoundError } from '../utils/errors.js';
import { ConnectionStatus } from '@prisma/client';

export const CURRENT_CONSENT_VERSION = '1.0';

const CONSENT_TEXT =
  'This app will create social media posts for you. Nothing is posted without your approval. ' +
  'By accepting, you allow us to connect your LinkedIn and X (Twitter) accounts and publish ' +
  'ONLY the posts you approve. You can disconnect anytime.';

export class ConsentService {
  /** Persist or update the user's consent record (full audit trail) */
  async giveConsent(userId: string, meta?: { ipAddress?: string; userAgent?: string }) {
    const consent = await prisma.userConsent.upsert({
      where: { userId },
      update: {
        consentVersion: CURRENT_CONSENT_VERSION,
        consentText: CONSENT_TEXT,
        agreedAt: new Date(),
        ipAddress: meta?.ipAddress ?? null,
        userAgent: meta?.userAgent ?? null,
      },
      create: {
        userId,
        consentVersion: CURRENT_CONSENT_VERSION,
        consentText: CONSENT_TEXT,
        ipAddress: meta?.ipAddress ?? null,
        userAgent: meta?.userAgent ?? null,
      },
    });
    return this.format(consent);
  }

  /**
   * Alias for giveConsent — used by tests and external callers for clarity.
   * Records the consent with ip/agent audit metadata.
   */
  async recordConsent(userId: string, meta?: { ipAddress?: string; userAgent?: string }) {
    return this.giveConsent(userId, meta);
  }

  /** Get the current user's consent record (null if never given) */
  async getConsent(userId: string) {
    const consent = await prisma.userConsent.findUnique({ where: { userId } });
    return consent ? this.format(consent) : null;
  }

  /** Check if consent is on record */
  async hasConsent(userId: string): Promise<boolean> {
    const count = await prisma.userConsent.count({ where: { userId } });
    return count > 0;
  }

  /**
   * Revoke consent — deletes the record AND marks all social connections as
   * DISCONNECTED and clears their tokens so the user must reconnect when
   * they give consent again.
   */
  async revokeConsent(userId: string) {
    const existing = await prisma.userConsent.findUnique({ where: { userId } });
    if (!existing) throw new NotFoundError('No consent record found');

    // Delete the consent record
    await prisma.userConsent.deleteMany({ where: { userId } });

    // Also invalidate all social connections — clear tokens, mark DISCONNECTED
    await prisma.socialConnection.updateMany({
      where: { userId },
      data: {
        status: ConnectionStatus.DISCONNECTED,
        encryptedAccessToken: null,
        encryptedRefreshToken: null,
        pkceVerifier: null,
        oauthState: null,
        disconnectedAt: new Date(),
      },
    });

    return { revoked: true };
  }

  private format(c: {
    id: string;
    userId: string;
    consentVersion: string;
    consentText: string;
    agreedAt: Date;
    createdAt: Date;
  }) {
    return {
      id: c.id,
      userId: c.userId,
      consentVersion: c.consentVersion,
      consentText: c.consentText,
      agreedAt: c.agreedAt.toISOString(),
      createdAt: c.createdAt.toISOString(),
    };
  }
}

export const consentService = new ConsentService();

