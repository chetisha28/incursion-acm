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

- Public: `GET /events`, `/events/upcoming`, `/events/past`, and `/events/:id`
- Auth: `POST /auth/executive/login`, `POST /auth/core/login`, `GET /auth/me`, and `POST /auth/logout`
- Event changes: `POST /events`, `PATCH /events/:id`, and `DELETE /events/:id`
- Core view: `GET /core/dashboard`

The backend response envelope is parsed as `{ success, message, data }`, with pagination read from the actual list response. Its 400/401/403/409 errors are surfaced in the form or access UI. The app stores the access token in tab-scoped `sessionStorage`; the backend checks its revocable session on each protected request. Logout calls the backend revocation route before clearing local state.

## Features

- Three accessible event views: upcoming, a responsive month/week/agenda calendar, and completed public events.
- Search and category filters use the backend's published event query; calendar requests are bounded to the visible date range.
- A small CSS/SVG wind sequence, skip-intro control, and reduced-motion support. It never locks scrolling or forces a scroll transition.
- Public event preview, loading, empty, retry, and API error states. There is no hardcoded sample event data.
- Executive event submission and Core event creation/edit/archive controls, matching server permissions. Event dates are converted from the selected IANA timezone to absolute timestamps before submission. Core users can explicitly review and accept a 409 conflict; executives cannot override it.
- A Core-only dashboard using `GET /core/dashboard` for event totals, conflict warnings, activity, expense totals, and budget summary. The backend remains authoritative for roles and every protected action.
- Login paths are distinct, and the backend—not the selected tab—verifies the account role.

## Backend API gaps that affect the interface

- Public event listing returns published events only, while Core can fetch dashboard counts for drafts and cancellations. There is no backend endpoint to list individual draft/cancelled events, so the frontend cannot populate a private draft-management list or cancelled-event calendar entries.
- The public event routes hide cancelled events by design. The calendar therefore displays published events and communicates scheduling conflicts only from the Core dashboard endpoint.
- Expenses and budgets have authorized API routes, but there is no separate financial dashboard in this frontend. The Core dashboard displays only the financial summary fields already returned by `GET /core/dashboard`.
- There is no receipt-upload storage backend configured. This frontend does not pretend to upload receipts.

## Verification

`npm run build` compiles the Next.js application. Event and login interactions require a running API and configured PostgreSQL database; there is no mock server or fallback content in this app.

