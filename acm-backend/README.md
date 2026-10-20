# ACM Conflict-Aware Events and Expenses Manager API

Backend-only Express API for ACM events, scheduling conflicts, expenses, budgets, and the private Core dashboard. It uses PostgreSQL through Prisma. Monetary values are accepted and returned as decimal strings so application code does not calculate money with JavaScript floating-point numbers.

## Requirements

- Node.js 20 or newer and npm
- PostgreSQL 14 or newer
- A database and account with permission to create tables and indexes

## Install and run

From this directory:

```powershell
npm install
Copy-Item .env.example .env
```

Edit `.env` and set `DATABASE_URL`, a random `JWT_SECRET` with at least 32 characters, and the allowed frontend origin(s) in `CORS_ORIGIN`. Multiple exact origins can be comma-separated. The API uses bearer tokens, so CORS does not enable credentials or cookies.

Create an empty PostgreSQL database, then run:

```powershell
npm run prisma:generate
npm run prisma:migrate
npm run db:seed
npm run dev
```

The server listens at `http://localhost:4000` by default. Use `npm start` for a non-watch start. For an already deployed database, use `npm run prisma:deploy` instead of the development migration command. `GET /api/health` reports app and database status without returning connection details.

## Bootstrap accounts safely

There is no public registration endpoint. To create the first Core account, temporarily set both `CORE_BOOTSTRAP_EMAIL` and `CORE_BOOTSTRAP_PASSWORD` in `.env` (password must be at least 12 characters), then run `npm run db:seed`. The seed creates the account only when the email does not already exist; it will not promote an existing account or replace its password. Remove the bootstrap password from the environment after setup. Use a password manager generated secret.

Demo accounts are off by default. They can only be seeded when `SEED_DEMO=true` and all `DEMO_*` email/password values are explicitly set. Demo seeding refuses to run in production. No default production passwords are included.

## Authentication and roles

Roles are `VIEWER`, `EXECUTIVE`, and `CORE`. Viewers are anonymous and have no login account. An account's database role controls access; request-body roles are ignored. Login responses return a JWT access token. Send it on protected routes as `Authorization: Bearer <token>`.

Tokens include a unique session ID. The server stores each session in PostgreSQL and checks it on every authenticated request. Logout marks that session revoked in the database, so a copied token stops working immediately. Expired sessions are rejected; old session rows can be cleaned up periodically by an operations job.

## Routes and permissions

All endpoints use the `/api` prefix. Responses use `{ "success", "message", "data" }`; paged list endpoints also return `pagination`. Validation errors include a `details` array. Conflict responses use HTTP 409 and `code: "SCHEDULING_CONFLICT"`.

| Method and path | Access | Description |
| --- | --- | --- |
| `GET /health` | Public | Service and database health |
| `POST /auth/executive/login` | Public, rate limited | Executive login (database role must be `EXECUTIVE`) |
| `POST /auth/core/login` | Public, rate limited | Core login (database role must be `CORE` or `ADMIN`) |
| `POST /auth/logout` | Authenticated | Revoke current JWT session in database |
| `GET /auth/me` | Authenticated | Current account profile and role |
| `POST /auth/change-password` | Authenticated | Rotate user password (forced on first login if flagged) |
| `GET /events` | Public / Optional Auth | Published events with category/date/search/pagination/sort filters (Core sees drafts) |
| `GET /events/past` | Public | Published completed events, newest first |
| `GET /events/upcoming` | Public | Published upcoming events, soonest first |
| `GET /events/:id` | Public / Optional Auth | Event detail (public views published; Core views draft proposals) |
| `POST /events` | Executive, Core, Admin | Create event (defaults to DRAFT for Executive, PUBLISHED for Core) |
| `PATCH /events/:id` | Core, Admin | Update event metadata and timeslots |
| `DELETE /events/:id` | Core, Admin | Soft-archive and cancel an event; preserves history and expenses |
| `POST /events/:id/resolve` | Core, Admin | Formal review console to publish, reschedule, or cancel a draft |
| `GET /events/:id/upvote` | Optional Auth | Endorsement upvote total count and peer voter roster |
| `POST /events/:id/upvote` | Executive, Core, Admin | Endorse a draft event (toggles off if already upvoted) |
| `DELETE /events/:id/upvote` | Executive, Core, Admin | Remove endorsement upvote from a draft event |
| `GET /core/dashboard` | Core, Admin | Aggregated dashboard: totals, conflicts, budgets, spending, drafts, team |
| `GET /core/dashboard/summary` | Core, Admin | Summary operational counts and financial balance |
| `GET /core/dashboard/conflicts` | Core, Admin | Automated radar matrix of detected event collisions |
| `GET /core/dashboard/recent-activity` | Core, Admin | Chronological audit trail dispatch |
| `GET /expenses` | Executive, Core, Admin | Filtered, paginated financial records (supports search) |
| `GET /expenses/:id` | Executive, Core, Admin | Detailed expense record |
| `POST /expenses` | Executive, Core, Admin | Submit an expense claim with decimal precision |
| `PATCH /expenses/:id` | Core, Admin | Update an expense record |
| `DELETE /expenses/:id` | Core, Admin | Soft-archive an expense; preserves historical audit trail |
| `GET /budgets` | Executive, Core, Admin | Budgets with spending and remaining balances |
| `GET /budgets/current` | Executive, Core, Admin | Active monthly or semester budget allocation |
| `POST /budgets` | Core, Admin | Establish a semester or monthly budget envelope |
| `PATCH /budgets/:id` | Core, Admin | Adjust allocation cap on an existing budget |
| `GET /users` | Core, Admin | Chapter member directory with activity statistics |
| `POST /users` | Core, Admin | Provision a user account with optional auto-generated credentials |
| `GET /users/:id` | Core, Admin | User account detail |
| `PATCH /users/:id` | Core, Admin | Update user role, title, department, or active status |
| `DELETE /users/:id` | Core, Admin | Deactivate a user account |
| `GET /work-assignments` | Executive, Core, Admin | Work delegation board (Executives receive their assigned tasks) |
| `POST /work-assignments` | Core, Admin | Delegate a task assignment to an executive officer |
| `PATCH /work-assignments/:id` | Executive, Core, Admin | Update task status (`PENDING`, `IN_PROGRESS`, `COMPLETED`) |
| `DELETE /work-assignments/:id` | Core, Admin | Delete a delegated task assignment |

## Example requests

Executive login:

```http
POST /api/auth/executive/login
Content-Type: application/json

{"email":"executive@example.org","password":"your-password"}
```

Create a published event as an executive or Core member. Times must include an explicit UTC offset; the normalized timestamp is stored as an absolute instant and the IANA `timezone` is retained for display.

```http
POST /api/events
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Intro to Machine Learning",
  "description": "A hands-on workshop.",
  "category": "Workshop",
  "startsAt": "2027-02-12T10:00:00+05:30",
  "endsAt": "2027-02-12T12:00:00+05:30",
  "timezone": "Asia/Kolkata",
  "venue": "Computer Lab 2",
  "expectedAudience": "ACM members, students",
  "organizer": "ACM Student Chapter",
  "campusRelevant": false,
  "status": "PUBLISHED"
}
```

Conflicts check true time overlap and any of: same venue (case-insensitive), an intersecting comma/semicolon-separated audience label (with `all`, `everyone`, or `campus` treated as universal), or both events marked campus-relevant. Cancelled and archived events are excluded. The write checks and event change run in a serializable database transaction. By default, a conflict returns 409 with the conflicting event IDs, titles, times, venue, and reason. When confirmed, sending `"allowConflict": true` allows both Executive (as a draft proposal) and Core (as published) to proceed with explicit acknowledgment.

For complete architectural diagrams, user flowcharts, and system specifications, refer to the master [README.md](../README.md).

Create an expense as a finance-authorized user. Supply amounts as decimal strings, not JSON floating-point numbers. Receipt hosting is not configured; an optional HTTPS receipt URL can be recorded.

```http
POST /api/expenses
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": "1250.50",
  "category": "Food",
  "transactionDate": "2027-02-12T13:00:00+05:30",
  "description": "Refreshments for the workshop",
  "eventId": null,
  "receiptUrl": "https://receipts.example.org/receipt-123"
}
```

Create a monthly or semester budget as Core. Dates are inclusive for expense summaries.

```http
POST /api/budgets
Authorization: Bearer <core-token>
Content-Type: application/json

{
  "name": "Spring semester 2027",
  "period": "SEMESTER",
  "startsAt": "2027-01-01T00:00:00+05:30",
  "endsAt": "2027-05-31T23:59:59+05:30",
  "totalAmount": "50000.00"
}
```

Use these requests in Postman or Thunder Client. First log in and copy the `data.token`; set it as a Bearer token for protected routes. `GET /api/events` and `/api/health` can be called without a token.

## Tests and verification

Run the mocked HTTP suite with:

```powershell
npm test
```

Tests use Jest and Supertest with a mocked Prisma client, so they verify routing, validation, authentication, role enforcement, and response behavior without claiming PostgreSQL integration coverage. PostgreSQL-specific migration deployment and live query behavior must be verified after setting a real `DATABASE_URL`.

## Limitations and operational notes

- This workspace did not have a PostgreSQL server/client configured; migrations were generated from the Prisma schema but were not applied to a live database.
- No receipt file uploads are implemented. The receipt reference logic is isolated in `src/services/receiptStorage.service.js` for a future object-storage integration.
- Public event routes show only published, non-archived events. Drafts, archived records, financial records, and all dashboard routes remain protected.
- `DELETE` event and expense operations are soft archives. Event rows are never physically removed by the API; linked financial history is preserved.
- The API has no frontend and makes no changes outside this `acm-backend/` directory.
