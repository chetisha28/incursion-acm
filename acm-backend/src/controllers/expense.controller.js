import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ensureEventAvailable, expenseInclude, normalizeExpenseInput } from '../services/expense.service.js';

function serialized(expense) {
  return { ...expense, amount: expense.amount.toString() };
}

export const listExpenses = asyncHandler(async (req, res) => {
  const query = req.query;
  const where = {
    archivedAt: null,
    ...(query.category ? { category: { equals: query.category, mode: 'insensitive' } } : {}),
    ...(query.eventId ? { eventId: query.eventId } : {}),
    ...(query.search ? {
      OR: [
        { description: { contains: query.search, mode: 'insensitive' } },
        { category: { contains: query.search, mode: 'insensitive' } }
      ]
    } : {}),
    ...(query.from || query.to ? { transactionDate: { ...(query.from ? { gte: query.from } : {}), ...(query.to ? { lte: query.to } : {}) } } : {})
  };
  const [items, total] = await Promise.all([
    prisma.expense.findMany({ where, include: expenseInclude, orderBy: { transactionDate: 'desc' }, skip: (query.page - 1) * query.limit, take: query.limit }),
    prisma.expense.count({ where })
  ]);
  res.json({ success: true, message: 'Expenses fetched successfully', data: items.map(serialized), pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) } });
});

export const getExpense = asyncHandler(async (req, res) => {
  const expense = await prisma.expense.findFirst({ where: { id: req.params.id, archivedAt: null }, include: expenseInclude });
  if (!expense) throw new ApiError(404, 'Expense not found', 'NOT_FOUND');
  res.json({ success: true, message: 'Expense fetched successfully', data: serialized(expense) });
});

export const createExpense = asyncHandler(async (req, res) => {
  const data = normalizeExpenseInput(req.body);
  const expense = await prisma.$transaction(async (tx) => {
    await ensureEventAvailable(data.eventId, tx);
    const created = await tx.expense.create({ data: { ...data, createdById: req.user.id }, include: expenseInclude });
    await tx.activityLog.create({ data: { actorId: req.user.id, action: 'EXPENSE_CREATED', entityType: 'Expense', entityId: created.id, metadata: { amount: created.amount.toString(), category: created.category } } });
    return created;
  });
  res.status(201).json({ success: true, message: 'Expense created successfully', data: serialized(expense) });
});

export const updateExpense = asyncHandler(async (req, res) => {
  const expense = await prisma.$transaction(async (tx) => {
    const existing = await tx.expense.findFirst({ where: { id: req.params.id, archivedAt: null } });
    if (!existing) throw new ApiError(404, 'Expense not found', 'NOT_FOUND');
    const data = normalizeExpenseInput(req.body);
    await ensureEventAvailable(data.eventId, tx);
    const updated = await tx.expense.update({ where: { id: existing.id }, data, include: expenseInclude });
    await tx.activityLog.create({ data: { actorId: req.user.id, action: 'EXPENSE_UPDATED', entityType: 'Expense', entityId: updated.id, metadata: { amount: updated.amount.toString(), category: updated.category } } });
    return updated;
  });
  res.json({ success: true, message: 'Expense updated successfully', data: serialized(expense) });
});

export const archiveExpense = asyncHandler(async (req, res) => {
  const expense = await prisma.$transaction(async (tx) => {
    const existing = await tx.expense.findFirst({ where: { id: req.params.id, archivedAt: null } });
    if (!existing) throw new ApiError(404, 'Expense not found', 'NOT_FOUND');
    const archived = await tx.expense.update({ where: { id: existing.id }, data: { archivedAt: new Date() } });
    await tx.activityLog.create({ data: { actorId: req.user.id, action: 'EXPENSE_ARCHIVED', entityType: 'Expense', entityId: archived.id, metadata: { category: archived.category } } });
    return archived;
  });
  res.json({ success: true, message: 'Expense archived successfully', data: { id: expense.id, archivedAt: expense.archivedAt } });
});
