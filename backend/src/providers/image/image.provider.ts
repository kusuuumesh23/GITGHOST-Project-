import crypto from 'node:crypto';
import path from 'node:path';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { IImageProvider, ImageGenerationResult } from './image.interface.js';
import { localStorageAdapter } from './local-storage.adapter.js';

export class ConfigurableImageProvider implements IImageProvider {
  public readonly name: string;

  constructor() {
    this.name = env.IMAGE_PROVIDER || 'mock';
  }

  isConfigured(): boolean {
    if (this.name === 'mock') return true;
    return Boolean(env.IMAGE_PROVIDER_API_KEY && env.IMAGE_PROVIDER_API_KEY.trim() !== '');
  }

  async generateImage(prompt: string): Promise<ImageGenerationResult> {
    if (!this.isConfigured()) {
      logger.info('Image generation provider is not configured. Preserving image prompt.');
      return {
        status: 'NOT_CONFIGURED',
        error: 'Image generation provider is not configured. Set IMAGE_PROVIDER_API_KEY to enable.',
      };
    }

    if (this.name === 'mock') {
      try {
        const id = crypto.randomUUID();
        const fileName = `generated-${id}.svg`;
        
        // Generate an elegant SVG illustration card incorporating prompt themes
        const safePromptText = prompt
          .replace(/[<>&"']/g, '')
          .slice(0, 100);

        const svgContent = `
<svg width="800" height="800" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2F7D5B" />
      <stop offset="100%" stop-color="#1F2421" />
    </linearGradient>
    <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="30" result="blur" />
    </filter>
  </defs>
  <rect width="800" height="800" fill="url(#bgGrad)" />
  <circle cx="400" cy="350" r="180" fill="#FAF8F4" opacity="0.08" filter="url(#softGlow)" />
  <circle cx="400" cy="350" r="120" stroke="#FAF8F4" stroke-width="2" stroke-dasharray="6 6" fill="none" opacity="0.25" />
  
  <text x="400" y="320" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="bold" fill="#FAF8F4" text-anchor="middle">
    PostDaily Daily Visual
  </text>
  <text x="400" y="365" font-family="system-ui, -apple-system, sans-serif" font-size="16" fill="#FAF8F4" opacity="0.8" text-anchor="middle">
    AI Photographic Concept
  </text>
  
  <rect x="100" y="480" width="600" height="180" rx="12" fill="#1F2421" opacity="0.6" stroke="#FAF8F4" stroke-opacity="0.15" />
  <text x="130" y="525" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="600" fill="#2F7D5B">
    PROMPT VISUALIZATION
  </text>
  <foreignObject x="130" y="540" width="540" height="100">
    <div xmlns="http://www.w3.org/1999/xhtml" style="color: #FAF8F4; font-family: system-ui; font-size: 14px; line-height: 1.5; opacity: 0.9;">
      ${safePromptText}...
    </div>
  </foreignObject>
</svg>
        `.trim();

        const buffer = Buffer.from(svgContent, 'utf-8');
        const storagePath = await localStorageAdapter.saveFile(fileName, buffer);
        const publicUrl = localStorageAdapter.getPublicUrl(fileName);

        return {
          status: 'GENERATED',
          storagePath,
          publicUrl,
          mimeType: 'image/svg+xml',
          metadata: {
            provider: 'mock',
            promptSnippet: safePromptText,
            fileName,
          },
        };
      } catch (err) {
        logger.error({ err }, 'Failed to create mock image asset');
        return {
          status: 'FAILED',
          error: (err as Error).message,
        };
      }
    }

    // For any unhandled provider string
    return {
      status: 'NOT_CONFIGURED',
      error: `Unsupported image provider: ${this.name}`,
    };
  }
}

export const imageProvider = new ConfigurableImageProvider();
