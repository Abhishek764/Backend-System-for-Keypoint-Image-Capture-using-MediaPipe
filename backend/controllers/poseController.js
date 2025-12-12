const mediapipeService = require('../services/mediapipeService');
const imageService = require('../services/imageService');
const keypointService = require('../services/keypointService');
const { v4: uuidv4 } = require('uuid');

class PoseController {
  /**
   * Extract pose keypoints from uploaded image
   * POST /api/extract-pose
   */
  async extractPose(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No image file provided',
        });
      }

      // Extract keypoints using MediaPipe
      const keypointsResult = await mediapipeService.extractKeypoints(
        req.file.buffer,
        null
      );

      if (!keypointsResult.success) {
        return res.status(500).json({
          success: false,
          error: 'Failed to extract keypoints',
        });
      }

      // Generate unique image ID
      const imageId = uuidv4();

      // Store image in MongoDB
      const image = await imageService.create(req.file, imageId);

      // Store keypoints in PostgreSQL
      const keypointRecord = await keypointService.create(
        imageId,
        keypointsResult.keypoints
      );

      res.status(201).json({
        success: true,
        data: {
          imageId,
          keypoints: keypointsResult.keypoints,
          image: {
            id: image._id,
            originalName: image.originalName,
            mimeType: image.mimeType,
            size: image.size,
            createdAt: image.createdAt,
          },
          keypointRecord: {
            id: keypointRecord.id,
            createdAt: keypointRecord.created_at,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all keypoints with pagination
   * GET /api/keypoints
   */
  async getAllKeypoints(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const result = await keypointService.getAll(page, limit);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get keypoint by image ID
   * GET /api/keypoints/image/:imageId
   */
  async getKeypointByImageId(req, res, next) {
    try {
      const { imageId } = req.params;

      const keypoint = await keypointService.getByImageId(imageId);

      if (!keypoint) {
        return res.status(404).json({
          success: false,
          error: 'Keypoint not found',
        });
      }

      res.json({
        success: true,
        data: keypoint,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get keypoint by ID
   * GET /api/keypoints/:id
   */
  async getKeypointById(req, res, next) {
    try {
      const { id } = req.params;

      const keypoint = await keypointService.getById(id);

      if (!keypoint) {
        return res.status(404).json({
          success: false,
          error: 'Keypoint not found',
        });
      }

      res.json({
        success: true,
        data: keypoint,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update keypoint by image ID
   * PUT /api/keypoints/image/:imageId
   */
  async updateKeypoint(req, res, next) {
    try {
      const { imageId } = req.params;
      const { keypoints } = req.body;

      if (!keypoints) {
        return res.status(400).json({
          success: false,
          error: 'Keypoints data is required',
        });
      }

      const updated = await keypointService.update(imageId, keypoints);

      if (!updated) {
        return res.status(404).json({
          success: false,
          error: 'Keypoint not found',
        });
      }

      res.json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete keypoint by image ID
   * DELETE /api/keypoints/image/:imageId
   */
  async deleteKeypoint(req, res, next) {
    try {
      const { imageId } = req.params;

      // Delete from both databases
      const keypointDeleted = await keypointService.delete(imageId);
      const imageDeleted = await imageService.delete(imageId);

      if (!keypointDeleted && !imageDeleted) {
        return res.status(404).json({
          success: false,
          error: 'Keypoint or image not found',
        });
      }

      res.json({
        success: true,
        message: 'Keypoint and image deleted successfully',
        data: {
          keypoint: keypointDeleted,
          image: imageDeleted ? { imageId } : null,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete keypoint by ID
   * DELETE /api/keypoints/:id
   */
  async deleteKeypointById(req, res, next) {
    try {
      const { id } = req.params;

      // Get keypoint to find imageId
      const keypoint = await keypointService.getById(id);

      if (!keypoint) {
        return res.status(404).json({
          success: false,
          error: 'Keypoint not found',
        });
      }

      // Delete from both databases
      await keypointService.deleteById(id);
      await imageService.delete(keypoint.image_id);

      res.json({
        success: true,
        message: 'Keypoint and image deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PoseController();

