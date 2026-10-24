import { validatePublicUrl } from '../../utils/ssrf.js';
import {
  ITinyFishProvider,
  CrawlResult,
  ExtractedBusinessData,
} from './tinyfish.interface.js';

export class MockTinyFishProvider implements ITinyFishProvider {
  async crawlAndExtract(targetUrl: string): Promise<CrawlResult> {
    const crawledAt = new Date();

    // Verify SSRF even in mock mode to test security pipeline
    const validUrl = await validatePublicUrl(targetUrl);
    const normalizedUrl = validUrl.toString();

    // Simulated sample extraction derived from the host
    const domainName = validUrl.hostname.replace('www.', '').split('.')[0];
    const capitalizedName = domainName.charAt(0).toUpperCase() + domainName.slice(1);

    const mockData: ExtractedBusinessData = {
      name: `${capitalizedName} Artisan Roasters`,
      category: 'Specialty Coffee & Cafe',
      description: `A warm neighborhood espresso bar and bakery serving sustainably sourced single-origin coffees and fresh house-baked pastries.`,
      productsAndServices: [
        'Single-origin pour-overs',
        'Seasonal espresso drinks',
        'House-baked sourdough croissants',
        'Artisan coffee subscriptions',
      ],
      menuOrProductCategories: ['Hot Drinks', 'Cold Brew', 'Bakery & Pastries', 'Whole Bean Coffee'],
      brandMessaging: 'Crafted with passion, roasted with precision, served with warmth.',
      targetAudience: 'Local residents, coffee enthusiasts, remote workers, and daily commuters.',
      currentOffers: ['10% off whole bean coffee bags on weekend mornings'],
      contactInfo: {
        phone: '+1 (555) 234-5678',
        email: `hello@${validUrl.hostname}`,
        address: '142 Market Street, Suite 4',
      },
      websiteUrl: normalizedUrl,
      brandVoiceAndTone: 'Warm, artisanal, grounded, and welcoming',
      publicImageUrls: [
        'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80',
      ],
      brandColors: ['#2F7D5B', '#FAF8F4', '#1F2421'],
    };

    return {
      success: true,
      data: mockData,
      sourceUrl: normalizedUrl,
      crawledAt,
    };
  }
}
