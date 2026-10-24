import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { standardRateLimiter } from './middleware/rate-limiter.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';
import { NotFoundError } from './utils/errors.js';
import routes from './routes/index.js';
import oauthRoutes from './routes/oauth.routes.js';

export const app = express();

// Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS configuration
app.use(
  cors({
    origin: [env.FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Body Parsing
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Global Rate Limiting
app.use(standardRateLimiter);

// API Version 1 Routes
app.use('/api/v1', routes);

// Direct root /auth alias for OAuth redirects (e.g. /auth/linkedin/callback)
app.use('/auth', oauthRoutes);

// Catch-all 404 handler for unknown endpoints
app.use((_req, _res, next) => {
  next(new NotFoundError('The requested endpoint does not exist'));
});

// Central Error Handling Middleware
app.use(errorHandler);
