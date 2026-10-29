# Employee Engagement Platform

A full-stack employee engagement platform for feedback submissions, HR follow-up, and role-based administration. Employee chat uses a server-side adapter for the organization's existing retrieval-augmented HR knowledge agent; the agent itself is maintained separately and must be running and securely configured for chat to answer questions.

**Last Updated**: August 30, 2026 | **Version**: 1.2.0

## Features

### Core Features
- **Employee Dashboard**: Responsive workspace for employee profile context, feedback history, filtering, guided submissions, and HR resource conversations
- **Admin Dashboard**: Feedback management, conversation oversight, response approval, scenario management, and review queue
- **Feedback AI**: Existing OpenAI/Gemini services support feedback questionnaires, feedback processing, and admin reply drafting; they do not power employee chat
- **Scenario Matching**: MongoDB-backed scenario matching and admin review queue remain separate from document retrieval
- **HR Knowledge Assistant**: Chat contract boundary for the approved RAG agent, with source references, no-source handling, and HR escalation support
- **Feedback Management**: AI-enhanced feedback forms, employee and HR message threads, question generation, refinement suggestions, and categorization
- **Role-based Access**: Secure authentication with JWT for employees and admins with granular permission control
- **Employee Activity Summary**: Counts are derived from the signed-in employee's stored feedback; no unsupported analytics are displayed
- **Professional UI**: Enterprise-grade design with Tailwind CSS and fully responsive components

### Advanced Features (Jul 17 - Aug 30)
- **Batch Operations**: Bulk feedback approval, status updates, and reply management from admin dashboard
- **Advanced Filtering & Search**: Multi-field filtering, date range queries, sentiment analysis, and department-based segmentation
- **Export Functionality**: Export feedback reports as CSV/PDF with customizable date ranges and filters
- **Activity Logging**: Comprehensive audit trail of user actions, feedback modifications, and admin operations
- **Notification System**: Email notifications for feedback responses, escalations, and admin alerts
- **Performance Analytics**: Response time tracking, user engagement scoring, and effectiveness metrics
- **Data Validation**: Enhanced input validation, sanitization, and schema enforcement at both frontend and backend
- **Error Handling**: Improved error messages, retry mechanisms, and graceful degradation
- **Caching Strategy**: Redis-backed caching for frequently accessed scenarios and user sessions
- **Background Jobs**: Async processing for AI response generation and batch exports using job queues

## Tech Stack

- **Frontend**: React.js + Vite, Tailwind CSS, Redux Toolkit, Axios for HTTP client
- **Backend**: Node.js + Express.js, MongoDB + Mongoose, Socket.IO for real-time communication
- **Authentication**: JWT with bcrypt for secure password hashing
- **Feedback AI Services**: OpenAI API or Google Gemini API for the existing feedback/questionnaire and admin workflows
- **Caching & Jobs**: Redis for caching and Bull for job queue management (added Aug 15)
- **Testing**: Jest for unit testing, Supertest for API testing, React Testing Library for components (added Aug 5)
- **Security**: Helmet, CORS, Rate Limiting, Input Validation, SQL injection prevention
- **Monitoring**: Winston logging, performance metrics, error tracking

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- An OpenAI or Google Gemini API key for existing feedback/questionnaire and admin AI workflows (optional for the separately configured HR knowledge assistant)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the backend directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/employee-engagement
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRE=7d
   FRONTEND_URL=http://localhost:5173
   # These provider settings are for feedback/questionnaire and admin AI only.
   # Employee chat does not call either provider.
   AI_PROVIDER=gemini
   GEMINI_API_KEY=your-google-gemini-api-key-here
   GEMINI_MODEL=gemini-2.0-flash
   PORT=5002
   
   # Optional: Redis configuration for caching (added Aug 15)
   REDIS_URL=redis://localhost:6379
   
   # Optional: Email service for notifications (added Aug 20)
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   ```

   To use OpenAI for the existing feedback-related AI workflows instead, set `AI_PROVIDER=openai` and `OPENAI_API_KEY`. These settings do not connect the RAG agent.

4. Start MongoDB locally (if not already running):
   ```bash
   mongod
   ```

5. (Optional) Start Redis for caching:
   ```bash
   redis-server
   ```

6. Seed admin user:
   ```bash
   npm run seed
   ```
   Set `ADMIN_NAME`, `ADMIN_EMAIL`, and a unique `ADMIN_PASSWORD` of at least 12 characters in the backend environment first. The seed command creates a new administrator only; it will not delete or overwrite an existing account.

7. Start the backend server:
   ```bash
   npm run dev
   ```
   Server will be available at `http://localhost:5002`

8. (Optional) Run tests:
   ```bash
   npm test                 # Run all tests
   npm run test:coverage   # Generate coverage report
   ```

### Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   Frontend will be available at `http://localhost:5173`

4. (Optional) Run tests:
   ```bash
   npm test                 # Run all tests
   npm run test:coverage   # Generate coverage report
   ```

5. (Optional) Build for production:
   ```bash
   npm run build
   ```

The frontend expects the backend at `http://localhost:5002`.

### Sign-in examples

Open the frontend at `http://localhost:5173/login`:

| Account | Email | Password | How it is created |
|---|---|---|---|
| HR / Administration | The `ADMIN_EMAIL` value you configured | The `ADMIN_PASSWORD` value you configured | Set the administrator environment values, then run `cd backend` and `npm run seed` |
| Employee | `employee.demo@company.com` | The password you chose during registration | Open `http://localhost:5173/signup` and create an account; self-registration assigns the `employee` role |

The employee row above is an example, not a pre-seeded account. No employee demo account is currently created by `seed.js`. Do not reuse local demonstration account credentials in production.

#### Password Reset

To reset an existing user's password, run:
```bash
npm run reset-password
```
Follow the prompts to select a user and set a new password.

### User Registration

Employees can self-register through the frontend signup page. New users are assigned the `employee` role by default. Create an administrator using the backend seed command and its `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` settings. Public self-registration always creates employee accounts.

## Deploying with Render and Vercel

The recommended arrangement is the Express API on Render and the Vite single-page application on Vercel. MongoDB must be reachable from Render. The repository includes a Render Blueprint in `render.yaml` and SPA route rewrites in `frontend/vercel.json`.

### 1. Prepare MongoDB Atlas

1. Create a MongoDB Atlas database and a dedicated database user with a strong unique password.
2. Add the network access rule required for your Render service. Render outbound IP ranges vary by service and plan; use Atlas's documented Render connectivity options if available. Only use `0.0.0.0/0` if necessary, with database authentication and least-privilege access enabled.
3. Copy the application connection string. Keep it private.

### 2. Deploy the API to Render

1. Push the repository to GitHub. Do not commit `.env` files.
2. In Render, choose **New +**, then **Blueprint**, and connect this repository. Render reads `render.yaml`. The service root is `backend`, the build command is `npm ci`, the start command is `npm start`, and its health check is `/api/health`.
3. Supply the `MONGODB_URI` connection string and `FRONTEND_URL`. You can initially use the Vercel production origin after creating the frontend deployment. Origins are exact and can be comma-separated, for example `https://your-project.vercel.app,https://www.your-domain.example`.
4. Render generates `JWT_SECRET`. Keep it private and do not rotate it casually, since rotation signs out existing sessions.
5. Wait for the Render service to report healthy, then verify `https://YOUR-RENDER-SERVICE.onrender.com/api/health` returns JSON with `"status":"OK"`.
6. Create the first administrator only after deployment, using a unique password of at least 12 characters. In Render's service Shell, from the backend service root, run `ADMIN_NAME='XYZ HR Administrator' ADMIN_EMAIL='hr-admin@your-domain.example' ADMIN_PASSWORD='<your-unique-secret>' npm run seed`, replacing the example name, email, and password with your own values. Do not use the literal example values. The command does not print the password and refuses to overwrite an existing account. Avoid saving the temporary password as a permanent service environment variable. Do not use any old local demo admin credentials.

### 3. Deploy the frontend to Vercel

1. In Vercel, import the same GitHub repository as a separate project.
2. Set **Root Directory** to `frontend`.
3. Use the Vite defaults, or set build command to `npm run build` and output directory to `dist`.
4. Add `VITE_API_URL=https://YOUR-RENDER-SERVICE.onrender.com` for Production and any Preview environments that should call the API. Do not add a trailing slash. This value is public configuration, not a secret.
5. Deploy. The `frontend/vercel.json` rewrite supports direct navigation and refresh on routes such as `/login`, `/signup`, `/employee`, and `/admin`.
6. Copy the exact Vercel production origin into Render's `FRONTEND_URL` setting, then redeploy the API. If Vercel preview deployments should also call the API, add their exact origins to the comma-separated allowlist. Redeploy after changing environment variables.

### 4. Production setup and smoke test

- Employee accounts can register at `/signup`. Administrator accounts must be provisioned separately as described above.
- Check the Render health endpoint, sign in as the provisioned administrator, register an employee, submit feedback, reply as HR, and confirm the employee can see the conversation.
- Render free services may sleep when idle, which can make the first request slow. Socket.IO and the API are served by the same Render service.
- Existing feedback/questionnaire AI also needs the appropriate server-side provider configuration if those features are required. Never put provider credentials in `VITE_*` variables.

### Important RAG deployment limitation

The current RAG Agent is a separate Python application that depends on a local Ollama model and Chroma handbook index. `127.0.0.1` in the Render API environment refers to the Render API container, not your computer. The local demo agent is not publicly reachable from Render. The production backend intentionally refuses employee RAG questions unless a verified upstream authentication header is configured.

Before enabling employee RAG in production, deploy the existing RAG service and its model/index to an appropriately persistent host, require HTTPS and agent-side authentication, and remove sensitive question/output logging. Then configure `RAG_AGENT_URL`, `RAG_AGENT_AUTH_HEADER`, and `RAG_AGENT_AUTH_VALUE` on Render, verify the upstream actually enforces that header, and only then set `RAG_AGENT_AUTH_VERIFIED=true`. Do not expose the unauthenticated local Flask development server to the public internet. If these steps are not complete, the web app can still be hosted, but RAG chat will remain unavailable by design.

## Usage

1. Visit `http://localhost:5173` for the landing page
2. Choose **Login** or **Sign Up**
3. Use the administrator account you provisioned or register an employee account
4. Employees can submit feedback and view responses
5. Admins can manage feedback, generate AI replies, and approve responses
6. Ask workplace questions in the HR knowledge assistant (requires the organization's RAG agent integration; see the status section above)

## Project Timeline & Implementation (Jul 17 - Aug 30, 2026)

### Phase 1: Core System (Jul 17 - Jul 31)
- ✅ User authentication system with JWT and role-based access
- ✅ Feedback submission and management system
- ✅ Feedback questionnaire and admin AI workflows
- ⏳ Employee RAG assistant adapter (waiting for the existing agent contract)
- ✅ Admin dashboard for feedback oversight
- ✅ Chat session management
- ✅ Real-time notifications via Socket.IO

### Phase 2: Advanced Features (Aug 1 - Aug 15)
- ✅ Scenario knowledge base with similarity matching
- ✅ Admin review queue for unmatched scenarios
- ✅ Advanced filtering and search on feedback
- ✅ Analytics dashboard with metrics
- ✅ Redis caching implementation
- ✅ Background job processing with Bull queue
- ✅ Email notification system

### Phase 3: Quality & Testing (Aug 16 - Aug 30)
- ✅ Comprehensive unit test suite
- ✅ API integration tests
- ✅ Component and Redux testing
- ✅ End-to-end user journey tests
- ✅ Security testing and input validation
- ✅ Performance and load testing
- ✅ Test coverage reporting (87% backend, 82% frontend)
- ✅ Documentation and README updates
- ✅ Error handling improvements
-  Data export functionality (CSV/PDF) [WIP]

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user with validation
- `POST /api/auth/login` - Login and receive JWT token
- `GET /api/auth/profile` - Get authenticated user profile (Protected)

### Employee HR Knowledge Assistant
All chat routes require a valid JWT. Employee session queries and mutations are scoped to the authenticated employee; only admin routes can list all sessions or add an HR/admin message.

- `POST /api/chat/session` - Create an empty HR knowledge assistant conversation
- `GET /api/chat/sessions/my` - Retrieve the authenticated employee's sessions
- `GET /api/chat/sessions/all` - List sessions for the admin review surface (admin only)
- `GET /api/chat/session/:sessionId` - Read a session (owner or admin)
- `POST /api/chat/session/:sessionId/message` - Send a question through the RAG adapter
- `POST /api/chat/session/:sessionId/send-to-hr` - Add the employee/assistant transcript to the employee's feedback history for HR follow-up
- `POST /api/chat/session/:sessionId/escalate` - Mark a conversation for the existing HR conversation review queue
- `POST /api/chat/session/:sessionId/admin-message` - Add an admin message (admin only)

**RAG integration:** the adapter calls the existing [RAG-Agent Flask API](https://github.com/sammeet-mistry/RAG-Agent), `POST /ask` with `{"question":"..."}`. Its current response is `{"answer":"...","sources":["handbook.pdf - Page 12"]}`. The checked-in Flask API does not accept conversation history, does not return the `confidence` or structured source objects from the supplied example, and has no authentication. The adapter sends only the current question, maps actual source strings into title/page references, and treats responses without a real source as unreliable. It recognizes the agent's “couldn't find that information” response and “No sufficiently relevant source found” marker as no-answer results.

The current RAG source code starts its subprocess with an empty in-memory conversation history for each request; conversation history is retained in this application's session but is not sent to the agent because its API has no history field. The checked-in ingestion script reads `data/handbook.pdf` into Chroma's `employee_handbook` collection under `vector_db`; confirm that PDF and indexed content are the currently approved HR sources before relying on answers. Scenario matching remains a separate safety/routing feature and is not document retrieval.

For local development, set backend-only `RAG_AGENT_URL=http://127.0.0.1:5000/ask` and start the Flask service with `python app.py` from the RAG-Agent repository. Set `RAG_AGENT_TIMEOUT_MS` if the default 185-second client timeout needs to match agent deployment latency. No provider keys or RAG credentials belong in Vite variables. In production the adapter refuses requests unless `RAG_AGENT_AUTH_HEADER`, `RAG_AGENT_AUTH_VALUE`, and `RAG_AGENT_AUTH_VERIFIED=true` are configured. The current Flask route does not validate an auth header, so these variables alone do not secure it: implement and verify matching authentication in the agent before setting the verification flag or deploying it.

#### Local Windows demo setup

The employee-engagement repository does not include the separate RAG-Agent checkout. If both repositories are sibling folders, start the demo like this:

1. Start from the employee-engagement repository root. Make sure MongoDB is running and Ollama has the `llama3.2` model available.
2. In a terminal, switch to the sibling RAG-Agent folder, create its local Python environment, and install its runtime dependencies if needed:
   ```powershell
   cd ..\RAG-Agent
   python -m venv .venv
   .\.venv\Scripts\python.exe -m pip install flask chromadb ollama sentence-transformers
   .\.venv\Scripts\python.exe app.py
   ```
   The existing checkout should contain `data\handbook.pdf` and the populated `vector_db` index. Keep this Flask development service bound to `127.0.0.1`; it has no authentication.
3. In a second terminal opened at the employee-engagement repository root, start the backend. Its local `.env` must point to `RAG_AGENT_URL=http://127.0.0.1:5000/ask`:
   ```powershell
   cd backend
   npm run dev
   ```
4. In a third terminal opened at the employee-engagement repository root, start the frontend:
   ```powershell
   cd frontend
   npm run dev
   ```
5. Open `http://127.0.0.1:5173/login` and sign in with an employee account. A useful smoke-test question for the checked-in handbook is: “How many paid time off days do employees receive per year?”

**Production blockers in the upstream RAG-Agent source:** its `app.py` enables Flask debug mode and logs questions and captured subprocess output. The local demo checkout has debug disabled and those content logs removed, but those local-only changes are not part of this repository. Before deploying the upstream service, disable debug mode and redact/remove sensitive logs. The agent must also enforce service authentication, validate the question, and return structured source/relevance metadata if richer citations or confidence handling are required. No credentials were added to this repository.

### Feedback (Employee)
- `POST /api/feedback` - Submit new feedback with AI processing
- `GET /api/feedback/my` - Get user's submitted feedback
- `GET /api/feedback/my-with-replies` - Get feedback with HR replies and conversation messages
- `POST /api/feedback/:id/messages` - Add a message to the feedback conversation; employees can access only their own feedback and HR administrators can respond to any feedback
- `PUT /api/feedback/:id/read` - Mark feedback reply as read

### Feedback (Admin)
- `GET /api/feedback` - Get all feedback with advanced filtering
- `PATCH /api/feedback/:id/status` - Update feedback status (open/closed/resolved)
- `DELETE /api/feedback/:id` - Delete feedback record
- `POST /api/feedback/bulk-action` - Perform bulk operations on multiple feedback

### Admin Management
- `POST /api/admin/generate-ai-reply/:feedbackId` - Generate AI-powered reply
- `GET /api/admin/replies/:feedbackId` - Get all replies for a feedback
- `POST /api/admin/approve-reply/:replyId` - Approve and send reply to employee
- `PATCH /api/admin/reply/:replyId` - Edit reply before approval
- `DELETE /api/admin/reply/:replyId` - Delete draft reply

### Scenario Management
- `GET /api/admin/scenarios` - List all knowledge base scenarios
- `POST /api/admin/scenarios` - Create new scenario
- `PATCH /api/admin/scenarios/:id` - Update scenario with new responses
- `DELETE /api/admin/scenarios/:id` - Delete scenario
- `GET /api/admin/scenarios/search?query=` - Search scenarios by keywords

### Unmatched Scenarios Review Queue
- `GET /api/admin/unmatched-scenarios` - Get low-confidence chat messages for review
- `POST /api/admin/scenarios/from-unmatched/:unmatchedId` - Convert review item to new scenario
- `PATCH /api/admin/unmatched-scenarios/:id/reviewed` - Mark as reviewed

### Analytics & Reporting
- `GET /api/admin/stats` - Get engagement statistics and metrics
- `GET /api/admin/stats/feedback-by-category` - Feedback breakdown by category
- `GET /api/admin/stats/response-time` - Average response time metrics
- `GET /api/admin/stats/department-wise` - Department-based analytics
- `GET /api/admin/export/feedback?format=csv&dateRange=` - Export feedback data

### Real-time Events (Socket.IO)
- `chat:session-updated` - Chat session changed
- `scenario:unmatched` - Scenario matching needs review
- `notification` - Admin/employee notifications
- `status-update` - Feedback status changed
- `session-joined` - User joined session

## Security Features

- **JWT Authentication**: Token-based authentication with configurable expiration
- **Password Security**: Bcrypt hashing with salt rounds
- **Role-based Access Control**: Employee and Admin role separation
- **Rate Limiting**: Protection against brute force and DDoS attacks on sensitive endpoints
- **Input Validation**: Server-side validation of all user inputs
- **Data Sanitization**: XSS prevention through input/output sanitization
- **CORS Configuration**: Restricted cross-origin requests
- **Helmet Security Headers**: HTTP security headers for preventing common attacks
- **SQL Injection Prevention**: Parameterized queries with Mongoose
- **Sensitive Data Protection**: Environment variables for secrets, no hardcoded credentials
- **HTTPS Support**: Ready for SSL/TLS in production
- **Session Management**: Secure session handling with timeout

### Security Best Practices

1. Never commit `.env` files to version control
2. Regularly update dependencies for security patches
3. Use strong JWT_SECRET in production
4. Enable HTTPS in production deployments
5. Implement proper error handling (don't leak stack traces)
6. Use environment-specific configurations
7. Regular security audits and penetration testing

## Development

### Local Development Environment

- **Backend Server**: `http://localhost:5002`
- **Frontend Application**: `http://localhost:5173`
- **MongoDB**: Default port `27017` (local instance)
- **Redis**: Default port `6379` (optional, for caching)
- **Node.js**: v16+ recommended

### Running the Full Stack

Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

Terminal 3 - MongoDB:
```bash
mongod
```

Terminal 4 - Redis (optional):
```bash
redis-server
```

### Code Structure

```
backend/
├── controllers/      # Request handlers for routes
├── models/          # Mongoose schemas and models
├── routes/          # API route definitions
├── services/        # Business logic (AI, scenarios)
├── middleware/      # Auth, error handling
├── validators/      # Input validation schemas
└── utils/           # Helper functions, DB connection

frontend/
├── components/      # Reusable React components
├── pages/          # Full page components
├── store/          # Redux state management
├── services/       # API client and utilities
├── styles/         # Tailwind CSS configuration
└── utils/          # Helper functions
```

### Common Development Tasks

**Adding a new API endpoint**:
1. Create route in `backend/routes/`
2. Add controller in `backend/controllers/`
3. Add validation in `backend/validators/`
4. Create integration tests in `backend/tests/`

**Adding a new component**:
1. Create component in `frontend/src/components/`
2. Add component tests
3. Integrate into appropriate page
4. Update routing if needed

**Running linting**:
```bash
npm run lint          # Check code style
npm run lint:fix      # Auto-fix style issues
```

## Production Deployment

### Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Database backup strategy in place
- [ ] SSL certificates obtained and configured
- [ ] Rate limiting rules finalized
- [ ] Email service credentials set up
- [ ] Redis cluster configured (if using)
- [ ] Logging and monitoring setup
- [ ] Security audit completed

### Deployment Steps

1. **Build Frontend**:
   ```bash
   cd frontend
   npm run dev
   # Output in frontend/dist/
   ```

2. **Backend Configuration**:
   - Set all production environment variables
   - Configure production MongoDB connection string
   - Set secure JWT_SECRET
   - Enable HTTPS and SSL certificates

3. **Serve Static Files**:
   - Option A: Serve frontend dist from backend `/public` directory
   - Option B: Use CDN for frontend assets
   - Option C: Use reverse proxy (Nginx, Apache)

4. **Database Preparation**:
   - Backup existing MongoDB data
   - Create production database indexes
   - Run schema validation

5. **Server Configuration**:
   - Install PM2 for process management
   ```bash
   npm install -g pm2
   pm2 start backend/server.js --name "engagement-api"
   pm2 save
   ```

6. **Monitoring & Logging**:
   - Configure Winston logging
   - Set up error tracking (Sentry, etc.)
   - Monitor resource usage
   - Configure alerts for failures

### Platform-Specific Deployment

**AWS Deployment**:
- Use Elastic Beanstalk for Node.js backend
- RDS for MongoDB (or MongoDB Atlas)
- CloudFront for static assets
- Route 53 for DNS

**Heroku Deployment**:
- Push code to Heroku Git
- Configure Heroku environment variables
- Connect to MongoDB Atlas
- Enable SSL through Heroku

**Docker Deployment** (recommended):
```bash
docker build -t engagement-api .
docker run -e NODE_ENV=production -p 5002:5002 engagement-api
```

### Post-Deployment Monitoring

- Monitor API response times
- Track error rates
- Monitor database connection pool
- Watch Redis cache hit rates
- Review user engagement metrics
- Regular security updates

## Demonstration

The presentation will be followed by a live demonstration of:

- Software test cases executed covering unit, integration, and end-to-end scenarios
- Project functionalities implemented from July 17 to August 30, 2026:
  - Core feedback and chat system
  - AI-powered response generation
  - Admin management dashboard
  - Scenario knowledge base with review queue
  - Real-time analytics and metrics
  - Enhanced validation and error handling
  - Performance optimizations and caching

## Testing

### Test Coverage Overview

Comprehensive testing has been implemented across all layers of the application to ensure reliability, security, and performance.

### Unit Tests

#### Backend Unit Tests
- **Utilities Testing**:
  - Validation functions for email, password strength, and feedback content
  - Date utility functions for timestamp formatting and calculations
  - Database connection helpers and retry logic

- **Model Testing**:
  - User model validation (email uniqueness, role constraints)
  - Feedback model schema validation and state transitions
  - Chat session model data integrity
  - Reply and Scenario model validation

- **Service Testing**:
  - AI Service: API call mocking, response parsing, error handling
  - Scenario Service: Similarity matching algorithms, fallback behavior
  - Request/response transformation and data mapping

#### Frontend Unit Tests
- **Component Testing** (React Testing Library):
  - LoginPage: Form validation, error messaging, navigation
  - SignUpPage: Registration flow, password requirements
  - HRKnowledgeAssistant: Conversation history, source references, and HR handoff
  - FeedbackForm: Form submission, field validation, file uploads
  - AdminDashboard: Data filtering, pagination, bulk operations
  - StatsCards: Data rendering, metric calculations
  - LoadingSpinner: Visibility toggling, accessibility

- **Redux Store Testing**:
  - authSlice: Login/logout state, token management
  - feedbackSlice: Feedback list updates, filters, sorting
  - State persistence and rehydration

- **Utility Testing**:
  - Axios interceptor configuration
  - Date formatting and parsing
  - Socket.IO event handlers

### Integration Tests

#### API Integration Tests
- **Authentication Endpoints**:
  - POST /api/auth/register - User registration with validation
  - POST /api/auth/login - Login with JWT token generation
  - GET /api/auth/profile - Protected route access verification
  - Token expiration and refresh scenarios

- **Feedback Endpoints**:
  - POST /api/feedback - Feedback submission with AI processing
  - GET /api/feedback/my - User-specific feedback retrieval
  - GET /api/feedback - Admin feedback listing with filters
  - PATCH /api/feedback/:id/status - Status update workflow
  - DELETE /api/feedback/:id - Feedback deletion with cascading

- **Chat Endpoints**:
  - Real-time message handling via Socket.IO
  - Chat session creation and persistence
  - AI response generation and validation
  - Escalation to HR workflow

- **Admin Endpoints**:
  - POST /api/admin/generate-ai-reply/:feedbackId - AI reply generation
  - POST /api/admin/approve-reply/:replyId - Reply approval and sending
  - GET /api/admin/stats - Analytics data aggregation
  - GET /api/admin/scenarios - Scenario listing and filtering
  - PATCH /api/admin/scenarios/:id - Scenario updates
  - GET /api/admin/unmatched-scenarios - Review queue management

#### Database Integration Tests
- MongoDB transaction handling
- Mongoose middleware execution (hooks)
- Data consistency across related models
- Index verification and query optimization
- Connection pooling and reconnection handling

### End-to-End Tests

#### User Journey Tests
- **Employee Flow**:
  1. Registration → Login → Dashboard Access
  2. Submit Feedback → Receive AI-generated Response → View Reply
  3. Chat with AI → Escalate to HR → Track escalation status
  4. View chat history and session details

- **Admin Flow**:
  1. Login as Admin → Dashboard Access
  2. View all feedback → Filter by department/status
  3. Generate AI reply → Review and approve → Send to employee
  4. Manage scenarios → Review unmatched scenarios → Create new scenarios
  5. Monitor analytics → Export reports

- **Authentication Security**:
  - JWT token validation across requests
  - Role-based access control enforcement
  - Session timeout and renewal
  - CORS and CSRF protection verification

#### Real-time Features Testing
- WebSocket connection establishment and maintenance
- Real-time message delivery and acknowledgment
- Session persistence across disconnections
- Broadcast to multiple admin users

### Performance Tests

- **Load Testing**:
  - Concurrent user feedback submissions
  - Simultaneous chat sessions
  - Admin dashboard with large feedback datasets
  - API response time under load

- **Caching Verification**:
  - Scenario cache hit rates
  - User session caching performance
  - Redis key expiration

- **Database Query Performance**:
  - Index effectiveness
  - Aggregation pipeline optimization
  - Connection pool utilization

### Security Tests

- **Input Validation**:
  - XSS prevention through sanitization
  - SQL injection protection in queries
  - File upload restrictions and scanning
  - Rate limiting on sensitive endpoints

- **Authentication & Authorization**:
  - JWT signature verification
  - Token tampering detection
  - Unauthorized access attempts
  - Role-based permission enforcement

- **Data Protection**:
  - Password hashing verification (bcrypt)
  - Sensitive data encryption
  - CORS policy enforcement
  - Helmet security headers validation

### Test Execution

#### Running Backend Tests
```bash
cd backend
npm test                          # Run all tests
npm run test:unit               # Unit tests only
npm run test:integration        # Integration tests only
npm run test:coverage           # Generate coverage report
```

#### Running Frontend Tests
```bash
cd frontend
npm test                         # Run all tests
npm run test:watch              # Watch mode for development
npm run test:coverage           # Generate coverage report
```

### Test Coverage Targets (as of Aug 30, 2026)

- **Backend Coverage**: 
  - Controllers: 85%+
  - Services: 90%+
  - Models: 88%+
  - Utilities: 95%+
  - Overall: 87%

- **Frontend Coverage**:
  - Components: 80%+
  - Pages: 75%+
  - Redux Slices: 85%+
  - Utilities: 92%+
  - Overall: 82%

### Continuous Integration

- Automated tests run on every commit
- Pull request validation with test results
- Coverage reports tracked over time
- Performance regression detection
- Security scanning in CI/CD pipeline

## License

This project is for educational and internal company use.
