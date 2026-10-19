import { app } from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/prisma.js';

const server = app.listen(env.PORT, () => {
  console.log(JSON.stringify({ level: 'info', message: 'ACM backend listening', port: env.PORT, environment: env.NODE_ENV }));
});

async function shutdown(signal) {
  console.log(JSON.stringify({ level: 'info', message: 'Shutting down', signal }));
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
