const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const multer = require('multer');
const apiRoutes = require('./routes/api');
const { connectMongoDB, initPostgreSQL } = require('./config/database');
const cronService = require('./services/cronService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api', apiRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Keypoint Extraction API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      extractPose: 'POST /api/extract-pose',
      keypoints: 'GET /api/keypoints',
      images: 'GET /api/images',
      backup: 'POST /api/backup/trigger',
    },
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);

  // Multer errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 10MB',
      });
    }
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }

  // Default error
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Initialize database connections and start server
async function startServer() {
  try {
    // Connect to databases
    await connectMongoDB();
    await initPostgreSQL();

    // Start cron jobs
    cronService.start();

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 API available at http://localhost:${PORT}/api`);
      console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  cronService.stop();
  const { closeConnections } = require('./config/database');
  await closeConnections();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  cronService.stop();
  const { closeConnections } = require('./config/database');
  await closeConnections();
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;

