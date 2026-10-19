import { Router } from 'express';
import { health } from '../controllers/public.controller.js';

const router = Router();
router.get('/health', health);
export default router;
