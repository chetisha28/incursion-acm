import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import {
  archiveEvent,
  createEvent,
  getEvent,
  getEventUpvoteStatus,
  listEvents,
  listPastEvents,
  listUpcomingEvents,
  removeUpvoteEvent,
  resolveEvent,
  updateEvent,
  upvoteEvent
} from '../controllers/event.controller.js';
import { eventListQuerySchema, eventPatchSchema, eventResolveSchema, eventSchema } from '../validators/event.validator.js';

const router = Router();
router.get('/', optionalAuthenticate, validate(eventListQuerySchema, 'query'), listEvents);
router.get('/past', listPastEvents);
router.get('/upcoming', listUpcomingEvents);
router.post('/', authenticate, authorize('CORE', 'ADMIN', 'EXECUTIVE'), validate(eventSchema), createEvent);
router.get('/:id/upvote', optionalAuthenticate, getEventUpvoteStatus);
router.post('/:id/upvote', authenticate, authorize('CORE', 'ADMIN', 'EXECUTIVE'), upvoteEvent);
router.delete('/:id/upvote', authenticate, authorize('CORE', 'ADMIN', 'EXECUTIVE'), removeUpvoteEvent);
router.post('/:id/resolve', authenticate, authorize('CORE', 'ADMIN'), validate(eventResolveSchema), resolveEvent);
router.patch('/:id', authenticate, authorize('CORE', 'ADMIN'), validate(eventPatchSchema), updateEvent);
router.delete('/:id', authenticate, authorize('CORE', 'ADMIN'), archiveEvent);
router.get('/:id', optionalAuthenticate, getEvent);

export default router;
