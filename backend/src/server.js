require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const repoRoutes = require('./routes/repoRoutes');
const graphRoutes = require('./routes/graphRoutes');
const codeRoutes = require('./routes/codeRoutes');
const aiRoutes = require('./routes/aiRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/repos', repoRoutes);
app.use('/api/graph', graphRoutes);
app.use('/api/code', codeRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'CodeGraph AI Intelligence Engine',
    timestamp: new Date().toISOString(),
  });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('[Server Error]:', err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// Start Server
const startServer = async () => {
  await connectDB();

  // Seed the demo user + sample repo AFTER the DB connection is established
  try {
    const { ensureDemoUser } = require('./routes/authRoutes');
    await ensureDemoUser();
    console.log('[CodeGraph] Demo user and sample repository seeded successfully.');
  } catch (err) {
    console.warn('[CodeGraph] Demo seeding warning:', err.message);
  }

  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`  🚀 CodeGraph Backend Engine running on port ${PORT}`);
    console.log(`  📍 API Health: http://localhost:${PORT}/api/health`);
    console.log(`====================================================`);
  });
};

startServer();
