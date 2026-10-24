import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { getConsent, giveConsent, revokeConsent } from '../controllers/consent.controller.js';

const router = Router();

router.use(requireAuth);

// GET  /consent     → get consent status
router.get('/', getConsent);

// POST /consent     → give consent
router.post('/', giveConsent);

// DELETE /consent   → revoke consent
router.delete('/', revokeConsent);

export default router;
