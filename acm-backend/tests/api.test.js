import { jest } from '@jest/globals';
import bcrypt from 'bcrypt';
import request from 'supertest';

process.env.NODE_ENV = 'test';
process.env.PORT = '4000';
process.env.DATABASE_URL = 'postgresql://postgres:placeholder@localhost:5432/acm_manager?schema=public';
process.env.CORS_ORIGIN = 'http://localhost:3000';
process.env.JWT_SECRET = 'test-secret-that-is-long-enough-32-chars';
process.env.JWT_EXPIRES_IN = '1h';
process.env.JWT_ISSUER = 'acm-conflict-manager';
process.env.JWT_AUDIENCE = 'acm-api';
process.env.AUTH_RATE_LIMIT_MAX = '1000';

const state = { users: [], sessions: [], events: [], expenses: [], budgets: [], logs: [], upvotes: [], workAssignments: [] };
const clone = (value) => structuredClone(value);
const compare = (actual, expected) => {
  if (expected === null || typeof expected !== 'object' || expected instanceof Date) return actual instanceof Date || expected instanceof Date ? new Date(actual).getTime() === new Date(expected).getTime() : actual === expected;
  for (const [operator, value] of Object.entries(expected)) {
    if (operator === 'mode') continue;
    if (operator === 'not' && actual === value) return false;
    if (operator === 'lt' && !(new Date(actual) < new Date(value))) return false;
    if (operator === 'gt' && !(new Date(actual) > new Date(value))) return false;
    if (operator === 'lte' && !(new Date(actual) <= new Date(value))) return false;
    if (operator === 'gte' && !(new Date(actual) >= new Date(value))) return false;
    if (operator === 'equals') {
      if (expected.mode === 'insensitive' ? String(actual).toLowerCase() !== String(value).toLowerCase() : actual !== value) return false;
    }
    if (operator === 'contains') {
      const a = String(actual ?? ''); const b = String(value);
      if (expected.mode === 'insensitive' ? !a.toLowerCase().includes(b.toLowerCase()) : !a.includes(b)) return false;
    }
  }
  return true;
};
function matches(record, where = {}) {
  for (const [key, expected] of Object.entries(where)) {
    if (key === 'OR') { if (!expected.some((part) => matches(record, part))) return false; continue; }
    if (key === 'AND') { if (!expected.every((part) => matches(record, part))) return false; continue; }
    if (!compare(record[key], expected)) return false;
  }
  return true;
}
const project = (record, select) => {
  if (!select) return record;
  const result = {};
  for (const [key, on] of Object.entries(select)) {
    if (!on) continue;
    if (key === 'upvotes') {
      result.upvotes = (state.upvotes || [])
        .filter((u) => u.eventId === record.id)
        .map((u) => {
          const user = state.users.find((usr) => usr.id === u.userId);
          return {
            id: u.id,
            userId: u.userId,
            createdAt: u.createdAt,
            user: user ? { id: user.id, name: user.name, role: user.role } : null
          };
        });
    } else if (key === 'createdBy') {
      const user = state.users.find((usr) => usr.id === record.createdById);
      result.createdBy = user ? { id: user.id, name: user.name, email: user.email, role: user.role } : null;
    } else if (key === 'resolver') {
      const user = state.users.find((usr) => usr.id === record.resolvedById);
      result.resolver = user ? { id: user.id, name: user.name, email: user.email, role: user.role } : null;
    } else {
      result[key] = record[key];
    }
  }
  return result;
};

const prisma = {
  user: {
    findUnique: jest.fn(async ({ where }) => {
      const found = state.users.find((user) => (where.email && user.email.toLowerCase() === where.email.toLowerCase()) || (where.id && user.id === where.id));
      return found ? clone(found) : null;
    }),
    findMany: jest.fn(async ({ where, select, orderBy }) => {
      let found = state.users.filter((item) => matches(item, where)).map(clone);
      return found;
    }),
    create: jest.fn(async ({ data }) => {
      const user = { id: `user-${state.users.length + 1}`, createdAt: new Date(), updatedAt: new Date(), isActive: true, mustChangePassword: false, ...data };
      state.users.push(user);
      return clone(user);
    }),
    update: jest.fn(async ({ where, data }) => {
      const user = state.users.find((u) => u.id === where.id);
      if (user) Object.assign(user, data, { updatedAt: new Date() });
      return clone(user);
    }),
    count: jest.fn(async ({ where } = {}) => state.users.filter((item) => matches(item, where)).length)
  },
  authSession: {
    create: jest.fn(async ({ data }) => { const session = { id: `session-${state.sessions.length + 1}`, revokedAt: null, ...data }; state.sessions.push(session); return clone(session); }),
    findUnique: jest.fn(async ({ where, include }) => {
      const session = state.sessions.find((item) => item.jti === where.jti);
      if (!session) return null;
      const user = state.users.find((item) => item.id === session.userId);
      return clone(include?.user ? { ...session, user } : session);
    }),
    updateMany: jest.fn(async ({ where, data }) => {
      let count = 0;
      for (const session of state.sessions.filter((item) => matches(item, where))) { Object.assign(session, data); count += 1; }
      return { count };
    })
  },
  event: {
    findMany: jest.fn(async ({ where, select, orderBy, skip = 0, take, include } = {}) => {
      let found = state.events.filter((item) => matches(item, where)).map(clone);
      if (orderBy) {
        const [field, order] = Object.entries(orderBy)[0];
        found.sort((a, b) => (a[field] > b[field] ? 1 : a[field] < b[field] ? -1 : 0) * (order === 'desc' ? -1 : 1));
      }
      found = found.slice(skip, take == null ? undefined : skip + take);
      return found.map((item) => select ? project(item, select) : item);
    }),
    findFirst: jest.fn(async ({ where, select } = {}) => {
      const found = state.events.find((item) => matches(item, where));
      return found ? project(clone(found), select) : null;
    }),
    count: jest.fn(async ({ where } = {}) => state.events.filter((item) => matches(item, where)).length),
    create: jest.fn(async ({ data }) => { const event = { id: `event-${state.events.length + 1}`, archivedAt: null, createdAt: new Date(), updatedAt: new Date(), ...data }; state.events.push(event); return clone(event); }),
    update: jest.fn(async ({ where, data }) => { const event = state.events.find((item) => matches(item, where)); Object.assign(event, data, { updatedAt: new Date() }); return clone(event); })
  },
  eventUpvote: {
    findUnique: jest.fn(async ({ where }) => {
      if (where.eventId_userId) {
        const found = state.upvotes.find((u) => u.eventId === where.eventId_userId.eventId && u.userId === where.eventId_userId.userId);
        return found ? clone(found) : null;
      }
      if (where.id) {
        const found = state.upvotes.find((u) => u.id === where.id);
        return found ? clone(found) : null;
      }
      return null;
    }),
    create: jest.fn(async ({ data }) => {
      const upvote = { id: `upvote-${state.upvotes.length + 1}`, createdAt: new Date(), ...data };
      state.upvotes.push(upvote);
      return clone(upvote);
    }),
    delete: jest.fn(async ({ where }) => {
      const idx = state.upvotes.findIndex((u) => u.id === where.id || (where.eventId_userId && u.eventId === where.eventId_userId.eventId && u.userId === where.eventId_userId.userId));
      if (idx !== -1) {
        const [removed] = state.upvotes.splice(idx, 1);
        return clone(removed);
      }
      return null;
    }),
    count: jest.fn(async ({ where } = {}) => {
      return state.upvotes.filter((u) => !where?.eventId || u.eventId === where.eventId).length;
    }),
    findMany: jest.fn(async ({ where } = {}) => {
      return state.upvotes.filter((u) => !where?.eventId || u.eventId === where.eventId).map(clone);
    })
  },
  expense: {
    findMany: jest.fn(async ({ where, skip = 0, take, orderBy, include } = {}) => state.expenses.filter((item) => matches(item, where)).slice(skip, take == null ? undefined : skip + take).map(clone)),
    findFirst: jest.fn(async ({ where } = {}) => clone(state.expenses.find((item) => matches(item, where)) || null)),
    count: jest.fn(async ({ where } = {}) => state.expenses.filter((item) => matches(item, where)).length),
    create: jest.fn(async ({ data }) => { const item = { id: `expense-${state.expenses.length + 1}`, archivedAt: null, createdAt: new Date(), updatedAt: new Date(), ...data }; state.expenses.push(item); return clone(item); }),
    update: jest.fn(async ({ where, data }) => { const item = state.expenses.find((expense) => matches(expense, where)); Object.assign(item, data); return clone(item); }),
    aggregate: jest.fn(async () => ({ _sum: { amount: null } })),
    groupBy: jest.fn(async () => [])
  },
  budget: {
    findFirst: jest.fn(async () => null), findMany: jest.fn(async () => []), findUnique: jest.fn(async () => null),
    create: jest.fn(), update: jest.fn()
  },
  activityLog: {
    create: jest.fn(async ({ data }) => { const log = { id: `log-${state.logs.length + 1}`, createdAt: new Date(), ...data }; state.logs.push(log); return clone(log); }),
    findMany: jest.fn(async () => [])
  },
  workAssignment: {
    findMany: jest.fn(async ({ where }) => {
      let found = state.workAssignments.filter((item) => matches(item, where)).map(clone);
      return found.map((item) => {
        const assignee = state.users.find((u) => u.id === item.assigneeId);
        const assigner = state.users.find((u) => u.id === item.assignerId);
        const event = state.events.find((e) => e.id === item.eventId);
        return {
          ...item,
          assignee: assignee ? { id: assignee.id, name: assignee.name, email: assignee.email, role: assignee.role, title: assignee.title, department: assignee.department } : null,
          assigner: assigner ? { id: assigner.id, name: assigner.name, email: assigner.email, role: assigner.role } : null,
          event: event ? { id: event.id, title: event.title, status: event.status, startsAt: event.startsAt, venue: event.venue } : null
        };
      });
    }),
    findUnique: jest.fn(async ({ where }) => {
      const found = state.workAssignments.find((item) => item.id === where.id);
      if (!found) return null;
      const assignee = state.users.find((u) => u.id === found.assigneeId);
      const assigner = state.users.find((u) => u.id === found.assignerId);
      const event = state.events.find((e) => e.id === found.eventId);
      return {
        ...clone(found),
        assignee: assignee ? { id: assignee.id, name: assignee.name, email: assignee.email, role: assignee.role } : null,
        assigner: assigner ? { id: assigner.id, name: assigner.name, email: assigner.email, role: assigner.role } : null,
        event: event ? { id: event.id, title: event.title } : null
      };
    }),
    create: jest.fn(async ({ data }) => {
      const assignment = { id: `work-${state.workAssignments.length + 1}`, status: 'PENDING', priority: 'MEDIUM', createdAt: new Date(), updatedAt: new Date(), ...data };
      state.workAssignments.push(assignment);
      const assignee = state.users.find((u) => u.id === assignment.assigneeId);
      const assigner = state.users.find((u) => u.id === assignment.assignerId);
      return {
        ...clone(assignment),
        assignee: assignee ? { id: assignee.id, name: assignee.name, email: assignee.email, role: assignee.role } : null,
        assigner: assigner ? { id: assigner.id, name: assigner.name, email: assigner.email, role: assigner.role } : null
      };
    }),
    update: jest.fn(async ({ where, data }) => {
      const found = state.workAssignments.find((item) => item.id === where.id);
      if (found) Object.assign(found, data, { updatedAt: new Date() });
      const assignee = state.users.find((u) => u.id === found?.assigneeId);
      const assigner = state.users.find((u) => u.id === found?.assignerId);
      return {
        ...clone(found),
        assignee: assignee ? { id: assignee.id, name: assignee.name, email: assignee.email, role: assignee.role } : null,
        assigner: assigner ? { id: assigner.id, name: assigner.name, email: assigner.email, role: assigner.role } : null
      };
    }),
    delete: jest.fn(async ({ where }) => {
      const idx = state.workAssignments.findIndex((item) => item.id === where.id);
      if (idx !== -1) {
        const [removed] = state.workAssignments.splice(idx, 1);
        return clone(removed);
      }
      return null;
    })
  },
  $queryRaw: jest.fn(async () => [{ '?column?': 1 }]),
  $transaction: jest.fn(async (work) => work(prisma)),
  $disconnect: jest.fn()
};

await jest.unstable_mockModule('../src/config/prisma.js', () => ({ prisma }));
const { app } = await import('../src/app.js');
const passwordHash = await bcrypt.hash('correct-password', 4);

function reset() {
  state.users = [
    { id: 'admin-1', email: 'admin@example.test', name: 'Admin', passwordHash, role: 'ADMIN', isActive: true, mustChangePassword: false },
    { id: 'core-1', email: 'core@example.test', name: 'Core', passwordHash, role: 'CORE', isActive: true, mustChangePassword: false },
    { id: 'exec-1', email: 'exec@example.test', name: 'Executive', passwordHash, role: 'EXECUTIVE', isActive: true, mustChangePassword: false },
    { id: 'viewer-1', email: 'viewer@example.test', name: 'Viewer', passwordHash, role: 'VIEWER', isActive: true, mustChangePassword: false }
  ];
  state.sessions = []; state.events = []; state.expenses = []; state.budgets = []; state.logs = []; state.upvotes = []; state.workAssignments = [];
  for (const model of [prisma.user, prisma.authSession, prisma.event, prisma.eventUpvote, prisma.expense, prisma.budget, prisma.activityLog, prisma.workAssignment]) {
    for (const method of Object.values(model)) if (typeof method?.mockClear === 'function') method.mockClear();
  }
  prisma.$queryRaw.mockClear();
  prisma.$transaction.mockClear();
}

async function token(kind, email) {
  const response = await request(app).post(`/api/auth/${kind}/login`).send({ email, password: 'correct-password' });
  return response.body.data?.token;
}

beforeEach(reset);

describe('public events', () => {
  test('lists published events without login', async () => {
    state.events.push({ id: 'pub-1', title: 'Public', status: 'PUBLISHED', archivedAt: null, startsAt: new Date('2030-01-01T10:00:00Z'), endsAt: new Date('2030-01-01T11:00:00Z') }, { id: 'draft-1', title: 'Draft', status: 'DRAFT', archivedAt: null });
    const response = await request(app).get('/api/events');
    expect(response.status).toBe(200);
    expect(response.body.data.map((event) => event.id)).toEqual(['pub-1']);
    expect(response.body.pagination.total).toBe(1);
  });

  test('uses literal past route before the event id route', async () => {
    const response = await request(app).get('/api/events/past');
    expect(response.status).toBe(200);
  });
});

describe('role-specific login', () => {
  test('executive login succeeds for an executive and rejects a Core account', async () => {
    expect((await request(app).post('/api/auth/executive/login').send({ email: 'exec@example.test', password: 'correct-password' })).status).toBe(200);
    const rejected = await request(app).post('/api/auth/executive/login').send({ email: 'core@example.test', password: 'correct-password' });
    expect(rejected.status).toBe(401);
  });

  test('Core login succeeds for Core and rejects an executive account', async () => {
    expect((await request(app).post('/api/auth/core/login').send({ email: 'core@example.test', password: 'correct-password' })).status).toBe(200);
    const rejected = await request(app).post('/api/auth/core/login').send({ email: 'exec@example.test', password: 'correct-password' });
    expect(rejected.status).toBe(401);
  });

  test('logout revokes the bearer token server-side', async () => {
    const auth = await token('core', 'core@example.test');
    expect((await request(app).post('/api/auth/logout').set('Authorization', `Bearer ${auth}`)).status).toBe(200);
    expect((await request(app).get('/api/auth/me').set('Authorization', `Bearer ${auth}`)).status).toBe(401);
  });
});

describe('event permissions and validation', () => {
  const existing = () => ({ id: 'event-1', title: 'Before', description: 'Description', category: 'Workshop', startsAt: new Date('2030-01-01T10:00:00Z'), endsAt: new Date('2030-01-01T11:00:00Z'), timezone: 'UTC', venue: 'Lab 1', expectedAudience: 'Members', organizer: 'ACM', campusRelevant: false, status: 'PUBLISHED', createdById: 'core-1', archivedAt: null });

  test('an executive can submit an event and it defaults to a Core-review draft', async () => {
    const auth = await token('executive', 'exec@example.test');
    const response = await request(app).post('/api/events').set('Authorization', `Bearer ${auth}`).send({
      title: 'New Workshop', description: 'A practical session', category: 'Workshop',
      startsAt: '2030-01-02T10:00:00Z', endsAt: '2030-01-02T11:00:00Z',
      venue: 'Lab 2', expectedAudience: 'Members', organizer: 'ACM'
    });
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('DRAFT');
  });

  test('anonymous visitors cannot create events', async () => {
    const response = await request(app).post('/api/events').send({
      title: 'Public write attempt', description: 'No session', category: 'Workshop',
      startsAt: '2030-01-02T10:00:00Z', endsAt: '2030-01-02T11:00:00Z',
      venue: 'Lab 2', expectedAudience: 'Members', organizer: 'ACM'
    });
    expect(response.status).toBe(401);
  });

  test('executive cannot update or delete events', async () => {
    state.events.push(existing());
    const auth = await token('executive', 'exec@example.test');
    expect((await request(app).patch('/api/events/event-1').set('Authorization', `Bearer ${auth}`).send({ title: 'Changed' })).status).toBe(403);
    expect((await request(app).delete('/api/events/event-1').set('Authorization', `Bearer ${auth}`)).status).toBe(403);
  });

  test('Core can update and archive an event', async () => {
    state.events.push(existing());
    const auth = await token('core', 'core@example.test');
    const updated = await request(app).patch('/api/events/event-1').set('Authorization', `Bearer ${auth}`).send({ title: 'Updated' });
    expect(updated.status).toBe(200);
    expect(updated.body.data.title).toBe('Updated');
    const archived = await request(app).delete('/api/events/event-1').set('Authorization', `Bearer ${auth}`);
    expect(archived.status).toBe(200);
    expect(archived.body.data.status).toBe('CANCELLED');
    expect(archived.body.data.archivedAt).toBeTruthy();
  });

  test('rejects end time earlier than start time', async () => {
    const auth = await token('core', 'core@example.test');
    const response = await request(app).post('/api/events').set('Authorization', `Bearer ${auth}`).send({
      title: 'Valid Title Here',
      description: 'A valid description of the proposed workshop.',
      category: 'Workshop',
      startsAt: '2030-01-01T12:00:00Z',
      endsAt: '2030-01-01T10:00:00Z',
      venue: 'Lab Room 101',
      expectedAudience: 'Members',
      organizer: 'ACM'
    });
    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  test('returns a structured warning when a scheduled event overlaps', async () => {
    state.events.push({ ...existing(), id: 'event-conflict', title: 'Other Workshop' });
    const auth = await token('executive', 'exec@example.test');
    const response = await request(app).post('/api/events').set('Authorization', `Bearer ${auth}`).send({
      title: 'New Workshop',
      description: 'A detailed workshop description for students.',
      category: 'Workshop',
      startsAt: '2030-01-01T10:30:00Z',
      endsAt: '2030-01-01T11:30:00Z',
      timezone: 'UTC',
      venue: 'Lab 1',
      expectedAudience: 'Members',
      organizer: 'ACM'
    });
    expect(response.status).toBe(409);
    expect(response.body.code).toBe('SCHEDULING_CONFLICT');
    expect(response.body.details[0].eventId).toBe('event-conflict');
    expect(response.body.details[0].reasons.length).toBeGreaterThan(0);
  });

  test('allows an executive to submit an overlapping event when explicitly acknowledged', async () => {
    state.events.push({ ...existing(), id: 'event-conflict', title: 'Other Workshop' });
    const auth = await token('executive', 'exec@example.test');
    const response = await request(app).post('/api/events').set('Authorization', `Bearer ${auth}`).send({
      title: 'Overlapping Exec Workshop',
      description: 'Executive acknowledges overlap and submits proposal for review.',
      category: 'Workshop',
      startsAt: '2030-01-01T10:30:00Z',
      endsAt: '2030-01-01T11:30:00Z',
      venue: 'Lab 1',
      expectedAudience: 'Members',
      organizer: 'ACM',
      allowConflict: true
    });
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('DRAFT');
    expect(response.body.data.conflicts).toHaveLength(1);
    expect(response.body.data.conflicts[0].eventId).toBe('event-conflict');
  });

  test('allows a Core member to explicitly accept a reviewed conflict', async () => {
    state.events.push({ ...existing(), id: 'event-conflict', title: 'Other Workshop' });
    const auth = await token('core', 'core@example.test');
    const response = await request(app).post('/api/events').set('Authorization', `Bearer ${auth}`).send({
      title: 'Accepted Workshop',
      description: 'A detailed workshop description for students.',
      category: 'Workshop',
      startsAt: '2030-01-01T10:30:00Z',
      endsAt: '2030-01-01T11:30:00Z',
      venue: 'Lab 1',
      expectedAudience: 'Members',
      organizer: 'ACM',
      allowConflict: true
    });
    expect(response.status).toBe(201);
    expect(response.body.data.conflicts).toHaveLength(1);
  });

  test('rejects whitespace-only and malformed form inputs', async () => {
    const auth = await token('executive', 'exec@example.test');
    // Whitespace title
    const res1 = await request(app).post('/api/events').set('Authorization', `Bearer ${auth}`).send({
      title: '   ',
      description: 'Valid description here',
      category: 'Workshop',
      startsAt: '2030-01-01T10:00:00Z',
      endsAt: '2030-01-01T11:00:00Z',
      venue: 'Lab 1',
      expectedAudience: 'Members',
      organizer: 'ACM'
    });
    expect(res1.status).toBe(400);

    // Title with only symbols/numbers
    const res2 = await request(app).post('/api/events').set('Authorization', `Bearer ${auth}`).send({
      title: '--- 12345 ---',
      description: 'Valid description here',
      category: 'Workshop',
      startsAt: '2030-01-01T10:00:00Z',
      endsAt: '2030-01-01T11:00:00Z',
      venue: 'Lab 1',
      expectedAudience: 'Members',
      organizer: 'ACM'
    });
    expect(res2.status).toBe(400);

    // Duration exceeding 14 days
    const res3 = await request(app).post('/api/events').set('Authorization', `Bearer ${auth}`).send({
      title: 'Super Long Event',
      description: 'Valid description here',
      category: 'Workshop',
      startsAt: '2030-01-01T10:00:00Z',
      endsAt: '2030-01-20T10:00:00Z',
      venue: 'Lab 1',
      expectedAudience: 'Members',
      organizer: 'ACM'
    });
    expect(res3.status).toBe(400);
  });
});

describe('executive upvoting and verification system', () => {
  const draftEvent = () => ({
    id: 'draft-upvote-1',
    title: 'Proposed AI Symposium',
    description: 'Executive proposal for an AI research conference.',
    category: 'Symposium',
    startsAt: new Date('2030-05-01T10:00:00Z'),
    endsAt: new Date('2030-05-01T12:00:00Z'),
    timezone: 'UTC',
    venue: 'Auditorium C',
    expectedAudience: 'Researchers and Students',
    organizer: 'AI Club',
    campusRelevant: true,
    status: 'DRAFT',
    createdById: 'exec-1',
    archivedAt: null
  });

  test('authenticated executive can upvote a draft event and toggle it off', async () => {
    state.events.push(draftEvent());
    const auth = await token('executive', 'exec@example.test');

    // First upvote -> added
    const res1 = await request(app).post('/api/events/draft-upvote-1/upvote').set('Authorization', `Bearer ${auth}`);
    expect(res1.status).toBe(200);
    expect(res1.body.success).toBe(true);
    expect(res1.body.data.upvoted).toBe(true);
    expect(res1.body.data.upvotesCount).toBe(1);

    // Second upvote from same user -> toggles off (deduplication / undo support)
    const res2 = await request(app).post('/api/events/draft-upvote-1/upvote').set('Authorization', `Bearer ${auth}`);
    expect(res2.status).toBe(200);
    expect(res2.body.data.upvoted).toBe(false);
    expect(res2.body.data.upvotesCount).toBe(0);
  });

  test('authenticated executive can explicitly remove an upvote via DELETE', async () => {
    state.events.push(draftEvent());
    state.upvotes.push({ id: 'upv-1', eventId: 'draft-upvote-1', userId: 'exec-1', createdAt: new Date() });
    const auth = await token('executive', 'exec@example.test');

    const res = await request(app).delete('/api/events/draft-upvote-1/upvote').set('Authorization', `Bearer ${auth}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.upvoted).toBe(false);
    expect(res.body.data.upvotesCount).toBe(0);
  });

  test('unauthenticated users receive 401 when attempting to upvote', async () => {
    state.events.push(draftEvent());
    const res = await request(app).post('/api/events/draft-upvote-1/upvote');
    expect(res.status).toBe(401);
  });

  test('cannot upvote an already published or cancelled event', async () => {
    state.events.push({
      id: 'pub-evt-10',
      title: 'Published Event',
      status: 'PUBLISHED',
      archivedAt: null
    });
    const auth = await token('executive', 'exec@example.test');
    const res = await request(app).post('/api/events/pub-evt-10/upvote').set('Authorization', `Bearer ${auth}`);
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_EVENT_STATE');
  });
});

describe('Core dashboard authorization', () => {
  test('public viewers receive 401', async () => {
    expect((await request(app).get('/api/core/dashboard')).status).toBe(401);
  });

  test('executives receive 403', async () => {
    const auth = await token('executive', 'exec@example.test');
    expect((await request(app).get('/api/core/dashboard').set('Authorization', `Bearer ${auth}`)).status).toBe(403);
  });

  test('Core members can read database-backed summary data including eventsUnderReview', async () => {
    state.events.push({
      id: 'draft-for-review',
      title: 'Cloud Computing BootCamp',
      description: 'Hands on AWS and GCP labs for ACM members.',
      category: 'BootCamp',
      startsAt: new Date('2030-06-01T09:00:00Z'),
      endsAt: new Date('2030-06-01T17:00:00Z'),
      timezone: 'UTC',
      venue: 'Lab 3',
      expectedAudience: 'Undergrads',
      organizer: 'Cloud SIG',
      status: 'DRAFT',
      createdById: 'exec-1',
      archivedAt: null
    });

    const auth = await token('core', 'core@example.test');
    const response = await request(app).get('/api/core/dashboard').set('Authorization', `Bearer ${auth}`);
    expect(response.status).toBe(200);
    expect(response.body.data.totalEvents).toBe(1);
    expect(response.body.data.totalExpenses).toBe('0.00');
    expect(response.body.data.eventsUnderReview).toBeDefined();
    expect(response.body.data.eventsUnderReview).toHaveLength(1);
    expect(response.body.data.eventsUnderReview[0].id).toBe('draft-for-review');
    expect(response.body.data.eventsUnderReview[0].createdBy.name).toBe('Executive');
  });
});

describe('financial records', () => {
  test('unauthenticated visitors cannot read expenses', async () => {
    expect((await request(app).get('/api/expenses')).status).toBe(401);
  });

  test('rejects negative and over-precision expense amounts', async () => {
    const auth = await token('executive', 'exec@example.test');
    for (const amount of ['-12.00', '10.999']) {
      const response = await request(app).post('/api/expenses').set('Authorization', `Bearer ${auth}`).send({ amount, category: 'Travel', transactionDate: '2030-01-01T00:00:00Z', description: 'Travel expense' });
      expect(response.status).toBe(400);
    }
  });

  test('an executive can submit a precise decimal amount', async () => {
    const auth = await token('executive', 'exec@example.test');
    const response = await request(app).post('/api/expenses').set('Authorization', `Bearer ${auth}`).send({ amount: '1250.50', category: 'Travel', transactionDate: '2030-01-01T00:00:00Z', description: 'Travel expense' });
    expect(response.status).toBe(201);
    expect(response.body.data.amount).toBe('1250.50');
  });

  test('supports keyword search on description and category', async () => {
    state.expenses.push(
      { id: 'exp-1', amount: '500.00', category: 'Food', description: 'Sandwiches for workshop', archivedAt: null, transactionDate: new Date('2030-01-01') },
      { id: 'exp-2', amount: '1500.00', category: 'Cloud', description: 'Compute GPU cluster credits', archivedAt: null, transactionDate: new Date('2030-01-02') }
    );
    const auth = await token('core', 'core@example.test');
    const response = await request(app).get('/api/expenses?search=Compute').set('Authorization', `Bearer ${auth}`);
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].id).toBe('exp-2');
  });
});

describe('event resolution and lifecycle workflow', () => {
  const sampleDraft = () => ({
    id: 'draft-evt-1',
    title: 'Proposed Robotics Seminar',
    description: 'Autonomous systems talk',
    category: 'Tech Talk',
    startsAt: new Date('2030-03-01T14:00:00Z'),
    endsAt: new Date('2030-03-01T16:00:00Z'),
    timezone: 'UTC',
    venue: 'Hall 401',
    expectedAudience: 'Engineers',
    organizer: 'Robotics Club',
    campusRelevant: false,
    status: 'DRAFT',
    createdById: 'exec-1',
    archivedAt: null
  });

  test('Core can resolve a draft event into published with resolution notes', async () => {
    state.events.push(sampleDraft());
    const auth = await token('core', 'core@example.test');
    const response = await request(app)
      .post('/api/events/draft-evt-1/resolve')
      .set('Authorization', `Bearer ${auth}`)
      .send({
        status: 'PUBLISHED',
        resolutionNotes: 'Approved by Core committee after timeslot verification.'
      });
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('PUBLISHED');
    expect(response.body.data.resolutionNotes).toBe('Approved by Core committee after timeslot verification.');
    expect(response.body.data.resolvedAt).toBeTruthy();
  });

  test('executives cannot resolve events', async () => {
    state.events.push(sampleDraft());
    const auth = await token('executive', 'exec@example.test');
    const response = await request(app)
      .post('/api/events/draft-evt-1/resolve')
      .set('Authorization', `Bearer ${auth}`)
      .send({ status: 'PUBLISHED' });
    expect(response.status).toBe(403);
  });

  test('Core can read draft events by ID while public visitors cannot', async () => {
    state.events.push(sampleDraft());
    const publicRes = await request(app).get('/api/events/draft-evt-1');
    expect(publicRes.status).toBe(404);

    const auth = await token('core', 'core@example.test');
    const coreRes = await request(app).get('/api/events/draft-evt-1').set('Authorization', `Bearer ${auth}`);
    expect(coreRes.status).toBe(200);
    expect(coreRes.body.data.id).toBe('draft-evt-1');
  });

  test('Core can list draft events with status filter', async () => {
    state.events.push(
      sampleDraft(),
      { id: 'pub-evt-2', title: 'Live Hackathon', category: 'Hackathon', startsAt: new Date('2030-03-02T10:00:00Z'), endsAt: new Date('2030-03-02T18:00:00Z'), timezone: 'UTC', venue: 'Auditorium', expectedAudience: 'All', organizer: 'ACM', campusRelevant: true, status: 'PUBLISHED', createdById: 'core-1', archivedAt: null }
    );

    const auth = await token('core', 'core@example.test');
    const draftsRes = await request(app).get('/api/events?status=DRAFT').set('Authorization', `Bearer ${auth}`);
    expect(draftsRes.status).toBe(200);
    expect(draftsRes.body.data.map((e) => e.id)).toEqual(['draft-evt-1']);

    const allRes = await request(app).get('/api/events?status=ALL').set('Authorization', `Bearer ${auth}`);
    expect(allRes.status).toBe(200);
    expect(allRes.body.data.length).toBeGreaterThanOrEqual(2);
  });

  test('rejects event resolution with scheduling conflict unless allowConflict is true', async () => {
    state.events.push(
      { id: 'existing-event', title: 'Main Hall Event', category: 'Workshop', startsAt: new Date('2030-04-01T10:00:00Z'), endsAt: new Date('2030-04-01T14:00:00Z'), timezone: 'UTC', venue: 'Main Hall', expectedAudience: 'All students', organizer: 'ACM', campusRelevant: true, status: 'PUBLISHED', createdById: 'core-1', archivedAt: null },
      { id: 'draft-conflict', title: 'Concurrent Expo', category: 'Exhibition', startsAt: new Date('2030-04-01T11:00:00Z'), endsAt: new Date('2030-04-01T13:00:00Z'), timezone: 'UTC', venue: 'Main Hall', expectedAudience: 'All students', organizer: 'Partner', campusRelevant: true, status: 'DRAFT', createdById: 'exec-1', archivedAt: null }
    );
    const auth = await token('core', 'core@example.test');

    const blocked = await request(app)
      .post('/api/events/draft-conflict/resolve')
      .set('Authorization', `Bearer ${auth}`)
      .send({ status: 'PUBLISHED', resolutionNotes: 'Attempting publish without override' });
    expect(blocked.status).toBe(409);
    expect(blocked.body.code).toBe('SCHEDULING_CONFLICT');

    const resolved = await request(app)
      .post('/api/events/draft-conflict/resolve')
      .set('Authorization', `Bearer ${auth}`)
      .send({
        status: 'PUBLISHED',
        allowConflict: true,
        resolutionNotes: 'Approved: Main Hall will be partitioned into North and South wings.'
      });
    expect(resolved.status).toBe(200);
    expect(resolved.body.data.status).toBe('PUBLISHED');
    expect(resolved.body.data.resolutionNotes).toContain('partitioned');
  });
});

describe('upvote route functionality', () => {
  const sampleDraft = () => ({
    id: 'draft-evt-1',
    title: 'Proposed AI Workshop',
    description: 'A detailed workshop description for students.',
    category: 'Workshop',
    startsAt: new Date('2030-05-01T10:00:00Z'),
    endsAt: new Date('2030-05-01T12:00:00Z'),
    timezone: 'UTC',
    venue: 'Auditorium C',
    expectedAudience: 'Students',
    organizer: 'AI Club',
    campusRelevant: true,
    status: 'DRAFT',
    createdById: 'exec-1',
    archivedAt: null
  });

  test('allows authenticated executive to upvote and remove upvote with accurate counts and upvotes array', async () => {
    state.events.push(sampleDraft());
    const auth = await token('executive', 'exec@example.test');

    // 1. Initial status: 0 upvotes
    const statusRes1 = await request(app)
      .get('/api/events/draft-evt-1/upvote')
      .set('Authorization', `Bearer ${auth}`);
    expect(statusRes1.status).toBe(200);
    expect(statusRes1.body.data.hasUpvoted).toBe(false);
    expect(statusRes1.body.data.upvoteCount).toBe(0);

    // 2. Upvote event
    const upvoteRes = await request(app)
      .post('/api/events/draft-evt-1/upvote')
      .set('Authorization', `Bearer ${auth}`);
    expect(upvoteRes.status).toBe(200);
    expect(upvoteRes.body.success).toBe(true);
    expect(upvoteRes.body.data.upvoted).toBe(true);
    expect(upvoteRes.body.data.upvoteCount).toBe(1);
    expect(Array.isArray(upvoteRes.body.data.upvotes)).toBe(true);
    expect(upvoteRes.body.data.upvotes.length).toBe(1);

    // 3. Status now reflects upvote
    const statusRes2 = await request(app)
      .get('/api/events/draft-evt-1/upvote')
      .set('Authorization', `Bearer ${auth}`);
    expect(statusRes2.status).toBe(200);
    expect(statusRes2.body.data.hasUpvoted).toBe(true);
    expect(statusRes2.body.data.upvoteCount).toBe(1);

    // 4. Toggle upvote off via POST
    const toggleRes = await request(app)
      .post('/api/events/draft-evt-1/upvote')
      .set('Authorization', `Bearer ${auth}`);
    expect(toggleRes.status).toBe(200);
    expect(toggleRes.body.data.upvoted).toBe(false);
    expect(toggleRes.body.data.upvoteCount).toBe(0);
    expect(toggleRes.body.data.upvotes.length).toBe(0);

    // 5. Upvote again, then explicitly delete
    await request(app)
      .post('/api/events/draft-evt-1/upvote')
      .set('Authorization', `Bearer ${auth}`);
    const deleteRes = await request(app)
      .delete('/api/events/draft-evt-1/upvote')
      .set('Authorization', `Bearer ${auth}`);
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.data.upvoted).toBe(false);
    expect(deleteRes.body.data.upvoteCount).toBe(0);
  });

  test('prevents unauthenticated visitors from voting', async () => {
    state.events.push(sampleDraft());
    const res = await request(app).post('/api/events/draft-evt-1/upvote');
    expect(res.status).toBe(401);
  });
});

describe('executive and core user management', () => {
  test('Core can create an executive account with auto-generated credentials', async () => {
    const auth = await token('core', 'core@example.test');
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${auth}`)
      .send({
        name: 'Jordan Lee',
        email: 'jordan.lee@example.test',
        role: 'EXECUTIVE',
        title: 'Lead Logistics Officer',
        department: 'Logistics',
        mustChangePassword: true
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('jordan.lee@example.test');
    expect(res.body.data.user.role).toBe('EXECUTIVE');
    expect(res.body.data.user.mustChangePassword).toBe(true);
    expect(res.body.data.generatedPassword).toBeTruthy();
  });

  test('Core can list users and update an executive profile', async () => {
    const auth = await token('core', 'core@example.test');
    const listRes = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${auth}`);
    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body.data)).toBe(true);

    const updateRes = await request(app)
      .patch('/api/users/exec-1')
      .set('Authorization', `Bearer ${auth}`)
      .send({
        title: 'Senior Officer',
        department: 'Technical'
      });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.title).toBe('Senior Officer');
  });

  test('Executives cannot access user management endpoints', async () => {
    const auth = await token('executive', 'exec@example.test');
    const listRes = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${auth}`);
    expect(listRes.status).toBe(403);
  });
});

describe('work assignments delegation', () => {
  test('Core can create and delegate a work assignment to an executive', async () => {
    const coreAuth = await token('core', 'core@example.test');
    const createRes = await request(app)
      .post('/api/work-assignments')
      .set('Authorization', `Bearer ${coreAuth}`)
      .send({
        title: 'Setup AV in Auditorium',
        description: 'Verify projector and wireless mics',
        priority: 'HIGH',
        assigneeId: 'exec-1'
      });
    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    expect(createRes.body.data.title).toBe('Setup AV in Auditorium');
    expect(createRes.body.data.assigneeId).toBe('exec-1');
  });

  test('Executive can view their assigned work and update task status', async () => {
    state.workAssignments.push({
      id: 'work-1',
      title: 'Review Attendee Badges',
      description: 'Print 150 name badges',
      priority: 'MEDIUM',
      status: 'PENDING',
      assigneeId: 'exec-1',
      assignerId: 'core-1',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const execAuth = await token('executive', 'exec@example.test');
    const listRes = await request(app)
      .get('/api/work-assignments')
      .set('Authorization', `Bearer ${execAuth}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.length).toBe(1);

    const updateRes = await request(app)
      .patch('/api/work-assignments/work-1')
      .set('Authorization', `Bearer ${execAuth}`)
      .send({ status: 'IN_PROGRESS' });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.status).toBe('IN_PROGRESS');
  });
});

describe('password change security', () => {
  test('allows user to change their password with valid current credentials', async () => {
    const auth = await token('core', 'core@example.test');
    const res = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${auth}`)
      .send({
        currentPassword: 'correct-password',
        newPassword: 'BrandNewPassword123!'
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('Password updated successfully');
  });

  test('rejects password change with incorrect current credentials', async () => {
    const auth = await token('core', 'core@example.test');
    const res = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${auth}`)
      .send({
        currentPassword: 'wrong-password-here',
        newPassword: 'BrandNewPassword123!'
      });
    expect(res.status).toBe(400);
  });
});

