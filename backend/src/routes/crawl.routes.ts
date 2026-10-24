import { Router } from 'express';
import {
  startCrawl,
  getCrawlStatus,
  retryCrawl,
  confirmProfile,
  startCrawlSchema,
  confirmProfileSchema,
} from '../controllers/crawl.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { requireAuth, requireBusinessAccess } from '../middleware/auth.middleware.js';
import { crawlRateLimiter } from '../middleware/rate-limiter.middleware.js';
import { Role } from '@prisma/client';

const router = Router({ mergeParams: true });

router.use(requireAuth);

router.post(
  '/:businessId/website-crawl',
  requireBusinessAccess([Role.OWNER, Role.ADMIN]),
  crawlRateLimiter,
  validate({ body: startCrawlSchema }),
  startCrawl
);

router.get(
  '/:businessId/website-crawl',
  requireBusinessAccess([Role.OWNER, Role.ADMIN, Role.MEMBER]),
  getCrawlStatus
);

router.post(
  '/:businessId/website-crawl/retry',
  requireBusinessAccess([Role.OWNER, Role.ADMIN]),
  crawlRateLimiter,
  retryCrawl
);

router.patch(
  '/:businessId/profile',
  requireBusinessAccess([Role.OWNER, Role.ADMIN]),
  validate({ body: confirmProfileSchema }),
  confirmProfile
);

export default router;
