import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { archiveEvent, createEvent, getEvent, listEvents, listPastEvents, listUpcomingEvents, updateEvent } from '../controllers/event.controller.js';
import { eventListQuerySchema, eventPatchSchema, eventSchema } from '../validators/event.validator.js';

const router = Router();
router.get('/', validate(eventListQuerySchema, 'query'), listEvents);
router.get('/past', listPastEvents);
router.get('/upcoming', listUpcomingEvents);
router.post('/', authenticate, authorize('CORE', 'EXECUTIVE'), validate(eventSchema), createEvent);
router.patch('/:id', authenticate, authorize('CORE'), validate(eventPatchSchema), updateEvent);
router.delete('/:id', authenticate, authorize('CORE'), archiveEvent);
router.get('/:id', getEvent);

export default router;
