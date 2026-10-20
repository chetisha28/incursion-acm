import { Router } from 'express';
import authRoutes from './auth.routes.js';
import publicRoutes from './public.routes.js';
import eventRoutes from './event.routes.js';
import coreRoutes from './core.routes.js';
import expenseRoutes from './expense.routes.js';
import budgetRoutes from './budget.routes.js';
import userRoutes from './user.routes.js';
import workRoutes from './work.routes.js';

const router = Router();
router.use('/auth', authRoutes);
router.use('/', publicRoutes);
router.use('/events', eventRoutes);
router.use('/core', coreRoutes);
router.use('/expenses', expenseRoutes);
router.use('/budgets', budgetRoutes);
router.use('/users', userRoutes);
router.use('/work-assignments', workRoutes);

export default router;
