import { apiClient } from './apiClient.js';
import {
  Services,
  PostsService,
  GenerationService,
  AnalyticsService,
  BusinessService,
  CrawlService,
} from './types.js';
import {
  Post,
  PostPatch,
  ListPostsParams,
  ListPostsResult,
  BusinessProfile,
  GenerationRequest,
  AnalyticsSummary,
  CrawlJobResult,
} from '../types/index.js';

export const httpPostsService: PostsService = {
  async list(businessId: string, params: ListPostsParams = {}): Promise<ListPostsResult> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.pageSize) query.set('pageSize', String(params.pageSize));
    if (params.search) query.set('search', params.search);
    if (params.status) query.set('status', params.status);
    if (params.platform) query.set('platform', params.platform);
    if (params.dateFrom) query.set('dateFrom', params.dateFrom);
    if (params.dateTo) query.set('dateTo', params.dateTo);
    if (params.includeArchived) query.set('includeArchived', 'true');

    const qs = query.toString() ? `?${query.toString()}` : '';
    return apiClient<ListPostsResult>(`/businesses/${businessId}/posts${qs}`);
  },

  async get(postId: string): Promise<Post> {
    return apiClient<Post>(`/posts/${postId}`);
  },

  async update(postId: string, patch: PostPatch): Promise<Post> {
    return apiClient<Post>(`/posts/${postId}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
  },

  async approve(postId: string, confirmed: boolean = true): Promise<Post> {
    return apiClient<Post>(`/posts/${postId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ permissionGranted: confirmed }),
    });
  },

  async reject(postId: string): Promise<Post> {
    return apiClient<Post>(`/posts/${postId}/reject`, {
      method: 'POST',
    });
  },

  async publish(postId: string): Promise<{ platformPostId: string; platformPostUrl: string }> {
    return apiClient<{ platformPostId: string; platformPostUrl: string }>(`/posts/${postId}/publish`, {
      method: 'POST',
    });
  },

  async retry(postId: string): Promise<{ platformPostId: string; platformPostUrl: string }> {
    return apiClient<{ platformPostId: string; platformPostUrl: string }>(`/posts/${postId}/retry`, {
      method: 'POST',
    });
  },

  async getApprovalQueue(businessId: string): Promise<Post[]> {
    return apiClient<Post[]>(`/posts/approval-queue?businessId=${encodeURIComponent(businessId)}`);
  },

  async archive(postId: string): Promise<Post> {
    return apiClient<Post>(`/posts/${postId}/archive`, {
      method: 'POST',
    });
  },

  async restore(postId: string): Promise<Post> {
    return apiClient<Post>(`/posts/${postId}/restore`, {
      method: 'POST',
    });
  },

  async delete(postId: string): Promise<void> {
    return apiClient<void>(`/posts/${postId}`, {
      method: 'DELETE',
    });
  },
};

export const httpGenerationService: GenerationService = {
  async generateToday(businessId: string, req: GenerationRequest): Promise<any> {
    return apiClient(`/businesses/${businessId}/generations`, {
      method: 'POST',
      body: JSON.stringify(req),
    });
  },

  async pollJob(jobId: string): Promise<any> {
    return apiClient(`/generations/${jobId}`);
  },

  async regenerateCaption(postId: string): Promise<Post> {
    return apiClient<Post>(`/posts/${postId}/regenerate-caption`, {
      method: 'POST',
    });
  },

  async regenerateImage(postId: string, visualPrompt?: string): Promise<Post> {
    return apiClient<Post>(`/posts/${postId}/regenerate-image`, {
      method: 'POST',
      body: JSON.stringify({ customVisualPrompt: visualPrompt }),
    });
  },
};

export const httpAnalyticsService: AnalyticsService = {
  async summary(businessId: string, range?: { dateFrom?: string; dateTo?: string }): Promise<AnalyticsSummary> {
    const query = new URLSearchParams();
    if (range?.dateFrom) query.set('dateFrom', range.dateFrom);
    if (range?.dateTo) query.set('dateTo', range.dateTo);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return apiClient<AnalyticsSummary>(`/businesses/${businessId}/analytics${qs}`);
  },

  async postAnalytics(postId: string): Promise<any> {
    return apiClient(`/businesses/any/analytics/posts/${postId}`);
  },
};

export const httpBusinessService: BusinessService = {
  async list(): Promise<BusinessProfile[]> {
    return apiClient<BusinessProfile[]>('/businesses');
  },

  async get(id: string): Promise<BusinessProfile> {
    return apiClient<BusinessProfile>(`/businesses/${id}`);
  },

  async create(data: { name: string; websiteUrl?: string; industry?: string }): Promise<BusinessProfile> {
    return apiClient<BusinessProfile>('/businesses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, patch: Partial<BusinessProfile>): Promise<BusinessProfile> {
    return apiClient<BusinessProfile>(`/businesses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
  },
};

export const httpCrawlService: CrawlService = {
  async start(businessId: string, websiteUrl?: string): Promise<{ jobId: string; status: string; message: string }> {
    return apiClient(`/businesses/${businessId}/website-crawl`, {
      method: 'POST',
      body: JSON.stringify({ websiteUrl }),
    });
  },

  async status(businessId: string): Promise<CrawlJobResult> {
    return apiClient<CrawlJobResult>(`/businesses/${businessId}/website-crawl`);
  },

  async retry(businessId: string): Promise<{ jobId: string; status: string; message: string }> {
    return apiClient(`/businesses/${businessId}/website-crawl/retry`, {
      method: 'POST',
    });
  },

  async confirm(businessId: string, confirmedData: Partial<BusinessProfile>): Promise<BusinessProfile> {
    return apiClient<BusinessProfile>(`/businesses/${businessId}/profile`, {
      method: 'PATCH',
      body: JSON.stringify(confirmedData),
    });
  },
};

export const httpServices: Services = {
  posts: httpPostsService,
  generation: httpGenerationService,
  analytics: httpAnalyticsService,
  business: httpBusinessService,
  crawl: httpCrawlService,
};
