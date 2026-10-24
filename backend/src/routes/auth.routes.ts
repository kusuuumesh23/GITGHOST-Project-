import { Router } from 'express';
import { register, login, getCurrentUser, registerSchema, loginSchema } from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/register', validate({ body: registerSchema }), register);
router.post('/login', validate({ body: loginSchema }), login);
router.get('/me', requireAuth, getCurrentUser);

export default router;
