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

export interface PostsService {
  list(businessId: string, params?: ListPostsParams): Promise<ListPostsResult>;
  get(postId: string): Promise<Post>;
  update(postId: string, patch: PostPatch): Promise<Post>;
  approve(postId: string, confirmed?: boolean): Promise<Post>;
  reject(postId: string): Promise<Post>;
  publish(postId: string): Promise<{ platformPostId: string; platformPostUrl: string }>;
  retry(postId: string): Promise<{ platformPostId: string; platformPostUrl: string }>;
  getApprovalQueue(businessId: string): Promise<Post[]>;
  archive(postId: string): Promise<Post>;
  restore(postId: string): Promise<Post>;
  delete(postId: string): Promise<void>;
}

export interface GenerationService {
  generateToday(businessId: string, req: GenerationRequest): Promise<any>;
  pollJob(jobId: string): Promise<any>;
  regenerateCaption(postId: string): Promise<Post>;
  regenerateImage(postId: string, visualPrompt?: string): Promise<Post>;
}

export interface AnalyticsService {
  summary(businessId: string, range?: { dateFrom?: string; dateTo?: string }): Promise<AnalyticsSummary>;
  postAnalytics(postId: string): Promise<any>;
}

export interface BusinessService {
  list(): Promise<BusinessProfile[]>;
  get(id: string): Promise<BusinessProfile>;
  create(data: { name: string; websiteUrl?: string; industry?: string }): Promise<BusinessProfile>;
  update(id: string, patch: Partial<BusinessProfile>): Promise<BusinessProfile>;
}

export interface CrawlService {
  start(businessId: string, websiteUrl?: string): Promise<{ jobId: string; status: string; message: string }>;
  status(businessId: string): Promise<CrawlJobResult>;
  retry(businessId: string): Promise<{ jobId: string; status: string; message: string }>;
  confirm(businessId: string, confirmedData: Partial<BusinessProfile>): Promise<BusinessProfile>;
}

export interface Services {
  posts: PostsService;
  generation: GenerationService;
  analytics: AnalyticsService;
  business: BusinessService;
  crawl: CrawlService;
}
