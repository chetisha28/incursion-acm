import bcrypt from 'bcrypt';
import { prisma } from '../src/config/prisma.js';
import { env } from '../src/config/env.js';

async function createIfMissing({ email, password, name, role }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role !== role) throw new Error(`Configured account ${email} exists with a different role; refusing to change it`);
    console.log(`Account already exists: ${email}`);
    return;
  }
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({ data: { email, name, passwordHash, role } });
  console.log(`Created ${role} account: ${email}`);
}

try {
  if (env.CORE_BOOTSTRAP_EMAIL && env.CORE_BOOTSTRAP_PASSWORD) {
    await createIfMissing({ email: env.CORE_BOOTSTRAP_EMAIL.toLowerCase(), password: env.CORE_BOOTSTRAP_PASSWORD, name: env.CORE_BOOTSTRAP_NAME, role: 'CORE' });
  }
  if (env.SEED_DEMO) {
    const configured = [env.DEMO_EXECUTIVE_EMAIL, env.DEMO_EXECUTIVE_PASSWORD, env.DEMO_CORE_EMAIL, env.DEMO_CORE_PASSWORD];
    if (configured.some((value) => !value)) throw new Error('SEED_DEMO=true requires both demo emails and passwords (12+ characters)');
    await createIfMissing({ email: env.DEMO_EXECUTIVE_EMAIL.toLowerCase(), password: env.DEMO_EXECUTIVE_PASSWORD, name: 'Demo Executive', role: 'EXECUTIVE' });
    await createIfMissing({ email: env.DEMO_CORE_EMAIL.toLowerCase(), password: env.DEMO_CORE_PASSWORD, name: 'Demo Core Member', role: 'CORE' });
  }
  if (!env.CORE_BOOTSTRAP_EMAIL && !env.SEED_DEMO) console.log('No account seeds configured; set CORE_BOOTSTRAP_EMAIL and CORE_BOOTSTRAP_PASSWORD for one-time Core bootstrap.');
} finally {
  await prisma.$disconnect();
}
