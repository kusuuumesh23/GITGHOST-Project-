import { Router } from 'express';
import {
  listBusinesses,
  createBusiness,
  getBusiness,
  updateBusiness,
  deleteBusiness,
  createBusinessSchema,
  updateBusinessSchema,
} from '../controllers/business.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { requireAuth, requireBusinessAccess } from '../middleware/auth.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

router.use(requireAuth);

router.get('/', listBusinesses);
router.post('/', validate({ body: createBusinessSchema }), createBusiness);

router.get('/:businessId', requireBusinessAccess([Role.OWNER, Role.ADMIN, Role.MEMBER]), getBusiness);
router.patch(
  '/:businessId',
  requireBusinessAccess([Role.OWNER, Role.ADMIN]),
  validate({ body: updateBusinessSchema }),
  updateBusiness
);
router.delete('/:businessId', requireBusinessAccess([Role.OWNER]), deleteBusiness);

export default router;
