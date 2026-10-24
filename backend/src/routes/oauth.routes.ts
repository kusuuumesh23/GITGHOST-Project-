import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  linkedInStart,
  linkedInCallbackHandler,
  xStart,
  xCallbackHandler,
  disconnectHandler,
} from '../controllers/oauth.controller.js';

const router = Router();

// LinkedIn OAuth — start needs auth (we need userId for state storage)
router.get('/linkedin/start', requireAuth, linkedInStart);

// LinkedIn callback — no requireAuth here because the redirect comes from LinkedIn (no Bearer token)
// The userId is recovered from the state param in the DB
router.get('/linkedin/callback', linkedInCallbackHandler);

// X OAuth
router.get('/x/start', requireAuth, xStart);
router.get('/x/callback', xCallbackHandler);

// Disconnect a platform
router.delete('/disconnect/:platform', requireAuth, disconnectHandler);

export default router;
