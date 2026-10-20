import { z } from 'zod';

const money = z.string().transform((text, ctx) => {
  if (!/^\d+(\.\d{1,2})?$/.test(text)) {
    ctx.addIssue({ code: 'custom', message: 'Amount must be positive with at most 2 decimal places' });
    return z.NEVER;
  }
  const [wholeRaw, fractionRaw = ''] = text.split('.');
  const whole = wholeRaw.replace(/^0+(?=\d)/, '');
  const fraction = fractionRaw.padEnd(2, '0');
  if ((whole === '0' && fraction === '00') || whole.length > 10 || (whole.length === 10 && (whole > '9999999999' || fraction > '99'))) {
    ctx.addIssue({ code: 'custom', message: 'Amount must be positive and within the supported range' });
    return z.NEVER;
  }
  return `${whole}.${fraction}`;
});

const fields = {
  name: z.string().trim().min(2).max(120),
  period: z.enum(['MONTHLY', 'SEMESTER']),
  startsAt: z.string().datetime({ offset: true }).transform((value) => new Date(value)),
  endsAt: z.string().datetime({ offset: true }).transform((value) => new Date(value)),
  totalAmount: money
};

export const budgetSchema = z.object(fields).strict().superRefine((budget, ctx) => {
  if (budget.endsAt <= budget.startsAt) ctx.addIssue({ code: 'custom', path: ['endsAt'], message: 'End must be later than start' });
});
export const budgetPatchSchema = z.object(fields).partial().strict().superRefine((budget, ctx) => {
  if (!Object.keys(budget).length) ctx.addIssue({ code: 'custom', message: 'At least one budget field is required' });
  if (budget.startsAt && budget.endsAt && budget.endsAt <= budget.startsAt) ctx.addIssue({ code: 'custom', path: ['endsAt'], message: 'End must be later than start' });
});
