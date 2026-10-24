import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  listConnections,
  getAuthUrl,
  handleCallback,
  mockConnect,
  disconnect,
} from '../controllers/social.controller.js';

const router = Router();

router.use(requireAuth);

// GET  /social/connections            → list all connections
router.get('/connections', listConnections);

// GET  /social/auth-url?platform=...  → get OAuth URL
router.get('/auth-url', getAuthUrl);

// POST /social/callback               → handle OAuth code (called from frontend after OAuth)
router.post('/callback', handleCallback);

// POST /social/mock-connect           → simulate OAuth connection (demo mode)
router.post('/mock-connect', mockConnect);

// DELETE /social/connections/:platform → disconnect
router.delete('/connections/:platform', disconnect);

export default router;
