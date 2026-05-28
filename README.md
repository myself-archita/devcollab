# DevCollab

## Problem Statement

**Problem Statement Chosen:** `DevCollab - Real-Time Project Collaboration Platform for Developers`

**Vision:** Build a GitHub-meets-Notion-meets-Slack platform designed for student developer teams, where they can manage projects, write documentation, review code snippets, track tasks, and communicate in one place, with AI acting as a project assistant.

## Brief Description

DevCollab is a collaborative workspace for student developer teams. It combines authentication, workspace management, member management, billing controls, task tracking, team communication, notifications, code snippet review, and lightweight AI-assisted project workflows into a single dashboard experience.

## Demo Access

- Email: `demo@devcollab.app`
- Password: `dev12345`

## Tech Stack

- Frontend: HTML5, CSS3, Vanilla JavaScript
- Backend: Node.js, Express
- Database: PostgreSQL
- Local database option: Dockerized Postgres
- Auth: server-side sessions stored in PostgreSQL and delivered through HttpOnly cookies
- Payments: Stripe Checkout in test mode
- Deployment: Vercel or any Node host with PostgreSQL access

## Project Structure

- Simple view:

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

- `server.js`: thin app shell, middleware, health/bootstrap, and route registration
- `src/routes/index.js`: central route aggregator
- `src/routes/auth.js`: authentication routes
- `src/routes/billing.js`: billing and Stripe checkout routes
- `src/routes/features/`: feature-specific route modules for profile, comments, members, tasks, and notifications
- `src/db/bootstrap.js`: schema creation and demo data seeding
- `src/db/pool.js`: PostgreSQL connection setup
- `src/services/state.js`: app state assembly for API responses
- `src/services/security.js`: password, session, and token helpers
- `src/services/stripe.js`: Stripe Checkout integration

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create environment config

Copy `.env.example` to `.env` and adjust the values if needed:

```env
PORT=3000
PGHOST=127.0.0.1
PGPORT=5432
PGUSER=postgres
PGPASSWORD=postgres
PGDATABASE=devcollab
```

For a hosted database, you can use a single connection string instead:

```env
POSTGRES_URL=postgres://user:password@host:5432/devcollab
```

For Stripe test-mode billing:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_ID=price_...
STRIPE_SUCCESS_URL=https://your-domain.com/?billing=success
STRIPE_CANCEL_URL=https://your-domain.com/?billing=cancel
```

### 3. Start PostgreSQL

If you have Docker installed, the easiest option is:

```bash
docker compose up -d
```

If you already have PostgreSQL installed locally, create a database named `devcollab` and set the `.env` values to match your server.

### 4. Start the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Architecture Notes

- The frontend still talks to Express `/api` endpoints, but the backend is now modular instead of one large file.
- Feature routes are separated by concern, which makes the app easier to explain, test, and extend.
- The server bootstraps PostgreSQL tables on startup and seeds demo data only when the database is empty.
- Sessions are server-side, hashed, and delivered via HttpOnly cookies for better production security.
- Stripe Checkout runs in test mode so the billing flow looks and feels real during demos.

## How It Works Now

- The frontend still talks to the same Express `/api` routes
- The backend now uses PostgreSQL instead of the checked-in SQLite file
- The server auto-creates tables on startup
- The server auto-seeds demo data when the database is empty
- Passwords are stored as bcrypt hashes
- Sessions are stored in PostgreSQL with server-side expiry and HttpOnly cookies
- Stripe Checkout can be enabled for real test-mode payment flows
- Static assets now live in `public/`, which is the Vercel-compatible layout for Express deployments

## Deploying To Vercel

1. Import the GitHub repository into Vercel.
2. Add a Postgres database from the Vercel Marketplace, or connect any managed Postgres provider.
3. Make sure your Vercel project has either `POSTGRES_URL` or the `PGHOST` / `PGPORT` / `PGUSER` / `PGPASSWORD` / `PGDATABASE` variables set.
4. Redeploy after the environment variables are saved.

This backend now supports both local `PG*` variables and hosted connection strings such as `POSTGRES_URL`, which is the shape commonly injected by Vercel Postgres integrations.

## Security Notes

- Existing legacy plain-text passwords are upgraded to bcrypt hashes automatically on startup.
- Password reset and password change invalidate existing sessions for that user.
- Session tokens are stored server-side as SHA-256 hashes and delivered through HttpOnly cookies.
- You can tune bcrypt cost and session lifetime with `BCRYPT_ROUNDS` and `SESSION_TTL_DAYS`.

## Features Built

- Authentication flow with Sign In, Sign Up, Forgot Password, and Reset Password
- Post-login workspace dashboard
- Task management with board, list, and calendar views
- Team comments with `@mentions`
- Notifications center
- Activity feed
- Member management with roles
- Billing section with mock plan switching and card update flow
- Stripe Checkout test-mode billing integration
- Account and workspace profile editing
- Persistent demo state stored in PostgreSQL
- Responsive interface for desktop and smaller screens

## Notes

- The old `data/devcollab.sqlite` files are no longer used by the backend.
- The old `supabase/` setup files have been removed because the app now uses a single Express + PostgreSQL path.
- If you deploy this app, point it at a persistent PostgreSQL instance by setting the same `PG*` environment variables.
- For production billing, set the Stripe environment variables listed above and create a test-mode subscription price.

## Live Deployment

- Live App: [https://devcollab-wheat.vercel.app/](https://devcollab-wheat.vercel.app/)

## Team Members

- **Archita Guha Roy** - Frontend development, UI/UX, product structure, deployment, integration
- **Shreyash Pandey** - Collaboration, project support, feature planning, testing/review

## Notes

- The old `data/devcollab.sqlite` files are no longer used by the backend.
- The old `supabase/` setup files have been removed because the app now uses a single Express + PostgreSQL path.
- If you deploy this app, point it at a persistent PostgreSQL instance by setting the same `PG*` environment variables.
- For production billing, set the Stripe environment variables listed above and create a test-mode subscription price.
