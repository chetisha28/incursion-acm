import { prisma } from '../config/prisma.js';
import { currentBudget } from '../services/budget.service.js';
import { detectConflicts } from '../services/conflict.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

async function dashboardSummary() {
  const now = new Date();
  const [totalEvents, upcomingEvents, pastEvents, draftEvents, cancelledEvents, expenseSum, current, categorySpending] = await Promise.all([
    prisma.event.count({ where: { archivedAt: null } }),
    prisma.event.count({ where: { status: 'PUBLISHED', archivedAt: null, startsAt: { gte: now } } }),
    prisma.event.count({ where: { status: 'PUBLISHED', archivedAt: null, endsAt: { lt: now } } }),
    prisma.event.count({ where: { status: 'DRAFT', archivedAt: null } }),
    prisma.event.count({ where: { status: 'CANCELLED' } }),
    prisma.expense.aggregate({ where: { archivedAt: null }, _sum: { amount: true } }),
    currentBudget(),
    prisma.expense.groupBy({ by: ['category'], where: { archivedAt: null }, _sum: { amount: true }, orderBy: { category: 'asc' } })
  ]);
  return {
    totalEvents, upcomingEvents, pastEvents, draftEvents, cancelledEvents,
    totalExpenses: expenseSum._sum.amount?.toString() || '0.00',
    currentBudget: current ? { id: current.id, name: current.name, period: current.period, totalAmount: current.totalAmount, spentAmount: current.spentAmount, remainingAmount: current.remainingAmount } : null,
    remainingBudget: current?.remainingAmount || null,
    categoryWiseSpending: categorySpending.map((item) => ({ category: item.category, amount: item._sum.amount?.toString() || '0.00' }))
  };
}

async function dashboardConflicts() {
  const events = await prisma.event.findMany({ where: { status: { not: 'CANCELLED' }, archivedAt: null }, orderBy: { startsAt: 'asc' } });
  const conflicts = [];
  for (let i = 0; i < events.length; i += 1) {
    for (let j = i + 1; j < events.length && events[j].startsAt < events[i].endsAt; j += 1) {
      const [conflict] = detectConflicts(events[i], [events[j]]);
      if (!conflict) continue;
      conflicts.push({
        eventId: events[i].id,
        title: events[i].title,
        conflictingEventId: conflict.eventId,
        conflictingTitle: conflict.title,
        startsAt: conflict.startsAt,
        endsAt: conflict.endsAt,
        venue: conflict.venue,
        reasons: conflict.reasons
      });
    }
  }
  return conflicts;
}

async function recentActivity() {
  const logs = await prisma.activityLog.findMany({
    take: 15,
    orderBy: { createdAt: 'desc' },
    include: { actor: { select: { id: true, name: true, role: true } } }
  });
  return logs.map(({ id, actor, action, entityType, entityId, metadata, createdAt }) => ({ id, actor, action, entityType, entityId, metadata, createdAt }));
}

export const getDashboard = asyncHandler(async (_req, res) => {
  const [summary, conflicts, recent] = await Promise.all([dashboardSummary(), dashboardConflicts(), recentActivity()]);
  res.json({ success: true, message: 'Core dashboard fetched successfully', data: { ...summary, detectedConflicts: conflicts, recentActivity: recent } });
});

export const getDashboardSummary = asyncHandler(async (_req, res) => {
  res.json({ success: true, message: 'Dashboard summary fetched successfully', data: await dashboardSummary() });
});

export const getDashboardConflicts = asyncHandler(async (_req, res) => {
  res.json({ success: true, message: 'Dashboard conflicts fetched successfully', data: await dashboardConflicts() });
});

export const getDashboardActivity = asyncHandler(async (_req, res) => {
  res.json({ success: true, message: 'Recent activity fetched successfully', data: await recentActivity() });
});
