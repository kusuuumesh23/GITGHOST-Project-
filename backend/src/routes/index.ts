import { Router } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { env } from '../config/env.js';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import businessRoutes from './business.routes.js';
import crawlRoutes from './crawl.routes.js';
import generationRoutes from './generation.routes.js';
import postRoutes from './post.routes.js';
import analyticsRoutes from './analytics.routes.js';
import settingsRoutes from './settings.routes.js';
import consentRoutes from './consent.routes.js';
import socialRoutes from './social.routes.js';
import oauthRoutes from './oauth.routes.js';
import { NotFoundError } from '../utils/errors.js';

const router = Router();

// Health
router.use(healthRoutes);

// Auth & OAuth
router.use('/auth', authRoutes);
router.use('/auth', oauthRoutes);

// Businesses
router.use('/businesses', businessRoutes);

// Website Crawl & Profile Extraction
router.use('/businesses', crawlRoutes);

// Post Generations
router.use(generationRoutes);

// Posts CRUD
router.use(postRoutes);

// Analytics
router.use(analyticsRoutes);

// Settings
router.use(settingsRoutes);

// User Consent
router.use('/consent', consentRoutes);

// Social Account Connections
router.use('/social', socialRoutes);

// Static asset delivery for generated/stored images
router.get('/assets/:fileName', (req, res, next) => {
  const safeName = path.basename(req.params.fileName);
  const filePath = path.resolve(process.cwd(), env.LOCAL_STORAGE_DIR, safeName);

  if (!fs.existsSync(filePath)) {
    return next(new NotFoundError('Asset not found'));
  }

  res.sendFile(filePath);
});

export default router;
