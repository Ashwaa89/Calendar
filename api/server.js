const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
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

// For local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export for Vercel
module.exports = app;
