import { Router } from 'express';
import {
  createGeneration,
  getGenerationJob,
  retryGenerationJob,
  regenerateCaption,
  regenerateImage,
  createGenerationSchema,
  regenerateImageSchema,
} from '../controllers/generation.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { requireAuth, requireBusinessAccess } from '../middleware/auth.middleware.js';
import { generationRateLimiter } from '../middleware/rate-limiter.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

router.use(requireAuth);

router.post(
  '/businesses/:businessId/generations',
  requireBusinessAccess([Role.OWNER, Role.ADMIN, Role.MEMBER]),
  generationRateLimiter,
  validate({ body: createGenerationSchema }),
  createGeneration
);

router.get('/generations/:jobId', getGenerationJob);
router.post('/generations/:jobId/retry', generationRateLimiter, retryGenerationJob);

router.post('/posts/:postId/regenerate-caption', generationRateLimiter, regenerateCaption);
router.post(
  '/posts/:postId/regenerate-image',
  generationRateLimiter,
  validate({ body: regenerateImageSchema }),
  regenerateImage
);

export default router;
