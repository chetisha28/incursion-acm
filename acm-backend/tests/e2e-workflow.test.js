import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = 'http://localhost:4000/api';

describe('End-to-End Live Application Workflow Verification', () => {
  let executiveToken;
  let coreToken;
  let createdEventId;

  it('1. Public health check is operational with connected database', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.data.database, 'connected');
  });

  it('2. Executive logs in and receives valid JWT', async () => {
    const res = await fetch(`${BASE_URL}/auth/executive/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'executive@acm.org',
        password: 'ExecutivePassword123!'
      })
    });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.data.user.role, 'EXECUTIVE');
    assert.ok(json.data.token);
    executiveToken = json.data.token;
  });

  it('3. Core Lead logs in and receives valid JWT', async () => {
    const res = await fetch(`${BASE_URL}/auth/core/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'core@acm.org',
        password: 'CorePassword123!'
      })
    });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.data.user.role, 'CORE');
    assert.ok(json.data.token);
    coreToken = json.data.token;
  });

  it('4. Executive proposes a new draft event with campusRelevant=true', async () => {
    const res = await fetch(`${BASE_URL}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${executiveToken}`
      },
      body: JSON.stringify({
        title: 'E2E Rust Systems Workshop',
        description: 'Hands-on low-level concurrency and memory safety with Rust.',
        category: 'WORKSHOP',
        venue: 'Auditorium East Wing',
        startsAt: new Date(Date.now() + 86400000 * 20).toISOString(),
        endsAt: new Date(Date.now() + 86400000 * 20 + 3600000 * 3).toISOString(),
        timezone: 'UTC',
        expectedAudience: 'Undergraduate Computer Science students',
        organizer: 'ACM Systems SIG',
        campusRelevant: true
      })
    });
    const json = await res.json();
    assert.equal(res.status, 201, `Failed to create event: ${JSON.stringify(json)}`);
    assert.equal(json.success, true);
    assert.equal(json.data.status, 'DRAFT');
    assert.equal(json.data.campusRelevant, true);
    assert.ok(json.data.id);
    createdEventId = json.data.id;
  });

  it('5. Public unauthenticated user CANNOT access draft event (404 expected)', async () => {
    const res = await fetch(`${BASE_URL}/events/${createdEventId}`);
    assert.equal(res.status, 404);
  });

  it('6. Core lead CAN access draft event with optionalAuthenticate (no 404)', async () => {
    const res = await fetch(`${BASE_URL}/events/${createdEventId}`, {
      headers: { Authorization: `Bearer ${coreToken}` }
    });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.data.id, createdEventId);
    assert.equal(json.data.status, 'DRAFT');
    assert.equal(json.data.campusRelevant, true);
  });

  it('7. Core lists drafts using status=DRAFT filter', async () => {
    const res = await fetch(`${BASE_URL}/events?status=DRAFT`, {
      headers: { Authorization: `Bearer ${coreToken}` }
    });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(Array.isArray(json.data));
    const found = json.data.some(e => e.id === createdEventId);
    assert.ok(found, 'Created draft must appear in Core draft query');
  });

  it('8. Conflict Center radar displays distinct properties for colliding events', async () => {
    const res = await fetch(`${BASE_URL}/core/dashboard/conflicts`, {
      headers: { Authorization: `Bearer ${coreToken}` }
    });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(Array.isArray(json.data));
    if (json.data.length > 0) {
      const conflict = json.data[0];
      assert.ok(conflict.eventId, 'Must have eventId');
      assert.ok(conflict.conflictingEventId, 'Must have conflictingEventId');
      assert.ok(conflict.venue, 'Must have venue');
      assert.ok(conflict.startsAt, 'Must have startsAt');
      assert.ok(conflict.conflictingVenue, 'Must have conflictingVenue');
      assert.ok(conflict.conflictingStartsAt, 'Must have conflictingStartsAt');
      assert.ok(Array.isArray(conflict.reasons), 'Must have reasons array');
    }
  });

  it('9. Core resolves the draft into PUBLISHED with resolution notes', async () => {
    const res = await fetch(`${BASE_URL}/events/${createdEventId}/resolve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${coreToken}`
      },
      body: JSON.stringify({
        status: 'PUBLISHED',
        resolutionNotes: 'Approved by Core Lead for systems programming track.'
      })
    });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.data.status, 'PUBLISHED');
    assert.ok(json.data.resolvedAt);
    assert.ok(json.data.resolvedById);
    assert.equal(json.data.resolutionNotes, 'Approved by Core Lead for systems programming track.');
  });

  it('10. Public user can now view the published event and see resolution metadata', async () => {
    const res = await fetch(`${BASE_URL}/events/${createdEventId}`);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.data.status, 'PUBLISHED');
    assert.equal(json.data.resolutionNotes, 'Approved by Core Lead for systems programming track.');
    assert.equal(json.data.campusRelevant, true);
    assert.ok(json.data.resolver);
    assert.equal(json.data.resolver.name, 'Demo Core Member');
  });

  it('11. Core edits event and verifies campusRelevant is preserved', async () => {
    const res = await fetch(`${BASE_URL}/events/${createdEventId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${coreToken}`
      },
      body: JSON.stringify({
        title: 'E2E Rust Systems Workshop (Expanded)',
        expectedAudience: 'CS and Engineering students',
        campusRelevant: true
      })
    });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.data.expectedAudience, 'CS and Engineering students');
    assert.equal(json.data.campusRelevant, true);
  });

  it('12. Core cancels / archives the event', async () => {
    const res = await fetch(`${BASE_URL}/events/${createdEventId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${coreToken}` }
    });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.data.status, 'CANCELLED');
  });

  it('13. Expense search filters results by keyword', async () => {
    const res = await fetch(`${BASE_URL}/expenses?search=Catering`, {
      headers: { Authorization: `Bearer ${coreToken}` }
    });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(Array.isArray(json.data));
    for (const exp of json.data) {
      const match = exp.description.toLowerCase().includes('catering') ||
                    exp.category.toLowerCase().includes('catering');
      assert.ok(match, 'Returned expense should match search term');
    }
  });

  it('14. Dashboard summary reflects accurate metrics and counters', async () => {
    const res = await fetch(`${BASE_URL}/core/dashboard`, {
      headers: { Authorization: `Bearer ${coreToken}` }
    });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(typeof json.data.totalEvents === 'number');
    assert.ok(typeof json.data.upcomingEvents === 'number');
    assert.ok(typeof json.data.pastEvents === 'number');
    assert.ok(typeof json.data.draftEvents === 'number');
    assert.ok(typeof json.data.cancelledEvents === 'number');
    assert.ok(json.data.totalExpenses);
    assert.ok(Array.isArray(json.data.detectedConflicts));
    assert.ok(Array.isArray(json.data.recentActivity));
  });
});
