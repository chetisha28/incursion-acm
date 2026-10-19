import { Router } from 'express';
import { getDashboard, getDashboardActivity, getDashboardConflicts, getDashboardSummary } from '../controllers/core.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = Router();
router.use(authenticate, authorize('CORE'));
router.get('/dashboard', getDashboard);
router.get('/dashboard/summary', getDashboardSummary);
router.get('/dashboard/conflicts', getDashboardConflicts);
router.get('/dashboard/recent-activity', getDashboardActivity);
export default router;
