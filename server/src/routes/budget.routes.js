import { Router } from 'express';
import { createBudget, getCurrentBudget, listBudgets, updateBudget } from '../controllers/budget.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { budgetPatchSchema, budgetSchema } from '../validators/budget.validator.js';

const router = Router();
router.use(authenticate, authorize('CORE', 'EXECUTIVE'));
router.get('/current', getCurrentBudget);
router.get('/', listBudgets);
router.post('/', authorize('CORE'), validate(budgetSchema), createBudget);
router.patch('/:id', authorize('CORE'), validate(budgetPatchSchema), updateBudget);
export default router;
