import { z } from 'zod';

export const contentGoals = [
  'PROMOTE_PRODUCT_OR_SERVICE',
  'ANNOUNCE_OFFER',
  'EDUCATE_AUDIENCE',
  'BEHIND_THE_SCENES',
  'HIGHLIGHT_CUSTOMER_BENEFIT',
  'PROMOTE_EVENT',
  'INCREASE_LOCAL_AWARENESS',
  'SEASONAL_IDEA',
] as const;

export type ContentGoal = (typeof contentGoals)[number];

export const generatePostInputSchema = z.object({
  businessName: z.string().min(1),
  industry: z.string().default('General Business'),
  description: z.string().default(''),
  productsAndServices: z.array(z.string()).default([]),
  targetAudience: z.string().default(''),
  brandTone: z.string().default('Warm and professional'),
  contentGoal: z.string().default('INCREASE_LOCAL_AWARENESS'),
  offerOrPromotion: z.string().optional(),
  platform: z.string().default('INSTAGRAM'),
  language: z.string().default('en'),
  additionalInstructions: z.string().optional(),
  maxHashtags: z.number().int().min(0).max(30).default(5),
});

export type GeneratePostInput = z.infer<typeof generatePostInputSchema>;

export const generatedPostOutputSchema = z.object({
  title: z.string().min(1),
  caption: z.string().min(1),
  hashtags: z.array(z.string()).default([]),
  callToAction: z.string().min(1),
  imagePrompt: z.string().min(1),
  suggestedPlatform: z.string().default('INSTAGRAM'),
  contentLanguage: z.string().default('en'),
  contentAngleExplanation: z.string().optional(),
});

export type GeneratedPostOutput = z.infer<typeof generatedPostOutputSchema>;

export interface IDeepSeekProvider {
  generatePost(input: GeneratePostInput): Promise<GeneratedPostOutput>;
  regenerateCaption(input: GeneratePostInput, existingTitle: string): Promise<Pick<GeneratedPostOutput, 'caption' | 'hashtags' | 'callToAction'>>;
  regenerateImagePrompt(input: GeneratePostInput, caption: string): Promise<string>;
}
