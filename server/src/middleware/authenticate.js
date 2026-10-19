import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';

export async function authenticate(req, _res, next) {
  try {
    const header = req.get('authorization') || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) throw new ApiError(401, 'Authentication required', 'UNAUTHORIZED');
    let claims;
    try {
      claims = jwt.verify(token, env.JWT_SECRET, { issuer: env.JWT_ISSUER, audience: env.JWT_AUDIENCE });
    } catch {
      throw new ApiError(401, 'Invalid or expired authentication token', 'INVALID_TOKEN');
    }
    if (typeof claims !== 'object' || !claims.sub || !claims.jti) {
      throw new ApiError(401, 'Invalid authentication token', 'INVALID_TOKEN');
    }
    const session = await prisma.authSession.findUnique({
      where: { jti: claims.jti },
      include: { user: { select: { id: true, email: true, name: true, role: true, isActive: true } } }
    });
    if (!session || session.userId !== claims.sub || session.revokedAt || session.expiresAt <= new Date() || !session.user.isActive) {
      throw new ApiError(401, 'Session is no longer valid', 'INVALID_SESSION');
    }
    req.auth = { jti: session.jti, sessionId: session.id };
    req.user = { id: session.user.id, email: session.user.email, name: session.user.name, role: session.user.role };
    return next();
  } catch (error) {
    return next(error);
  }
}
