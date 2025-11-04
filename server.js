require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// ✅ CORRECT CORS CONFIGURATION
app.use(cors({ 
  origin: '*',
  credentials: false,  // ✅ Changed from true
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ✅ Handle preflight requests
app.options('*', cors());

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Logging
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`);
  next();
});

// MongoDB Connection
console.log('🔌 Connecting to MongoDB...');
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
})
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => {
    console.error('❌ MongoDB Error:', err.message);
  });

// Routes
try {
  const paintingRoutes = require('./routes/paintings');
  const analyticsRoutes = require('./routes/analytics');
  const geminiRoutes = require('./routes/gemini');

  app.use('/api/paintings', paintingRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/gemini', geminiRoutes);

  console.log('✅ Routes loaded');
} catch (err) {
  console.error('❌ Route error:', err.message);
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK ✅' });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('ERROR:', err.message);
  res.status(500).json({ error: err.message });
});

// Start
const PORT = process.env.PORT || 5000;

try {
  app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════╗
║  🚀 SERVER RUNNING ✅             ║
║  📍 http://localhost:${PORT}              ║
║  🎨 Museum Admin Backend           ║
╚════════════════════════════════════╝
    `);
  });
} catch (err) {
  console.error('❌ Failed to start:', err.message);
  process.exit(1);
}

process.on('SIGTERM', () => {
  console.log('Shutting down...');
  process.exit(0);
});
