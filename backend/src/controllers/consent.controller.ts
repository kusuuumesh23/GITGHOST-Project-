import { Request, Response, NextFunction } from 'express';
import { consentService } from '../services/consent.service.js';

/** GET /consent - get current user's consent status */
export async function getConsent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const consent = await consentService.getConsent(req.user!.userId);
    res.json({
      success: true,
      data: {
        hasConsent: consent !== null,
        consent,
      },
    });
  } catch (err) {
    next(err);
  }
}

/** POST /consent - give consent */
export async function giveConsent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ipAddress =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const consent = await consentService.giveConsent(req.user!.userId, {
      ipAddress,
      userAgent,
    });

    res.status(201).json({
      success: true,
      data: consent,
    });
  } catch (err) {
    next(err);
  }
}

/** DELETE /consent - revoke consent */
export async function revokeConsent(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await consentService.revokeConsent(req.user!.userId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
