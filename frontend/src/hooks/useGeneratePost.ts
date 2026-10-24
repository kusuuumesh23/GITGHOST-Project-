import { useState } from 'react';
import { services } from '../services/index.js';
import { Post, GenerationRequest } from '../types/index.js';

export function useGeneratePost() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const generate = async (businessId: string, req: GenerationRequest): Promise<Post | null> => {
    setIsGenerating(true);
    setProgress(15);
    setError(null);

    try {
      const response = await services.generation.generateToday(businessId, req);

      // If mock or already finished
      if (response.post) {
        setProgress(100);
        setIsGenerating(false);
        return response.post;
      }

      // If async job was queued
      if (response.jobId) {
        const jobId = response.jobId;
        // Poll for completion
        let attempts = 0;
        while (attempts < 30) {
          await new Promise(r => setTimeout(r, 1500));
          attempts += 1;
          const status = await services.generation.pollJob(jobId);
          setProgress(status.progress || 50);

          if (status.status === 'COMPLETED' && status.post) {
            setIsGenerating(false);
            setProgress(100);
            return status.post;
          }

          if (status.status === 'FAILED') {
            throw new Error(status.errorMessage || 'Generation failed');
          }
        }
      }

      setIsGenerating(false);
      return null;
    } catch (err: unknown) {
      setError(err as Error);
      setIsGenerating(false);
      throw err;
    }
  };

  const regenerateCaption = async (postId: string): Promise<Post> => {
    setIsGenerating(true);
    try {
      const updated = await services.generation.regenerateCaption(postId);
      setIsGenerating(false);
      return updated;
    } catch (err: unknown) {
      setIsGenerating(false);
      throw err;
    }
  };

  const regenerateImage = async (postId: string, visualPrompt?: string): Promise<Post> => {
    setIsGenerating(true);
    try {
      const updated = await services.generation.regenerateImage(postId, visualPrompt);
      setIsGenerating(false);
      return updated;
    } catch (err: unknown) {
      setIsGenerating(false);
      throw err;
    }
  };

  return {
    generate,
    regenerateCaption,
    regenerateImage,
    isGenerating,
    progress,
    error,
  };
}
