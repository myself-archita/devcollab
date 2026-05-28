# DevCollab

**Problem Statement Chosen:** DevCollab — Real-Time Project Collaboration Platform for Developers

**Vision:** Build a GitHub-meets-Notion-meets-Slack platform designed for student developer teams — where they can manage projects, write documentation, review code snippets, track tasks, and communicate — all in one place, with AI acting as a project assistant.

DevCollab is a full-stack collaboration platform for developer teams, built as a GitHub-meets-Notion-meets-Slack workspace for projects, tasks, documentation, team communication, and lightweight AI-assisted workflows.

## Live Demo

- **Production:** [https://devcollab-wheat.vercel.app/](https://devcollab-wheat.vercel.app/)
- **Demo account:** `demo@devcollab.app`
- **Password:** `dev12345`

## Brief Description

DevCollab combines authentication, workspace management, member management, billing controls, task tracking, team communication, notifications, code snippet review, and AI-inspired project workflows into one dashboard experience for student developer teams.

## What It Solves

Student and early-stage developer teams usually jump between too many tools:

- one app for tasks
- one for docs
- one for chat
- one for billing
- one for workspace coordination

DevCollab unifies those workflows into one polished dashboard so teams can plan faster, coordinate better, and stay organized without context switching.

## Key Capabilities

- Secure sign-in, sign-up, password reset, and session-based auth
- Workspace dashboard with task, member, billing, and account management
- Kanban, list, and calendar task views
- Team comments with `@mentions`
- Notifications and activity feed
- Member roles and workspace controls
- Billing panel with Stripe Checkout test-mode support
- AI-inspired project summaries, blocker analysis, and standup generation

## Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Backend:** Node.js, Express
- **Database:** PostgreSQL
- **Auth:** Server-side sessions with HttpOnly cookies
- **Payments:** Stripe Checkout in test mode
- **Deployment:** Vercel
- **Other tools:** Docker for local PostgreSQL, GitHub for source control

## Architecture

DevCollab is structured as a modular full-stack application:

```text
devcollab/
├─ server.js
├─ public/
├─ src/
│  ├─ db/
│  ├─ routes/
│  │  └─ features/
│  └─ services/
└─ docs/
```

- `server.js` keeps the app shell thin and wires everything together
- `src/routes/index.js` acts as the central route aggregator
- `src/routes/auth.js` handles authentication flows
- `src/routes/billing.js` handles billing and checkout
- `src/routes/features/` contains feature-specific route modules
- `src/db/bootstrap.js` creates the schema and seeds demo data
- `src/db/pool.js` configures PostgreSQL connectivity
- `src/services/security.js` handles password, token, and session helpers
- `src/services/state.js` assembles API state responses
- `src/services/stripe.js` encapsulates Stripe Checkout integration

## Why This Is Full Stack

- The frontend communicates with Express `/api` endpoints
- The backend persists data in PostgreSQL
- Authentication is server-side and session-based
- Billing is integrated through a real payment gateway flow
- Workspace data, tasks, comments, members, and notifications are all database-backed

## Local Development

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment variables

Copy `.env.example` to `.env` and update values as needed.

```env
PORT=3000
PGHOST=127.0.0.1
PGPORT=5432
PGUSER=postgres
PGPASSWORD=postgres
PGDATABASE=devcollab
```

For a hosted database, use a connection string instead:

```env
POSTGRES_URL=postgres://user:password@host:5432/devcollab
```

For Stripe test billing:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_ID=price_...
STRIPE_SUCCESS_URL=https://your-domain.com/?billing=success
STRIPE_CANCEL_URL=https://your-domain.com/?billing=cancel
```

### 3) Start PostgreSQL

If you have Docker installed:

```bash
docker compose up -d
```

If you already run PostgreSQL locally, create a database named `devcollab` and match the `.env` values to your setup.

### 4) Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Features Built

- Authentication flow with sign in, sign up, forgot password, and reset password
- Post-login workspace dashboard
- Task management with board, list, and calendar views
- Team comments with `@mentions`
- Notifications center
- Activity feed
- Member management with roles
- Billing section with payment-method capture and Stripe Checkout
- Stripe Checkout test-mode billing integration
- Account and workspace profile editing
- AI-inspired project summaries, blocker analysis, and standup generation
- Persistent demo state stored in PostgreSQL
- Responsive interface for desktop and smaller screens

## Deployment

### Vercel

1. Import the GitHub repository into Vercel.
2. Connect a PostgreSQL provider or Vercel Postgres.
3. Set `POSTGRES_URL` or the individual `PG*` variables.
4. Set Stripe test-mode variables if you want the checkout flow enabled.
5. Redeploy after saving environment variables.

The app includes `vercel.json` so `/api/*` routes are correctly routed into the Express backend.

## Security & Reliability

- Passwords are stored as bcrypt hashes
- Sessions are stored server-side and delivered through HttpOnly cookies
- Password reset and password change invalidate old sessions
- Security headers are enabled for browser hardening
- The backend auto-creates tables on startup
- Demo data is seeded when the database is empty

## Known Bugs / Limitations

- The project is demo-first, so some AI outputs are simulated rather than generated by a live LLM API.
- Stripe is integrated in test/demo mode; production charging still requires real Stripe environment keys.
- If no production database is configured on Vercel, the app falls back to seeded demo state so judges can still test the product.
- Real-time collaboration is represented through shared state and UI interactions rather than live WebSocket presence.

## Feature Highlights

- Authentication flow with sign in, sign up, forgot password, and reset password
- Workspace dashboard for projects and collaboration
- Task management with board, list, and calendar views
- Team comments with mentions
- Notification center and activity feed
- Member management with roles
- Billing panel with payment-method capture and Stripe Checkout
- Workspace profile and account editing
- AI-inspired project summaries and blocker analysis

## Team

- **Archita Guha Roy** - Full-stack architecture, frontend implementation, backend integration, database design, deployment, and product UI/UX
- **Shreyash Pandey** - Feature planning, testing/review, collaboration support, product feedback, and demo preparation

## Development History

The repository was built iteratively with incremental commits so the history reflects real progress:

- frontend prototype
- backend conversion to PostgreSQL
- auth hardening and modular route split
- billing and Stripe integration
- documentation and deployment polish

If you inspect the Git history, you will see the project evolving step by step rather than appearing as a single late-stage code dump.

## Notes

- The old SQLite and Supabase setup files are no longer used.
- The project is now organized around a single Express + PostgreSQL backend.
- For production billing, create a Stripe test-mode subscription price and set the Stripe environment variables above.
