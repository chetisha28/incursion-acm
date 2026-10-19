import { prisma } from '../config/prisma.js';
import { Prisma } from '@prisma/client';
import { decimalString } from '../utils/dateUtils.js';

export async function summarizeBudget(budget) {
  const where = { archivedAt: null, transactionDate: { gte: budget.startsAt, lte: budget.endsAt } };
  const [spentResult, categories] = await Promise.all([
    prisma.expense.aggregate({ where, _sum: { amount: true } }),
    prisma.expense.groupBy({ by: ['category'], where, _sum: { amount: true }, orderBy: { category: 'asc' } })
  ]);
  const spent = spentResult._sum.amount || new Prisma.Decimal(0);
  const total = new Prisma.Decimal(budget.totalAmount);
  return {
    ...budget,
    totalAmount: decimalString(budget.totalAmount),
    spentAmount: spent.toFixed(2),
    remainingAmount: total.minus(spent).toFixed(2),
    categoryWiseSpending: categories.map((item) => ({ category: item.category, amount: decimalString(item._sum.amount) || '0.00' }))
  };
}

export async function currentBudget() {
  const now = new Date();
  const budget = await prisma.budget.findFirst({ where: { startsAt: { lte: now }, endsAt: { gte: now } }, orderBy: { startsAt: 'desc' } });
  return budget ? summarizeBudget(budget) : null;
}
