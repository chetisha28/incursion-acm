import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { createWorkAssignmentSchema, updateWorkAssignmentSchema } from '../validators/user.validator.js';
import {
  createWorkAssignment,
  deleteWorkAssignment,
  listWorkAssignments,
  updateWorkAssignment
} from '../controllers/work.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize('CORE', 'ADMIN', 'EXECUTIVE'), listWorkAssignments);
router.post('/', authorize('CORE', 'ADMIN'), validate(createWorkAssignmentSchema), createWorkAssignment);
router.patch('/:id', authorize('CORE', 'ADMIN', 'EXECUTIVE'), validate(updateWorkAssignmentSchema), updateWorkAssignment);
router.delete('/:id', authorize('CORE', 'ADMIN'), deleteWorkAssignment);

export default router;
