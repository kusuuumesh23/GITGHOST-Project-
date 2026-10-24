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

let MOCK_BUSINESS: BusinessProfile = {
  id: 'demo-business-1',
  name: 'Kestrel Coffee & Roastery',
  websiteUrl: 'https://kestrelcoffeeroasters.com',
  industry: 'Specialty Coffee & Bakery',
  description: 'Neighborhood micro-roaster offering single-origin espresso and artisan sourdough pastries.',
  location: 'Portland, OR',
  brandTone: 'Warm, artisanal, grounded, and welcoming',
  targetAudience: 'Local residents and specialty coffee enthusiasts',
  preferredLanguage: 'en',
  role: 'OWNER',
};

let MOCK_POSTS: Post[] = [
  {
    id: 'demo-post-pending-1',
    businessId: 'demo-business-1',
    title: 'Single-Origin Ethiopian Direct Trade Story',
    caption: 'Great coffee starts with great relationships. We just received our harvest shipment directly from Yirgacheffe, roasted fresh this morning in Portland. Come try a pour-over today!',
    hashtags: ['specialtycoffee', 'directtrade', 'portland', 'coffeeroaster'],
    callToAction: 'Taste the new roast at our bar before 4pm.',
    imagePrompt: 'Pour-over coffee brewing in ceramic dripper on rustic counter with beans scattered around.',
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
    platform: 'LINKEDIN',
    language: 'en',
    contentGoal: 'BEHIND_THE_SCENES',
    status: 'pending_approval',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDemo: true,
    metrics: { likes: null, shares: null, comments: null, reach: null, clicks: null, recordedAt: null },
  },
  {
    id: 'demo-post-pending-2',
    businessId: 'demo-business-1',
    title: 'Flash Cold Brew Announcement',
    caption: 'Nitro cold brew is back on tap all weekend long! Smooth, naturally sweet, zero bitter bite. ☕⚡',
    hashtags: ['coldbrew', 'nitrocoldbrew', 'pdxcoffee'],
    callToAction: 'Grab a growler fill before we run out.',
    imagePrompt: 'Cold brew glass with rich crema cascading down the sides.',
    imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=800&q=80',
    platform: 'X',
    language: 'en',
    contentGoal: 'PROMOTE_PRODUCT_OR_SERVICE',
    status: 'pending_approval',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    isDemo: true,
    metrics: { likes: null, shares: null, comments: null, reach: null, clicks: null, recordedAt: null },
  },
  {
    id: 'demo-post-1',
    businessId: 'demo-business-1',
    title: 'Tuesday Morning Roast Profiling',
    caption: 'Every Tuesday we fire up the roaster for our single-origin Ethiopian Yirgacheffe. Come smell the fresh floral aroma in the shop today!',
    hashtags: ['specialtycoffee', 'portlandcoffee', 'coffeeroaster', 'localpdx'],
    callToAction: 'Stop by before 3pm to grab fresh beans.',
    imagePrompt: 'A warm photograph of fresh roasted coffee beans cooling in a vintage stainless hopper.',
    imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80',
    platform: 'LINKEDIN',
    language: 'en',
    contentGoal: 'BEHIND_THE_SCENES',
    status: 'published',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    platformPostId: 'urn:li:share:123456789',
    platformPostUrl: 'https://www.linkedin.com/feed/update/urn:li:share:123456789/',
    isDemo: true,
    metrics: {
      likes: 48,
      shares: 3,
      comments: 7,
      reach: null,
      clicks: null,
      recordedAt: new Date().toISOString(),
    },
  },
  {
    id: 'demo-post-2',
    businessId: 'demo-business-1',
    title: 'Warm Cardamom Latte Special',
    caption: 'Crisp morning air calls for ground green cardamom, steamed whole milk, and our house double shot.',
    hashtags: ['cardamomlatte', 'fallmenu', 'pdxdrinks'],
    callToAction: 'Available hot or iced all through this week.',
    imagePrompt: 'Top-down view of latte art in a hunter-green ceramic mug on a rustic table.',
    imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80',
    platform: 'X',
    language: 'en',
    contentGoal: 'PROMOTE_PRODUCT_OR_SERVICE',
    status: 'published',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    platformPostId: '1849204910293',
    platformPostUrl: 'https://twitter.com/kestrelcoffee/status/1849204910293',
    isDemo: true,
    metrics: {
      likes: 62,
      shares: null,
      comments: 11,
      reach: null,
      clicks: null,
      recordedAt: new Date().toISOString(),
    },
  },
];

export const mockPostsService: PostsService = {
  async list(_businessId: string, params: ListPostsParams = {}): Promise<ListPostsResult> {
    await new Promise(r => setTimeout(r, 150));
    let filtered = [...MOCK_POSTS];

    if (params.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        p => p.title.toLowerCase().includes(q) || p.caption.toLowerCase().includes(q)
      );
    }
    if (params.status) {
      filtered = filtered.filter(p => p.status === params.status);
    }

    return {
      items: filtered,
      total: filtered.length,
      page: params.page || 1,
      pageSize: params.pageSize || 12,
      hasMore: false,
    };
  },

  async get(postId: string): Promise<Post> {
    const post = MOCK_POSTS.find(p => p.id === postId);
    if (!post) throw new Error('Post not found in mock store');
    return post;
  },

  async update(postId: string, patch: PostPatch): Promise<Post> {
    const idx = MOCK_POSTS.findIndex(p => p.id === postId);
    if (idx === -1) throw new Error('Post not found in mock store');
    MOCK_POSTS[idx] = { ...MOCK_POSTS[idx], ...patch, updatedAt: new Date().toISOString() };
    return MOCK_POSTS[idx];
  },

  async approve(postId: string): Promise<Post> {
    return this.update(postId, { status: 'approved' });
  },

  async reject(postId: string): Promise<Post> {
    return this.update(postId, { status: 'archived', archivedAt: new Date().toISOString() });
  },

  async publish(postId: string): Promise<{ platformPostId: string; platformPostUrl: string }> {
    const post = await this.get(postId);
    const platform = (post.platform || 'LINKEDIN').toUpperCase();
    const mockId = String(Date.now());
    const mockUrl =
      platform === 'LINKEDIN'
        ? `https://www.linkedin.com/feed/update/urn:li:share:${mockId}/`
        : `https://twitter.com/user/status/${mockId}`;

    await this.update(postId, {
      status: 'published',
      publishedAt: new Date().toISOString(),
      platformPostId: mockId,
      platformPostUrl: mockUrl,
      failureReason: null,
    });

    return { platformPostId: mockId, platformPostUrl: mockUrl };
  },

  async retry(postId: string): Promise<{ platformPostId: string; platformPostUrl: string }> {
    return this.publish(postId);
  },

  async getApprovalQueue(_businessId: string): Promise<Post[]> {
    await new Promise(r => setTimeout(r, 100));
    return MOCK_POSTS.filter(p => p.status === 'pending_approval' || p.status === 'failed');
  },

  async archive(postId: string): Promise<Post> {
    return this.update(postId, { status: 'archived' });
  },

  async restore(postId: string): Promise<Post> {
    return this.update(postId, { status: 'draft' });
  },

  async delete(postId: string): Promise<void> {
    MOCK_POSTS = MOCK_POSTS.filter(p => p.id !== postId);
  },
};

export const mockGenerationService: GenerationService = {
  async generateToday(businessId: string, req: GenerationRequest): Promise<any> {
    await new Promise(r => setTimeout(r, 300));
    const newPost: Post = {
      id: `mock-gen-${Date.now()}`,
      businessId,
      title: 'Daily Spotlight: Artisan Craft',
      caption: 'Every morning begins with dedicated craft and attention to detail. Stop by today and experience what makes our local kitchen unique.',
      hashtags: ['localbusiness', 'craft', 'community', 'dailyfavorite'],
      callToAction: 'Visit us on Main Street or say hello in the comments!',
      imagePrompt: 'A warm natural-light photo of daily kitchen craft.',
      platform: req.platform || 'INSTAGRAM',
      language: req.language || 'en',
      contentGoal: req.contentGoal,
      status: 'pending_approval',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDemo: true,
      metrics: {
        likes: null,
        shares: null,
        comments: null,
        reach: null,
        clicks: null,
        recordedAt: null,
      },
    };
    MOCK_POSTS.unshift(newPost);
    return { post: newPost, status: 'COMPLETED' };
  },

  async pollJob(): Promise<any> {
    return { status: 'COMPLETED', progress: 100 };
  },

  async regenerateCaption(postId: string): Promise<Post> {
    return mockPostsService.update(postId, {
      caption: 'Updated fresh perspective on our daily artisan routine. Crafted with care for you.',
    });
  },

  async regenerateImage(postId: string): Promise<Post> {
    return mockPostsService.update(postId, {
      imagePrompt: 'Updated photographic perspective with warm golden hour morning illumination.',
    });
  },
};

export const mockAnalyticsService: AnalyticsService = {
  async summary(businessId: string): Promise<AnalyticsSummary> {
    await new Promise(r => setTimeout(r, 100));
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
        totalPostsCount: MOCK_POSTS.length,
        postsWithRecordedMetricsCount: 2,
        hasRecordedData: true,
        notice: 'Demo mode active. Sample metrics displayed.',
      },
      totals: {
        likes: 110,
        shares: 3,
        comments: 18,
        reach: null,
        clicks: null,
        contributingPostCount: 2,
      },
      metricsByPlatform: {
        INSTAGRAM: { postCount: 2, likes: 110, shares: 3, comments: 18 },
      },
      topPerformingPosts: [
        {
          id: 'demo-post-2',
          title: 'Warm Cardamom Latte Special',
          platform: 'INSTAGRAM',
          publishedAt: new Date(Date.now() - 86400000).toISOString(),
          recordedEngagement: 73,
        },
      ],
    };
  },

  async postAnalytics(postId: string): Promise<any> {
    const post = MOCK_POSTS.find(p => p.id === postId);
    return { post, recordedSnapshots: [] };
  },
};

export const mockBusinessService: BusinessService = {
  async list(): Promise<BusinessProfile[]> {
    return [MOCK_BUSINESS];
  },

  async get(): Promise<BusinessProfile> {
    return MOCK_BUSINESS;
  },

  async create(data): Promise<BusinessProfile> {
    MOCK_BUSINESS = { ...MOCK_BUSINESS, ...data };
    return MOCK_BUSINESS;
  },

  async update(_id, patch): Promise<BusinessProfile> {
    MOCK_BUSINESS = { ...MOCK_BUSINESS, ...patch };
    return MOCK_BUSINESS;
  },
};

export const mockCrawlService: CrawlService = {
  async start(): Promise<{ jobId: string; status: string; message: string }> {
    return { jobId: 'mock-crawl-1', status: 'COMPLETED', message: 'Demo crawl complete' };
  },

  async status(): Promise<CrawlJobResult> {
    return {
      hasCrawled: true,
      jobId: 'mock-crawl-1',
      status: 'COMPLETED',
      websiteUrl: MOCK_BUSINESS.websiteUrl,
      extractedData: {
        name: 'Kestrel Coffee & Roastery',
        category: 'Specialty Coffee & Bakery',
        description: 'Neighborhood micro-roaster offering single-origin espresso and artisan sourdough pastries.',
        productsAndServices: ['Single-origin pour-overs', 'Oat milk lattes', 'Sourdough croissants'],
        menuOrProductCategories: ['Espresso', 'Drip', 'Pastries'],
        brandMessaging: 'Small batches, direct relationships, roasted with heart.',
        targetAudience: 'Local coffee lovers in Portland',
        currentOffers: ['Complimentary drip with bag purchase'],
        contactInfo: { phone: '(503) 555-0192', address: '812 SE Division St' },
        websiteUrl: 'https://kestrelcoffeeroasters.com',
        brandVoiceAndTone: 'Warm and community-focused',
        publicImageUrls: ['https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80'],
        brandColors: ['#2F7D5B', '#FAF8F4', '#1F2421'],
      },
    };
  },

  async retry(): Promise<{ jobId: string; status: string; message: string }> {
    return this.start();
  },

  async confirm(_id, confirmedData): Promise<BusinessProfile> {
    MOCK_BUSINESS = { ...MOCK_BUSINESS, ...confirmedData };
    return MOCK_BUSINESS;
  },
};

export const mockServices: Services = {
  posts: mockPostsService,
  generation: mockGenerationService,
  analytics: mockAnalyticsService,
  business: mockBusinessService,
  crawl: mockCrawlService,
};
