# ACM Campus Events & Conflict-Aware Operations Manager

> **A mission-critical event orchestration, physical venue collision radar, and double-entry financial ledger platform engineered for ACM Student Chapters.**

[![Platform](https://img.shields.io/badge/platform-Web%20%7C%20Next.js%2016%20%7C%20Express%204-005596?style=flat-square)](https://github.com/chetisha28/incursion-acm)
[![Database](https://img.shields.io/badge/database-PostgreSQL%20%7C%20Prisma%206-336791?style=flat-square)](https://www.prisma.io/)
[![Frontend](https://img.shields.io/badge/frontend-React%2019%20%7C%20Vanilla%20CSS-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Language](https://img.shields.io/badge/language-JavaScript%20ES%20Modules-F7DF1E?style=flat-square&logo=javascript)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Security](https://img.shields.io/badge/security-Revocable%20JWT%20Sessions%20%7C%20Helmet%20%7C%20Rate%20Limit-critical?style=flat-square)](https://jwt.io/)
[![Tests](https://img.shields.io/badge/tests-Jest%20%7C%20Supertest%20(39%20Passed)-brightgreen?style=flat-square)](https://jestjs.io/)

## Team

- [@chetisha28](https://github.com/chetisha28)
- [@some1iu](https://github.com/some1iu)
- [@harshil-mistry007](https://github.com/harshil-mistry007)
- [@Aiiszgh](https://github.com/Aiiszgh)


## Table of Contents

1. [Project Overview](#project-overview)
   - [Mission & Problem Statement](#mission--problem-statement)
   - [Target Audience & Role Hierarchy](#target-audience--role-hierarchy)
   - [Core Value Propositions](#core-value-propositions)
2. [Features & Capabilities](#features--capabilities)
   - [Implemented Functionality](#implemented-functionality)
   - [Planned & Incomplete Capabilities](#planned--incomplete-capabilities)
3. [User Interface & Visual Experience](#user-interface--visual-experience)
   - [Design Philosophy & Aesthetic Standards](#design-philosophy--aesthetic-standards)
   - [Screenshots & Visual Preview Guide](#screenshots--visual-preview-guide)
   - [Instructions for Capturing Interface Screenshots](#instructions-for-capturing-interface-screenshots)
4. [Technology Stack](#technology-stack)
   - [Frontend Ecosystem](#frontend-ecosystem)
   - [Backend Services & Engine](#backend-services--engine)
   - [Persistence & ORM](#persistence--orm)
   - [Testing & Quality Assurance](#testing--quality-assurance)
5. [Website Navigation & High-Level User Flow](#website-navigation--high-level-user-flow)
6. [Detailed Feature Workflows & Architectural Diagrams](#detailed-feature-workflows--architectural-diagrams)
   - [1. Role-Tiered Authentication & Revocable Session Lifecycle](#1-role-tiered-authentication--revocable-session-lifecycle)
   - [2. Event Lifecycle, Multi-Dimensional Collision Radar & Resolution](#2-event-lifecycle-multi-dimensional-collision-radar--resolution)
   - [3. Executive Peer Verification & Proposal Endorsement System](#3-executive-peer-verification--proposal-endorsement-system)
   - [4. Chapter Team Governance & Work Assignment Delegation](#4-chapter-team-governance--work-assignment-delegation)
   - [5. Double-Entry Financial Ledger & Semester Budget Allocation](#5-double-entry-financial-ledger--semester-budget-allocation)
7. [System Architecture & Repository Monorepo Structure](#system-architecture--repository-monorepo-structure)
   - [High-Level Architecture](#high-level-architecture)
   - [Annotated Monorepo Directory Tree](#annotated-monorepo-directory-tree)
8. [RESTful API Specification & Endpoint Directory](#restful-api-specification--endpoint-directory)
9. [Environment Configuration & Security Controls](#environment-configuration--security-controls)
   - [Backend Environment Variables (`acm-backend/.env`)](#backend-environment-variables-acm-backendenv)
   - [Frontend Environment Variables (`acm-frontend/.env.local`)](#frontend-environment-variables-acm-frontendenvlocal)
   - [Security Architecture & Defense-in-Depth](#security-architecture--defense-in-depth)
10. [Local Setup & Installation Guide](#local-setup--installation-guide)
    - [Prerequisites](#prerequisites)
    - [1. Backend Setup & Database Migration](#1-backend-setup--database-migration)
    - [2. Safe Administrator Account Bootstrapping](#2-safe-administrator-account-bootstrapping)
    - [3. Frontend Setup & Client Execution](#3-frontend-setup--client-execution)
11. [Verification & Test Suite](#verification--test-suite)
    - [Running Backend Mock & Unit Test Suite](#running-backend-mock--unit-test-suite)
    - [Running End-to-End Live Workflow Suite](#running-end-to-end-live-workflow-suite)
    - [Compiling Frontend Production Bundle](#compiling-frontend-production-bundle)
12. [Operational Governance & Contributing](#operational-governance--contributing)
13. [License](#license)

---

## Project Overview

### Mission & Problem Statement

University student chapters of the **Association for Computing Machinery (ACM)** organize dozens of technical workshops, hackathons, guest lectures, and coding competitions each semester. However, chapter officers frequently encounter three severe logistical failure modes:

1. **Venue Concurrency & Schedule Clashes**: Competing campus groups or sub-committees schedule overlapping sessions in the same physical laboratories or lecture halls, causing disruptive room booking conflicts and split student attendance.
2. **Ungoverned Proposal Workflows**: Disorganized event proposals submitted via informal chat groups or spreadsheets result in unvetted dates, missing prerequisites, and uncoordinated marketing.
3. **Budgetary Deficits & Unaudited Spending**: Student organizations struggle with inaccurate currency calculations caused by floating-point arithmetic errors, untracked expense receipts, and lack of real-time fiscal burn rate monitoring against allocated semester grants.

**ACM Campus Events & Conflict-Aware Operations Manager** directly solves these challenges. It provides a synchronized full-stack platform featuring a public campus portal, an automated **multi-dimensional collision detection radar**, an **executive peer-verification proposal engine**, a **double-entry financial ledger** with exact decimal precision, and an **executive task delegation board**.

### Target Audience & Role Hierarchy

The platform implements a strict four-tiered role governance model enforced at the database level:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ROLE AUTHORIZATION HIERARCHY                    │
├──────────────┬──────────────────┬──────────────────────────────────────┤
│ Role         │ Authentication   │ Primary Capabilities                 │
├──────────────┼──────────────────┼──────────────────────────────────────┤
│ VIEWER       │ Anonymous Public │ • Browse upcoming & completed events │
│              │ (No Credentials) │ • Interactive month/week calendar    │
│              │                  │ • Search by title, venue, category   │
├──────────────┼──────────────────┼──────────────────────────────────────┤
│ EXECUTIVE    │ Bearer JWT       │ • Propose new event drafts           │
│              │ (Password Auth)  │ • Endorse/upvote peer proposals      │
│              │                  │ • Acknowledge 409 collision warnings │
│              │                  │ • Record expense reimbursement claims│
│              │                  │ • Execute assigned work tasks        │
├──────────────┼──────────────────┼──────────────────────────────────────┤
│ CORE         │ Bearer JWT       │ • Comprehensive Operations Console   │
│              │ (Elevated Auth)  │ • Collision Decision Center          │
│              │                  │ • Approve, reject & resolve drafts   │
│              │                  │ • Adjust semester budget allocations │
│              │                  │ • Manage team users & auto-passwords │
│              │                  │ • Delegate work assignments          │
├──────────────┼──────────────────┼──────────────────────────────────────┤
│ ADMIN        │ Bearer JWT       │ • Full superuser privileges          │
│              │ (Root Access)    │ • Provision Core & Executive members │
│              │                  │ • System-wide audit inspection       │
└──────────────┴──────────────────┴──────────────────────────────────────┘
```

### Core Value Propositions

- **Automated Collision Radar**: Real-time evaluation of start/end timestamps, physical venues, targeted audience segments, and campus-wide relevance before any event is saved to the chapter calendar.
- **Peer-Verified Proposal Pipeline**: Submissions default to a protected draft state awaiting executive peer endorsements (upvotes). Once vetted with $\ge 2$ endorsements, Core leads can approve proposals with formal resolution notes.
- **Exact Decimal Financial Ledger**: All monetary calculations bypass standard IEEE 754 floating-point errors by utilizing PostgreSQL `Decimal(12, 2)` representations and strict string-serialized API boundaries.
- **Server-Authoritative Session Security**: JWT tokens include a unique session identifier (`jti`) persisted in PostgreSQL. Logging out revokes the session in the database immediately, invalidating copied tokens even before their expiration window expires.

---

## Features & Capabilities

### Implemented Functionality

#### Public Campus Portal
- **Precision Hero Experience**: Clean Swiss editorial typography featuring custom SVG ribbon animations (`WindSwirl`), skip-intro capabilities, and full `prefers-reduced-motion` compliance.
- **"Next on Calendar" Live Ticker**: Real-time identification and display of the soonest upcoming event with venue and timezone formatting.
- **Multi-View Event Calendar**: Responsive tabbed explorer including **Upcoming Events**, an interactive **FullCalendar** (Month, Week, Agenda views), and a completed **Event Archive**.
- **Contextual Search & Category Filters**: Live query-filtering across titles, descriptions, venues, and categories.

#### Collision Detection & Safety Radar
- **3D Concurrency Analysis**: Automatically evaluates potential overlaps across:
  1. *Temporal Concurrency*: Exact timestamp intersection (`startsAt < candidate.endsAt && endsAt > candidate.startsAt`).
  2. *Venue Collisions*: Normalized, case-insensitive room and laboratory matching.
  3. *Audience Clash*: Tokenized intersection of targeted cohorts (e.g., `CS Year 2`, `Undergrads`), with universal audience expansion for `all`, `everyone`, or `campus`.
  4. *Campus-Wide Relevance*: Dual campus-relevant flags scheduled concurrently.
- **Structured 409 Conflict Warnings**: When conflicts occur, the API halts execution and returns HTTP 409 with an array of colliding event titles, locations, and explicit clash reasons.
- **Conflict Decision Center**: Core administrators inspect side-by-side collision cards, re-scan conflict matrices, and execute one-click rescheduling or overrides with formal documentation.

#### Peer Verification & Governance Workflow
- **Executive Review Queue**: Filtered workspace displaying proposals awaiting administrative approval.
- **One-Click Endorsement (Upvoting)**: Authenticated officers can toggle endorsements on draft proposals with optimistic UI updates and server concurrency locking.
- **Verification Threshold**: Proposals reaching $\ge 2$ executive upvotes receive a distinct `PEER VERIFIED` status badge.
- **Formal Resolution Console**: Core members can transition drafts to `PUBLISHED` or `CANCELLED`, adjust venues and timeslots, and attach immutable resolution notes visible in audit trails.

#### Double-Entry Financial Ledger
- **Semester Budget Allocations**: Establishment of semester and monthly financial envelopes with strict allocation caps.
- **Expense Logging & Ledger**: Recording of itemized expenditures with category tagging (`Food`, `Logistics`, `Honorarium`, `Equipment`, `Printing`), linked event IDs, and external receipt URLs.
- **Dynamic Burn Rate Tracking**: Real-time computation of committed funds, total expenditure, uncommitted reserves, and category percentage breakdown bars.

#### Chapter Team & Task Delegation Board
- **Team Management**: Core officers can onboard executives, view activity statistics (events created, tasks assigned), toggle account states, and issue cryptographically strong temporary credentials.
- **Forced Password Rotation**: Automatic modal interruption requiring newly provisioned users to establish personal passwords on their initial sign-in (`mustChangePassword: true`).
- **Work Assignment Matrix**: Delegation board supporting task creation, priority stratification (`LOW`, `MEDIUM`, `HIGH`, `URGENT`), target deadlines, and status lifecycles (`PENDING` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `COMPLETED`).

---

### Planned & Incomplete Capabilities

To maintain full transparency with developers and stakeholders, the following features are isolated or roadmapped:

- **Cloud Object Storage for Receipt Uploads**: The receipt upload service is isolated in `src/services/receiptStorage.service.js`. Currently, external HTTPS receipt URLs are recorded; direct multi-part image uploads to AWS S3 or Cloudflare R2 are planned for a subsequent release.
- **Push & Email Notifications**: Audit activity is logged in the `ActivityLog` table. Automated SMTP/SES email dispatch to executive assignees is scheduled for phase two.
- **Multi-Chapter Federation**: Current database models assume a single ACM chapter per deployment. Multi-tenant chapter separation is in architectural discovery.

---

## User Interface & Visual Experience

### Design Philosophy & Aesthetic Standards

The interface follows a **Swiss Precision & Technical Editorial** design system:
- **Typography**: Tailored variable typography with system-level font stacks, high-contrast hierarchical kickers (`CHAPTER DESK // SYSTEM CONSOLE`), and tabular figures (`tnum`) for monetary alignment.
- **Color Palette**: A curated corporate dark/light palette using semantic tokens:
  - Canvas: High-depth dark slate (`#0B0F17`) and crisp surface panels (`#131926`).
  - Brand Primary: ACM Precision Cobalt (`#005596` / `#0077CC`).
  - Safety & Alerts: Emerald Green (`--success`), Amber Amber-Orange (`--warning`), and Vivid Crimson (`--danger`).
- **Zero Third-Party CSS Frameworks**: Built entirely with Vanilla CSS (`app/globals.css`) for ultimate control over layout reflows, micro-interactions, and hardware-accelerated animations.

### Screenshots & Visual Preview Guide

Below is a breakdown of the visual components available within the running application:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        UI WORKSPACE COMPONENT MAP                      │
├────────────────────────────┬───────────────────────────────────────────┤
│ Interface Route            │ Key Visual Elements                       │
├────────────────────────────┼───────────────────────────────────────────┤
│ Public Home (/)            │ • Dynamic wind ribbon hero canvas         │
│                            │ • Next upcoming event alert band          │
│                            │ • Tabbed event catalog & FullCalendar     │
│                            │ • Search input & category chip filter bar │
├────────────────────────────┼───────────────────────────────────────────┤
│ Login Portal (/login)      │ • Split-screen architectural branding     │
│                            │ • Desk switcher (Executive vs. Core)      │
│                            │ • One-click demo credentials autofill     │
│                            │ • Real-time error status badges           │
├────────────────────────────┼───────────────────────────────────────────┤
│ Core Desk (/core/dashboard)│ • Continuous 4-cell operational ticker    │
│                            │ • Visual collision comparison card (VS)   │
│                            │ • Proposals under review queue            │
│                            │ • Chronological agenda table              │
│                            │ • Financial balance sheet & category bars │
│                            │ • Chronological audit dispatch feed       │
├────────────────────────────┼───────────────────────────────────────────┤
│ Team & Work Workspaces     │ • Member directory with activity counters │
│                            │ • Task delegation kanban & status pills   │
│                            │ • Credential generation modal with copy   │
└────────────────────────────┴───────────────────────────────────────────┘
```

### Instructions for Capturing Interface Screenshots

To capture verified, publication-grade screenshots for documentation or release notes:

1. Launch both the backend API and frontend client locally as detailed in the [Local Setup Guide](#local-setup--installation-guide).
2. Seed the development database with demo data (`SEED_DEMO=true npm run db:seed`).
3. Open a Chromium browser in full HD resolution (`1920x1080`) at `http://localhost:3000`.
4. Capture the following verified perspectives:
   - **`docs/screenshots/01_public_portal.png`**: The landing hero and upcoming events grid.
   - **`docs/screenshots/02_login_portal.png`**: The dual-tab sign-in console.
   - **`docs/screenshots/03_core_overview.png`**: The Operations Desk showing operational ticker ribbons and the collision radar.
   - **`docs/screenshots/04_conflict_center.png`**: The Conflict Decision Center with side-by-side venue clash comparisons.
   - **`docs/screenshots/05_financial_ledger.png`**: The semester ledger and category expenditure bars.
   - **`docs/screenshots/06_team_work_matrix.png`**: The chapter user directory and work delegation table.

---

## Technology Stack

### Frontend Ecosystem
- **Framework**: [Next.js 16.4.0](https://nextjs.org/) (React 19 App Router)
- **Library**: [React 19.3.0](https://react.dev/) & [React-DOM 19.3.0](https://react.dev/)
- **Styling**: Vanilla CSS Design Tokens (Custom properties, grid systems, no Tailwind)
- **Icons**: [Lucide React 1.55.0](https://lucide.dev/)
- **Calendar Engine**: [@fullcalendar/react 7.1.1](https://fullcalendar.io/)
- **Bundler**: Webpack 5 (configured via Next.js `--webpack` execution flag)

### Backend Services & Engine
- **Runtime**: [Node.js >= 20](https://nodejs.org/) (Native ES Modules `"type": "module"`)
- **Web Framework**: [Express 4.22.3](https://expressjs.com/)
- **Security Middleware**: [Helmet 8.3.0](https://helmetjs.github.io/) (HTTP security headers)
- **Traffic Control**: [express-rate-limit 8.7.1](https://www.npmjs.com/package/express-rate-limit)
- **CORS Protection**: [cors 2.8.6](https://www.npmjs.com/package/cors)
- **Cryptographic Security**: [bcrypt 6.0.0](https://www.npmjs.com/package/bcrypt) & [jsonwebtoken 9.0.3](https://www.npmjs.com/package/jsonwebtoken)
- **Schema Validation**: [Zod 4.6.5](https://zod.dev/)

### Persistence & ORM
- **Database Engine**: [PostgreSQL >= 14](https://www.postgresql.org/)
- **ORM & Client**: [Prisma ORM 6.19.3](https://www.prisma.io/)
- **Data Integrity**: Foreign key constraints, unique composite constraints, cascading revocations, and ACID serializable transactions.

### Testing & Quality Assurance
- **Unit / Mock Test Runner**: [Jest 30.5.2](https://jestjs.io/) with `--experimental-vm-modules`
- **HTTP Mock Integration**: [Supertest 7.3.1](https://www.npmjs.com/package/supertest)
- **E2E Live Workflow Suite**: Native Node.js Test Runner (`node --test tests/e2e-workflow.test.js`)

---

## Website Navigation & High-Level User Flow

The following flowchart illustrates the complete user journey through the application, spanning public visitors, executive officers, and core administrators:

```mermaid
flowchart TD
    %% Entry Point
    Start(["Visitor Opens ACM Platform"]) --> CheckAuth{"Authenticated?"}

    %% Public Journey
    CheckAuth -- "No (Viewer)" --> PublicHome["Public Campus Portal (/)"]
    PublicHome --> BrowseEvents["Explore Event Views"]
    BrowseEvents --> TabSelect{"Select View Tab"}
    TabSelect --> ViewUpcoming["Upcoming Events Tab"]
    TabSelect --> ViewCalendar["Interactive FullCalendar Tab"]
    TabSelect --> ViewArchive["Completed Past Events Tab"]
    ViewUpcoming --> OpenModal["Inspect Event Details Modal"]
    ViewCalendar --> OpenModal
    ViewArchive --> OpenModal
    PublicHome --> ClickLogin["Click 'Sign In' Button"]
    ClickLogin --> LoginPage["Login Console (/login)"]

    %% Authentication Journey
    LoginPage --> SelectDesk{"Select Access Desk"}
    SelectDesk -- "Executive Tab" --> ExecCreds["Submit Executive Credentials"]
    SelectDesk -- "Core Tab" --> CoreCreds["Submit Core Credentials"]
    ExecCreds --> RateLimiter["Rate Limiting & Validation"]
    CoreCreds --> RateLimiter
    RateLimiter --> VerifyDB{"Verify Hash & Role in PostgreSQL"}
    VerifyDB -- "Invalid" --> ShowAuthError["Display Error / Alert Message"]
    ShowAuthError --> LoginPage
    VerifyDB -- "Valid" --> IssueJWT["Issue Bearer JWT with Revocable Session ID (jti)"]
    IssueJWT --> CheckMustChange{"Must Change Password?"}

    CheckMustChange -- "Yes (First Login)" --> ForcePassModal["ChangePasswordModal Interruption"]
    ForcePassModal --> UpdatePassword["POST /api/auth/change-password"]
    UpdatePassword --> SetSessionActive["Update mustChangePassword = false"]
    SetSessionActive --> RedirectRole

    CheckMustChange -- "No" --> RedirectRole{"Evaluate Role"}

    %% Executive Journey
    RedirectRole -- "EXECUTIVE" --> ExecView["Public Portal with Executive Controls"]
    ExecView --> ProposeEvent["Propose New Event Draft"]
    ProposeEvent --> EventFormModal["Complete Event Form Modal"]
    EventFormModal --> SubmitDraft["POST /api/events"]
    SubmitDraft --> ConflictScanExec{"Collision Detected?"}
    ConflictScanExec -- "Yes (No Override)" --> Warn409Exec["409 Conflict Warning Banner"]
    Warn409Exec --> ReviewClashExec{"Reschedule or Override?"}
    ReviewClashExec -- "Reschedule" --> EventFormModal
    ReviewClashExec -- "Override Confirmed" --> PostOverrideDraft["POST with allowConflict: true"]
    PostOverrideDraft --> SaveDraftDB["Save Event as DRAFT in Database"]
    ConflictScanExec -- "No Collision" --> SaveDraftDB
    SaveDraftDB --> ReviewQueueNotify["Proposal Enters Core Review Queue"]

    ExecView --> EndorseProposals["Browse Proposals Awaiting Review"]
    EndorseProposals --> UpvoteAction["Click 'Endorse' (POST /api/events/:id/upvote)"]
    UpvoteAction --> UpdateUpvoteBadge["Increment Endorsements (Peer Verified >= 2)"]

    %% Core Administrator Journey
    RedirectRole -- "CORE / ADMIN" --> CoreDashboard["Core Operations Desk (/core/dashboard)"]
    CoreDashboard --> DeskTabs{"Select Management Workspace"}

    %% Desk Workspaces
    DeskTabs -- "01 · Overview" --> ViewOverview["Continuous Operational Ticker & Review Queue"]
    ViewOverview --> QuickApprove["One-Click Approve & Publish"]
    ViewOverview --> QuickReject["One-Click Reject & Cancel"]

    DeskTabs -- "02 · Conflict Center" --> ViewConflicts["Collision Radar Matrix"]
    ViewConflicts --> ResolveModal["EventResolveModal Console"]
    ResolveModal --> ActionResolve{"Choose Decision"}
    ActionResolve -- "Approve & Publish" --> PublishEvent["POST /api/events/:id/resolve (PUBLISHED)"]
    ActionResolve -- "Reschedule Timeslot" --> ModifyTimes["Update startsAt / endsAt / venue"]
    ActionResolve -- "Accept Clashing Space" --> ForceAcceptConflict["Accept 409 with allowConflict: true"]

    DeskTabs -- "03 · Financial Ledger" --> ViewLedger["Double-Entry Transaction Register"]
    ViewLedger --> AddExpense["Log Expenditure Claim"]
    ViewLedger --> AdjustBudget["Establish / Adjust Semester Budget"]

    DeskTabs -- "04 · Analytical Report" --> ViewAnalytics["Fiscal Burn Rate & Velocity Charts"]

    DeskTabs -- "05 · Team Management" --> ViewTeam["Chapter User Directory"]
    ViewTeam --> CreateOfficer["Create Officer Account (Auto-Generated Password)"]
    ViewTeam --> DelegateWork["Initiate Work Delegation to Officer"]

    DeskTabs -- "06 · Work Assignments" --> ViewWork["Task Delegation Board"]
    ViewWork --> UpdateTaskStatus["Assignee Updates Task Status (IN_PROGRESS / COMPLETED)"]

    %% Sign Out Flow
    CoreDashboard --> ClickLogout["Click 'Sign Out' Button"]
    ExecView --> ClickLogout
    ClickLogout --> ServerRevocation["POST /api/auth/logout (Revoke Session in DB)"]
    ServerRevocation --> ClearStorage["Clear sessionStorage"]
    ClearStorage --> ReturnPublic(["Redirect to Public Portal"])
```

---

## Detailed Feature Workflows & Architectural Diagrams

### 1. Role-Tiered Authentication & Revocable Session Lifecycle

Unlike naive JWT architectures where issued tokens cannot be revoked until expiry, this platform couples stateless JWT authentication with a **database-backed revocable session registry** (`AuthSession` model).

```mermaid
flowchart TD
    A["Client / Frontend"] -->|"POST /api/auth/{executive|core}/login"| B["Express Rate Limiter (10 req / 15m)"]
    B --> C["Zod Request Body Validator"]
    C -->|"Invalid Schema"| D["400 Bad Request Response"]
    C -->|"Valid Schema"| E["Lookup User by Email in PostgreSQL"]
    E -->|"User Not Found"| F["401 Unauthorized (Generic Message)"]
    E -->|"User Found"| G{"Verify Account Role Matches Desk"}
    G -->|"Role Mismatch"| F
    G -->|"Role Matches"| H["Verify Bcrypt Hash (12 Rounds)"]
    H -->|"Invalid Password"| F
    H -->|"Password Verified"| I["Generate Cryptographic Session UUID (jti)"]
    I --> J["Insert AuthSession Record in PostgreSQL (expiresAt = now + 1h)"]
    J --> K["Sign JWT (Payload: userId, email, role, jti, iss, aud)"]
    K --> L["200 OK: Return JWT Token & User Profile"]
    L --> M["Client stores token in tab-scoped sessionStorage"]

    %% Subsequent Authenticated Request
    M -->|"Subsequent Request: Authorization: Bearer <token>"| N["authenticate Middleware"]
    N --> O["Verify JWT Signature & Expiry"]
    O -->|"Tampered / Expired"| P["401 Unauthorized Response"]
    O -->|"Valid JWT Signature"| Q["Query AuthSession by jti in PostgreSQL"]
    Q -->|"Session Revoked or Missing"| P
    Q -->|"Session Active (revokedAt IS NULL)"| R["Attach req.user & req.session to Context"]
    R --> S["authorize Middleware (Checks required role)"]
    S -->|"Role Forbidden"| T["403 Forbidden Response"]
    S -->|"Role Permitted"| U["Execute Controller & Business Logic"]

    %% Logout Request
    U -->|"POST /api/auth/logout"| V["Update AuthSession: SET revokedAt = NOW()"]
    V --> W["200 OK: Session Revoked Server-Side"]
    W --> X["Client Clears Local Session Storage"]
```

---

### 2. Event Lifecycle, Multi-Dimensional Collision Radar & Resolution

Events follow a robust state machine (`DRAFT` $\rightarrow$ `PUBLISHED` or `CANCELLED`). Every creation, update, and resolution executes inside an **ACID serializable database transaction** to prevent concurrency race conditions.

```mermaid
flowchart TD
    A["User Submits Event Payload"] --> B["Zod eventSchema Validation"]
    B --> C{"Check User Role"}
    C -->|"EXECUTIVE"| D["Target Status: DRAFT"]
    C -->|"CORE / ADMIN"| E["Target Status: PUBLISHED (or Custom)"]

    D --> F["Open Database Transaction"]
    E --> F

    F --> G["Find Potential Temporal Overlaps in PostgreSQL: (startsAt < candidate.endsAt && endsAt > candidate.startsAt)"]
    G --> H["Execute detectConflicts() Algorithm"]

    subgraph Collision_Checks ["3D Multi-Criteria Collision Checks"]
        H --> C1{"Venue Match?"}
        C1 -- "Case-insensitive equal" --> R1["Add: 'Same venue during overlapping times'"]
        C1 -- "Different venue" --> C2{"Target Audience Overlap?"}
        
        R1 --> C2
        C2 -- "Tokens intersect or universal ('all', 'campus')" --> R2["Add: 'Overlapping target audiences during overlapping times'"]
        C2 -- "Distinct audiences" --> C3{"Both Marked Campus-Relevant?"}
        
        R2 --> C3
        C3 -- "Both true" --> R3["Add: 'Both events are marked campus-relevant'"]
        C3 -- "False" --> C4["Aggregate Detected Conflict Reasons"]
        R3 --> C4
    end

    C4 --> I{"Are Conflict Reasons Present?"}
    I -- "Yes" --> J{"allowConflict === true in Request?"}
    
    J -- "No" --> K["Rollback Transaction & Throw 409 ApiError (SCHEDULING_CONFLICT with clash details)"]
    K --> L["Client receives 409 & displays Side-by-Side Collision Card"]
    
    J -- "Yes (Explicit Override)" --> M["Proceed with Event Creation"]
    I -- "No (Zero Collisions)" --> M

    M --> N["INSERT Event Record in PostgreSQL"]
    N --> O["INSERT ActivityLog Record: EVENT_CREATED"]
    O --> P["Commit Database Transaction"]
    P --> Q["201 Created Response with Event Data & Any Overridden Conflicts"]

    %% Core Review Console
    Q --> R{"If Event Status is DRAFT"}
    R --> S["Event Appears in Core Dashboard 'Proposals Under Review'"]
    S --> T["Core Opens EventResolveModal"]
    T --> U{"Core Decision"}
    U -- "Approve" --> V["POST /api/events/:id/resolve { status: 'PUBLISHED', notes }"]
    U -- "Reschedule" --> W["POST /api/events/:id/resolve { startsAt, endsAt, venue }"]
    U -- "Reject" --> X["POST /api/events/:id/resolve { status: 'CANCELLED', notes }"]
    
    V --> Y["Event Published to Public Chapter Calendar & Archive Preserved"]
    W --> Y
    X --> Z["Event Marked CANCELLED & Hidden from Public Listings"]
```

---

### 3. Executive Peer Verification & Proposal Endorsement System

To distribute governance across chapter officers, the platform includes a peer-verification voting matrix allowing executives to endorse pending proposals:

```mermaid
flowchart TD
    A["Officer Views Proposal in Review Queue"] --> B{"Is Event Status == DRAFT?"}
    B -- "No (Already Published/Cancelled)" --> C["Upvoting Disabled (HTTP 400 INVALID_EVENT_STATE)"]
    B -- "Yes" --> D{"Is User Authenticated as EXECUTIVE, CORE, or ADMIN?"}
    D -- "No (Anonymous Visitor)" --> E["401 Unauthorized Response"]
    D -- "Yes" --> F["Client issues POST /api/events/:id/upvote"]

    F --> G["Begin Serializable Transaction in PostgreSQL"]
    G --> H["Query EventUpvote by Unique [eventId, userId]"]

    H --> I{"Record Exists?"}
    I -- "Yes (Already Voted)" --> J["DELETE EventUpvote Record"]
    J --> K["Log Activity: EVENT_UPVOTE_REMOVED"]
    K --> L["Set upvoted = false"]

    I -- "No (New Endorsement)" --> M["INSERT EventUpvote Record"]
    M --> N["Log Activity: EVENT_UPVOTED"]
    N --> O["Set upvoted = true"]

    L --> P["Query New Total Upvotes Count & Voter Profiles"]
    O --> P
    P --> Q["Commit Transaction & Return 200 OK with upvoteCount"]

    Q --> R["Client Receives Payload & Updates Local State Optimistically"]
    R --> S{"upvoteCount >= 2?"}
    S -- "Yes" --> T["Render 'PEER VERIFIED' Green Badge with Sparkles Icon"]
    S -- "No" --> U["Render Standard Endorsement Counter Badge"]
    T --> V["Core Leads Prioritize Peer-Verified Proposals for Fast-Track Publishing"]
```

---

### 4. Chapter Team Governance & Work Assignment Delegation

```mermaid
flowchart TD
    A["Core / Admin Accesses 'Team Management' Tab"] --> B["Click 'Add Executive Officer'"]
    B --> C["Client Generates Cryptographically Random 12-char Password"]
    C --> D["POST /api/users { name, email, role, title, department, mustChangePassword: true }"]
    D --> E["Validate Input with createUserSchema"]
    E --> F{"Email Already Registered?"}
    F -- "Yes" --> G["409 Conflict Response (EMAIL_EXISTS)"]
    F -- "No" --> H["Hash Password with Bcrypt (12 Salt Rounds)"]
    H --> I["INSERT User Record in PostgreSQL"]
    I --> J["Return 201 Created with Plaintext Generated Password"]
    J --> K["Display Credential Modal with One-Click Clipboard Copy"]

    %% Work Assignment Creation
    A --> L["Core Clicks 'Assign Work' on Team Member Card"]
    L --> M["WorkAssignments Modal Opens with Preset Assignee"]
    M --> N["POST /api/work-assignments { title, description, priority, dueDate, assigneeId, eventId }"]
    N --> O["INSERT WorkAssignment Record in PostgreSQL"]
    O --> P["Log Activity: WORK_ASSIGNMENT_CREATED"]

    %% Executive First Login & Execution
    K -.-> Q["Officer Logs In with Generated Credentials"]
    Q --> R{"mustChangePassword == true?"}
    R -- "Yes" --> S["Application forces ChangePasswordModal Modal"]
    S --> T["POST /api/auth/change-password { currentPassword, newPassword }"]
    T --> U["Update User passwordHash & SET mustChangePassword = false"]
    U --> V["Officer Accesses Assigned Work Dashboard"]
    V --> W["Officer updates task status: PATCH /api/work-assignments/:id { status: 'IN_PROGRESS' }"]
    W --> X["Officer completes task: PATCH /api/work-assignments/:id { status: 'COMPLETED' }"]
    X --> Y["Core Dashboard Reflects Real-Time Team Productivity Metrics"]
```

---

### 5. Double-Entry Financial Ledger & Semester Budget Allocation

```mermaid
flowchart TD
    A["Core Administrator establishes Semester Budget"] --> B["POST /api/budgets { name, period: 'SEMESTER', startsAt, endsAt, totalAmount: '50000.00' }"]
    B --> C["Validate Decimal String & Store in PostgreSQL (Decimal 12,2)"]
    C --> D["Budget Established as Active Financial Envelope"]

    %% Expense Ingestion
    E["Executive or Core Member Incurs Chapter Expense"] --> F["POST /api/expenses { amount: '1250.50', category: 'Food', transactionDate, description, eventId, receiptUrl }"]
    F --> G["Zod Validates: Non-negative, Max 2 Decimal Places, Valid ISO Date"]
    G --> H["INSERT Expense Record in PostgreSQL"]
    H --> I["Log Activity: EXPENSE_CREATED"]

    %% Financial Aggregation & Burn Rate
    I --> J["Core Dashboard Requests GET /api/core/dashboard"]
    J --> K["Execute Prisma Aggregations:"]
    K --> K1["SUM(amount) WHERE archivedAt IS NULL"]
    K --> K2["GROUP BY category: SUM(amount)"]
    K --> K3["Fetch Current Budget: totalAmount"]

    K1 --> L["Compute Derived Fiscal Metrics:"]
    K2 --> L
    K3 --> L
    L --> M["totalExpended = sum(expenses)"]
    L --> N["remainingBudget = max(0, totalAmount - totalExpended)"]
    L --> O["budgetUtilization = round((totalExpended / totalAmount) * 100)%"]
    L --> P["categoryBreakdown = [{ category, amount, percentage }]"]

    M --> Q["Render Double-Entry Balance Sheet on Operations Desk"]
    N --> Q
    O --> Q
    P --> Q
```

---

## System Architecture & Repository Monorepo Structure

### High-Level Architecture

The project is structured as a cohesive decoupled monorepo:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SYSTEM ARCHITECTURE MAP                         │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   CLIENT TIER (Next.js 16 / React 19 App Router)                       │
│   [ Port: 3000 ]                                                       │
│   ├── Public Portal (/) ── Hero / Wind Animation / Tabs / Calendar     │
│   ├── Login Console (/login) ── Role-Tiered Tabs / Demo Fill           │
│   └── Operations Desk (/core/dashboard) ── 6 Management Workspaces     │
│             │                                                          │
│             ▼ HTTP Requests (Bearer JWT in Authorization Header)       │
│                                                                        │
│   API GATEWAY & ENGINE TIER (Express 4 / Node.js 20 ES Modules)        │
│   [ Port: 4000/api ]                                                   │
│   ├── Security Stack: Helmet / CORS Whitelist / express-rate-limit     │
│   ├── Middleware: authenticate.js (Session DB check) / authorize.js    │
│   ├── Route Modules: /auth, /events, /core, /expenses, /budgets, etc.  │
│   ├── Controllers: Concurrency-guarded transaction controllers         │
│   └── Services: conflict.service.js / budget.service.js                │
│             │                                                          │
│             ▼ Prisma Client 6 Queries & Transactions                   │
│                                                                        │
│   PERSISTENCE TIER (PostgreSQL 14+ / Relational Store)                 │
│   ├── Users & Revocable AuthSessions                                   │
│   ├── Events & WorkAssignments (Foreign Keys & Relations)              │
│   ├── EventUpvotes (Composite Unique: eventId + userId)                │
│   └── Expenses & Budgets (High-Precision Decimal 12,2)                 │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### Annotated Monorepo Directory Tree

```
incursion-acm/
│
├── acm-backend/                       # RESTful Express API Backend
│   ├── prisma/
│   │   ├── schema.prisma              # PostgreSQL schema (Models, Enums, Indexes)
│   │   └── seed.js                    # Core bootstrap & demo account seeder
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.js                 # Centralized environment variable loader
│   │   │   └── prisma.js              # Prisma ORM client singleton instance
│   │   ├── controllers/               # Business logic & transaction handlers
│   │   │   ├── auth.controller.js     # Login, logout, session revocation, passwords
│   │   │   ├── budget.controller.js   # Semester & monthly budget controllers
│   │   │   ├── core.controller.js     # Aggregated dashboard metrics & radar summary
│   │   │   ├── event.controller.js    # Event CRUD, conflict resolution, upvotes
│   │   │   ├── expense.controller.js  # Expense ledger & decimal formatting
│   │   │   ├── public.controller.js   # Public health check endpoint
│   │   │   ├── user.controller.js     # User management & credential generation
│   │   │   └── work.controller.js     # Work delegation & task tracking
│   │   ├── middleware/                # Express middleware pipeline
│   │   │   ├── authenticate.js        # JWT verification & database session lookup
│   │   │   ├── authorize.js           # Role-based access control guard
│   │   │   ├── errorHandler.js        # Normalized error response formatter
│   │   │   ├── notFound.js            # 404 handler
│   │   │   └── validate.js            # Zod request schema validator
│   │   ├── routes/                    # Route index and endpoint definitions
│   │   │   ├── auth.routes.js         # /api/auth routes
│   │   │   ├── budget.routes.js       # /api/budgets routes
│   │   │   ├── core.routes.js         # /api/core routes
│   │   │   ├── event.routes.js        # /api/events routes
│   │   │   ├── expense.routes.js      # /api/expenses routes
│   │   │   ├── public.routes.js       # /api/health route
│   │   │   ├── user.routes.js         # /api/users routes
│   │   │   └── work.routes.js         # /api/work-assignments routes
│   │   ├── services/                  # Encapsulated domain logic
│   │   │   ├── auth.service.js        # Session persistence and password hashing
│   │   │   ├── budget.service.js      # Current budget calculations
│   │   │   ├── conflict.service.js    # 3D spatial-temporal collision detection
│   │   │   ├── expense.service.js     # Expense aggregations
│   │   │   └── receiptStorage.service.js # Receipt abstraction stub
│   │   ├── utils/                     # Utility helpers (ApiError, asyncHandler, dateUtils)
│   │   ├── validators/                # Strict Zod schemas for all request payloads
│   │   └── server.js                  # Application entry point & port listener
│   ├── tests/
│   │   ├── api.test.js                # 39 Unit & Mock tests (Jest + Supertest)
│   │   └── e2e-workflow.test.js       # 21 End-to-end integration tests (Node Test Runner)
│   ├── .env.example                   # Environment configuration template
│   └── package.json                   # Backend scripts and dependencies
│
├── acm-frontend/                      # Next.js 16 App Router Client
│   ├── app/
│   │   ├── core/
│   │   │   └── dashboard/
│   │   │       └── page.js            # Protected Core Operations Desk (/core/dashboard)
│   │   ├── login/
│   │   │   └── page.js                # Role-tiered authentication portal (/login)
│   │   ├── globals.css                # Swiss Precision Design System & CSS Variables
│   │   ├── layout.js                  # Root HTML document, metadata & font providers
│   │   └── page.js                    # Public campus homepage (/)
│   ├── components/                    # Modular React 19 UI components
│   │   ├── animation/                 # WindSwirl & IntroSequence ribbons
│   │   ├── auth/                      # LoginPanel, ProtectedRoute, ChangePasswordModal
│   │   ├── branding/                  # AcmLogo SVG brand component
│   │   ├── budgets/                   # BudgetModal allocation adjuster
│   │   ├── calendar/                  # EventCalendar (FullCalendar integration)
│   │   ├── dashboard/                 # Operations desk sub-views:
│   │   │   ├── ActivityFeed.jsx       # Chronological audit dispatch
│   │   │   ├── AnalyticsReports.jsx   # Visual burn rate & category breakdown
│   │   │   ├── ConflictCenter.jsx     # Side-by-side collision comparison cards
│   │   │   ├── CoreDashboard.jsx      # Master Operations Desk layout & workspace tabs
│   │   │   ├── TeamManagement.jsx     # Member directory & auto-credential generator
│   │   │   └── WorkAssignments.jsx    # Task delegation board
│   │   ├── events/                    # EventSection, EventGrid, EventCard, EventForm,
│   │   │                              # EventDetails modal, EventResolveModal
│   │   ├── expenses/                  # ExpenseTable & ExpenseForm modals
│   │   ├── layout/                    # Navbar & Footer
│   │   ├── providers/                 # Combined client contexts
│   │   └── ui/                        # Modal, ConfirmModal, LoadingState, ErrorState
│   ├── context/
│   │   ├── AuthContext.jsx            # Authentication state, JWT session storage & logout
│   │   └── ToastContext.jsx           # Global floating status notifications
│   ├── hooks/
│   │   └── useEvents.js               # Event fetching, caching, pagination & optimistic updates
│   ├── lib/
│   │   ├── api.js                     # Unified API client & error normalizer
│   │   └── dates.js                   # Timezone-aware date formatting utilities
│   ├── public/                        # Static assets (acm-logo.png)
│   ├── .env.example                   # Client environment template
│   └── package.json                   # Frontend scripts and dependencies
│
└── README.md                          # Master Project Architecture & Documentation
```

---

## RESTful API Specification & Endpoint Directory

All endpoints are mounted with the `/api` prefix and return JSON adhering to the standardized envelope:
```json
{
  "success": true,
  "message": "Human readable status description",
  "data": { ... },
  "pagination": { "page": 1, "limit": 10, "total": 42, "totalPages": 5 }
}
```

### Authentication & Account Routes (`/api/auth`)
| Method | Endpoint | Access Level | Description |
|---|---|---|---|
| `POST` | `/api/auth/executive/login` | Public (Rate-Limited) | Authenticates Executive credentials; returns Bearer JWT. |
| `POST` | `/api/auth/core/login` | Public (Rate-Limited) | Authenticates Core Administrator credentials; returns Bearer JWT. |
| `POST` | `/api/auth/logout` | Authenticated | Revokes the current session `jti` in PostgreSQL immediately. |
| `GET` | `/api/auth/me` | Authenticated | Retrieves current authenticated user profile and role. |
| `POST` | `/api/auth/change-password` | Authenticated | Verifies old password and establishes new password hash. |

### Public & Management Event Routes (`/api/events`)
| Method | Endpoint | Access Level | Description |
|---|---|---|---|
| `GET` | `/api/events` | Public / Optional Auth | Paginated event list (supports `category`, `search`, `status`, `from`, `to`). |
| `GET` | `/api/events/upcoming` | Public | Published upcoming events ordered chronologically. |
| `GET` | `/api/events/past` | Public | Published completed events ordered newest first. |
| `GET` | `/api/events/:id` | Public / Optional Auth | Detailed event metadata (public sees published; Core sees drafts). |
| `POST` | `/api/events` | Executive, Core, Admin | Creates draft or published event with automated 3D collision check. |
| `PATCH` | `/api/events/:id` | Core, Admin | Updates event details with collision validation. |
| `DELETE` | `/api/events/:id` | Core, Admin | Soft-archives an event (marks `CANCELLED` and preserves history). |
| `POST` | `/api/events/:id/resolve` | Core, Admin | Reviews and resolves a draft proposal into `PUBLISHED` or `CANCELLED`. |
| `GET` | `/api/events/:id/upvote` | Optional Auth | Retrieves total endorsement upvotes and peer voter list. |
| `POST` | `/api/events/:id/upvote` | Executive, Core, Admin | Endorses a draft proposal (toggles off if already voted). |
| `DELETE` | `/api/events/:id/upvote` | Executive, Core, Admin | Explicitly removes endorsement from a draft proposal. |

### Core Operations Desk Routes (`/api/core`)
| Method | Endpoint | Access Level | Description |
|---|---|---|---|
| `GET` | `/api/core/dashboard` | Core, Admin | Master dashboard payload (summary, conflicts, activity, drafts, team). |
| `GET` | `/api/core/dashboard/summary` | Core, Admin | Operational counts (total, upcoming, past, draft, cancelled, expenses). |
| `GET` | `/api/core/dashboard/conflicts` | Core, Admin | Scanned array of colliding event pairs with clash reasons. |
| `GET` | `/api/core/dashboard/recent-activity` | Core, Admin | Last 15 chronological audit log entries with actor metadata. |

### Financial Ledger & Budget Routes (`/api/expenses` & `/api/budgets`)
| Method | Endpoint | Access Level | Description |
|---|---|---|---|
| `GET` | `/api/expenses` | Executive, Core, Admin | Paginated ledger records (supports category and search filtering). |
| `GET` | `/api/expenses/:id` | Executive, Core, Admin | Detailed expense record. |
| `POST` | `/api/expenses` | Executive, Core, Admin | Submits an itemized expense claim with decimal precision. |
| `PATCH` | `/api/expenses/:id` | Core, Admin | Modifies an existing expense claim. |
| `DELETE` | `/api/expenses/:id` | Core, Admin | Soft-archives an expense record while retaining historical audit logs. |
| `GET` | `/api/budgets` | Executive, Core, Admin | All established semester and monthly budget allocations. |
| `GET` | `/api/budgets/current` | Executive, Core, Admin | Current active semester budget with committed funds and remaining reserve. |
| `POST` | `/api/budgets` | Core, Admin | Establishes a new semester or monthly expenditure envelope. |
| `PATCH` | `/api/budgets/:id` | Core, Admin | Adjusts allocation cap on an existing budget. |

### Team Management & Work Assignment Routes (`/api/users` & `/api/work-assignments`)
| Method | Endpoint | Access Level | Description |
|---|---|---|---|
| `GET` | `/api/users` | Core, Admin | Directory of all registered chapter members with activity counts. |
| `POST` | `/api/users` | Core, Admin | Creates a user account with optional auto-generated password. |
| `GET` | `/api/users/:id` | Core, Admin | Detailed user profile. |
| `PATCH` | `/api/users/:id` | Core, Admin | Updates user role, title, department, or active status. |
| `DELETE` | `/api/users/:id` | Core, Admin | Deactivates or removes a user account. |
| `GET` | `/api/work-assignments` | Executive, Core, Admin | Lists tasks (Executives only receive tasks assigned to them). |
| `POST` | `/api/work-assignments` | Core, Admin | Creates and delegates a work task to an executive officer. |
| `PATCH` | `/api/work-assignments/:id` | Executive, Core, Admin | Updates task status (`PENDING` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `COMPLETED`). |
| `DELETE` | `/api/work-assignments/:id` | Core, Admin | Deletes a delegated task assignment. |

---

## Environment Configuration & Security Controls

### Backend Environment Variables (`acm-backend/.env`)

| Variable Name | Type | Required | Default / Example | Purpose |
|---|---|---|---|---|
| `NODE_ENV` | String | Yes | `development` | Runtime environment (`development`, `production`, `test`). |
| `PORT` | Integer | Yes | `4000` | HTTP port on which Express server listens. |
| `DATABASE_URL` | String | Yes | `postgresql://user:pass@localhost:5432/acm_manager` | PostgreSQL connection string for Prisma. |
| `CORS_ORIGIN` | String | Yes | `http://localhost:3000` | Whitelisted frontend origins (comma-separated for multiples). |
| `JWT_SECRET` | String | Yes | Random $\ge 32$ chars | Cryptographic secret for signing Bearer JWTs. |
| `JWT_EXPIRES_IN` | String | No | `1h` | Expiration window for access tokens. |
| `JWT_ISSUER` | String | No | `acm-conflict-manager` | Claim `iss` for verifying token origin. |
| `JWT_AUDIENCE` | String | No | `acm-api` | Claim `aud` for verifying audience. |
| `AUTH_RATE_LIMIT_WINDOW_MS`| Integer | No | `900000` (15 mins) | Rate limit rolling time window in milliseconds. |
| `AUTH_RATE_LIMIT_MAX` | Integer | No | `10` | Maximum login attempts allowed per IP per window. |
| `CORE_BOOTSTRAP_EMAIL` | String | No | `admin@acm.org` | Email for one-time initial Core admin creation. |
| `CORE_BOOTSTRAP_PASSWORD`| String | No | $\ge 12$ chars | Password for one-time initial Core admin creation. |
| `CORE_BOOTSTRAP_NAME` | String | No | `ACM Core Administrator` | Full name for initial Core administrator. |
| `SEED_DEMO` | Boolean | No | `false` | Enables seeding demo accounts (`refuses in production`). |

### Frontend Environment Variables (`acm-frontend/.env.local`)

| Variable Name | Type | Required | Default / Example | Purpose |
|---|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | String | Yes | `http://localhost:4000/api` | Base URL prefix for backend REST API. |

### Security Architecture & Defense-in-Depth

- **Revocable JWT JTI Sessions**: Every token contains a cryptographic UUID `jti`. Authenticated middleware checks PostgreSQL on every request to confirm `revokedAt IS NULL`. Revocation is immediate upon logout.
- **Strict Role Verification**: Endpoint authorization relies exclusively on database queries (`req.user.role`), never client-supplied request body roles.
- **SQL Injection Prevention**: All queries execute through Prisma ORM using parameterized SQL queries.
- **Brute-Force Rate Limiting**: Authentication endpoints enforce strict IP-based rate limiting (10 attempts per 15-minute window).
- **HTTP Security Headers**: Integrated Helmet configuration disables `X-Powered-By`, enables `X-Content-Type-Options: nosniff`, and configures frame protection.

---

## Local Setup & Installation Guide

### Prerequisites
- **Node.js**: `v20.9.0` or higher (`node -v`)
- **Package Manager**: `npm` (`npm -v`)
- **Database Engine**: [PostgreSQL 14+](https://www.postgresql.org/) running locally or accessible via a hosted instance (e.g., Supabase, Neon, AWS RDS).

---

### 1. Backend Setup & Database Migration

1. Open a terminal and navigate to the backend directory:
   ```powershell
   cd acm-backend
   ```
2. Install dependencies:
   ```powershell
   npm install
   ```
3. Initialize the environment file:
   ```powershell
   Copy-Item .env.example .env
   ```
4. Open `.env` and set your `DATABASE_URL`, a strong `JWT_SECRET` (32+ random characters), and your allowed frontend origin in `CORS_ORIGIN`:
   ```env
   DATABASE_URL=postgresql://postgres:your_password@localhost:5432/acm_incursion?schema=public
   JWT_SECRET=super_secret_cryptographic_random_key_with_at_least_32_characters
   CORS_ORIGIN=http://localhost:3000
   ```
5. Generate Prisma Client and apply database migrations:
   ```powershell
   npm run prisma:generate
   npm run prisma:migrate
   ```

---

### 2. Safe Administrator Account Bootstrapping

To create the initial Core Administrator account safely without open public registration:

1. Temporarily add bootstrap credentials to `acm-backend/.env`:
   ```env
   CORE_BOOTSTRAP_EMAIL=core@acm.org
   CORE_BOOTSTRAP_PASSWORD=SecureCorePassword123!
   CORE_BOOTSTRAP_NAME=ACM Lead Administrator
   ```
2. Execute the database seed:
   ```powershell
   npm run db:seed
   ```
   *The seed will create the account only if the email does not already exist; it refuses to overwrite passwords on existing accounts.*
3. **Remove** the `CORE_BOOTSTRAP_PASSWORD` value from your `.env` after running the seed.
4. *(Optional Demo Mode)*: In development, you can seed demo executive and core accounts:
   ```env
   SEED_DEMO=true
   DEMO_EXECUTIVE_EMAIL=executive@acm.org
   DEMO_EXECUTIVE_PASSWORD=ExecutivePassword123!
   DEMO_CORE_EMAIL=core@acm.org
   DEMO_CORE_PASSWORD=CorePassword123!
   ```
   Then run:
   ```powershell
   npm run db:seed
   ```
5. Start the backend development server:
   ```powershell
   npm run dev
   ```
   *The Express API will be operational at `http://localhost:4000/api`.*

---

### 3. Frontend Setup & Client Execution

1. Open a second terminal and navigate to the frontend directory:
   ```powershell
   cd acm-frontend
   ```
2. Install dependencies:
   ```powershell
   npm install
   ```
3. Initialize the local environment file:
   ```powershell
   Copy-Item .env.example .env.local
   ```
4. Verify that `NEXT_PUBLIC_API_URL` points to your backend instance:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:4000/api
   ```
5. Launch the Next.js development server:
   ```powershell
   npm run dev
   ```
6. Open your browser and navigate to **`http://localhost:3000`**.

---

## Verification & Test Suite

### Running Backend Mock & Unit Test Suite

The backend includes a comprehensive Jest and Supertest suite featuring in-memory mocked PostgreSQL persistence. This verifies all route definitions, Zod validation schemas, role enforcement, collision detection rules, and financial accuracy without requiring a live database connection:

```powershell
cd acm-backend
npm test
```

**Test Suite Coverage Summary (39 Tests Passed)**:
- `public events`: Listing, ordering, filtering, route precedence.
- `role-specific login`: Role separation, token generation, server-side session revocation.
- `event permissions & validation`: Executive draft creation, Core publishing, timeslot ordering.
- `concurrency collision detection`: Overlapping venues, audience intersection, 409 status code, explicit acknowledgment overrides.
- `executive upvoting & peer verification`: Upvote toggle, authentication guards, status threshold badges.
- `Core dashboard authorization`: Viewer 401, Executive 403, Core summary metrics aggregation.
- `financial ledger`: Decimal precision validation, negative amount rejection, search indexing.
- `event resolution & lifecycle`: Transitioning drafts to published with resolution notes.
- `user management`: Executive account provisioning, auto-generated passwords, forced password rotation.
- `work assignments`: Delegation, priority filtering, status transitions.
- `password security`: Authenticated password rotation and validation.

### Running End-to-End Live Workflow Suite

To test the entire application against a live running PostgreSQL database and Express server:

1. Ensure the backend server is running at `http://localhost:4000`.
2. Run the native Node test runner:
   ```powershell
   cd acm-backend
   npm run test:e2e
   ```
   *This executes 21 sequential integration steps covering the complete user journey.*

### Compiling Frontend Production Bundle

Validate the Next.js frontend for zero compilation or type errors:

```powershell
cd acm-frontend
npm run build
```