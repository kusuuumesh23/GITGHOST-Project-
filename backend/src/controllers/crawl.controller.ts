import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { crawlService } from '../services/crawl.service.js';

export const startCrawlSchema = z.object({
  websiteUrl: z.string().url('Must be a valid HTTP or HTTPS URL').optional(),
});

export const confirmProfileSchema = z.object({
  name: z.string().min(1).optional(),
  industry: z.string().optional(),
  description: z.string().optional(),
  targetAudience: z.string().optional(),
  brandTone: z.string().optional(),
  location: z.string().optional(),
});

export async function startCrawl(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await crawlService.startCrawl(req.params.businessId, req.body.websiteUrl);
    res.status(202).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function getCrawlStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const status = await crawlService.getCrawlStatus(req.params.businessId);
    res.status(200).json({
      success: true,
      data: status,
    });
  } catch (err) {
    next(err);
  }
}

export async function retryCrawl(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await crawlService.retryCrawl(req.params.businessId);
    res.status(202).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function confirmProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const updated = await crawlService.confirmExtractedProfile(req.params.businessId, req.body);
    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}
