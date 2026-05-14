# Employee Feedback Management System

A full-stack AI-powered employee feedback management system with a sleek, professional interface.

## Features

- **Employee Dashboard**: Submit feedback, view submissions and responses
- **Admin Dashboard**: Manage all feedback, generate AI responses, approve replies
- **AI Integration**: OpenAI-powered professional response generation
- **Role-based Access**: Secure authentication with JWT
- **Real-time Analytics**: Dashboard with feedback statistics
- **Professional UI**: Enterprise-grade design with Tailwind CSS

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
   MONGODB_URI=mongodb://localhost:27017/employee-feedback
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRE=7d
   FRONTEND_URL=http://localhost:5173
   OPENAI_API_KEY=your-openai-api-key-here
   PORT=5000
   ```

4. Start MongoDB locally (if not already running)

5. Seed admin user:
   ```bash
   npm run seed
   ```
   This creates an admin user with email `admin@company.com` and password `admin123`.

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

## Security Features

- JWT authentication with expiration
- Password hashing with bcrypt
- Rate limiting on sensitive endpoints
- Input validation and sanitization
- CORS configuration
- Helmet security headers
- Role-based access control

## Development

- Backend runs on `http://localhost:5000`
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