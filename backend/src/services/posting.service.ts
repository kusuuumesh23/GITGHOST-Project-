/**
 * Posting service — publishes approved posts via LinkedIn and X official APIs.
 *
 * Guarantees:
 * - Only posts with status APPROVED and a connected, consented account are posted.
 * - Exponential backoff on 429 / 5xx responses (max 3 retries).
 * - Marks status = PUBLISHED (with platformPostId/URL) on success.
 * - Marks status = FAILED (with failureReason) on permanent failure.
 * - Never logs raw tokens.
 */
import fs from 'node:fs';
import { prisma } from '../db/prisma.js';
import { getFreshAccessToken } from './oauth.service.js';
import { consentService } from './consent.service.js';
import { SocialPlatform, PostStatus } from '@prisma/client';
import { ForbiddenError, NotFoundError } from '../utils/errors.js';

const MAX_RETRIES = 3;

/* ── Exponential-backoff fetch ── */

async function fetchWithBackoff(
  url: string,
  options: RequestInit,
  attempt = 1,
): Promise<Response> {
  const res = await fetch(url, options);

  if ((res.status === 429 || res.status >= 500) && attempt < MAX_RETRIES) {
    const retryAfter = parseInt(res.headers.get('retry-after') ?? '0', 10);
    const delay = retryAfter > 0 ? retryAfter * 1000 : Math.pow(2, attempt) * 1000;
    await new Promise(r => setTimeout(r, delay));
    return fetchWithBackoff(url, options, attempt + 1);
  }

  return res;
}

/* ── LinkedIn posting ── */

async function uploadLinkedInImage(
  accessToken: string,
  authorUrn: string,
  filePath: string,
): Promise<string | null> {
  try {
    if (!fs.existsSync(filePath)) return null;
    const fileData = await fs.promises.readFile(filePath);

    const regRes = await fetchWithBackoff(
      'https://api.linkedin.com/v2/assets?action=registerUpload',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registerUploadRequest: {
            recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
            owner: authorUrn,
            serviceRelationships: [
              {
                relationshipType: 'OWNER',
                identifier: 'urn:li:userGeneratedContent',
              },
            ],
          },
        }),
      },
    );

    if (!regRes.ok) return null;
    const regData = (await regRes.json()) as any;
    const uploadUrl =
      regData.value?.uploadMechanism?.[
        'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'
      ]?.uploadUrl;
    const assetUrn = regData.value?.asset;

    if (!uploadUrl || !assetUrn) return null;

    const putRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/octet-stream',
      },
      body: fileData,
    });

    return putRes.ok ? assetUrn : null;
  } catch (err) {
    console.warn('LinkedIn image upload skipped due to error:', err);
    return null;
  }
}

async function postToLinkedIn(
  userId: string,
  post: { caption: string; hashtags: string[]; callToAction: string; assets?: Array<{ storagePath: string }> },
): Promise<{ postId: string; postUrl: string }> {
  const accessToken = await getFreshAccessToken(userId, SocialPlatform.LINKEDIN);

  // Get LinkedIn urn (person URN needed for author field)
  const meRes = await fetch('https://api.linkedin.com/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!meRes.ok) throw new Error('Failed to fetch LinkedIn user info');
  const me = (await meRes.json()) as { sub: string };
  const authorUrn = `urn:li:person:${me.sub}`;

  const text = [
    post.caption,
    post.callToAction,
    post.hashtags.map(h => `#${h}`).join(' '),
  ]
    .filter(Boolean)
    .join('\n\n');

  // Try image upload if asset is available
  let assetUrn: string | null = null;
  if (post.assets && post.assets.length > 0 && post.assets[0].storagePath) {
    assetUrn = await uploadLinkedInImage(accessToken, authorUrn, post.assets[0].storagePath);
  }

  const shareContent: Record<string, unknown> = {
    shareCommentary: { text },
    shareMediaCategory: assetUrn ? 'IMAGE' : 'NONE',
  };

  if (assetUrn) {
    shareContent.media = [
      {
        status: 'READY',
        description: { text: post.caption },
        media: assetUrn,
        title: { text: post.caption.slice(0, 30) },
      },
    ];
  }

  const body = {
    author: authorUrn,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': shareContent,
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
    },
  };

  const res = await fetchWithBackoff('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`LinkedIn post failed (${res.status}): ${errBody}`);
  }

  const data = (await res.json()) as { id: string };
  const postId = data.id;
  const postUrl = `https://www.linkedin.com/feed/update/${postId}/`;

  return { postId, postUrl };
}

/* ── X (Twitter) posting ── */

async function uploadXMedia(
  accessToken: string,
  filePath: string,
): Promise<string | null> {
  try {
    if (!fs.existsSync(filePath)) return null;
    const fileData = await fs.promises.readFile(filePath);
    const base64Data = fileData.toString('base64');

    const form = new URLSearchParams();
    form.append('media_data', base64Data);

    const res = await fetchWithBackoff('https://upload.twitter.com/1.1/media/upload.json', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
    });

    if (!res.ok) return null;
    const data = (await res.json()) as { media_id_string?: string };
    return data.media_id_string ?? null;
  } catch (err) {
    console.warn('X media upload skipped due to error:', err);
    return null;
  }
}

async function postToX(
  userId: string,
  post: { caption: string; hashtags: string[]; callToAction: string; assets?: Array<{ storagePath: string }> },
): Promise<{ postId: string; postUrl: string }> {
  const accessToken = await getFreshAccessToken(userId, SocialPlatform.X);

  // Get X user info for URL
  const meRes = await fetch('https://api.twitter.com/2/users/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const me = meRes.ok
    ? ((await meRes.json()) as { data?: { username?: string } })
    : null;
  const username = me?.data?.username ?? 'user';

  const tweetText = [
    post.caption,
    post.callToAction,
    post.hashtags.map(h => `#${h}`).join(' '),
  ]
    .filter(Boolean)
    .join('\n\n')
    .slice(0, 280);

  let mediaId: string | null = null;
  if (post.assets && post.assets.length > 0 && post.assets[0].storagePath) {
    mediaId = await uploadXMedia(accessToken, post.assets[0].storagePath);
  }

  const payload: Record<string, unknown> = { text: tweetText };
  if (mediaId) {
    payload.media = { media_ids: [mediaId] };
  }

  const res = await fetchWithBackoff('https://api.twitter.com/2/tweets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`X post failed (${res.status}): ${errBody}`);
  }

  const data = (await res.json()) as { data: { id: string } };
  const postId = data.data.id;
  const postUrl = `https://twitter.com/${username}/status/${postId}`;

  return { postId, postUrl };
}

/* ── Public: publish a single approved post ── */

/**
 * Publish an approved post for a given user + platform.
 * Requires: consent on file, connected platform, post in APPROVED status.
 */
export async function publishPost(
  postId: string,
  userId: string,
): Promise<{ platformPostId: string; platformPostUrl: string }> {
  // 1. Consent gate
  const hasConsent = await consentService.hasConsent(userId);
  if (!hasConsent) {
    throw new ForbiddenError('Cannot publish: user has not given consent');
  }

  // 2. Load post with assets
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: { assets: true },
  });
  if (!post) throw new NotFoundError('Post not found');

  if (post.status !== PostStatus.APPROVED && post.status !== PostStatus.SCHEDULED) {
    throw new ForbiddenError(`Post must be APPROVED or SCHEDULED to publish (current: ${post.status})`);
  }

  const platform = post.platform as 'LINKEDIN' | 'X' | 'INSTAGRAM' | 'FACEBOOK';
  let result: { postId: string; postUrl: string };

  try {
    if (platform === 'LINKEDIN') {
      result = await postToLinkedIn(userId, post);
    } else if (platform === 'X') {
      result = await postToX(userId, post);
    } else {
      throw new Error(`Publishing to ${platform} is not yet supported`);
    }
  } catch (err: unknown) {
    // Mark as failed
    await prisma.post.update({
      where: { id: postId },
      data: {
        status: PostStatus.FAILED,
        failureReason: (err as Error).message,
      },
    });
    throw err;
  }

  // 3. Mark published
  await prisma.post.update({
    where: { id: postId },
    data: {
      status: PostStatus.PUBLISHED,
      publishedAt: new Date(),
      platformPostId: result.postId,
      platformPostUrl: result.postUrl,
      failureReason: null,
    },
  });

  return { platformPostId: result.postId, platformPostUrl: result.postUrl };
}

/* ── Scheduler: publish all due scheduled posts ── */

/**
 * Called by a cron job every minute.
 * Finds SCHEDULED posts whose scheduledAt is in the past, publishes them.
 */
export async function publishDueScheduledPosts(): Promise<void> {
  const duePosts = await prisma.post.findMany({
    where: {
      status: PostStatus.SCHEDULED,
      scheduledAt: { lte: new Date() },
    },
    include: {
      business: {
        include: {
          owner: {
            include: { consent: true },
          },
        },
      },
    },
  });

  for (const post of duePosts) {
    const ownerId = post.business.ownerId;
    try {
      await publishPost(post.id, ownerId);
    } catch (err) {
      // Error already saved to post; continue with others
      console.error(`[scheduler] Failed to publish post ${post.id}:`, (err as Error).message);
    }
  }
}
