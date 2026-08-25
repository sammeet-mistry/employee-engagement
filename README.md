# Employee Engagement Platform

A comprehensive full-stack AI-powered employee engagement platform with feedback management, AI chatbot interactions, and admin oversight for fostering workplace communication and satisfaction.

## Features

- **Employee Dashboard**: Submit feedback, engage with AI chatbot, view chat sessions and feedback responses
- **Admin Dashboard**: Manage feedback, oversee chat sessions, generate AI responses, approve replies, and monitor engagement metrics
- **AI Integration**: OpenAI-powered chatbot for employee queries and professional response generation for feedback
- **Scenario Knowledge Base**: MongoDB-backed scenario matching with local cosine-similarity fallback and an admin review queue
- **Chat System**: Real-time AI chatbot interactions with session management and escalation to HR
- **Feedback Management**: AI-enhanced feedback forms with question generation and refinement
- **Role-based Access**: Secure authentication with JWT for employees and admins
- **Real-time Analytics**: Dashboard with feedback statistics, chat session metrics, and engagement insights
- **Professional UI**: Enterprise-grade design with Tailwind CSS and responsive components

## Tech Stack

- **Frontend**: React.js + Vite, Tailwind CSS, Redux Toolkit
- **Backend**: Node.js + Express.js, MongoDB + Mongoose
- **Authentication**: JWT with bcrypt
- **AI**: OpenAI API
- **Security**: Helmet, CORS, Rate Limiting, Input Validation

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- OpenAI API key

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
   OPENAI_API_KEY=your-openai-api-key-here
   PORT=5002
   ```

4. Start MongoDB locally (if not already running)

5. Seed admin user:
   ```bash
   npm run seed
   ```
   This creates an admin user with email `admin@company.com` and password `Admin@123`.

6. Start the backend server:
   ```bash
   npm run dev
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

The frontend expects the backend at `http://localhost:5002`.

### Admin Access

The seed command creates the initial administrator:

- Email: `admin@company.com`
- Password: `Admin@123`
- Role: `admin`
- Department: `IT Management`

To reset an existing user's password, run `npm run reset-password` from `backend` and follow the prompts. Change the seeded password before using a shared or production environment.

### Seed Admin User

To create an admin user, you can use the registration endpoint or modify the database directly. For testing, register a user with role 'admin' in the database.

Example MongoDB insert:
```javascript
db.users.insertOne({
  name: "Admin User",
  email: "admin@example.com",
  password: "$2a$12$...", // bcrypt hash of password
  role: "admin",
  department: "HR"
})
```

## Usage

1. Visit `http://localhost:5173` for the landing page
2. Click "Login as Employee" or "Login as Admin"
3. Register or login with existing credentials
4. Employees can submit feedback and view responses
5. Admins can manage feedback, generate AI replies, and approve responses

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile

### Feedback (Employee)
- `POST /api/feedback` - Submit feedback
- `GET /api/feedback/my` - Get user's feedback
- `GET /api/feedback/my-with-replies` - Get feedback with replies

### Feedback (Admin)
- `GET /api/feedback` - Get all feedback with filters
- `PATCH /api/feedback/:id/status` - Update feedback status
- `DELETE /api/feedback/:id` - Delete feedback

### Admin
- `POST /api/admin/generate-ai-reply/:feedbackId` - Generate AI reply
- `POST /api/admin/approve-reply/:replyId` - Approve and send reply
- `GET /api/admin/replies/:feedbackId` - Get replies for feedback
- `GET /api/admin/stats` - Get feedback statistics
- `GET /api/admin/scenarios` - List knowledge-base scenarios
- `PATCH /api/admin/scenarios/:id` - Update a scenario
- `DELETE /api/admin/scenarios/:id` - Delete a scenario
- `GET /api/admin/unmatched-scenarios` - Review low-confidence messages
- `POST /api/admin/scenarios/from-unmatched/:unmatchedId` - Convert a review item into a scenario

## Security Features

- JWT authentication with expiration
- Password hashing with bcrypt
- Rate limiting on sensitive endpoints
- Input validation and sanitization
- CORS configuration
- Helmet security headers
- Role-based access control

## Development

- Backend runs on `http://localhost:5002`
- Frontend runs on `http://localhost:5173`
- MongoDB default port `27017`

## Production Deployment

1. Set environment variables for production
2. Build frontend: `npm run build` in frontend directory
3. Serve static files from backend or use a reverse proxy
4. Configure MongoDB for production
5. Set up SSL certificates
6. Configure rate limiting and security headers

## License

This project is for educational and internal company use.