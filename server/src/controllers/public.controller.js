import { prisma } from '../config/prisma.js';

export async function health(_req, res) {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ success: true, message: 'Service is healthy', data: { status: 'ok', database: 'connected' } });
  } catch {
    res.status(503).json({ success: false, message: 'Service is unavailable', code: 'DATABASE_UNAVAILABLE', data: { status: 'degraded', database: 'unavailable' } });
  }
}
