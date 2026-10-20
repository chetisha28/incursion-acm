import { z } from 'zod';

const isoDate = z.string().datetime({ offset: true }).transform((value) => new Date(value));

export const createUserSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().email('Invalid email address').max(254).transform((v) => v.toLowerCase()),
  role: z.enum(['EXECUTIVE', 'CORE', 'ADMIN']).default('EXECUTIVE'),
  title: z.string().trim().max(100).optional(),
  department: z.string().trim().max(100).optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(200).optional(),
  mustChangePassword: z.boolean().optional()
}).strict();

export const updateUserSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100).optional(),
  role: z.enum(['EXECUTIVE', 'CORE', 'ADMIN']).optional(),
  title: z.string().trim().max(100).optional().nullable(),
  department: z.string().trim().max(100).optional().nullable(),
  isActive: z.boolean().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(200).optional(),
  mustChangePassword: z.boolean().optional()
}).strict();

export const createWorkAssignmentSchema = z.object({
  title: z.string().trim().min(2, 'Title must be at least 2 characters').max(200),
  description: z.string().trim().max(2000).optional().nullable(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  dueDate: isoDate.optional().nullable(),
  assigneeId: z.string().trim().min(1, 'Assignee is required'),
  eventId: z.string().trim().optional().nullable()
}).strict();

export const updateWorkAssignmentSchema = z.object({
  title: z.string().trim().min(2).max(200).optional(),
  description: z.string().trim().max(2000).optional().nullable(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: isoDate.optional().nullable(),
  assigneeId: z.string().trim().min(1).optional(),
  eventId: z.string().trim().optional().nullable()
}).strict();
