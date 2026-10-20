import { z } from 'zod';
import { assertTimezone } from '../utils/dateUtils.js';

const isoDate = z.string().datetime({ offset: true }).transform((value) => new Date(value));
const timezone = z.string().min(1).max(100).refine(assertTimezone, 'Timezone must be a valid IANA timezone');

const statusEnum = z.enum(['DRAFT', 'PUBLISHED', 'CANCELLED', 'IN_REVIEW', 'APPROVED', 'REJECTED'])
  .default('DRAFT')
  .transform((s) => {
    if (s === 'IN_REVIEW') return 'DRAFT';
    if (s === 'APPROVED') return 'PUBLISHED';
    if (s === 'REJECTED') return 'CANCELLED';
    return s;
  });

const eventFields = {
  title: z.string()
    .trim()
    .min(3, 'Event title must be at least 3 characters')
    .max(160, 'Event title cannot exceed 160 characters')
    .refine((val) => !/^[\d\s\W]+$/.test(val), 'Event title must contain descriptive text, not only symbols or numbers'),
  description: z.string()
    .trim()
    .min(10, 'Event description must be at least 10 characters')
    .max(5000, 'Event description cannot exceed 5000 characters'),
  category: z.string()
    .trim()
    .min(2, 'Category must be at least 2 characters')
    .max(80, 'Category cannot exceed 80 characters'),
  startsAt: isoDate,
  endsAt: isoDate,
  timezone: timezone.default('UTC'),
  venue: z.string()
    .trim()
    .min(2, 'Venue must be at least 2 characters')
    .max(200, 'Venue cannot exceed 200 characters'),
  expectedAudience: z.string()
    .trim()
    .min(2, 'Expected audience must be at least 2 characters')
    .max(300, 'Expected audience cannot exceed 300 characters'),
  organizer: z.string()
    .trim()
    .min(2, 'Organizer must be at least 2 characters')
    .max(160, 'Organizer cannot exceed 160 characters'),
  campusRelevant: z.boolean().default(false),
  status: statusEnum,
  resolutionNotes: z.string().trim().max(2000).optional(),
  allowConflict: z.boolean().optional()
};

export const eventSchema = z.object(eventFields).strict().superRefine((event, ctx) => {
  if (event.endsAt <= event.startsAt) {
    ctx.addIssue({ code: 'custom', path: ['endsAt'], message: 'End date and time must be later than start date and time' });
  }
  const durationMs = event.endsAt.getTime() - event.startsAt.getTime();
  if (durationMs > 14 * 24 * 60 * 60 * 1000) {
    ctx.addIssue({ code: 'custom', path: ['endsAt'], message: 'Event duration cannot exceed 14 consecutive days' });
  }
});

export const eventPatchSchema = z.object(eventFields).partial().strict().superRefine((event, ctx) => {
  if (!Object.keys(event).some((key) => key !== 'allowConflict')) {
    ctx.addIssue({ code: 'custom', message: 'At least one event field is required' });
  }
  if (event.startsAt && event.endsAt && event.endsAt <= event.startsAt) {
    ctx.addIssue({ code: 'custom', path: ['endsAt'], message: 'End date and time must be later than start date and time' });
  }
  if (event.startsAt && event.endsAt) {
    const durationMs = event.endsAt.getTime() - event.startsAt.getTime();
    if (durationMs > 14 * 24 * 60 * 60 * 1000) {
      ctx.addIssue({ code: 'custom', path: ['endsAt'], message: 'Event duration cannot exceed 14 consecutive days' });
    }
  }
});

export const eventResolveSchema = z.object({
  status: statusEnum.default('PUBLISHED'),
  resolutionNotes: z.string().trim().max(2000).optional(),
  allowConflict: z.boolean().optional(),
  venue: z.string().trim().min(2).max(200).optional(),
  startsAt: isoDate.optional(),
  endsAt: isoDate.optional()
}).strict().superRefine((data, ctx) => {
  if (data.startsAt && data.endsAt && data.endsAt <= data.startsAt) {
    ctx.addIssue({ code: 'custom', path: ['endsAt'], message: 'End date and time must be later than start date and time' });
  }
});

export const eventListQuerySchema = z.object({
  category: z.string().trim().min(1).optional(),
  from: isoDate.optional(),
  to: isoDate.optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'CANCELLED', 'ALL', 'IN_REVIEW', 'APPROVED', 'REJECTED'])
    .optional()
    .transform((s) => {
      if (!s) return s;
      if (s === 'IN_REVIEW') return 'DRAFT';
      if (s === 'APPROVED') return 'PUBLISHED';
      if (s === 'REJECTED') return 'CANCELLED';
      return s;
    }),
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(['startsAt', 'createdAt', 'title']).default('startsAt'),
  order: z.enum(['asc', 'desc']).default('asc')
}).strict().superRefine((query, ctx) => {
  if (query.from && query.to && query.to <= query.from) {
    ctx.addIssue({ code: 'custom', path: ['to'], message: 'to must be later than from' });
  }
});

