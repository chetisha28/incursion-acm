import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { findEventConflicts } from '../services/conflict.service.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const publicEventSelect = {
  id: true,
  title: true,
  description: true,
  category: true,
  startsAt: true,
  endsAt: true,
  timezone: true,
  venue: true,
  expectedAudience: true,
  organizer: true,
  campusRelevant: true,
  status: true,
  createdById: true,
  archivedAt: true,
  resolvedAt: true,
  resolvedById: true,
  resolutionNotes: true,
  createdAt: true,
  updatedAt: true,
  assignedToId: true,
  createdBy: {
    select: { id: true, name: true, email: true, role: true }
  },
  assignedTo: {
    select: { id: true, name: true, email: true, title: true, role: true }
  },
  resolver: {
    select: { id: true, name: true, email: true, role: true }
  },
  upvotes: {
    select: {
      id: true,
      userId: true,
      createdAt: true,
      user: {
        select: { id: true, name: true, role: true }
      }
    }
  },
  assignments: {
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      dueDate: true
    }
  }
};

function buildEventWhere(query = {}, user = null) {
  let statusCondition;
  if (query.status) {
    if (query.status === 'ALL') {
      statusCondition = user?.role === 'CORE' ? {} : { status: 'PUBLISHED', archivedAt: null };
    } else if (query.status === 'DRAFT') {
      // Both CORE and EXECUTIVE can view drafts awaiting review
      statusCondition = (user?.role === 'CORE' || user?.role === 'EXECUTIVE')
        ? { status: 'DRAFT', archivedAt: null }
        : { status: 'PUBLISHED', archivedAt: null };
    } else {
      statusCondition = { status: query.status, ...(query.status === 'CANCELLED' ? {} : { archivedAt: null }) };
    }
  } else if (user?.role === 'CORE') {
    statusCondition = { archivedAt: null };
  } else if (user?.role === 'EXECUTIVE') {
    statusCondition = {
      archivedAt: null,
      OR: [
        { status: 'PUBLISHED' },
        { status: 'DRAFT' }
      ]
    };
  } else {
    statusCondition = { status: 'PUBLISHED', archivedAt: null };
  }

  let dateCondition = {};
  if (query.from && query.to) {
    dateCondition = {
      startsAt: { lte: query.to },
      endsAt: { gte: query.from }
    };
  } else if (query.from) {
    dateCondition = {
      endsAt: { gte: query.from }
    };
  } else if (query.to) {
    dateCondition = {
      startsAt: { lte: query.to }
    };
  }

  return {
    ...statusCondition,
    ...dateCondition,
    ...(query.category ? { category: { equals: query.category, mode: 'insensitive' } } : {}),
    ...(query.search ? {
      OR: [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { organizer: { contains: query.search, mode: 'insensitive' } },
        { venue: { contains: query.search, mode: 'insensitive' } }
      ]
    } : {})
  };
}

export const listEvents = asyncHandler(async (req, res) => {
  const query = req.query;
  const where = buildEventWhere(query, req.user);
  const [items, total] = await Promise.all([
    prisma.event.findMany({
      where,
      select: publicEventSelect,
      orderBy: { [query.sortBy]: query.order },
      skip: (query.page - 1) * query.limit,
      take: query.limit
    }),
    prisma.event.count({ where })
  ]);
  res.json({
    success: true,
    message: 'Events fetched successfully',
    data: items,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit)
    }
  });
});

export const listPastEvents = asyncHandler(async (_req, res) => {
  const items = await prisma.event.findMany({
    where: { status: 'PUBLISHED', archivedAt: null, endsAt: { lt: new Date() } },
    select: publicEventSelect,
    orderBy: { startsAt: 'desc' },
    take: 100
  });
  res.json({ success: true, message: 'Past events fetched successfully', data: items });
});

export const listUpcomingEvents = asyncHandler(async (_req, res) => {
  const items = await prisma.event.findMany({
    where: { status: 'PUBLISHED', archivedAt: null, endsAt: { gte: new Date() } },
    select: publicEventSelect,
    orderBy: { startsAt: 'asc' },
    take: 100
  });
  res.json({ success: true, message: 'Upcoming events fetched successfully', data: items });
});

export const getEvent = asyncHandler(async (req, res) => {
  let where;
  if (req.user?.role === 'CORE') {
    where = { id: req.params.id };
  } else if (req.user?.role === 'EXECUTIVE') {
    where = {
      id: req.params.id,
      archivedAt: null,
      OR: [
        { status: 'PUBLISHED' },
        { status: 'DRAFT' }
      ]
    };
  } else {
    where = { id: req.params.id, status: 'PUBLISHED', archivedAt: null };
  }

  const event = await prisma.event.findFirst({
    where,
    select: publicEventSelect
  });
  if (!event) throw new ApiError(404, 'Event not found', 'NOT_FOUND');
  res.json({ success: true, message: 'Event fetched successfully', data: event });
});

export const createEvent = asyncHandler(async (req, res) => {
  const { allowConflict, ...data } = req.body;
  const result = await prisma.$transaction(async (tx) => {
    const conflicts = data.status === 'CANCELLED' ? [] : await findEventConflicts(tx, data);
    // If overlaps exist and allowConflict was not explicitly sent, warn with 409
    if (conflicts.length && !allowConflict) {
      throw new ApiError(409, 'Event scheduling conflicts were found', 'SCHEDULING_CONFLICT', conflicts);
    }
    // Both Executive and Core can submit with allowConflict: true!
    const targetStatus = req.user.role === 'CORE' ? (data.status || 'PUBLISHED') : 'DRAFT';
    const event = await tx.event.create({
      data: {
        ...data,
        status: targetStatus,
        createdById: req.user.id
      },
      select: publicEventSelect
    });
    await tx.activityLog.create({
      data: {
        actorId: req.user.id,
        action: 'EVENT_CREATED',
        entityType: 'Event',
        entityId: event.id,
        metadata: { title: event.title, status: event.status, hasConflicts: conflicts.length > 0 }
      }
    });
    return { event, conflicts };
  }, { timeout: 20000, maxWait: 10000 });
  const { event, conflicts } = result;
  res.status(201).json({ success: true, message: 'Event created successfully', data: { ...event, conflicts } });
});

export const updateEvent = asyncHandler(async (req, res) => {
  const { allowConflict, ...patch } = req.body;
  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.event.findFirst({ where: { id: req.params.id, archivedAt: null } });
    if (!existing) throw new ApiError(404, 'Event not found', 'NOT_FOUND');
    const candidate = { ...existing, ...patch };
    if (candidate.endsAt <= candidate.startsAt) {
      throw new ApiError(400, 'End date and time must be later than start date and time', 'VALIDATION_ERROR');
    }
    const conflicts = candidate.status === 'CANCELLED' ? [] : await findEventConflicts(tx, candidate, existing.id);
    if (conflicts.length && !(req.user.role === 'CORE' && allowConflict === true)) {
      throw new ApiError(409, 'Event scheduling conflicts were found', 'SCHEDULING_CONFLICT', conflicts);
    }
    const event = await tx.event.update({
      where: { id: existing.id },
      data: patch,
      select: publicEventSelect
    });
    await tx.activityLog.create({
      data: {
        actorId: req.user.id,
        action: 'EVENT_UPDATED',
        entityType: 'Event',
        entityId: event.id,
        metadata: { title: event.title, status: event.status }
      }
    });
    return { event, conflicts };
  }, { timeout: 20000, maxWait: 10000 });
  const { event, conflicts } = result;
  res.json({ success: true, message: 'Event updated successfully', data: { ...event, conflicts } });
});

export const resolveEvent = asyncHandler(async (req, res) => {
  const { status = 'PUBLISHED', resolutionNotes, allowConflict, venue, startsAt, endsAt } = req.body;
  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.event.findFirst({ where: { id: req.params.id } });
    if (!existing) throw new ApiError(404, 'Event not found', 'NOT_FOUND');

    const patch = {
      status,
      resolvedAt: new Date(),
      resolvedById: req.user.id,
      ...(resolutionNotes !== undefined ? { resolutionNotes: resolutionNotes ? resolutionNotes.trim() : null } : {}),
      ...(venue !== undefined ? { venue: venue.trim() } : {}),
      ...(startsAt !== undefined ? { startsAt } : {}),
      ...(endsAt !== undefined ? { endsAt } : {})
    };
    if (status === 'CANCELLED') {
      patch.archivedAt = new Date();
    } else {
      patch.archivedAt = null;
    }
    const candidate = { ...existing, ...patch };
    if (candidate.endsAt <= candidate.startsAt) {
      throw new ApiError(400, 'End date and time must be later than start date and time', 'VALIDATION_ERROR');
    }
    const conflicts = candidate.status === 'CANCELLED' ? [] : await findEventConflicts(tx, candidate, existing.id);
    if (conflicts.length && !(req.user.role === 'CORE' && allowConflict === true)) {
      throw new ApiError(409, 'Event scheduling conflicts were found', 'SCHEDULING_CONFLICT', conflicts);
    }
    const event = await tx.event.update({
      where: { id: existing.id },
      data: patch,
      select: publicEventSelect
    });
    const action = conflicts.length ? 'EVENT_CONFLICT_RESOLVED' : 'EVENT_RESOLVED';
    await tx.activityLog.create({
      data: {
        actorId: req.user.id,
        action,
        entityType: 'Event',
        entityId: event.id,
        metadata: {
          title: event.title,
          previousStatus: existing.status,
          newStatus: event.status,
          resolutionNotes: event.resolutionNotes
        }
      }
    });
    return { event, conflicts };
  }, { timeout: 20000, maxWait: 10000 });
  const { event, conflicts } = result;
  res.json({
    success: true,
    message: `Event successfully resolved with status ${event.status}`,
    data: { ...event, conflicts }
  });
});

export const upvoteEvent = asyncHandler(async (req, res) => {
  const event = await prisma.event.findFirst({
    where: { id: req.params.id, archivedAt: null },
    select: { id: true, title: true, status: true }
  });
  if (!event) throw new ApiError(404, 'Event not found', 'NOT_FOUND');
  if (event.status !== 'DRAFT') {
    throw new ApiError(400, 'Upvoting is only available for events currently awaiting review', 'INVALID_EVENT_STATE');
  }

  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.eventUpvote.findUnique({
      where: { eventId_userId: { eventId: event.id, userId: req.user.id } }
    });

    let upvoted;
    if (existing) {
      await tx.eventUpvote.delete({ where: { id: existing.id } });
      upvoted = false;
      await tx.activityLog.create({
        data: {
          actorId: req.user.id,
          action: 'EVENT_UPVOTE_REMOVED',
          entityType: 'Event',
          entityId: event.id,
          metadata: { title: event.title }
        }
      });
    } else {
      await tx.eventUpvote.create({
        data: { eventId: event.id, userId: req.user.id }
      });
      upvoted = true;
      await tx.activityLog.create({
        data: {
          actorId: req.user.id,
          action: 'EVENT_UPVOTED',
          entityType: 'Event',
          entityId: event.id,
          metadata: { title: event.title }
        }
      });
    }

    const upvotes = await tx.eventUpvote.findMany({
      where: { eventId: event.id },
      select: {
        id: true,
        userId: true,
        createdAt: true,
        user: { select: { id: true, name: true, role: true } }
      }
    });

    return { upvoted, upvotes, count: upvotes.length };
  });

  res.json({
    success: true,
    message: result.upvoted ? 'Event upvoted successfully' : 'Upvote removed successfully',
    data: {
      eventId: event.id,
      upvoted: result.upvoted,
      upvoteCount: result.count,
      upvotesCount: result.count,
      upvotes: result.upvotes
    }
  });
});

export const removeUpvoteEvent = asyncHandler(async (req, res) => {
  const event = await prisma.event.findFirst({
    where: { id: req.params.id, archivedAt: null },
    select: { id: true, title: true, status: true }
  });
  if (!event) throw new ApiError(404, 'Event not found', 'NOT_FOUND');

  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.eventUpvote.findUnique({
      where: { eventId_userId: { eventId: event.id, userId: req.user.id } }
    });
    if (existing) {
      await tx.eventUpvote.delete({ where: { id: existing.id } });
      await tx.activityLog.create({
        data: {
          actorId: req.user.id,
          action: 'EVENT_UPVOTE_REMOVED',
          entityType: 'Event',
          entityId: event.id,
          metadata: { title: event.title }
        }
      });
    }
    const upvotes = await tx.eventUpvote.findMany({
      where: { eventId: event.id },
      select: {
        id: true,
        userId: true,
        createdAt: true,
        user: { select: { id: true, name: true, role: true } }
      }
    });
    return { upvoted: false, count: upvotes.length, upvotes };
  });

  res.json({
    success: true,
    message: 'Upvote removed successfully',
    data: {
      eventId: event.id,
      upvoted: false,
      upvoteCount: result.count,
      upvotesCount: result.count,
      upvotes: result.upvotes
    }
  });
});

export const getEventUpvoteStatus = asyncHandler(async (req, res) => {
  const event = await prisma.event.findFirst({
    where: { id: req.params.id, archivedAt: null },
    select: { id: true, title: true, status: true }
  });
  if (!event) throw new ApiError(404, 'Event not found', 'NOT_FOUND');

  const upvotes = await prisma.eventUpvote.findMany({
    where: { eventId: event.id },
    select: {
      id: true,
      userId: true,
      createdAt: true,
      user: { select: { id: true, name: true, role: true } }
    }
  });

  const upvoted = req.user ? upvotes.some((u) => u.userId === req.user.id) : false;

  res.json({
    success: true,
    data: {
      eventId: event.id,
      upvoted,
      hasUpvoted: upvoted,
      upvoteCount: upvotes.length,
      upvotesCount: upvotes.length,
      upvotes
    }
  });
});

export const archiveEvent = asyncHandler(async (req, res) => {
  const event = await prisma.$transaction(async (tx) => {
    const existing = await tx.event.findFirst({ where: { id: req.params.id } });
    if (!existing) throw new ApiError(404, 'Event not found', 'NOT_FOUND');
    const archived = await tx.event.update({
      where: { id: existing.id },
      data: { status: 'CANCELLED', archivedAt: new Date() },
      select: publicEventSelect
    });
    await tx.activityLog.create({
      data: {
        actorId: req.user.id,
        action: 'EVENT_ARCHIVED',
        entityType: 'Event',
        entityId: archived.id,
        metadata: { title: archived.title }
      }
    });
    return archived;
  });
  res.json({ success: true, message: 'Event archived successfully', data: { id: event.id, status: event.status, archivedAt: event.archivedAt } });
});
