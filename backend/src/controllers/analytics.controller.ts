import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { analyticsService } from '../services/analytics.service.js';

export const analyticsQuerySchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export async function getAnalyticsSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const summary = await analyticsService.getSummary(req.params.businessId, req.query);
    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (err) {
    next(err);
  }
}

export async function getPostAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const postAnalytics = await analyticsService.getPostAnalytics(req.params.postId);
    res.status(200).json({
      success: true,
      data: postAnalytics,
    });
  } catch (err) {
    next(err);
  }
}
