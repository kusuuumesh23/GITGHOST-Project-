import { describe, it, expect } from 'vitest';
import { MockDeepSeekProvider } from '../../src/providers/nvidia-nim/mock.provider.js';
import { generatedPostOutputSchema, GeneratePostInput } from '../../src/providers/nvidia-nim/deepseek.interface.js';

describe('NVIDIA NIM DeepSeek Text Generation Provider', () => {
  const provider = new MockDeepSeekProvider();

  const sampleInput: GeneratePostInput = {
    businessName: 'Lakeside Ceramics',
    industry: 'Handmade Pottery & Studio',
    description: 'Independent pottery studio offering handmade stoneware mugs and weekend wheel-throwing workshops.',
    productsAndServices: ['Stoneware Mugs', 'Wheel Throwing Classes', 'Custom Dinnerware'],
    targetAudience: 'Local residents, art hobbyists, and gift shoppers',
    brandTone: 'Mindful, earthy, warm, and inspiring',
    contentGoal: 'PROMOTE_PRODUCT_OR_SERVICE',
    platform: 'INSTAGRAM',
    language: 'en',
    maxHashtags: 5,
  };

  it('should generate structured daily post content conforming to schema', async () => {
    const post = await provider.generatePost(sampleInput);

    expect(post.title).toBeTruthy();
    expect(post.caption).toContain('Lakeside Ceramics');
    expect(post.callToAction).toBeTruthy();
    expect(post.imagePrompt).toBeTruthy();
    expect(post.suggestedPlatform).toBe('INSTAGRAM');
    expect(post.contentLanguage).toBe('en');

    // Hashtags rules verification
    expect(post.hashtags.length).toBeLessThanOrEqual(5);
    for (const tag of post.hashtags) {
      expect(tag.startsWith('#')).toBe(false);
      expect(tag).toBe(tag.toLowerCase());
    }

    const parseResult = generatedPostOutputSchema.safeParse(post);
    expect(parseResult.success).toBe(true);
  });

  it('should support caption regeneration preserving existing title context', async () => {
    const regen = await provider.regenerateCaption(sampleInput, 'Lakeside Ceramics Spotlight');
    expect(regen.caption).toBeTruthy();
    expect(regen.callToAction).toBeTruthy();
    expect(Array.isArray(regen.hashtags)).toBe(true);
  });

  it('should support image prompt regeneration for an approved caption', async () => {
    const prompt = await provider.regenerateImagePrompt(sampleInput, 'Our new stoneware mugs are out of the kiln today!');
    expect(prompt).toContain('photograph');
  });
});
