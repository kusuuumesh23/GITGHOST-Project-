import { z } from 'zod';

export const extractedBusinessDataSchema = z.object({
  name: z.string().min(1, 'Business name is required'),
  category: z.string().default('Small Business'),
  description: z.string().default(''),
  productsAndServices: z.array(z.string()).default([]),
  menuOrProductCategories: z.array(z.string()).default([]),
  brandMessaging: z.string().default(''),
  targetAudience: z.string().default(''),
  currentOffers: z.array(z.string()).default([]),
  contactInfo: z.object({
    phone: z.string().optional(),
    email: z.string().optional(),
    address: z.string().optional(),
  }).default({}),
  websiteUrl: z.string().url(),
  brandVoiceAndTone: z.string().default('Friendly and professional'),
  publicImageUrls: z.array(z.string().url()).default([]),
  brandColors: z.array(z.string()).default([]),
});

export type ExtractedBusinessData = z.infer<typeof extractedBusinessDataSchema>;

export interface CrawlResult {
  success: boolean;
  data?: ExtractedBusinessData;
  error?: string;
  sourceUrl: string;
  crawledAt: Date;
}

export interface ITinyFishProvider {
  crawlAndExtract(url: string): Promise<CrawlResult>;
}
