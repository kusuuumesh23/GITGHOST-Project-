import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { socialConnectionService } from '../services/social.service.js';
import { SocialPlatform } from '@prisma/client';

const platformSchema = z.object({
  platform: z.enum(['LINKEDIN', 'X', 'INSTAGRAM', 'FACEBOOK']),
});

const callbackSchema = z.object({
  code: z.string().min(1),
  platform: z.enum(['LINKEDIN', 'X', 'INSTAGRAM', 'FACEBOOK']),
  displayName: z.string().optional(),
});

const mockConnectSchema = z.object({
  platform: z.enum(['LINKEDIN', 'X', 'INSTAGRAM', 'FACEBOOK']),
  displayName: z.string().optional(),
});

/** GET /social/connections - list all connections for the user */
export async function listConnections(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const connections = await socialConnectionService.listConnections(req.user!.userId);
    res.json({ success: true, data: connections });
  } catch (err) {
    next(err);
  }
}

/** GET /social/auth-url?platform=LINKEDIN&callbackUrl=... - get OAuth URL */
export async function getAuthUrl(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { platform } = platformSchema.parse({ platform: req.query.platform });
    const callbackUrl =
      (req.query.callbackUrl as string) ||
      `${req.protocol}://${req.get('host')}/api/v1/social/callback`;

    const result = await socialConnectionService.getAuthUrl(
      req.user!.userId,
      platform as SocialPlatform,
      callbackUrl,
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

/** POST /social/callback - handle OAuth code exchange */
export async function handleCallback(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { code, platform, displayName } = callbackSchema.parse(req.body);
    const connection = await socialConnectionService.handleCallback(
      req.user!.userId,
      platform as SocialPlatform,
      code,
      displayName,
    );
    res.json({ success: true, data: connection });
  } catch (err) {
    next(err);
  }
}

/** POST /social/mock-connect - simulate OAuth connection (demo mode) */
export async function mockConnect(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { platform, displayName } = mockConnectSchema.parse(req.body);
    const connection = await socialConnectionService.mockConnect(
      req.user!.userId,
      platform as SocialPlatform,
      displayName,
    );
    res.json({ success: true, data: connection });
  } catch (err) {
    next(err);
  }
}

/** DELETE /social/connections/:platform - disconnect a platform */
export async function disconnect(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { platform } = platformSchema.parse({ platform: req.params.platform });
    const result = await socialConnectionService.disconnect(
      req.user!.userId,
      platform as SocialPlatform,
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
