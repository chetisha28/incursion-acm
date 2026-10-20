import { app } from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/prisma.js';

const server = app.listen(env.PORT, () => {
  console.log(`\n======================================================`);
  console.log(`ACM Backend Server is ONLINE & READY`);
  console.log(`URL: http://localhost:${env.PORT}`);
  console.log(`Health: http://localhost:${env.PORT}/api/health`);
  console.log(`Environment: ${env.NODE_ENV}`);
  console.log(`======================================================\n`);
  console.log(JSON.stringify({ level: 'info', message: 'ACM backend listening', port: env.PORT, environment: env.NODE_ENV }));
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\nError: Port ${env.PORT} is already in use by another process.`);
    console.error(`Please stop the process on port ${env.PORT} or change PORT in .env\n`);
    process.exit(1);
  }
  console.error(JSON.stringify({ level: 'error', message: 'Server startup error', error: err.message }));
  process.exit(1);
});

async function shutdown(signal) {
  console.log(`\nGracefully shutting down ACM backend (${signal})...`);
  server.close(async () => {
    await prisma.$disconnect();
    console.log(`Server stopped cleanly.\n`);
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on('unhandledRejection', (reason) => {
  console.error(JSON.stringify({
    level: 'error',
    message: 'Unhandled Promise Rejection',
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined
  }));
});

process.on('uncaughtException', (err) => {
  console.error(JSON.stringify({
    level: 'error',
    message: 'Uncaught Exception',
    error: err.message,
    stack: err.stack
  }));
  shutdown('UNCAUGHT_EXCEPTION');
});

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

