import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';

const roleForLogin = {
  executive: ['EXECUTIVE'],
  core: ['CORE', 'ADMIN']
};

export async function login(kind, { email, password }) {
  const allowedRoles = roleForLogin[kind] || [];
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      passwordHash: true,
      role: true,
      title: true,
      department: true,
      mustChangePassword: true,
      isActive: true
    }
  });
  if (!user || !allowedRoles.includes(user.role) || !user.isActive || !(await bcrypt.compare(password, user.passwordHash))) {
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
  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      title: user.title,
      department: user.department,
      mustChangePassword: user.mustChangePassword
    },
    expiresAt: new Date(decoded.exp * 1000).toISOString()
  };
}

export async function logout(jti) {
  await prisma.authSession.updateMany({ where: { jti, revokedAt: null }, data: { revokedAt: new Date() } });
}

export async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, passwordHash: true, isActive: true }
  });
  if (!user || !user.isActive) {
    throw new ApiError(404, 'User account not found', 'NOT_FOUND');
  }
  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isValid) {
    throw new ApiError(400, 'Current password does not match', 'INVALID_PASSWORD');
  }
  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash,
      mustChangePassword: false
    }
  });
  await prisma.activityLog.create({
    data: {
      actorId: userId,
      action: 'PASSWORD_CHANGED',
      entityType: 'User',
      entityId: userId,
      metadata: { timestamp: new Date() }
    }
  });
  return { success: true };
}
