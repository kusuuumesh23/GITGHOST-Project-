import { Request, Response, NextFunction } from 'express';
import {
  linkedInStartOAuth,
  linkedInCallback,
  xStartOAuth,
  xCallback,
  disconnectPlatform,
} from '../services/oauth.service.js';
import { SocialPlatform } from '@prisma/client';
import { env } from '../config/env.js';

/** GET /auth/linkedin/start — redirect user to LinkedIn OAuth page */
export async function linkedInStart(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { authUrl } = await linkedInStartOAuth(req.user!.userId);
    if (req.headers.accept?.includes('application/json') || req.query.format === 'json') {
      res.json({ success: true, data: { authUrl } });
      return;
    }
    res.redirect(authUrl);
  } catch (err) {
    next(err);
  }
}

/** GET /auth/linkedin/callback — LinkedIn redirects here with code + state */
export async function linkedInCallbackHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { code, state, error } = req.query as Record<string, string>;

    if (error) {
      return res.redirect(`${env.FRONTEND_URL}/connect?error=linkedin_denied`) as unknown as void;
    }

    if (!code || !state) {
      return res.redirect(`${env.FRONTEND_URL}/connect?error=invalid_callback`) as unknown as void;
    }

    await linkedInCallback(code, state);
    res.redirect(`${env.FRONTEND_URL}/connect?connected=linkedin`);
  } catch (err) {
    next(err);
  }
}

/** GET /auth/x/start — redirect user to X OAuth page */
export async function xStart(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { authUrl } = await xStartOAuth(req.user!.userId);
    if (req.headers.accept?.includes('application/json') || req.query.format === 'json') {
      res.json({ success: true, data: { authUrl } });
      return;
    }
    res.redirect(authUrl);
  } catch (err) {
    next(err);
  }
}

/** GET /auth/x/callback — X redirects here with code + state */
export async function xCallbackHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { code, state, error } = req.query as Record<string, string>;

    if (error) {
      return res.redirect(`${env.FRONTEND_URL}/connect?error=x_denied`) as unknown as void;
    }

    if (!code || !state) {
      return res.redirect(`${env.FRONTEND_URL}/connect?error=invalid_callback`) as unknown as void;
    }

    await xCallback(code, state);
    res.redirect(`${env.FRONTEND_URL}/connect?connected=x`);
  } catch (err) {
    next(err);
  }
}

/** DELETE /auth/disconnect/:platform */
export async function disconnectHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const platform = req.params.platform?.toUpperCase() as SocialPlatform;
    await disconnectPlatform(req.user!.userId, platform);
    res.json({ success: true, data: { disconnected: platform } });
  } catch (err) {
    next(err);
  }
}
