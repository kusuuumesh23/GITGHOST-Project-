/**
 * LinkedIn OAuth 2.0 Authorization Code flow
 * X (Twitter) OAuth 2.0 with PKCE
 *
 * Tokens are stored AES-256-GCM encrypted. Never returned to the frontend.
 * State param is validated on callback to prevent CSRF.
 */
import { randomBytes, createHash } from 'node:crypto';
import { prisma } from '../db/prisma.js';
import { env } from '../config/env.js';
import { encryptTokenSafe, decryptTokenSafe } from '../utils/crypto.js';
import { ForbiddenError, NotFoundError, BadRequestError } from '../utils/errors.js';
import { SocialPlatform, ConnectionStatus } from '@prisma/client';
import { consentService } from './consent.service.js';

/* ──────────────── helpers ──────────────── */

function generateState(userId: string, platform: string): string {
  const raw = `${userId}:${platform}:${Date.now()}:${randomBytes(16).toString('hex')}`;
  return Buffer.from(raw).toString('base64url');
}

function generatePKCEVerifier(): string {
  return randomBytes(32).toString('base64url');
}

function generatePKCEChallenge(verifier: string): string {
  return createHash('sha256').update(verifier).digest('base64url');
}

/* ──────────────── LinkedIn ──────────────── */

const LINKEDIN_SCOPES = ['openid', 'profile', 'email', 'w_member_social'];

export async function linkedInStartOAuth(userId: string): Promise<{ authUrl: string }> {
  if (!(await consentService.hasConsent(userId))) {
    throw new ForbiddenError('Consent required before connecting accounts');
  }

  const state = generateState(userId, 'LINKEDIN');
  const redirectUri = `${env.REDIRECT_BASE_URL}/api/v1/auth/linkedin/callback`;

  // Persist state for CSRF validation
  await prisma.socialConnection.upsert({
    where: { userId_platform: { userId, platform: SocialPlatform.LINKEDIN } },
    update: { oauthState: state, status: ConnectionStatus.DISCONNECTED },
    create: {
      userId,
      platform: SocialPlatform.LINKEDIN,
      oauthState: state,
      scopes: LINKEDIN_SCOPES,
      status: ConnectionStatus.DISCONNECTED,
    },
  });

  const url = new URL('https://www.linkedin.com/oauth/v2/authorization');
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', env.LINKEDIN_CLIENT_ID!);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('scope', LINKEDIN_SCOPES.join(' '));
  url.searchParams.set('state', state);

  return { authUrl: url.toString() };
}

export async function linkedInCallback(code: string, state: string): Promise<{ userId: string }> {
  // Find the connection by oauthState (CSRF check)
  const conn = await prisma.socialConnection.findFirst({
    where: { oauthState: state, platform: SocialPlatform.LINKEDIN },
  });

  if (!conn) throw new BadRequestError('Invalid or expired OAuth state');

  const redirectUri = `${env.REDIRECT_BASE_URL}/api/v1/auth/linkedin/callback`;

  // Exchange code for tokens
  const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: env.LINKEDIN_CLIENT_ID!,
      client_secret: env.LINKEDIN_CLIENT_SECRET!,
    }),
  });

  if (!tokenRes.ok) {
    const body = await tokenRes.text();
    throw new BadRequestError(`LinkedIn token exchange failed: ${body}`);
  }

  const tokens = (await tokenRes.json()) as {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
    refresh_token_expires_in?: number;
  };

  // Fetch LinkedIn profile (userinfo via OpenID Connect)
  const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const profile = profileRes.ok
    ? ((await profileRes.json()) as { sub?: string; name?: string })
    : null;

  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

  await prisma.socialConnection.update({
    where: { id: conn.id },
    data: {
      platformUserId: profile?.sub ?? null,
      displayName: profile?.name ?? null,
      encryptedAccessToken: encryptTokenSafe(tokens.access_token),
      encryptedRefreshToken: encryptTokenSafe(tokens.refresh_token ?? null),
      tokenExpiresAt: expiresAt,
      scopes: LINKEDIN_SCOPES,
      oauthState: null,        // clear CSRF state
      pkceVerifier: null,
      status: ConnectionStatus.CONNECTED,
      connectedAt: new Date(),
      disconnectedAt: null,
    },
  });

  return { userId: conn.userId };
}

/* ──────────────── X (Twitter) ──────────────── */

const X_SCOPES = ['tweet.read', 'tweet.write', 'users.read', 'offline.access'];

export async function xStartOAuth(userId: string): Promise<{ authUrl: string }> {
  if (!(await consentService.hasConsent(userId))) {
    throw new ForbiddenError('Consent required before connecting accounts');
  }

  const state = generateState(userId, 'X');
  const verifier = generatePKCEVerifier();
  const challenge = generatePKCEChallenge(verifier);
  const redirectUri = `${env.REDIRECT_BASE_URL}/api/v1/auth/x/callback`;

  await prisma.socialConnection.upsert({
    where: { userId_platform: { userId, platform: SocialPlatform.X } },
    update: { oauthState: state, pkceVerifier: verifier, status: ConnectionStatus.DISCONNECTED },
    create: {
      userId,
      platform: SocialPlatform.X,
      oauthState: state,
      pkceVerifier: verifier,
      scopes: X_SCOPES,
      status: ConnectionStatus.DISCONNECTED,
    },
  });

  const url = new URL('https://twitter.com/i/oauth2/authorize');
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', env.X_CLIENT_ID!);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('scope', X_SCOPES.join(' '));
  url.searchParams.set('state', state);
  url.searchParams.set('code_challenge', challenge);
  url.searchParams.set('code_challenge_method', 'S256');

  return { authUrl: url.toString() };
}

export async function xCallback(code: string, state: string): Promise<{ userId: string }> {
  const conn = await prisma.socialConnection.findFirst({
    where: { oauthState: state, platform: SocialPlatform.X },
  });

  if (!conn || !conn.pkceVerifier) throw new BadRequestError('Invalid or expired OAuth state');

  const redirectUri = `${env.REDIRECT_BASE_URL}/api/v1/auth/x/callback`;

  const tokenRes = await fetch('https://api.twitter.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${env.X_CLIENT_ID}:${env.X_CLIENT_SECRET}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      code_verifier: conn.pkceVerifier,
    }),
  });

  if (!tokenRes.ok) {
    const body = await tokenRes.text();
    throw new BadRequestError(`X token exchange failed: ${body}`);
  }

  const tokens = (await tokenRes.json()) as {
    access_token: string;
    expires_in?: number;
    refresh_token?: string;
    scope: string;
  };

  // Fetch X user info
  const meRes = await fetch('https://api.twitter.com/2/users/me', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const me = meRes.ok
    ? ((await meRes.json()) as { data?: { id?: string; username?: string } })
    : null;

  const expiresAt = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000)
    : null;

  await prisma.socialConnection.update({
    where: { id: conn.id },
    data: {
      platformUserId: me?.data?.id ?? null,
      displayName: me?.data?.username ?? null,
      encryptedAccessToken: encryptTokenSafe(tokens.access_token),
      encryptedRefreshToken: encryptTokenSafe(tokens.refresh_token ?? null),
      tokenExpiresAt: expiresAt,
      scopes: tokens.scope.split(' '),
      oauthState: null,
      pkceVerifier: null,
      status: ConnectionStatus.CONNECTED,
      connectedAt: new Date(),
      disconnectedAt: null,
    },
  });

  return { userId: conn.userId };
}

/* ──────────────── Token refresh ──────────────── */

/** Returns a fresh decrypted access token, refreshing if expired. */
export async function getFreshAccessToken(
  userId: string,
  platform: SocialPlatform,
): Promise<string> {
  const conn = await prisma.socialConnection.findUnique({
    where: { userId_platform: { userId, platform } },
  });

  if (!conn || conn.status !== ConnectionStatus.CONNECTED) {
    throw new NotFoundError(`No active ${platform} connection found`);
  }

  const accessToken = decryptTokenSafe(conn.encryptedAccessToken);
  if (!accessToken) throw new ForbiddenError(`${platform} access token missing`);

  // If not expired (with 5-min buffer), return as-is
  const bufferMs = 5 * 60 * 1000;
  const isExpired = conn.tokenExpiresAt
    ? conn.tokenExpiresAt.getTime() - Date.now() < bufferMs
    : false;

  if (!isExpired) return accessToken;

  const refreshToken = decryptTokenSafe(conn.encryptedRefreshToken);
  if (!refreshToken) throw new ForbiddenError(`${platform} refresh token missing — user must reconnect`);

  return platform === SocialPlatform.LINKEDIN
    ? refreshLinkedInToken(conn.id, refreshToken)
    : refreshXToken(conn.id, refreshToken);
}

async function refreshLinkedInToken(connId: string, refreshToken: string): Promise<string> {
  const res = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: env.LINKEDIN_CLIENT_ID!,
      client_secret: env.LINKEDIN_CLIENT_SECRET!,
    }),
  });

  if (!res.ok) throw new ForbiddenError('LinkedIn token refresh failed — user must reconnect');

  const data = (await res.json()) as { access_token: string; expires_in: number; refresh_token?: string };

  await prisma.socialConnection.update({
    where: { id: connId },
    data: {
      encryptedAccessToken: encryptTokenSafe(data.access_token),
      encryptedRefreshToken: encryptTokenSafe(data.refresh_token ?? refreshToken),
      tokenExpiresAt: new Date(Date.now() + data.expires_in * 1000),
    },
  });

  return data.access_token;
}

async function refreshXToken(connId: string, refreshToken: string): Promise<string> {
  const res = await fetch('https://api.twitter.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${env.X_CLIENT_ID}:${env.X_CLIENT_SECRET}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) throw new ForbiddenError('X token refresh failed — user must reconnect');

  const data = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  };

  await prisma.socialConnection.update({
    where: { id: connId },
    data: {
      encryptedAccessToken: encryptTokenSafe(data.access_token),
      encryptedRefreshToken: encryptTokenSafe(data.refresh_token ?? refreshToken),
      tokenExpiresAt: data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000)
        : null,
    },
  });

  return data.access_token;
}

/* ──────────────── Disconnect ──────────────── */

export async function disconnectPlatform(userId: string, platform: SocialPlatform): Promise<void> {
  const conn = await prisma.socialConnection.findUnique({
    where: { userId_platform: { userId, platform } },
  });
  if (!conn) throw new NotFoundError(`No ${platform} connection found`);

  await prisma.socialConnection.update({
    where: { id: conn.id },
    data: {
      encryptedAccessToken: null,
      encryptedRefreshToken: null,
      tokenExpiresAt: null,
      pkceVerifier: null,
      oauthState: null,
      status: ConnectionStatus.DISCONNECTED,
      disconnectedAt: new Date(),
    },
  });
}
