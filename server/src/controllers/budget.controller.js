import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { currentBudget, summarizeBudget } from '../services/budget.service.js';

export const listBudgets = asyncHandler(async (_req, res) => {
  const budgets = await prisma.budget.findMany({ orderBy: { startsAt: 'desc' } });
  const data = await Promise.all(budgets.map(summarizeBudget));
  res.json({ success: true, message: 'Budgets fetched successfully', data });
});

export const getCurrentBudget = asyncHandler(async (_req, res) => {
  const budget = await currentBudget();
  res.json({ success: true, message: 'Current budget fetched successfully', data: budget });
});

export const createBudget = asyncHandler(async (req, res) => {
  const budget = await prisma.budget.create({ data: { ...req.body, createdById: req.user.id } });
  res.status(201).json({ success: true, message: 'Budget created successfully', data: await summarizeBudget(budget) });
});

export const updateBudget = asyncHandler(async (req, res) => {
  const existing = await prisma.budget.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new ApiError(404, 'Budget not found', 'NOT_FOUND');
  const data = { ...req.body };
  if (data.startsAt && data.endsAt <= data.startsAt) throw new ApiError(400, 'End must be later than start', 'VALIDATION_ERROR');
  if (data.startsAt && data.endsAt === undefined && data.startsAt >= existing.endsAt) throw new ApiError(400, 'End must be later than start', 'VALIDATION_ERROR');
  if (data.endsAt && data.startsAt === undefined && data.endsAt <= existing.startsAt) throw new ApiError(400, 'End must be later than start', 'VALIDATION_ERROR');
  const budget = await prisma.budget.update({ where: { id: existing.id }, data });
  res.json({ success: true, message: 'Budget updated successfully', data: await summarizeBudget(budget) });
});
