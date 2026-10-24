import { describe, it, expect } from 'vitest';
import { MockTinyFishProvider } from '../../src/providers/tinyfish/mock.provider.js';
import { extractedBusinessDataSchema } from '../../src/providers/tinyfish/tinyfish.interface.js';

describe('TinyFish Website Extraction Provider', () => {
  const provider = new MockTinyFishProvider();

  it('should successfully crawl a permitted website and return valid structured profile', async () => {
    const result = await provider.crawlAndExtract('https://example-bakery.com');
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();

    const data = result.data!;
    expect(data.name).toContain('Example-bakery');
    expect(data.category).toBeTruthy();
    expect(data.description).toBeTruthy();
    expect(Array.isArray(data.productsAndServices)).toBe(true);
    expect(data.productsAndServices.length).toBeGreaterThan(0);
    expect(data.brandVoiceAndTone).toBeTruthy();
    expect(Array.isArray(data.brandColors)).toBe(true);

    // Validate that the returned object satisfies the Zod schema
    const parsed = extractedBusinessDataSchema.safeParse(data);
    expect(parsed.success).toBe(true);
  });

  it('should reject invalid or private IP destinations in crawling', async () => {
    await expect(provider.crawlAndExtract('http://127.0.0.1/admin')).rejects.toThrow();
  });
});
