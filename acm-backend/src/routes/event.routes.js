import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { archiveEvent, createEvent, getEvent, listEvents, listPastEvents, listUpcomingEvents, resolveEvent, updateEvent } from '../controllers/event.controller.js';
import { eventListQuerySchema, eventPatchSchema, eventResolveSchema, eventSchema } from '../validators/event.validator.js';

const router = Router();
router.get('/', optionalAuthenticate, validate(eventListQuerySchema, 'query'), listEvents);
router.get('/past', listPastEvents);
router.get('/upcoming', listUpcomingEvents);
router.post('/', authenticate, authorize('CORE', 'EXECUTIVE'), validate(eventSchema), createEvent);
router.post('/:id/resolve', authenticate, authorize('CORE'), validate(eventResolveSchema), resolveEvent);
router.patch('/:id', authenticate, authorize('CORE'), validate(eventPatchSchema), updateEvent);
router.delete('/:id', authenticate, authorize('CORE'), archiveEvent);
router.get('/:id', optionalAuthenticate, getEvent);

export default router;
