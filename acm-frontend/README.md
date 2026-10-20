# ACM Campus Events

A Next.js App Router frontend for the ACM campus events and expenses manager. It is kept in its own directory so the existing Express/Prisma API remains untouched. There was no ACM logo asset in the repository, so the site uses an original text-only ACM wordmark and does not present it as an official logo.

## Run locally

Node.js 20.9 or newer is required. From `acm-frontend/`:

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

The site runs at `http://localhost:3000`. Set `NEXT_PUBLIC_API_URL` in `.env.local` to the backend API prefix; the default is `http://localhost:4000/api`. The Express backend's `CORS_ORIGIN` must include `http://localhost:3000`.

Start the backend in a separate terminal from `acm-backend/` after configuring its PostgreSQL `DATABASE_URL` and other server secrets:

```powershell
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

Before running those commands, create `acm-backend/.env` from its `.env.example` and set the database URL, JWT secret, CORS origin, and a safe Core bootstrap account as needed. The current workspace does not have a PostgreSQL server configured; without one, public API reads and account sign-in return service errors/empty-unavailable states rather than sample data.

For a production build:

```powershell
npm run build
npm start
```

## API integrations

The client is centralized in `lib/api.js`, and reads the bearer-token API directly:

- **Public**: `GET /events`, `/events/upcoming`, `/events/past`, and `/events/:id`
- **Auth**: `POST /auth/executive/login`, `POST /auth/core/login`, `GET /auth/me`, `POST /auth/logout`, and `POST /auth/change-password`
- **Event Lifecycle & Governance**: `POST /events`, `PATCH /events/:id`, `DELETE /events/:id`, and `POST /events/:id/resolve`
- **Peer Verification**: `GET /events/:id/upvote`, `POST /events/:id/upvote`, and `DELETE /events/:id/upvote`
- **Core Operations**: `GET /core/dashboard`, `/core/dashboard/summary`, `/core/dashboard/conflicts`, and `/core/dashboard/recent-activity`
- **Financial Ledger & Budgets**: `GET /expenses`, `POST /expenses`, `PATCH /expenses/:id`, `DELETE /expenses/:id`, `GET /budgets`, `GET /budgets/current`, `POST /budgets`, and `PATCH /budgets/:id`
- **Team & Work Delegation**: `GET /users`, `POST /users`, `PATCH /users/:id`, `DELETE /users/:id`, `GET /work-assignments`, `POST /work-assignments`, `PATCH /work-assignments/:id`, and `DELETE /work-assignments/:id`

The backend response envelope is parsed as `{ success, message, data }`, with pagination read from the actual list response. Its 400/401/403/409 errors are surfaced in the form or access UI. The app stores the access token in tab-scoped `sessionStorage`; the backend checks its revocable session on each protected request. Logout calls the backend revocation route before clearing local state.

## Features

- **Three Public Event Views**: Upcoming cards, an interactive month/week/agenda FullCalendar, and completed public events archive.
- **Search and Category Filtering**: Filter by category and search keyword against the backend published event index.
- **Dynamic Ribbons**: Smooth CSS/SVG wind sequence, skip-intro control, and full reduced-motion support.
- **Peer-Verified Executive Submissions**: Chapter executives submit proposals that default to `DRAFT` status and can be endorsed (upvoted) by peer officers. Proposals with $\ge 2$ upvotes receive a `PEER VERIFIED` status badge.
- **Core Operations Desk (`/core/dashboard`)**:
  - `[ 01 · OVERVIEW ]`: Continuous operational ticker ribbons, live collision alerts, proposals review queue with quick-approval, and chronological agenda table.
  - `[ 02 · CONFLICT CENTER ]`: Automated spatial/temporal collision matrix with side-by-side venue and timeslot clash comparisons.
  - `[ 03 · FINANCIAL LEDGER ]`: Full double-entry expenditure ledger, semester allocation balance tracking, and category-wise spend bars.
  - `[ 04 · ANALYTICAL REPORT ]`: Chapter fiscal burn rate, spending velocity, and category distribution reports.
  - `[ 05 · CHAPTER TEAM & EXECUTIVES ]`: Team directory, user provisioning with auto-generated secure passwords, and forced initial password rotation.
  - `[ 06 · WORK ASSIGNMENTS ]`: Chapter task delegation board with priority levels (`LOW`, `MEDIUM`, `HIGH`, `URGENT`) and status lifecycles.
- **Strict Role-Tiered Access**: Distinct login portals for Executive and Core Administrator accounts with server-authoritative role verification.

## Operational notes and limitations

- Public event listing returns published events only; Core dashboard and privileged views display draft proposals and cancelled events.
- Receipt storage currently records external HTTPS receipt URLs; direct multi-part file upload to AWS S3/Cloudflare R2 is isolated in `src/services/receiptStorage.service.js` for future cloud storage integration.
- For complete architecture diagrams, database schemas, and end-to-end workflows, see the root [README.md](../README.md).

## Verification

`npm run build` compiles the Next.js application. Event and login interactions require a running API and configured PostgreSQL database; there is no mock server or fallback content in this app.

