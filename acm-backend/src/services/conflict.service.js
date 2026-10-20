import { overlaps } from '../utils/dateUtils.js';

function audienceTokens(value) {
  return new Set(String(value || '').toLowerCase().split(/[;,]/).map((item) => item.trim()).filter(Boolean));
}

function audiencesOverlap(left, right) {
  const a = audienceTokens(left);
  const b = audienceTokens(right);
  const universal = new Set(['all', 'everyone', 'campus', 'all students']);
  if ([...a].some((item) => universal.has(item)) || [...b].some((item) => universal.has(item))) return true;
  return [...a].some((item) => b.has(item));
}

export function detectConflicts(candidate, events) {
  return events.flatMap((event) => {
    if (event.id === candidate.id || event.status === 'CANCELLED' || event.archivedAt) return [];
    if (!overlaps(candidate.startsAt, candidate.endsAt, event.startsAt, event.endsAt)) return [];
    const reasons = [];
    if (event.venue.trim().toLowerCase() === candidate.venue.trim().toLowerCase()) reasons.push('Same venue during overlapping times');
    if (audiencesOverlap(event.expectedAudience, candidate.expectedAudience)) reasons.push('Overlapping target audiences during overlapping times');
    if (event.campusRelevant && candidate.campusRelevant) reasons.push('Both events are marked as campus-relevant and overlap');
    if (!reasons.length) return [];
    return [{
      eventId: event.id,
      title: event.title,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      venue: event.venue,
      reasons
    }];
  });
}

export async function findEventConflicts(prisma, candidate, excludeId) {
  const events = await prisma.event.findMany({
    where: {
      status: { not: 'CANCELLED' },
      archivedAt: null,
      startsAt: { lt: candidate.endsAt },
      endsAt: { gt: candidate.startsAt },
      ...(excludeId ? { id: { not: excludeId } } : {})
    },
    select: { id: true, title: true, startsAt: true, endsAt: true, venue: true, expectedAudience: true, campusRelevant: true, status: true, archivedAt: true }
  });
  return detectConflicts(candidate, events);
}
