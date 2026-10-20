import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  CORS_ORIGIN: z.string().min(1),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must contain at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('1h'),
  JWT_ISSUER: z.string().default('acm-conflict-manager'),
  JWT_AUDIENCE: z.string().default('acm-api'),
  AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),
  CORE_BOOTSTRAP_EMAIL: z.string().email().optional().or(z.literal('')),
  CORE_BOOTSTRAP_PASSWORD: z.string().min(12).optional().or(z.literal('')),
  CORE_BOOTSTRAP_NAME: z.string().default('ACM Core Administrator'),
  SEED_DEMO: z.string().default('false'),
  DEMO_EXECUTIVE_EMAIL: z.string().email().optional().or(z.literal('')),
  DEMO_EXECUTIVE_PASSWORD: z.string().min(12).optional().or(z.literal('')),
  DEMO_CORE_EMAIL: z.string().email().optional().or(z.literal('')),
  DEMO_CORE_PASSWORD: z.string().min(12).optional().or(z.literal(''))
}).superRefine((env, ctx) => {
  if (Boolean(env.CORE_BOOTSTRAP_EMAIL) !== Boolean(env.CORE_BOOTSTRAP_PASSWORD)) {
    ctx.addIssue({ code: 'custom', message: 'Set both CORE_BOOTSTRAP_EMAIL and CORE_BOOTSTRAP_PASSWORD, or neither' });
  }
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  const details = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
  throw new Error(`Invalid environment configuration: ${details}`);
}

export const env = {
  ...parsed.data,
  SEED_DEMO: parsed.data.SEED_DEMO.toLowerCase() === 'true',
  CORS_ORIGINS: parsed.data.CORS_ORIGIN.split(',').map((origin) => origin.trim().replace(/\/+$/, '')).filter(Boolean)
};
