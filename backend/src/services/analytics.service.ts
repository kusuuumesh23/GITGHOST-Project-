import { prisma } from '../db/prisma.js';
import { NotFoundError } from '../utils/errors.js';

export interface AnalyticsSummary {
  businessId: string;
  integrationStatus: {
    instagramConnected: boolean;
    facebookConnected: boolean;
    linkedInConnected: boolean;
    xConnected: boolean;
    syncAvailable: boolean;
  };
  dataAvailability: {
    totalPostsCount: number;
    postsWithRecordedMetricsCount: number;
    hasRecordedData: boolean;
    notice: string;
  };
  totals: {
    likes: number | null;
    shares: number | null;
    comments: number | null;
    reach: number | null;
    clicks: number | null;
    contributingPostCount: number;
  };
  metricsByPlatform: Record<
    string,
    {
      postCount: number;
      likes: number | null;
      shares: number | null;
      comments: number | null;
    }
  >;
  topPerformingPosts: Array<{
    id: string;
    title: string;
    platform: string;
    publishedAt: Date | null;
    recordedEngagement: number;
  }>;
}

export class AnalyticsService {
  async getSummary(businessId: string, range?: { dateFrom?: string; dateTo?: string }): Promise<AnalyticsSummary> {
    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business) {
      throw new NotFoundError('Business not found');
    }

    const postWhere: any = { businessId };
    if (range?.dateFrom || range?.dateTo) {
      postWhere.createdAt = {
        ...(range.dateFrom ? { gte: new Date(range.dateFrom) } : {}),
        ...(range.dateTo ? { lte: new Date(range.dateTo) } : {}),
      };
    }

    // Retrieve all posts in the range with their performance snapshots
    const posts = await prisma.post.findMany({
      where: postWhere,
      include: {
        snapshots: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalPostsCount = posts.length;
    let postsWithRecordedMetricsCount = 0;

    let totalLikes: number | null = null;
    let totalShares: number | null = null;
    let totalComments: number | null = null;
    let totalReach: number | null = null;
    let totalClicks: number | null = null;

    const platformMap: Record<
      string,
      { postCount: number; likes: number | null; shares: number | null; comments: number | null }
    > = {};

    const postsWithEngagement: Array<{
      id: string;
      title: string;
      platform: string;
      publishedAt: Date | null;
      recordedEngagement: number;
    }> = [];

    for (const post of posts) {
      const platform = post.platform || 'INSTAGRAM';
      if (!platformMap[platform]) {
        platformMap[platform] = { postCount: 0, likes: null, shares: null, comments: null };
      }
      platformMap[platform].postCount += 1;

      if (!post.snapshots || post.snapshots.length === 0) {
        continue;
      }

      let postHasAnyRecord = false;
      let postEngagement = 0;

      for (const snap of post.snapshots) {
        if (snap.metricValue !== null && snap.metricValue !== undefined) {
          postHasAnyRecord = true;
          const val = snap.metricValue;

          if (snap.metricName === 'likes') {
            totalLikes = (totalLikes ?? 0) + val;
            platformMap[platform].likes = (platformMap[platform].likes ?? 0) + val;
            postEngagement += val;
          } else if (snap.metricName === 'shares') {
            totalShares = (totalShares ?? 0) + val;
            platformMap[platform].shares = (platformMap[platform].shares ?? 0) + val;
            postEngagement += val;
          } else if (snap.metricName === 'comments') {
            totalComments = (totalComments ?? 0) + val;
            platformMap[platform].comments = (platformMap[platform].comments ?? 0) + val;
            postEngagement += val;
          } else if (snap.metricName === 'reach') {
            totalReach = (totalReach ?? 0) + val;
          } else if (snap.metricName === 'clicks') {
            totalClicks = (totalClicks ?? 0) + val;
          }
        }
      }

      if (postHasAnyRecord) {
        postsWithRecordedMetricsCount += 1;
        postsWithEngagement.push({
          id: post.id,
          title: post.title,
          platform: post.platform,
          publishedAt: post.publishedAt,
          recordedEngagement: postEngagement,
        });
      }
    }

    postsWithEngagement.sort((a, b) => b.recordedEngagement - a.recordedEngagement);

    const hasRecordedData = postsWithRecordedMetricsCount > 0;
    const notice = hasRecordedData
      ? `Metrics calculated from ${postsWithRecordedMetricsCount} post(s) with recorded observations.`
      : 'No real platform integrations are connected yet. Metrics are marked as unrecorded according to our Data Honesty policy.';

    return {
      businessId,
      integrationStatus: {
        instagramConnected: false,
        facebookConnected: false,
        linkedInConnected: false,
        xConnected: false,
        syncAvailable: false,
      },
      dataAvailability: {
        totalPostsCount,
        postsWithRecordedMetricsCount,
        hasRecordedData,
        notice,
      },
      totals: {
        likes: totalLikes,
        shares: totalShares,
        comments: totalComments,
        reach: totalReach,
        clicks: totalClicks,
        contributingPostCount: postsWithRecordedMetricsCount,
      },
      metricsByPlatform: platformMap,
      topPerformingPosts: postsWithEngagement.slice(0, 5),
    };
  }

  async getPostAnalytics(postId: string) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { snapshots: { orderBy: { recordedAt: 'desc' } } },
    });

    if (!post) {
      throw new NotFoundError('Post not found');
    }

    const recordedMetrics: Record<string, { value: number | null; source: string; recordedAt: Date }> = {};
    for (const snap of post.snapshots) {
      recordedMetrics[snap.metricName] = {
        value: snap.metricValue,
        source: snap.source,
        recordedAt: snap.recordedAt,
      };
    }

    return {
      postId: post.id,
      title: post.title,
      platform: post.platform,
      status: post.status,
      hasRecordedMetrics: post.snapshots.length > 0,
      metrics: {
        likes: recordedMetrics.likes?.value ?? null,
        shares: recordedMetrics.shares?.value ?? null,
        comments: recordedMetrics.comments?.value ?? null,
        reach: recordedMetrics.reach?.value ?? null,
        clicks: recordedMetrics.clicks?.value ?? null,
      },
      recordedSnapshots: post.snapshots,
    };
  }
}

export const analyticsService = new AnalyticsService();
