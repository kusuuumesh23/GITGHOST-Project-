import { Router } from 'express';
import {
  getAnalyticsSummary,
  getPostAnalytics,
  analyticsQuerySchema,
} from '../controllers/analytics.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { requireAuth, requireBusinessAccess } from '../middleware/auth.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

router.use(requireAuth);

router.get(
  '/businesses/:businessId/analytics',
  requireBusinessAccess([Role.OWNER, Role.ADMIN, Role.MEMBER]),
  validate({ query: analyticsQuerySchema }),
  getAnalyticsSummary
);

router.get(
  '/businesses/:businessId/analytics/posts/:postId',
  requireBusinessAccess([Role.OWNER, Role.ADMIN, Role.MEMBER]),
  getPostAnalytics
);

export default router;
