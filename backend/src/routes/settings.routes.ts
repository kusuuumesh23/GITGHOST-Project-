import { Router } from 'express';
import { getSettings, updateSettings, updateSettingsSchema } from '../controllers/settings.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { requireAuth, requireBusinessAccess } from '../middleware/auth.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

router.use(requireAuth);

router.get(
  '/businesses/:businessId/settings',
  requireBusinessAccess([Role.OWNER, Role.ADMIN, Role.MEMBER]),
  getSettings
);

router.patch(
  '/businesses/:businessId/settings',
  requireBusinessAccess([Role.OWNER, Role.ADMIN]),
  validate({ body: updateSettingsSchema }),
  updateSettings
);

export default router;
