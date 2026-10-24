export type PostStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'scheduled'
  | 'published'
  | 'failed'
  | 'archived';

export type Platform = 'INSTAGRAM' | 'FACEBOOK' | 'LINKEDIN' | 'X';

export interface PostMetrics {
  likes: number | null;
  shares: number | null;
  comments: number | null;
  reach: number | null;
  clicks: number | null;
  recordedAt: string | null;
}

export interface PostAsset {
  id: string;
  assetType: 'IMAGE' | 'VIDEO';
  storagePath: string;
  mimeType: string;
  metadata?: Record<string, unknown>;
}

export interface Post {
  id: string;
  businessId: string;
  title: string;
  caption: string;
  hashtags: string[];
  callToAction: string;
  imagePrompt?: string;
  imageUrl?: string;
  platform: string;
  language: string;
  contentGoal: string;
  status: PostStatus;
  targetDate?: string;
  isDailyPost?: boolean;
  scheduledAt?: string | null;
  publishedAt?: string | null;
  archivedAt?: string | null;
  platformPostId?: string | null;
  platformPostUrl?: string | null;
  failureReason?: string | null;
  createdAt: string;
  updatedAt: string;
  metrics: PostMetrics;
  assets?: PostAsset[];
  isDemo?: boolean;
}

export interface PostPatch {
  title?: string;
  caption?: string;
  hashtags?: string[];
  callToAction?: string;
  imagePrompt?: string;
  status?: PostStatus;
  scheduledAt?: string | null;
  platform?: string;
}

export interface ListPostsParams {
  businessId?: string;
  page?: number;
  pageSize?: number;
  search?: string;
  status?: PostStatus;
  platform?: string;
  dateFrom?: string;
  dateTo?: string;
  includeArchived?: boolean;
}

export interface ListPostsResult {
  items: Post[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface BusinessProfile {
  id: string;
  name: string;
  websiteUrl?: string | null;
  industry?: string | null;
  description?: string | null;
  location?: string | null;
  brandTone?: string | null;
  targetAudience?: string | null;
  preferredLanguage: string;
  role?: string;
}

export interface GenerationRequest {
  contentGoal: string;
  offerOrPromotion?: string;
  platform?: string;
  language?: string;
  additionalInstructions?: string;
  idempotencyKey?: string;
  allowMultipleDailyPosts?: boolean;
}

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
    publishedAt: string | null;
    recordedEngagement: number;
  }>;
}

export interface CrawlJobResult {
  hasCrawled: boolean;
  jobId?: string;
  websiteUrl?: string | null;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | null;
  extractedData?: {
    name: string;
    category: string;
    description: string;
    productsAndServices: string[];
    menuOrProductCategories: string[];
    brandMessaging: string;
    targetAudience: string;
    currentOffers: string[];
    contactInfo: { phone?: string; email?: string; address?: string };
    websiteUrl: string;
    brandVoiceAndTone: string;
    publicImageUrls: string[];
    brandColors: string[];
  } | null;
  errorDetails?: string | null;
  userConfirmationStatus?: 'UNREVIEWED' | 'CONFIRMED' | 'REJECTED';
}
