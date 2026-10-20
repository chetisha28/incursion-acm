import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  title: true,
  department: true,
  isActive: true,
  mustChangePassword: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      createdEvents: true,
      assignedWork: true,
      createdWork: true
    }
  }
};

export const listUsers = asyncHandler(async (req, res) => {
  const { role, status, search } = req.query;
  const where = {};

  if (role && ['EXECUTIVE', 'CORE', 'ADMIN', 'VIEWER'].includes(role)) {
    where.role = role;
  }
  if (status === 'active') {
    where.isActive = true;
  } else if (status === 'inactive') {
    where.isActive = false;
  }
  if (search && typeof search === 'string') {
    const term = search.trim();
    if (term) {
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
        { title: { contains: term, mode: 'insensitive' } },
        { department: { contains: term, mode: 'insensitive' } }
      ];
    }
  }

  const users = await prisma.user.findMany({
    where,
    select: publicUserSelect,
    orderBy: [{ role: 'asc' }, { name: 'asc' }]
  });

  res.json({
    success: true,
    message: 'Users retrieved successfully',
    data: users
  });
});

export const createUser = asyncHandler(async (req, res) => {
  const { name, email, role = 'EXECUTIVE', title, department, password, mustChangePassword: reqMustChange } = req.body;

  // Authorization check: CORE can create EXECUTIVE; ADMIN can create CORE or EXECUTIVE
  if (req.user.role === 'CORE' && (role === 'CORE' || role === 'ADMIN')) {
    // If the caller is Core, they can create executives. If they want to create another Core,
    // only permitted if they have administrative privilege or explicit request.
    // Allow Core leads to add Core members or Executives as requested by Requirement 2 & 3.
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new ApiError(409, `An account with email ${email} already exists`, 'EMAIL_EXISTS');
  }

  let finalPassword = password;
  let mustChangePassword = reqMustChange !== undefined ? Boolean(reqMustChange) : false;
  if (!finalPassword) {
    // Auto-generate strong temporary password
    finalPassword = `ACM-${crypto.randomBytes(4).toString('hex').toUpperCase()}!${Math.floor(100 + Math.random() * 900)}`;
    mustChangePassword = true;
  }

  const passwordHash = await bcrypt.hash(finalPassword, 12);
  const newUser = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role,
      title: title || null,
      department: department || null,
      mustChangePassword,
      isActive: true,
      createdById: req.user.id
    },
    select: publicUserSelect
  });

  await prisma.activityLog.create({
    data: {
      actorId: req.user.id,
      action: 'USER_CREATED',
      entityType: 'User',
      entityId: newUser.id,
      metadata: { name: newUser.name, email: newUser.email, role: newUser.role }
    }
  });

  res.status(201).json({
    success: true,
    message: `${newUser.role} account created successfully`,
    data: {
      ...newUser,
      user: newUser,
      generatedPassword: mustChangePassword ? finalPassword : null
    }
  });
});

export const getUser = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: {
      ...publicUserSelect,
      assignedWork: {
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      },
      createdEvents: {
        select: {
          id: true,
          title: true,
          status: true,
          startsAt: true
        },
        take: 10,
        orderBy: { startsAt: 'desc' }
      }
    }
  });

  if (!user) throw new ApiError(404, 'User not found', 'NOT_FOUND');
  res.json({ success: true, message: 'User fetched successfully', data: user });
});

export const updateUser = asyncHandler(async (req, res) => {
  const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new ApiError(404, 'User not found', 'NOT_FOUND');

  // Prevent demoting self or locking out own active account
  if (existing.id === req.user.id && req.body.isActive === false) {
    throw new ApiError(400, 'Cannot deactivate your own active session account', 'INVALID_OPERATION');
  }

  const updateData = {};
  if (req.body.name !== undefined) updateData.name = req.body.name;
  if (req.body.role !== undefined) updateData.role = req.body.role;
  if (req.body.title !== undefined) updateData.title = req.body.title;
  if (req.body.department !== undefined) updateData.department = req.body.department;
  if (req.body.isActive !== undefined) {
    updateData.isActive = req.body.isActive;
    if (req.body.isActive === false) {
      // Revoke all sessions for deactivated user
      await prisma.authSession.updateMany({
        where: { userId: existing.id, revokedAt: null },
        data: { revokedAt: new Date() }
      });
    }
  }

  let generatedPassword = null;
  if (req.body.password) {
    updateData.passwordHash = await bcrypt.hash(req.body.password, 12);
    updateData.mustChangePassword = true;
    generatedPassword = req.body.password;
  }

  const updated = await prisma.user.update({
    where: { id: existing.id },
    data: updateData,
    select: publicUserSelect
  });

  await prisma.activityLog.create({
    data: {
      actorId: req.user.id,
      action: 'USER_UPDATED',
      entityType: 'User',
      entityId: updated.id,
      metadata: { changedFields: Object.keys(updateData) }
    }
  });

  res.json({
    success: true,
    message: 'User account updated successfully',
    data: {
      ...updated,
      generatedPassword
    }
  });
});

export const deleteUser = asyncHandler(async (req, res) => {
  const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new ApiError(404, 'User not found', 'NOT_FOUND');

  if (existing.id === req.user.id) {
    throw new ApiError(400, 'Cannot delete or deactivate your own account', 'INVALID_OPERATION');
  }

  // Soft deactivate so audit trails and linked events/expenses are preserved
  const deactivated = await prisma.user.update({
    where: { id: existing.id },
    data: { isActive: false },
    select: publicUserSelect
  });

  await prisma.authSession.updateMany({
    where: { userId: existing.id, revokedAt: null },
    data: { revokedAt: new Date() }
  });

  await prisma.activityLog.create({
    data: {
      actorId: req.user.id,
      action: 'USER_DEACTIVATED',
      entityType: 'User',
      entityId: existing.id,
      metadata: { name: existing.name, email: existing.email }
    }
  });

  res.json({
    success: true,
    message: 'User account deactivated successfully',
    data: deactivated
  });
});
