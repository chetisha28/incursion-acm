import { z } from 'zod';

function normalizeMoney(text, ctx) {
  if (!/^\d+(\.\d{1,2})?$/.test(text)) {
    ctx.addIssue({ code: 'custom', message: 'Amount must be a positive monetary value with at most 2 decimal places' });
    return z.NEVER;
  }
  const [wholeRaw, fractionRaw = ''] = text.split('.');
  const whole = wholeRaw.replace(/^0+(?=\d)/, '');
  const fraction = fractionRaw.padEnd(2, '0');
  if ((whole === '0' && fraction === '00') || whole.length > 10 || (whole.length === 10 && (whole > '9999999999' || fraction > '99'))) {
    ctx.addIssue({ code: 'custom', message: 'Amount must be greater than zero and within the supported range' });
    return z.NEVER;
  }
  return `${whole}.${fraction}`;
}
const amount = z.string().transform((value, ctx) => normalizeMoney(value, ctx));

const fields = {
  amount,
  category: z.string().trim().min(1).max(80),
  transactionDate: z.string().datetime({ offset: true }).transform((value) => new Date(value)),
  description: z.string().trim().min(1).max(5000),
  eventId: z.string().cuid().nullable().optional(),
  receiptUrl: z.string().url().max(2048).refine((value) => new URL(value).protocol === 'https:', 'Receipt URLs must use HTTPS').nullable().optional()
};

export const expenseSchema = z.object(fields).strict();
export const expensePatchSchema = z.object(fields).partial().strict().refine((value) => Object.keys(value).length > 0, 'At least one expense field is required');
export const expenseListQuerySchema = z.object({
  category: z.string().trim().min(1).optional(),
  from: z.string().datetime({ offset: true }).transform((value) => new Date(value)).optional(),
  to: z.string().datetime({ offset: true }).transform((value) => new Date(value)).optional(),
  eventId: z.string().cuid().optional(),
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
}).strict();
