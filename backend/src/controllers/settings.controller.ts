import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { settingsService } from '../services/settings.service.js';

export const updateSettingsSchema = z.object({
  timezone: z.string().optional(),
  defaultPlatform: z.string().optional(),
  defaultLanguage: z.string().optional(),
  notificationsEnabled: z.boolean().optional(),
  dailyReminderTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Must be in HH:MM format').optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
});

export async function getSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const settings = await settingsService.getByBusinessId(req.params.businessId);
    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const updated = await settingsService.update(req.params.businessId, req.body);
    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}
