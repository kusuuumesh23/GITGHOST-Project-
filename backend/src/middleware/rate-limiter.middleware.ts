import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { RateLimitError } from '../utils/errors.js';

export const standardRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  handler: () => {
    throw new RateLimitError('Too many requests from this IP, please try again later');
  },
});

export const crawlRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.CRAWL_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: () => {
    throw new RateLimitError('Website crawl rate limit reached, please try again in a few minutes');
  },
});

export const generationRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.GENERATION_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: () => {
    throw new RateLimitError('AI generation rate limit reached, please try again shortly');
  },
});
