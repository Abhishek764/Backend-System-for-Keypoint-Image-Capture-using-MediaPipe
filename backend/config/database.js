const { Pool } = require('pg');
const mongoose = require('mongoose');
require('dotenv').config();

// PostgreSQL Connection Pool
const pgPool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB || 'keypoints_db',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// PostgreSQL connection event handlers
pgPool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
  process.exit(-1);
});

// MongoDB Connection
const connectMongoDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/images_db';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Initialize PostgreSQL tables
const initPostgreSQL = async () => {
  try {
    const client = await pgPool.connect();
    await client.query(`
      CREATE TABLE IF NOT EXISTS keypoints (
        id SERIAL PRIMARY KEY,
        image_id VARCHAR(255) UNIQUE NOT NULL,
        keypoints JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_image_id ON keypoints(image_id);
      CREATE INDEX IF NOT EXISTS idx_created_at ON keypoints(created_at);
    `);
    client.release();
    console.log('✅ PostgreSQL tables initialized');
  } catch (error) {
    console.error('❌ PostgreSQL initialization error:', error);
    throw error;
  }
};

// Graceful shutdown
const closeConnections = async () => {
  await pgPool.end();
  await mongoose.connection.close();
  console.log('Database connections closed');
};

module.exports = {
  pgPool,
  connectMongoDB,
  initPostgreSQL,
  closeConnections,
};
