import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { validatePublicUrl } from '../../utils/ssrf.js';
import {
  ITinyFishProvider,
  CrawlResult,
  ExtractedBusinessData,
  extractedBusinessDataSchema,
} from './tinyfish.interface.js';

export class TinyFishClient implements ITinyFishProvider {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor() {
    this.apiKey = env.TINYFISH_API_KEY;
    this.baseUrl = env.TINYFISH_BASE_URL.replace(/\/$/, '');
    this.timeoutMs = env.TINYFISH_TIMEOUT_MS;
  }

  async crawlAndExtract(targetUrl: string): Promise<CrawlResult> {
    const crawledAt = new Date();

    if (!this.apiKey) {
      throw new Error('TINYFISH_API_KEY is not configured on the server');
    }

    // SSRF and protocol check
    const validUrl = await validatePublicUrl(targetUrl);
    const normalizedUrl = validUrl.toString();

    const extractionGoal = `
      Extract accurate business profile information from this website into a JSON object with this exact structure:
      {
        "name": string (business name),
        "category": string (industry or business category),
        "description": string (short overview of the business),
        "productsAndServices": string[] (list of key products or services offered),
        "menuOrProductCategories": string[] (categories of products or menu items),
        "brandMessaging": string (core value proposition or tagline),
        "targetAudience": string (who this business serves, only if evident on website),
        "currentOffers": string[] (any active specials, discounts, or promotions currently mentioned),
        "contactInfo": { "phone": string, "email": string, "address": string },
        "websiteUrl": string (canonical website URL),
        "brandVoiceAndTone": string (tone inferred from website copy e.g. playful, warm, minimalist, authoritative),
        "publicImageUrls": string[] (up to 5 publicly accessible high-quality product/storefront image URLs),
        "brandColors": string[] (hex color codes or dominant colors evident on website)
      }
      Do not invent facts, opening hours, or fake promotions. If a field is not found, leave it as an empty string or empty array.
    `.trim();

    logger.info({ url: normalizedUrl }, 'Initiating TinyFish website crawl');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/v1/automation/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
        },
        body: JSON.stringify({
          url: normalizedUrl,
          goal: extractionGoal,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        logger.error({ status: response.status, errorText }, 'TinyFish API error response');
        return {
          success: false,
          sourceUrl: normalizedUrl,
          crawledAt,
          error: `TinyFish crawl request failed (${response.status}): ${errorText.slice(0, 300)}`,
        };
      }

      const rawResult = (await response.json()) as {
        status?: string;
        result_json?: unknown;
        data?: unknown;
        error?: string;
      };

      const payloadToValidate = rawResult.result_json || rawResult.data || rawResult;

      // Validate with Zod
      const parseResult = extractedBusinessDataSchema.safeParse({
        ...(typeof payloadToValidate === 'object' && payloadToValidate !== null ? payloadToValidate : {}),
        websiteUrl: normalizedUrl,
      });

      if (!parseResult.success) {
        logger.warn({ errors: parseResult.error.format() }, 'TinyFish output validation failed to match schema strictly');
        return {
          success: false,
          sourceUrl: normalizedUrl,
          crawledAt,
          error: 'Extracted website data failed validation requirements',
        };
      }

      logger.info({ url: normalizedUrl }, 'Successfully extracted business profile with TinyFish');
      return {
        success: true,
        data: parseResult.data,
        sourceUrl: normalizedUrl,
        crawledAt,
      };
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const isAbort = (err as Error).name === 'AbortError';
      const errorMessage = isAbort
        ? `Crawl request timed out after ${this.timeoutMs}ms`
        : (err as Error).message;

      logger.error({ url: normalizedUrl, err: errorMessage }, 'TinyFish crawl exception');
      return {
        success: false,
        sourceUrl: normalizedUrl,
        crawledAt,
        error: errorMessage,
      };
    }
  }
}
