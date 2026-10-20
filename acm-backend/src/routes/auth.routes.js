import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { changePasswordSchema, loginSchema } from '../validators/auth.validator.js';
import { changePassword, coreLogin, executiveLogin, logout, me } from '../controllers/auth.controller.js';

const router = Router();
const limiter = rateLimit({ windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS, limit: env.AUTH_RATE_LIMIT_MAX, standardHeaders: 'draft-8', legacyHeaders: false, message: { success: false, message: 'Too many login attempts. Try again later.', code: 'RATE_LIMITED' } });

router.post('/executive/login', limiter, validate(loginSchema), executiveLogin);
router.post('/core/login', limiter, validate(loginSchema), coreLogin);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, me);
router.post('/change-password', authenticate, validate(changePasswordSchema), changePassword);

export default router;
