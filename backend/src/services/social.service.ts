import { prisma } from '../db/prisma.js';
import { ConflictError, NotFoundError, ForbiddenError } from '../utils/errors.js';
import { SocialPlatform, ConnectionStatus } from '@prisma/client';
import { consentService } from './consent.service.js';

// OAuth config would normally come from env. These are placeholder URLs.
const OAUTH_CONFIG: Record<SocialPlatform, { authUrl: string; scopes: string[] }> = {
  LINKEDIN: {
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    scopes: ['openid', 'profile', 'email', 'w_member_social'],
  },
  X: {
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    scopes: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
  },
  INSTAGRAM: {
    authUrl: 'https://api.instagram.com/oauth/authorize',
    scopes: ['user_profile', 'user_media'],
  },
  FACEBOOK: {
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    scopes: ['pages_manage_posts', 'pages_read_engagement'],
  },
};

export class SocialConnectionService {
  /** Return all social connections for the user */
  async listConnections(userId: string) {
    const connections = await prisma.socialConnection.findMany({
      where: { userId },
      orderBy: { connectedAt: 'desc' },
    });
    return connections.map(c => this.format(c));
  }

  /**
   * Generate the OAuth authorization URL for the platform.
   * Requires user to have given consent first.
   */
  async getAuthUrl(
    userId: string,
    platform: SocialPlatform,
    callbackUrl: string,
  ): Promise<{ authUrl: string }> {
    const hasConsent = await consentService.hasConsent(userId);
    if (!hasConsent) {
      throw new ForbiddenError('User must give consent before connecting accounts');
    }

    const cfg = OAUTH_CONFIG[platform];
    const state = Buffer.from(JSON.stringify({ userId, platform })).toString('base64url');

    const url = new URL(cfg.authUrl);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', process.env[`${platform}_CLIENT_ID`] ?? 'NOT_CONFIGURED');
    url.searchParams.set('redirect_uri', callbackUrl);
    url.searchParams.set('scope', cfg.scopes.join(' '));
    url.searchParams.set('state', state);

    return { authUrl: url.toString() };
  }

  /**
   * Handle OAuth callback – exchange code for tokens and save the connection.
   * In a real implementation this would call the platform token endpoint.
   * Here we save a stub connection so the UI can reflect "connected" status.
   */
  async handleCallback(
    userId: string,
    platform: SocialPlatform,
    code: string,
    displayName?: string,
  ) {
    const hasConsent = await consentService.hasConsent(userId);
    if (!hasConsent) {
      throw new ForbiddenError('User must give consent before connecting accounts');
    }

    // In production: exchange `code` for tokens via platform API
    const connection = await prisma.socialConnection.upsert({
      where: { userId_platform: { userId, platform } },
      update: {
        status: ConnectionStatus.CONNECTED,
        accessToken: `stub_${code}`, // encrypted in production
        displayName: displayName ?? null,
        connectedAt: new Date(),
        disconnectedAt: null,
      },
      create: {
        userId,
        platform,
        accessToken: `stub_${code}`,
        displayName: displayName ?? null,
        scopes: OAUTH_CONFIG[platform].scopes,
        status: ConnectionStatus.CONNECTED,
      },
    });

    return this.format(connection);
  }

  /** Simulate connecting for demo/mock mode (no real OAuth round-trip) */
  async mockConnect(userId: string, platform: SocialPlatform, displayName?: string) {
    const hasConsent = await consentService.hasConsent(userId);
    if (!hasConsent) {
      throw new ForbiddenError('User must give consent before connecting accounts');
    }

    const connection = await prisma.socialConnection.upsert({
      where: { userId_platform: { userId, platform } },
      update: {
        status: ConnectionStatus.CONNECTED,
        displayName: displayName ?? `demo_${platform.toLowerCase()}_user`,
        connectedAt: new Date(),
        disconnectedAt: null,
      },
      create: {
        userId,
        platform,
        displayName: displayName ?? `demo_${platform.toLowerCase()}_user`,
        scopes: OAUTH_CONFIG[platform].scopes,
        status: ConnectionStatus.CONNECTED,
      },
    });

    return this.format(connection);
  }

  /** Disconnect / revoke a social connection */
  async disconnect(userId: string, platform: SocialPlatform) {
    const connection = await prisma.socialConnection.findUnique({
      where: { userId_platform: { userId, platform } },
    });

    if (!connection) {
      throw new NotFoundError(`No ${platform} connection found`);
    }

    const updated = await prisma.socialConnection.update({
      where: { userId_platform: { userId, platform } },
      data: {
        status: ConnectionStatus.DISCONNECTED,
        accessToken: null,
        refreshToken: null,
        disconnectedAt: new Date(),
      },
    });

    return this.format(updated);
  }

  private format(c: {
    id: string;
    userId: string;
    platform: SocialPlatform;
    platformUserId: string | null;
    displayName: string | null;
    scopes: string[];
    status: ConnectionStatus;
    connectedAt: Date;
    disconnectedAt: Date | null;
    createdAt: Date;
  }) {
    return {
      id: c.id,
      userId: c.userId,
      platform: c.platform,
      platformUserId: c.platformUserId,
      displayName: c.displayName,
      scopes: c.scopes,
      status: c.status,
      connectedAt: c.connectedAt.toISOString(),
      disconnectedAt: c.disconnectedAt?.toISOString() ?? null,
      createdAt: c.createdAt.toISOString(),
    };
  }
}

export const socialConnectionService = new SocialConnectionService();
