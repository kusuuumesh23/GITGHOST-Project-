import {
  IDeepSeekProvider,
  GeneratePostInput,
  GeneratedPostOutput,
} from './deepseek.interface.js';

export class MockDeepSeekProvider implements IDeepSeekProvider {
  private normalizeHashtags(rawTags: string[], maxCount: number): string[] {
    const cleaned = rawTags
      .map(tag => tag.replace(/^#+/, '').trim().toLowerCase())
      .filter(tag => tag.length > 0);
    return Array.from(new Set(cleaned)).slice(0, maxCount);
  }

  async generatePost(input: GeneratePostInput): Promise<GeneratedPostOutput> {
    const topic = input.productsAndServices[0] || 'our signature specialties';
    const cleanBusiness = input.businessName;

    const hashtags = this.normalizeHashtags(
      [
        cleanBusiness.toLowerCase().replace(/[^a-z0-9]/g, ''),
        'smallbusiness',
        'localfavorite',
        'qualityfirst',
        'community',
        'dailycraft',
      ],
      input.maxHashtags
    );

    return {
      title: `Daily Spotlight: ${topic} at ${cleanBusiness}`,
      caption: `Every morning begins with dedicated craft and attention to detail. Whether you're dropping by for ${topic} or enjoying a quiet moment in our space, we're proud to serve our community with care.\n\nStop by today and experience what makes ${cleanBusiness} special.`,
      hashtags,
      callToAction: `Visit ${cleanBusiness} today or tap the link in our bio to learn more.`,
      imagePrompt: `A beautiful, atmospheric wide-angle photograph inside ${cleanBusiness}, featuring ${topic} placed neatly on a textured rustic wooden table with soft morning natural sunlight streaming through a window. Warm color grading, 35mm lens style.`,
      suggestedPlatform: input.platform,
      contentLanguage: input.language,
      contentAngleExplanation: `Highlights the authenticity and product quality of ${cleanBusiness} while inviting local engagement.`,
    };
  }

  async regenerateCaption(
    input: GeneratePostInput,
    _existingTitle: string
  ): Promise<Pick<GeneratedPostOutput, 'caption' | 'hashtags' | 'callToAction'>> {
    const post = await this.generatePost(input);
    return {
      caption: `Fresh perspective: Experience the craft behind ${input.businessName}. We prioritize quality and authentic service every single day.`,
      hashtags: post.hashtags,
      callToAction: `Comment below or visit us in person this week!`,
    };
  }

  async regenerateImagePrompt(input: GeneratePostInput, caption: string): Promise<string> {
    return `Editorial lifestyle photograph matching the theme: "${caption.slice(0, 80)}", clean natural lighting, shallow depth of field, vibrant textures, high resolution.`;
  }
}
