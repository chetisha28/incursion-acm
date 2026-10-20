import { Router } from 'express';
import { archiveExpense, createExpense, getExpense, listExpenses, updateExpense } from '../controllers/expense.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { expenseListQuerySchema, expensePatchSchema, expenseSchema } from '../validators/expense.validator.js';

const router = Router();
router.use(authenticate);
router.get('/', authorize('CORE', 'EXECUTIVE'), validate(expenseListQuerySchema, 'query'), listExpenses);
router.get('/:id', authorize('CORE', 'EXECUTIVE'), getExpense);
router.post('/', authorize('EXECUTIVE', 'CORE'), validate(expenseSchema), createExpense);
router.patch('/:id', authorize('CORE'), validate(expensePatchSchema), updateExpense);
router.delete('/:id', authorize('CORE'), archiveExpense);
export default router;
