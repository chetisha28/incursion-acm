import { Router } from 'express';
import authRoutes from './auth.routes.js';
import publicRoutes from './public.routes.js';
import eventRoutes from './event.routes.js';
import coreRoutes from './core.routes.js';
import expenseRoutes from './expense.routes.js';
import budgetRoutes from './budget.routes.js';

const router = Router();
router.use('/auth', authRoutes);
router.use('/', publicRoutes);
router.use('/events', eventRoutes);
router.use('/core', coreRoutes);
router.use('/expenses', expenseRoutes);
router.use('/budgets', budgetRoutes);
export default router;
