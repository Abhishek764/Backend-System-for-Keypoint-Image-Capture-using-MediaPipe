const { pgPool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class KeypointService {
  /**
   * Create a new keypoint record
   */
  async create(imageId, keypoints) {
    if (!imageId || typeof imageId !== 'string') {
      throw new Error('imageId is required and must be a string');
    }
    if (!keypoints || typeof keypoints !== 'object') {
      throw new Error('keypoints is required and must be an object');
    }

    const client = await pgPool.connect();
    try {
      const result = await client.query(
        `INSERT INTO keypoints (image_id, keypoints, created_at, updated_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING *`,
        [imageId, JSON.stringify(keypoints)]
      );
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        throw new Error(`Keypoint with imageId ${imageId} already exists`);
      }
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get keypoint by image ID
   */
  async getByImageId(imageId) {
    const client = await pgPool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM keypoints WHERE image_id = $1',
        [imageId]
      );
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  /**
   * Get keypoint by ID
   */
  async getById(id) {
    const client = await pgPool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM keypoints WHERE id = $1',
        [id]
      );
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  /**
   * Get all keypoints with pagination
   */
  async getAll(page = 1, limit = 10) {
    const client = await pgPool.connect();
    try {
      const offset = (page - 1) * limit;
      
      const countResult = await client.query('SELECT COUNT(*) FROM keypoints');
      const total = parseInt(countResult.rows[0].count);
      
      const result = await client.query(
        'SELECT * FROM keypoints ORDER BY created_at DESC LIMIT $1 OFFSET $2',
        [limit, offset]
      );
      
      return {
        data: result.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } finally {
      client.release();
    }
  }

  /**
   * Update keypoint by image ID
   */
  async update(imageId, keypoints) {
    const client = await pgPool.connect();
    try {
      const result = await client.query(
        `UPDATE keypoints 
         SET keypoints = $1, updated_at = CURRENT_TIMESTAMP
         WHERE image_id = $2
         RETURNING *`,
        [JSON.stringify(keypoints), imageId]
      );
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  /**
   * Delete keypoint by image ID
   */
  async delete(imageId) {
    const client = await pgPool.connect();
    try {
      const result = await client.query(
        'DELETE FROM keypoints WHERE image_id = $1 RETURNING *',
        [imageId]
      );
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  /**
   * Delete keypoint by ID
   */
  async deleteById(id) {
    const client = await pgPool.connect();
    try {
      const result = await client.query(
        'DELETE FROM keypoints WHERE id = $1 RETURNING *',
        [id]
      );
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }
}

module.exports = new KeypointService();
