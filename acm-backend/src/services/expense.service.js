import { prisma } from '../config/prisma.js';
import { receiptReference } from './receiptStorage.service.js';
import { ApiError } from '../utils/apiError.js';

export const expenseInclude = {
  event: { select: { id: true, title: true } },
  createdBy: { select: { id: true, name: true, role: true } }
};

export async function ensureEventAvailable(eventId, client = prisma) {
  if (!eventId) return;
  const event = await client.event.findFirst({ where: { id: eventId, archivedAt: null }, select: { id: true } });
  if (!event) throw new ApiError(404, 'Associated event not found', 'EVENT_NOT_FOUND');
}

export function normalizeExpenseInput(input) {
  const data = { ...input };
  if ('receiptUrl' in data) data.receiptUrl = receiptReference(data.receiptUrl);
  return data;
}
