import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { createUserSchema, updateUserSchema } from '../validators/user.validator.js';
import { createUser, deleteUser, getUser, listUsers, updateUser } from '../controllers/user.controller.js';

const router = Router();

router.use(authenticate, authorize('CORE', 'ADMIN'));

router.get('/', listUsers);
router.post('/', validate(createUserSchema), createUser);
router.get('/:id', getUser);
router.patch('/:id', validate(updateUserSchema), updateUser);
router.delete('/:id', deleteUser);

export default router;
