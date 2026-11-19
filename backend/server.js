const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const { MongoStore } = require('connect-mongo');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const path = require('path');
const mongoSanitize = require('express-mongo-sanitize');
const { createAdapter } = require('@socket.io/mongo-adapter');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const { connectDB } = require('./utils/db');
const { createCsrfProtection } = require('./middleware/csrf');

const defaultFrontendOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://localhost:5175'
];
const configuredFrontendOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map((origin) => {
    try {
      const parsedOrigin = new URL(origin.trim());
      if (!['http:', 'https:'].includes(parsedOrigin.protocol) || parsedOrigin.username || parsedOrigin.password) {
        throw new Error();
      }
      return parsedOrigin.origin;
    } catch {
      throw new Error('FRONTEND_URL must contain comma-separated HTTP or HTTPS frontend origins.');
    }
  })
  : defaultFrontendOrigins;
const deploymentOrigin = process.env.VERCEL_URL
  ? new URL(`https://${process.env.VERCEL_URL}`).origin
  : null;
const productionOrigin = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? new URL(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`).origin
  : null;
const frontendOrigins = [...new Set([
  ...configuredFrontendOrigins,
  ...(deploymentOrigin ? [deploymentOrigin] : []),
  ...(productionOrigin ? [productionOrigin] : [])
])];

const app = express();
const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error('SESSION_SECRET is required to start the server.');
}

app.set('trust proxy', 1);
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  path: '/api/socket.io',
  cors: { origin: frontendOrigins, credentials: true }
});
app.set('io', io);
const dbReady = connectDB().then(async () => {
  if (process.env.VERCEL) {
    const adapterEvents = mongoose.connection.db.collection('socket.io-adapter-events');
    await adapterEvents.createIndex(
      { createdAt: 1 },
      { expireAfterSeconds: 3600, background: true }
    );
    io.adapter(createAdapter(adapterEvents, { addCreatedAtField: true }));
  }
});
dbReady.catch((error) => {
  console.error('Unable to initialize the database or realtime adapter:', error.message);
});

io.use(async (socket, next) => {
  try {
    await dbReady;
  } catch {
    return next(new Error('Realtime service is unavailable.'));
  }

  const token = socket.handshake.auth?.token;
  if (typeof token !== 'string' || !process.env.SOCKET_TOKEN_SECRET) {
    return next(new Error('Socket authentication required.'));
  }

  try {
    const user = jwt.verify(token, process.env.SOCKET_TOKEN_SECRET, {
      algorithms: ['HS256'],
      issuer: 'employee-engagement'
    });
    if (user.purpose !== 'socket' || !user.sub || !['admin', 'employee'].includes(user.role)) {
      return next(new Error('Socket authentication failed.'));
    }

    socket.data.user = { id: user.sub, role: user.role };
    return next();
  } catch {
    return next(new Error('Socket authentication failed.'));
  }
});

io.on('connection', (socket) => {
  socket.join(`user:${socket.data.user.id}`);
  if (socket.data.user.role === 'admin') socket.join('admins');
  console.log(`Realtime client connected: ${socket.id}`);
  socket.on('disconnect', () => console.log(`Realtime client disconnected: ${socket.id}`));
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || frontendOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin is not allowed by CORS.'));
  },
  credentials: true
}));
app.use(mongoSanitize());
app.use(session({
  name: 'employee.sid',
  secret: sessionSecret,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions',
    ttl: 7 * 24 * 60 * 60
  }),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
}));

app.use(createCsrfProtection(frontendOrigins));

app.use(async (req, res, next) => {
  try {
    await dbReady;
    next();
  } catch (error) {
    next(error);
  }
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/chat', require('./routes/chat'));

console.log('Routes registered:');
console.log('- /api/auth');
console.log('- /api/feedback');
console.log('- /api/admin');
console.log('- /api/chat');

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5002;
if (process.env.VERCEL) {
  module.exports = httpServer;
} else {
  dbReady
    .then(() => {
      httpServer.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    })
    .catch(() => {
      process.exitCode = 1;
    });
  module.exports = httpServer;
}
