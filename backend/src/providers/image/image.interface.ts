export type ImageStatus = 'GENERATED' | 'NOT_CONFIGURED' | 'FAILED';

export interface ImageGenerationResult {
  status: ImageStatus;
  storagePath?: string;
  publicUrl?: string;
  mimeType?: string;
  metadata?: Record<string, unknown>;
  error?: string;
}

export interface IImageProvider {
  name: string;
  isConfigured(): boolean;
  generateImage(prompt: string, options?: { width?: number; height?: number }): Promise<ImageGenerationResult>;
}
