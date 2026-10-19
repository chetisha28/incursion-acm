import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { ApiError } from '../utils/apiError.js';

export function errorHandler(error, req, res, _next) {
  if (res.headersSent) return;
  if (error?.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Request body contains invalid JSON', code: 'INVALID_JSON' });
  }
  if (error?.type === 'entity.too.large') {
    return res.status(413).json({ success: false, message: 'Request body is too large', code: 'PAYLOAD_TOO_LARGE' });
  }
  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Request validation failed',
      code: 'VALIDATION_ERROR',
      details: error.issues.map(({ path, message }) => ({ path: path.join('.'), message }))
    });
  }
  if (error instanceof ApiError) {
    const payload = { success: false, message: error.message, code: error.code };
    if (error.details !== undefined) payload.details = error.details;
    return res.status(error.status).json(payload);
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'A record with those values already exists', code: 'DUPLICATE_RESOURCE' });
    }
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Resource not found', code: 'NOT_FOUND' });
    }
    if (error.code === 'P2034') {
      return res.status(409).json({ success: false, message: 'The data changed during this operation; retry the request', code: 'CONCURRENT_UPDATE' });
    }
  }
  console.error(JSON.stringify({ level: 'error', requestId: req.id, method: req.method, path: req.path, errorName: error?.name || 'Error', errorCode: error?.code || 'UNEXPECTED' }));
  return res.status(500).json({ success: false, message: 'An unexpected server error occurred', code: 'INTERNAL_ERROR' });
}
