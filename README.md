# Employee Engagement Platform

A full-stack employee engagement and HR support platform developed as a college major project. Employees can submit and track feedback, communicate with HR, and use an HR knowledge assistant. Administrators can manage feedback, review activity, and support employees through role-protected tools.

> **Project status:** Updated November 19, 2026. The web application and backend are maintained in this repository. The HR RAG agent is a separate service and must be securely deployed and configured before employee knowledge chat is available in production.

## Highlights

- Employee and administrator dashboards with role-based access.
- Feedback submission, status tracking, HR replies, filtering, pagination, and CSV export.
- Admin audit history and privacy protections for anonymous feedback.
- HR chat session history, escalation to HR, and a separate adapter for an existing RAG knowledge service.
- Realtime updates through Socket.IO, with MongoDB-backed session and event support.
- CSRF protection, secure session cookies, password hashing, and guarded administrator provisioning/reset workflows.
- Optional AI support for feedback and admin workflows. This is separate from the HR knowledge assistant.

## Architecture and technology

| Layer | Technologies |
|---|---|
| Frontend | React, Vite, Redux Toolkit, Axios, Socket.IO client |
| Backend | Node.js, Express, Mongoose, Socket.IO |
| Database | MongoDB; Atlas for hosted deployments |
| AI integrations | Configurable OpenAI/Gemini for feedback workflows; separately hosted Python/Ollama/Chroma RAG agent for HR knowledge chat |
| Deployment | Vercel configuration for frontend/API; Render configuration is also included |

The RAG agent is not bundled into this repository. Do not assume employee chat is production-ready solely because the web application is deployed.

## Full feature and component inventory

This section summarizes the application as it has evolved from its initial employee feedback workflow through the current HR assistant, admin, security, and deployment work. A capability described as optional depends on its provider or deployment configuration.

### Employee experience

- Landing, sign-in, and employee self-registration screens with role-safe registration.
- Employee dashboard with overview, personal feedback history, search/filter/sort controls, and guided feedback submission.
- Feedback questionnaire flow with question generation, draft refinement, summary/category/tag suggestions, and mood indicators. AI-backed functions depend on configured provider access; deterministic questionnaire questions and fallback behavior are also present.
- Feedback privacy choice, submission status, and threaded follow-up messages with HR.
- HR knowledge assistant with persisted chat sessions, cited source display when supplied by the upstream service, retry/no-source states, and explicit HR escalation/follow-up.

### HR and administrator experience

- Admin dashboard and section navigation for feedback management and chat oversight.
- Feedback filtering, pagination, status/assignment workflows, response drafting, review/approval, and CSV export.
- Anonymous feedback privacy handling in administrator responses and exports.
- Feedback conversation threads between employees and HR.
- Scenario management and unmatched-scenario review queue, including trigger matching, similarity scoring, safety phrase checks, and usage tracking.
- Administrator audit history for supported administrative actions.
- Protected administrator-only pages and APIs; administrator account seeding and a guarded password reset utility.

### Frontend component map

- **Application and navigation:** `App`, `Layout`, `ProtectedRoute`, `AuthLayout`, `LandingPage`, `LoginPage`, `SignUpPage`.
- **Employee workflow:** `EmployeeDashboard`, `FeedbackForm`, `AIQuestionnaire`, `FeedbackList`, `FeedbackConversation`, `HRKnowledgeAssistant`.
- **Administrator workflow:** `AdminDashboard`, `AdminSectionNav`, `FeedbackTable`, `FeedbackFilters`, `ReplyModal`, `AdminChatSessions`, `AdminAuditLog`, `ScenarioManagementPage`, `ScenarioReviewQueuePage`.
- **Shared UI:** `StatsCards`, `Pagination`, `LoadingSpinner`, `ContentSkeleton`.
- **Client state and transport:** Redux store with `authSlice` and `feedbackSlice`; Axios API helper; Socket.IO client helper; date utility; shared responsive styles.

### Backend component map

- **HTTP application:** Express server, health endpoint, route registration, database startup, error handling, CORS, and request parsing.
- **API areas:** authentication, feedback, administrator, and chat routes/controllers; scenario controller and scenario review endpoints.
- **Persistence models:** user, feedback, reply, chat session, scenario, unmatched scenario, and administrator audit log, stored through Mongoose.
- **Authentication and security:** MongoDB-backed Express sessions, bcrypt password hashing, role/ownership authorization, CSRF middleware, security headers, request rate limiting, Mongo query sanitization, and authenticated Socket.IO handshakes.
- **Business utilities:** request validation, AI assistance, scenario matching, RAG-agent adapter, feedback privacy shaping, CSV generation, pagination, audit recording, and realtime event helpers.
- **Realtime delivery:** Socket.IO events with MongoDB adapter support for multi-instance deployments.
- **Maintenance and quality:** administrator seed/reset scripts and Node's built-in test runner with focused tests for reset behavior, CSRF, AI usage, CSV privacy/export, pagination, and realtime behavior.

## Technology stack across the project

| Area | Technologies used |
|---|---|
| Web client | React 18, JavaScript/JSX, Vite, React Router, Tailwind CSS, PostCSS, Autoprefixer |
| Client state and UI | Redux Toolkit, React Redux, Axios, Framer Motion, React Icons |
| API server | Node.js 18+, Express 4 |
| Data and sessions | MongoDB, Mongoose, `connect-mongo`, `express-session` |
| Realtime | Socket.IO and Socket.IO client; MongoDB Socket.IO adapter for distributed events |
| AI and language services | OpenAI API (including embeddings where configured); Google Gemini REST API; separate Python RAG service using Flask, Ollama, Chroma, and sentence-transformers in its own checkout |
| Validation and protection | `express-validator`, Helmet, CORS, express-rate-limit, express-mongo-sanitize, bcryptjs, JSON Web Tokens for socket authentication |
| Build and development | npm, Vite, PostCSS, Tailwind CSS, Nodemon; Node built-in `node:test` runner |
| Hosting configuration | Vercel and Render configuration; MongoDB Atlas as the hosted database option |

The repository's package manifests are authoritative for installed dependencies. Redis and email providers appeared in earlier planning/documentation but are not current direct dependencies in this repository; treat them as historical/optional only unless separately configured by a deployment. The RAG service is maintained separately and is not part of this repository's Node dependency tree.

### Development milestones

- **Initial project foundation:** employee feedback submission and administration, account access, MongoDB-backed records, and the React/Node web application.
- **AI and scenario workflows:** guided questionnaires, feedback summarization/refinement, AI-assisted HR replies, sentiment/category suggestions, scenario matching, and review of unmatched cases.
- **Employee and HR collaboration:** personal dashboards, feedback conversations, chat sessions, escalation paths, and realtime updates.
- **Security and operations:** role-based authorization, secure server-side sessions, CSRF protection, audit history, anonymous-feedback privacy, pagination, CSV export, and controlled administrator provisioning/reset.
- **Knowledge assistant integration:** a backend adapter to the separately maintained HR RAG agent, with source-aware responses and explicit availability/security boundaries.
- **Deployment and documentation:** local setup plus Vercel/Render configuration and environment templates; production integrations still require provider credentials and secured services.
## Repository layout

```text
backend/                 Express API, models, middleware, services, tests
frontend/                React application
vercel.json              Vercel multi-service routing
render.yaml              Render service configuration
README.md                Setup, configuration, deployment, and project guide
UPDATE_LOG.md             Chronological project change log
```

## Requirements

- Node.js 18 or later and npm
- MongoDB connection string
- Optional: Redis and email provider for features enabled by the deployment
- Optional: OpenAI or Gemini credentials for feedback/admin AI features
- Optional and separate: secured RAG agent URL and authentication for employee HR knowledge chat

## Local setup

### 1. Configure the backend

```powershell
cd backend
npm install
Copy-Item .env.example .env
```

Edit `backend/.env` with the values for your machine. At minimum, configure:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/employee-engagement
SESSION_SECRET=<long-random-secret>
SOCKET_TOKEN_SECRET=<different-long-random-secret>
FRONTEND_URL=http://localhost:5173
FEEDBACK_SLA_HOURS=72
PORT=5002
```

Use the checked-in `backend/.env.example` as the source of truth for supported backend variables. Add provider credentials only for features you intend to enable. Never commit `.env` files or real secrets.

Start MongoDB, then create an administrator using configured `ADMIN_NAME`, `ADMIN_EMAIL`, and a unique `ADMIN_PASSWORD` of at least 12 characters:

```powershell
npm run seed
```

The seed operation creates an administrator and does not overwrite an existing account. To reset an existing administrator, configure `RESET_ADMIN_EMAIL` and `RESET_ADMIN_PASSWORD` temporarily and run `npm run reset-password`; remove those values after use.

Start the API:

```powershell
npm run dev
```

The backend runs at `http://localhost:5002`.

### 2. Configure and start the frontend

In another terminal:

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api` requests to the local backend. Public registration creates employee accounts; create administrators using the backend seed workflow.

### 3. Optional checks

```powershell
cd backend
npm test
```

For a production frontend build:

```powershell
cd frontend
npm run build
```

## Environment configuration

Backend and frontend templates are maintained in `backend/.env.example` and `frontend/.env.example`. Values depend on the selected hosting environment. Common backend settings include:

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB application database |
| `SESSION_SECRET` | Secret used for server-side session security |
| `SOCKET_TOKEN_SECRET` | Separate secret for realtime authentication |
| `FRONTEND_URL` | Allowed frontend origin when frontend and API use separate origins |
| `FEEDBACK_SLA_HOURS` | Feedback response target, from 1 to 720 hours |
| `AI_PROVIDER`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `GEMINI_MODEL` | Optional feedback and admin AI configuration |
| `RAG_AGENT_URL` and `RAG_AGENT_*` | Optional separate HR RAG service integration; production requires verified upstream authentication |
| `REDIS_URL`, email settings | Optional services, when enabled by the deployment |

Do not put server secrets in `VITE_*` variables. Do not enable production RAG access until the separate service is deployed over HTTPS, enforces authentication, and has safe logging configured.

## Deployment

The repository includes `vercel.json` and `render.yaml`. Review the configuration and the hosting provider's current requirements before deployment. For Vercel, configure the required database URI and strong, distinct session and socket secrets in the project environment. Use Atlas networking and least-privilege database credentials. Configure optional AI, email, Redis, and RAG variables only when those services are available and secured.

Provision the first administrator against the intended production database using the backend seed command and temporary environment variables. Verify `/api/health`, registration, sign-in, feedback workflows, administrator authorization, and realtime behavior after deployment. Never commit credentials or paste production secrets into project documentation.

### HR knowledge assistant deployment boundary

The HR knowledge assistant calls a separate Python RAG service. A local URL such as `127.0.0.1` points to the API runtime itself after deployment; it does not reach a developer computer. Keep RAG settings unset and verification disabled until the upstream is reachable over HTTPS and its authentication is actually enforced. The application must not be treated as having a live HR knowledge source until this integration is completed and verified.

## Security notes

- Keep `.env` files, database credentials, API keys, and reset passwords out of version control.
- Use strong, unique secrets and production-only credentials.
- Public signup creates employee accounts; administrator creation is a controlled backend operation.
- Anonymous feedback responses and exports should not expose submitter identity.
- Secure the separate RAG service itself; a backend verification flag does not add authentication to an unprotected upstream.

## Project documentation

See [UPDATE_LOG.md](UPDATE_LOG.md) for the dated implementation history, including the November 19 security, admin, feedback, and deployment updates.

## Academic project note

This repository is an educational major project demonstrating full-stack application development, database-backed workflows, access control, realtime communication, and integration with AI services. Optional or separately hosted integrations depend on valid configuration and should be identified clearly during evaluation.

## License

For educational and internal project use.
