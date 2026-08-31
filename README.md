# Employee Engagement Platform

A comprehensive full-stack AI-powered employee engagement platform with advanced feedback management, real-time AI chatbot interactions, intelligent scenario matching, and comprehensive admin oversight for fostering workplace communication and satisfaction.

**Last Updated**: August 30, 2026 | **Version**: 1.2.0

## Features

### Core Features
- **Employee Dashboard**: Submit feedback, engage with AI chatbot, view chat sessions and feedback responses, track engagement history
- **Admin Dashboard**: Comprehensive feedback management, chat session oversight, AI-powered response generation, reply approval workflow, and real-time engagement metrics
- **AI Integration**: OpenAI- or Gemini-powered intelligent chatbot for employee queries and professional response generation with context awareness
- **Scenario Knowledge Base**: MongoDB-backed scenario matching with local cosine-similarity fallback and admin review queue for continuous learning
- **Chat System**: Real-time AI chatbot interactions with session management, escalation to HR, and conversation history
- **Feedback Management**: AI-enhanced feedback forms with intelligent question generation, refinement suggestions, and categorization
- **Role-based Access**: Secure authentication with JWT for employees and admins with granular permission control
- **Real-time Analytics**: Dashboard with feedback statistics, chat session metrics, engagement insights, and trend analysis
- **Professional UI**: Enterprise-grade design with Tailwind CSS and fully responsive components

### Advanced Features (Added Jul 17 - Aug 30)
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
- **AI Services**: OpenAI API or Google Gemini API with fallback mechanisms
- **Caching & Jobs**: Redis for caching and Bull for job queue management (added Aug 15)
- **Testing**: Jest for unit testing, Supertest for API testing, React Testing Library for components (added Aug 5)
- **Security**: Helmet, CORS, Rate Limiting, Input Validation, SQL injection prevention
- **Monitoring**: Winston logging, performance metrics, error tracking

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- An OpenAI or Google Gemini API key (Gemini can be used instead of a billed OpenAI project)

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
   # Choose one provider. Gemini avoids OpenAI 402 quota/billing errors.
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

   To use OpenAI instead, set `AI_PROVIDER=openai` and `OPENAI_API_KEY` to a key from an OpenAI project with available billing quota. A 402 response means that project has no available quota; it cannot be repaired by changing the request payload.

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
   This creates an admin user with email `admin@company.com` and password `Admin@123`.

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

### Admin Access

The seed command creates the initial administrator:

- **Email**: `admin@company.com`
- **Password**: `Admin@123`
- **Role**: `admin`
- **Department**: `IT Management`

**Important**: Change the seeded password before using in a shared or production environment.

#### Password Reset

To reset an existing user's password, run:
```bash
npm run reset-password
```
Follow the prompts to select a user and set a new password.

### User Registration

Users can self-register through the frontend signup page. New users are assigned the `employee` role by default. Admins can be created:
1. Via database directly (not recommended for production)
2. By using an admin panel feature (future enhancement)
3. By modifying existing user roles directly in MongoDB

## Usage

1. Visit `http://localhost:5173` for the landing page
2. Click "Login as Employee" or "Login as Admin"
3. Register or login with existing credentials
4. Employees can submit feedback and view responses
5. Admins can manage feedback, generate AI replies, and approve responses
6. Chat with the AI assistant for real-time employee support

## Project Timeline & Implementation (Jul 17 - Aug 30, 2026)

### Phase 1: Core System (Jul 17 - Jul 31)
- ✅ User authentication system with JWT and role-based access
- ✅ Feedback submission and management system
- ✅ AI chatbot integration with OpenAI/Gemini
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
- ✅ Data export functionality (CSV/PDF)

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user with validation
- `POST /api/auth/login` - Login and receive JWT token
- `GET /api/auth/profile` - Get authenticated user profile (Protected)

### Chat Management
- `POST /api/chat/session` - Create new chat session
- `GET /api/chat/sessions` - Retrieve user's chat sessions
- `POST /api/chat/message` - Send message in chat (Real-time via Socket.IO)
- `GET /api/chat/session/:id/history` - Get chat conversation history
- `POST /api/chat/escalate/:sessionId` - Escalate chat to HR

### Feedback (Employee)
- `POST /api/feedback` - Submit new feedback with AI processing
- `GET /api/feedback/my` - Get user's submitted feedback
- `GET /api/feedback/my-with-replies` - Get feedback with admin replies
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
- `message` - New chat message received
- `response` - AI response generated
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
   npm run build
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
  - AIChatbot: Message sending, response display, session handling
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