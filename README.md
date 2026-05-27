# DevCollab

## Problem Statement

**Problem Statement Chosen:** `DevCollab - Real-Time Project Collaboration Platform for Developers`

**Vision:** Build a GitHub-meets-Notion-meets-Slack platform designed for student developer teams, where they can manage projects, write documentation, review code snippets, track tasks, and communicate in one place, with AI acting as a project assistant.

## Brief Description

DevCollab is a collaborative workspace for student developer teams. It combines authentication, workspace management, member management, billing controls, task tracking, team communication, notifications, code snippet review, and lightweight AI-assisted project workflows into a single dashboard experience.

The application is designed as a multi-section collaboration hub where teams can:

- sign in and create a workspace
- manage project tasks in board, list, and calendar views
- add and manage members with roles
- review code snippets and feedback
- post comments with mentions
- track notifications and workspace activity
- manage account settings and workspace details
- simulate AI-supported planning and project summaries

## Tech Stack

### Frontend

- HTML5
- CSS3
- Vanilla JavaScript

### Backend

- No separate backend service is currently connected in the deployed `devcollab` app
- Application state is managed on the client side

### Database

- No external database is currently connected
- Local browser storage (`localStorage`) is used for persistence in the prototype

### Third-Party APIs / Tools

- Vercel for deployment and hosting
- GitHub for source control and repository hosting
- GitHub CLI for repository setup

## How To Run Locally

### Option 1: Open directly

1. Clone the repository:

```bash
git clone https://github.com/myself-archita/devcollab.git
```

2. Move into the project folder:

```bash
cd devcollab
```

3. Open `index.html` in your browser.

### Option 2: Run with a simple local server

1. Clone the repository:

```bash
git clone https://github.com/myself-archita/devcollab.git
```

2. Move into the project folder:

```bash
cd devcollab
```

3. Start a local server. For example, with VS Code Live Server or Python:

```bash
python -m http.server 8000
```

4. Open:

```text
http://localhost:8000
```

## Features Built

- Authentication flow with Sign In, Sign Up, Forgot Password, and Reset Password
- Demo credentials for quick evaluation
- Post-login menu-first experience
- Workspace overview and settings
- Task management with Kanban board
- Task list view
- Task calendar view
- Drag and drop task movement
- Team comments with `@mentions`
- Notifications center
- Activity feed
- Member management with roles
- Billing section with plan details and payment method mock flow
- Account management and profile editing
- Workspace profile editing
- AI-inspired feature breakdown generation
- AI-inspired project summary generation
- AI-inspired blocker analysis
- AI-inspired standup report generation
- Persistent prototype state using `localStorage`
- Responsive interface for desktop and smaller screens

## Live Deployment

- Live App: [https://devcollab-wheat.vercel.app/](https://devcollab-wheat.vercel.app/)

## Team Members

- **Archita Guha Roy** - Frontend development, UI/UX, product structure, deployment, integration
- **Shreyash Pandey** - Collaboration, project support, feature planning, testing/review

## Known Bugs / Limitations

- This is currently a frontend-heavy prototype and does not use a production backend
- Data is stored in browser `localStorage`, so it is not shared across devices or users
- Notifications, billing, and AI flows are simulated rather than connected to live services
- Real-time collaboration is represented through UI behavior and mock state, not live sockets
- Authentication is prototype-level and not production-secure
- The current repository history is **not yet ideal for the judge requirement about gradual, incremental commits** because the repo was initialized and pushed recently as a standalone repository

## Commit History Note

The judging note says commit history should reflect genuine incremental progress and should not look like a last-minute code dump. That expectation is reasonable.

This repository currently contains a recent standalone initial commit because the project folder was separated into its own GitHub repository after deployment. To stay honest and transparent:

- the code and deployment are real
- the repository setup was completed later
- the current commit history does **not fully demonstrate the original development timeline**

If this repository is being submitted for judging, it is best to explain that clearly rather than trying to fabricate history.
