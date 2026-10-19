import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';

const roleForLogin = { executive: 'EXECUTIVE', core: 'CORE' };

export async function login(kind, { email, password }) {
  const expectedRole = roleForLogin[kind];
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true, name: true, passwordHash: true, role: true, isActive: true } });
  if (!user || user.role !== expectedRole || !user.isActive || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new ApiError(401, 'Email or password is incorrect', 'INVALID_CREDENTIALS');
  }
  const jti = randomUUID();
  const token = jwt.sign({}, env.JWT_SECRET, {
    subject: user.id,
    jwtid: jti,
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
    expiresIn: env.JWT_EXPIRES_IN
  });
  const decoded = jwt.decode(token);
  await prisma.authSession.create({ data: { jti, userId: user.id, expiresAt: new Date(decoded.exp * 1000) } });
  return { token, user: { id: user.id, email: user.email, name: user.name, role: user.role }, expiresAt: new Date(decoded.exp * 1000).toISOString() };
}

export async function logout(jti) {
  await prisma.authSession.updateMany({ where: { jti, revokedAt: null }, data: { revokedAt: new Date() } });
}
