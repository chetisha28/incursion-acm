import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const workSelect = {
  id: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  dueDate: true,
  assigneeId: true,
  assignerId: true,
  eventId: true,
  createdAt: true,
  updatedAt: true,
  assignee: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      title: true,
      department: true
    }
  },
  assigner: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    }
  },
  event: {
    select: {
      id: true,
      title: true,
      status: true,
      startsAt: true,
      venue: true
    }
  }
};

export const listWorkAssignments = asyncHandler(async (req, res) => {
  const { status, priority, assigneeId, eventId } = req.query;
  const where = {};

  if (req.user.role === 'EXECUTIVE') {
    // Executives only access work assigned to them
    where.assigneeId = req.user.id;
  } else if (assigneeId) {
    where.assigneeId = assigneeId;
  }

  if (status && ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(status)) {
    where.status = status;
  }
  if (priority && ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(priority)) {
    where.priority = priority;
  }
  if (eventId) {
    where.eventId = eventId;
  }

  const assignments = await prisma.workAssignment.findMany({
    where,
    select: workSelect,
    orderBy: [
      { status: 'asc' },
      { dueDate: 'asc' },
      { createdAt: 'desc' }
    ]
  });

  res.json({
    success: true,
    message: 'Work assignments retrieved successfully',
    data: assignments
  });
});

export const createWorkAssignment = asyncHandler(async (req, res) => {
  const { title, description, priority = 'MEDIUM', dueDate, assigneeId, eventId } = req.body;

  const assignee = await prisma.user.findUnique({
    where: { id: assigneeId },
    select: { id: true, name: true, role: true, isActive: true }
  });
  if (!assignee || !assignee.isActive) {
    throw new ApiError(404, 'Assigned user does not exist or is inactive', 'USER_NOT_FOUND');
  }

  if (eventId) {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new ApiError(404, 'Linked event not found', 'EVENT_NOT_FOUND');
  }

  const assignment = await prisma.workAssignment.create({
    data: {
      title,
      description: description || null,
      priority,
      dueDate: dueDate || null,
      assigneeId,
      assignerId: req.user.id,
      eventId: eventId || null
    },
    select: workSelect
  });

  await prisma.activityLog.create({
    data: {
      actorId: req.user.id,
      action: 'WORK_ASSIGNED',
      entityType: 'WorkAssignment',
      entityId: assignment.id,
      metadata: {
        title: assignment.title,
        assigneeName: assignee.name,
        priority: assignment.priority
      }
    }
  });

  res.status(201).json({
    success: true,
    message: 'Work assigned successfully',
    data: assignment
  });
});

export const updateWorkAssignment = asyncHandler(async (req, res) => {
  const existing = await prisma.workAssignment.findUnique({
    where: { id: req.params.id },
    select: { id: true, assigneeId: true, title: true }
  });
  if (!existing) throw new ApiError(404, 'Work assignment not found', 'NOT_FOUND');

  const patch = {};

  if (req.user.role === 'EXECUTIVE') {
    // Executive can only update their own assigned work status
    if (existing.assigneeId !== req.user.id) {
      throw new ApiError(403, 'You can only update tasks assigned to your account', 'FORBIDDEN');
    }
    if (req.body.status) {
      patch.status = req.body.status;
    }
  } else {
    // Core/Admin can update all assignment properties
    if (req.body.title !== undefined) patch.title = req.body.title;
    if (req.body.description !== undefined) patch.description = req.body.description;
    if (req.body.status !== undefined) patch.status = req.body.status;
    if (req.body.priority !== undefined) patch.priority = req.body.priority;
    if (req.body.dueDate !== undefined) patch.dueDate = req.body.dueDate;
    if (req.body.assigneeId !== undefined) {
      const assignee = await prisma.user.findUnique({ where: { id: req.body.assigneeId } });
      if (!assignee || !assignee.isActive) throw new ApiError(404, 'New assignee not found or inactive', 'USER_NOT_FOUND');
      patch.assigneeId = req.body.assigneeId;
    }
    if (req.body.eventId !== undefined) patch.eventId = req.body.eventId;
  }

  const updated = await prisma.workAssignment.update({
    where: { id: existing.id },
    data: patch,
    select: workSelect
  });

  await prisma.activityLog.create({
    data: {
      actorId: req.user.id,
      action: 'WORK_UPDATED',
      entityType: 'WorkAssignment',
      entityId: updated.id,
      metadata: { title: updated.title, updatedFields: Object.keys(patch) }
    }
  });

  res.json({
    success: true,
    message: 'Work assignment updated successfully',
    data: updated
  });
});

export const deleteWorkAssignment = asyncHandler(async (req, res) => {
  const existing = await prisma.workAssignment.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new ApiError(404, 'Work assignment not found', 'NOT_FOUND');

  await prisma.workAssignment.delete({ where: { id: existing.id } });

  await prisma.activityLog.create({
    data: {
      actorId: req.user.id,
      action: 'WORK_DELETED',
      entityType: 'WorkAssignment',
      entityId: existing.id,
      metadata: { title: existing.title }
    }
  });

  res.json({
    success: true,
    message: 'Work assignment deleted successfully',
    data: { id: existing.id }
  });
});
