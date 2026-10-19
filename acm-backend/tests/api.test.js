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

const state = { users: [], sessions: [], events: [], expenses: [], budgets: [], logs: [] };
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
const project = (record, select) => select ? Object.fromEntries(Object.entries(select).filter(([, on]) => on).map(([key]) => [key, record[key]])) : record;

const prisma = {
  user: {
    findUnique: jest.fn(async ({ where }) => clone(state.users.find((user) => user.email === where.email || user.id === where.id) || null)),
    create: jest.fn(async ({ data }) => { const user = { id: `user-${state.users.length + 1}`, ...data, isActive: true }; state.users.push(user); return clone(user); })
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
  $queryRaw: jest.fn(async () => [{ '?column?': 1 }]),
  $transaction: jest.fn(async (work) => work(prisma)),
  $disconnect: jest.fn()
};

await jest.unstable_mockModule('../src/config/prisma.js', () => ({ prisma }));
const { app } = await import('../src/app.js');
const passwordHash = await bcrypt.hash('correct-password', 4);

function reset() {
  state.users = [
    { id: 'core-1', email: 'core@example.test', name: 'Core', passwordHash, role: 'CORE', isActive: true },
    { id: 'exec-1', email: 'exec@example.test', name: 'Executive', passwordHash, role: 'EXECUTIVE', isActive: true },
    { id: 'viewer-1', email: 'viewer@example.test', name: 'Viewer', passwordHash, role: 'VIEWER', isActive: true }
  ];
  state.sessions = []; state.events = []; state.expenses = []; state.budgets = []; state.logs = [];
  for (const model of [prisma.user, prisma.authSession, prisma.event, prisma.expense, prisma.budget, prisma.activityLog]) {
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
    const response = await request(app).post('/api/events').set('Authorization', `Bearer ${auth}`).send({ title: 'Bad', description: 'x', category: 'Workshop', startsAt: '2030-01-01T12:00:00Z', endsAt: '2030-01-01T10:00:00Z', venue: 'Lab', expectedAudience: 'Members', organizer: 'ACM' });
    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  test('returns a structured warning when a scheduled event overlaps', async () => {
    state.events.push({ ...existing(), id: 'event-conflict', title: 'Other Workshop' });
    const auth = await token('executive', 'exec@example.test');
    const response = await request(app).post('/api/events').set('Authorization', `Bearer ${auth}`).send({ title: 'New Workshop', description: 'x', category: 'Workshop', startsAt: '2030-01-01T10:30:00Z', endsAt: '2030-01-01T11:30:00Z', timezone: 'UTC', venue: 'Lab 1', expectedAudience: 'Members', organizer: 'ACM' });
    expect(response.status).toBe(409);
    expect(response.body.code).toBe('SCHEDULING_CONFLICT');
    expect(response.body.details[0].eventId).toBe('event-conflict');
    expect(response.body.details[0].reasons.length).toBeGreaterThan(0);
  });

  test('allows a Core member to explicitly accept a reviewed conflict', async () => {
    state.events.push({ ...existing(), id: 'event-conflict', title: 'Other Workshop' });
    const auth = await token('core', 'core@example.test');
    const response = await request(app).post('/api/events').set('Authorization', `Bearer ${auth}`).send({ title: 'Accepted Workshop', description: 'x', category: 'Workshop', startsAt: '2030-01-01T10:30:00Z', endsAt: '2030-01-01T11:30:00Z', venue: 'Lab 1', expectedAudience: 'Members', organizer: 'ACM', allowConflict: true });
    expect(response.status).toBe(201);
    expect(response.body.data.conflicts).toHaveLength(1);
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

  test('Core members can read database-backed summary data', async () => {
    const auth = await token('core', 'core@example.test');
    const response = await request(app).get('/api/core/dashboard').set('Authorization', `Bearer ${auth}`);
    expect(response.status).toBe(200);
    expect(response.body.data.totalEvents).toBe(0);
    expect(response.body.data.totalExpenses).toBe('0.00');
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

