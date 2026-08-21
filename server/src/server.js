const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const authRoutes = require('./routes/auth.routes');
const transcriptRoutes = require('./routes/transcript.routes');

const app = express();

// Middleware
app.use(morgan('dev'));

const clientUrl = process.env.CLIENT_URL ? process.env.CLIENT_URL.trim().replace(/\/+$/, '') : null;
const frontendUrl = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.trim().replace(/\/+$/, '') : null;
const customOrigin = clientUrl || frontendUrl;

const allowedOrigins = customOrigin
  ? [customOrigin, `${customOrigin}/`, 'http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173']
  : '*';

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health and Root routes
app.get('/', (req, res) => {
  res.json({
    service: 'MetaMind AI - API Gateway',
    status: 'online',
    version: '1.0.0'
  });
});

app.get('/api/health', (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  if (!isDbConnected) {
    return res.status(503).json({
      status: 'unhealthy',
      message: 'Database connection is unavailable',
      timestamp: new Date().toISOString(),
      database: 'disconnected'
    });
  }

  return res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: 'connected'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/transcripts', transcriptRoutes);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Database connection & Server initialization
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

let server = null;

const initializeDatabaseAndStartServer = async () => {
  if (MONGO_URI) {
    console.log('[MongoDB] Connecting to configured database...');
    try {
      // Set bufferCommands to false in production to prevent 10s silent query buffering timeouts
      if (process.env.NODE_ENV === 'production') {
        mongoose.set('bufferCommands', false);
      }

      await mongoose.connect(MONGO_URI, {
        serverSelectionTimeoutMS: 15000
      });
      console.log('[MongoDB] Connected successfully to database');
    } catch (err) {
      console.error(`[MongoDB] Critical: Connection failed (${err.message}). Exiting process...`);
      process.exit(1);
    }
  } else if (process.env.NODE_ENV === 'production') {
    console.error('[MongoDB] Critical: MONGO_URI environment variable is missing in production. Exiting process...');
    process.exit(1);
  } else {
    // Local development fallback to embedded MongoMemoryServer
    console.log('[MongoDB] MONGO_URI not set. Initializing local embedded MongoDB for development...');
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      const inMemoryUri = mongoServer.getUri();
      await mongoose.connect(inMemoryUri);
      console.log(`[MongoDB] Embedded local MongoDB ready and connected at ${inMemoryUri}`);
    } catch (memErr) {
      console.error('[MongoDB] Embedded MongoDB startup error:', memErr.message);
      process.exit(1);
    }
  }

  server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`===================================================`);
    console.log(`[MetaMind Server] API running on port ${PORT}`);
    console.log(`[MetaMind Server] Health endpoint: /api/health`);
    console.log(`===================================================`);
  });
};

if (process.env.NODE_ENV !== 'test') {
  initializeDatabaseAndStartServer();
}

module.exports = { app, server };
