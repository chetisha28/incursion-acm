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

  it('4b. Executive submits overlapping event without override -> receives 409 warning', async () => {
    const res = await fetch(`${BASE_URL}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${executiveToken}`
      },
      body: JSON.stringify({
        title: 'Concurrent Golang Workshop',
        description: 'Overlapping systems workshop in the same venue.',
        category: 'WORKSHOP',
        venue: 'Auditorium East Wing',
        startsAt: new Date(Date.now() + 86400000 * 20 + 1800000).toISOString(),
        endsAt: new Date(Date.now() + 86400000 * 20 + 7200000).toISOString(),
        timezone: 'UTC',
        expectedAudience: 'Undergraduate Computer Science students',
        organizer: 'Golang Club',
        campusRelevant: true
      })
    });
    const json = await res.json();
    assert.equal(res.status, 409, 'Expected 409 SCHEDULING_CONFLICT');
    assert.equal(json.code, 'SCHEDULING_CONFLICT');
    assert.ok(Array.isArray(json.details));
    assert.ok(json.details.length > 0);
  });

  it('4c. Executive submits overlapping event with allowConflict: true -> succeeds with 201', async () => {
    const res = await fetch(`${BASE_URL}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${executiveToken}`
      },
      body: JSON.stringify({
        title: 'Concurrent Golang Workshop',
        description: 'Overlapping systems workshop with explicit acknowledgment.',
        category: 'WORKSHOP',
        venue: 'Auditorium East Wing',
        startsAt: new Date(Date.now() + 86400000 * 20 + 1800000).toISOString(),
        endsAt: new Date(Date.now() + 86400000 * 20 + 7200000).toISOString(),
        timezone: 'UTC',
        expectedAudience: 'Undergraduate Computer Science students',
        organizer: 'Golang Club',
        campusRelevant: true,
        allowConflict: true
      })
    });
    const json = await res.json();
    assert.equal(res.status, 201, `Expected 201: ${JSON.stringify(json)}`);
    assert.equal(json.success, true);
    assert.equal(json.data.status, 'DRAFT');
    assert.ok(json.data.conflicts.length > 0);
    // Cleanup the secondary conflict test event
    await fetch(`${BASE_URL}/events/${json.data.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${coreToken}` }
    });
  });

  it('4d. Executive upvotes draft event, toggles it off, and re-applies upvote', async () => {
    // 1. Initial upvote
    const vote1 = await fetch(`${BASE_URL}/events/${createdEventId}/upvote`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${executiveToken}` }
    });
    const json1 = await vote1.json();
    assert.equal(vote1.status, 200);
    assert.equal(json1.data.upvoted, true);
    assert.equal(json1.data.upvoteCount, 1);

    // 2. Duplicate upvote by same executive -> toggles off
    const vote2 = await fetch(`${BASE_URL}/events/${createdEventId}/upvote`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${executiveToken}` }
    });
    const json2 = await vote2.json();
    assert.equal(vote2.status, 200);
    assert.equal(json2.data.upvoted, false);
    assert.equal(json2.data.upvoteCount, 0);

    // 3. Re-upvote to maintain endorsement
    const vote3 = await fetch(`${BASE_URL}/events/${createdEventId}/upvote`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${executiveToken}` }
    });
    const json3 = await vote3.json();
    assert.equal(vote3.status, 200);
    assert.equal(json3.data.upvoted, true);
    assert.equal(json3.data.upvoteCount, 1);

    // 4. Core lead also endorses the event -> upvote count reaches 2
    const voteCore = await fetch(`${BASE_URL}/events/${createdEventId}/upvote`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${coreToken}` }
    });
    const jsonCore = await voteCore.json();
    assert.equal(voteCore.status, 200);
    assert.equal(jsonCore.data.upvoted, true);
    assert.equal(jsonCore.data.upvoteCount, 2);
  });

  it('5. Public unauthenticated user CANNOT access draft event (404 expected)', async () => {
    const res = await fetch(`${BASE_URL}/events/${createdEventId}`);
    assert.equal(res.status, 404);
  });

  it('5b. Public unauthenticated user CANNOT upvote events (401 expected)', async () => {
    const res = await fetch(`${BASE_URL}/events/${createdEventId}/upvote`, {
      method: 'POST'
    });
    assert.equal(res.status, 401);
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
    assert.ok(json.data.upvotes);
    assert.equal(json.data.upvotes.length, 2);
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

  it('7b. Core dashboard returns eventsUnderReview containing the draft event', async () => {
    const res = await fetch(`${BASE_URL}/core/dashboard`, {
      headers: { Authorization: `Bearer ${coreToken}` }
    });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(Array.isArray(json.data.eventsUnderReview));
    const draftInReview = json.data.eventsUnderReview.find(e => e.id === createdEventId);
    assert.ok(draftInReview, 'Draft must be present in eventsUnderReview array on Core Dashboard');
    assert.equal(draftInReview.status, 'DRAFT');
    assert.ok(draftInReview.createdBy);
    assert.equal(draftInReview.createdBy.role, 'EXECUTIVE');
    assert.ok(draftInReview.upvotes.length >= 2);
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

  it('9b. Cannot upvote an already published event (400 expected)', async () => {
    const res = await fetch(`${BASE_URL}/events/${createdEventId}/upvote`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${executiveToken}` }
    });
    assert.equal(res.status, 400);
    const json = await res.json();
    assert.equal(json.code, 'INVALID_EVENT_STATE');
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

  let newExecId;
  let newExecEmail;
  let newExecPassword;
  let newExecToken;
  let newWorkId;

  it('15. Core creates a new executive account with generated credentials', async () => {
    newExecEmail = `exec.e2e.${Date.now()}@acm.org`;
    const res = await fetch(`${BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${coreToken}`
      },
      body: JSON.stringify({
        name: 'Alex Executive',
        email: newExecEmail,
        role: 'EXECUTIVE',
        title: 'Lead Logistics Officer',
        department: 'Logistics',
        mustChangePassword: true
      })
    });
    assert.equal(res.status, 201);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.data.user.email, newExecEmail);
    assert.equal(json.data.user.role, 'EXECUTIVE');
    assert.equal(json.data.user.mustChangePassword, true);
    assert.ok(json.data.generatedPassword);
    newExecId = json.data.user.id;
    newExecPassword = json.data.generatedPassword;
  });

  it('16. Newly created executive logs in using generated credentials', async () => {
    const res = await fetch(`${BASE_URL}/auth/executive/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: newExecEmail,
        password: newExecPassword
      })
    });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.data.user.email, newExecEmail);
    assert.equal(json.data.user.mustChangePassword, true);
    assert.ok(json.data.token);
    newExecToken = json.data.token;
  });

  it('17. Newly created executive establishes new personal password on first login', async () => {
    const res = await fetch(`${BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${newExecToken}`
      },
      body: JSON.stringify({
        currentPassword: newExecPassword,
        newPassword: 'PersonalSecurePassword123!'
      })
    });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);

    // Verify login with new password succeeds
    const loginRes = await fetch(`${BASE_URL}/auth/executive/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: newExecEmail,
        password: 'PersonalSecurePassword123!'
      })
    });
    assert.equal(loginRes.status, 200);
    const loginJson = await loginRes.json();
    assert.equal(loginJson.data.user.mustChangePassword, false);
    newExecToken = loginJson.data.token;
  });

  it('18. Core assigns work responsibility to executive and tracks progress', async () => {
    // 1. Core creates work assignment
    const assignRes = await fetch(`${BASE_URL}/work-assignments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${coreToken}`
      },
      body: JSON.stringify({
        title: 'Coordinate Stage Lighting and Podium',
        description: 'Liaise with university AV team for the keynote hall.',
        priority: 'HIGH',
        assigneeId: newExecId,
        dueDate: new Date(Date.now() + 86400000 * 5).toISOString()
      })
    });
    assert.equal(assignRes.status, 201);
    const assignJson = await assignRes.json();
    assert.equal(assignJson.success, true);
    assert.equal(assignJson.data.title, 'Coordinate Stage Lighting and Podium');
    assert.equal(assignJson.data.assigneeId, newExecId);
    assert.equal(assignJson.data.status, 'PENDING');
    newWorkId = assignJson.data.id;

    // 2. Executive views their work assignments
    const listRes = await fetch(`${BASE_URL}/work-assignments`, {
      headers: { Authorization: `Bearer ${newExecToken}` }
    });
    assert.equal(listRes.status, 200);
    const listJson = await listRes.json();
    assert.ok(listJson.data.some((w) => w.id === newWorkId));

    // 3. Executive updates status to IN_PROGRESS
    const updateRes = await fetch(`${BASE_URL}/work-assignments/${newWorkId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${newExecToken}`
      },
      body: JSON.stringify({ status: 'IN_PROGRESS' })
    });
    assert.equal(updateRes.status, 200);
    const updateJson = await updateRes.json();
    assert.equal(updateJson.data.status, 'IN_PROGRESS');

    // 4. Core marks as COMPLETED
    const compRes = await fetch(`${BASE_URL}/work-assignments/${newWorkId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${coreToken}`
      },
      body: JSON.stringify({ status: 'COMPLETED' })
    });
    assert.equal(compRes.status, 200);
    const compJson = await compRes.json();
    assert.equal(compJson.data.status, 'COMPLETED');

    // Cleanup work assignment and user
    await fetch(`${BASE_URL}/work-assignments/${newWorkId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${coreToken}` }
    });
    await fetch(`${BASE_URL}/users/${newExecId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${coreToken}` }
    });
  });
});
