import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { businessService } from '../services/business.service.js';

export const createBusinessSchema = z.object({
  name: z.string().min(1, 'Business name is required'),
  websiteUrl: z.string().url('Must be a valid URL').optional(),
  industry: z.string().optional(),
  description: z.string().optional(),
});

export const updateBusinessSchema = z.object({
  name: z.string().min(1).optional(),
  websiteUrl: z.string().url().optional(),
  industry: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  brandTone: z.string().optional(),
  targetAudience: z.string().optional(),
  preferredLanguage: z.string().optional(),
});

export async function listBusinesses(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const list = await businessService.listForUser(req.user!.userId);
    res.status(200).json({
      success: true,
      data: list,
    });
  } catch (err) {
    next(err);
  }
}

export async function createBusiness(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const business = await businessService.create(req.user!.userId, req.body);
    res.status(201).json({
      success: true,
      data: business,
    });
  } catch (err) {
    next(err);
  }
}

export async function getBusiness(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const business = await businessService.getById(req.params.businessId);
    res.status(200).json({
      success: true,
      data: business,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateBusiness(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const updated = await businessService.update(req.params.businessId, req.body);
    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteBusiness(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await businessService.delete(req.params.businessId, req.user!.userId);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
