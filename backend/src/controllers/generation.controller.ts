import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { generationService } from '../services/generation.service.js';
import { contentGoals } from '../providers/nvidia-nim/deepseek.interface.js';

export const createGenerationSchema = z.object({
  contentGoal: z.enum(contentGoals).default('INCREASE_LOCAL_AWARENESS'),
  offerOrPromotion: z.string().optional(),
  platform: z.string().default('INSTAGRAM'),
  language: z.string().default('en'),
  additionalInstructions: z.string().optional(),
  idempotencyKey: z.string().optional(),
  allowMultipleDailyPosts: z.boolean().default(false),
});

export const regenerateImageSchema = z.object({
  customVisualPrompt: z.string().optional(),
});

export async function createGeneration(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await generationService.startGenerationJob(req.params.businessId, req.body);
    const status = (result as any).alreadyExists ? 200 : 202;
    res.status(status).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function getGenerationJob(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const job = await generationService.getJobStatus(req.params.jobId);
    res.status(200).json({
      success: true,
      data: job,
    });
  } catch (err) {
    next(err);
  }
}

export async function retryGenerationJob(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await generationService.retryJob(req.params.jobId);
    res.status(202).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function regenerateCaption(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const updatedPost = await generationService.regenerateCaption(req.params.postId);
    res.status(200).json({
      success: true,
      data: updatedPost,
    });
  } catch (err) {
    next(err);
  }
}

export async function regenerateImage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const updatedPost = await generationService.regenerateImage(
      req.params.postId,
      req.body.customVisualPrompt
    );
    res.status(200).json({
      success: true,
      data: updatedPost,
    });
  } catch (err) {
    next(err);
  }
}
