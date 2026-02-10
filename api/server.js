const express = require('express');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');
const WebSocket = require('ws');
require('dotenv').config();

// Check if demo mode is enabled
const DEMO_MODE = process.env.DEMO_MODE === 'true';

if (DEMO_MODE) {
  console.log('🎭 Running in DEMO MODE - using mock data (no Firebase required)');
} else {
  const { initializeFirebase } = require('./firebase-config');
  initializeFirebase();
}

// Load routes based on mode
const demoRoutes = DEMO_MODE ? require('./demo') : null;
const authRoutes = !DEMO_MODE ? require('./auth') : null;
const calendarRoutes = !DEMO_MODE ? require('./calendar') : null;
const profileRoutes = !DEMO_MODE ? require('./profiles') : null;
const taskRoutes = !DEMO_MODE ? require('./tasks') : null;
const prizeRoutes = !DEMO_MODE ? require('./prizes') : null;
const mealRoutes = !DEMO_MODE ? require('./meals') : null;
const inventoryRoutes = !DEMO_MODE ? require('./inventory') : null;

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : 'http://localhost:4200',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/api/ws' });
const clientsByUser = new Map();

const registerClient = (ws, userId, clientId) => {
  if (!userId) return;
  ws.userId = userId;
  ws.clientId = clientId || null;
  if (!clientsByUser.has(userId)) {
    clientsByUser.set(userId, new Set());
  }
  clientsByUser.get(userId).add(ws);
};

const removeClient = (ws) => {
  if (!ws.userId) return;
  const bucket = clientsByUser.get(ws.userId);
  if (!bucket) return;
  bucket.delete(ws);
  if (bucket.size === 0) {
    clientsByUser.delete(ws.userId);
  }
};

const broadcastToUser = (userId, message, exclude) => {
  const bucket = clientsByUser.get(userId);
  if (!bucket) return;
  const payload = JSON.stringify(message);
  bucket.forEach((client) => {
    if (client.readyState !== WebSocket.OPEN) return;
    if (exclude && client === exclude) return;
    client.send(payload);
  });
};

wss.on('connection', (ws) => {
  ws.isAlive = true;

  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('message', (data) => {
    let message = null;
    try {
      message = JSON.parse(data);
    } catch (error) {
      console.error('Invalid websocket message:', error);
      return;
    }

    if (message.type === 'hello') {
      registerClient(ws, message.userId, message.clientId);
      return;
    }

    if (message.type === 'update' && message.userId) {
      broadcastToUser(message.userId, message, ws);
    }
  });

  ws.on('close', () => removeClient(ws));
  ws.on('error', () => removeClient(ws));
});

// Make broadcastToUser available to routes
app.locals.broadcastToUser = broadcastToUser;

setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) {
      ws.terminate();
      return;
    }
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'API is running',
    mode: DEMO_MODE ? 'demo' : 'production'
  });
});

// Routes
if (DEMO_MODE) {
  // Demo mode - all routes handled by demo.js
  app.use('/api', demoRoutes);
} else {
  // Production mode - use real Firebase routes
  app.use('/api/auth', authRoutes);
  app.use('/api/calendar', calendarRoutes);
  app.use('/api/profiles', profileRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/prizes', prizeRoutes);
  app.use('/api/meals', mealRoutes);
  app.use('/api/inventory', inventoryRoutes);
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Serve the Angular app in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'frontend', 'dist', 'frontend');
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Listen when running as a standalone server (not in Vercel serverless)
if (!process.env.VERCEL) {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export for Vercel
module.exports = app;
