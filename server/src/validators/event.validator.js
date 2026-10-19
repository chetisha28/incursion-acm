import { z } from 'zod';
import { assertTimezone } from '../utils/dateUtils.js';

const isoDate = z.string().datetime({ offset: true }).transform((value) => new Date(value));
const timezone = z.string().min(1).max(100).refine(assertTimezone, 'Timezone must be a valid IANA timezone');

const eventFields = {
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().min(1).max(10000),
  category: z.string().trim().min(1).max(80),
  startsAt: isoDate,
  endsAt: isoDate,
  timezone: timezone.default('UTC'),
  venue: z.string().trim().min(1).max(200),
  expectedAudience: z.string().trim().min(1).max(300),
  organizer: z.string().trim().min(1).max(160),
  campusRelevant: z.boolean().default(false),
  status: z.enum(['DRAFT', 'PUBLISHED', 'CANCELLED']).default('DRAFT'),
  allowConflict: z.boolean().optional()
};

export const eventSchema = z.object(eventFields).strict().superRefine((event, ctx) => {
  if (event.endsAt <= event.startsAt) ctx.addIssue({ code: 'custom', path: ['endsAt'], message: 'End date and time must be later than start date and time' });
});

export const eventPatchSchema = z.object(eventFields).partial().strict().superRefine((event, ctx) => {
  if (!Object.keys(event).some((key) => key !== 'allowConflict')) ctx.addIssue({ code: 'custom', message: 'At least one event field is required' });
  if (event.startsAt && event.endsAt && event.endsAt <= event.startsAt) {
    ctx.addIssue({ code: 'custom', path: ['endsAt'], message: 'End date and time must be later than start date and time' });
  }
});

export const eventListQuerySchema = z.object({
  category: z.string().trim().min(1).optional(),
  from: isoDate.optional(),
  to: isoDate.optional(),
  status: z.enum(['PUBLISHED']).optional(),
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(['startsAt', 'createdAt', 'title']).default('startsAt'),
  order: z.enum(['asc', 'desc']).default('asc')
}).strict().superRefine((query, ctx) => {
  if (query.from && query.to && query.to <= query.from) ctx.addIssue({ code: 'custom', path: ['to'], message: 'to must be later than from' });
});
