const imageService = require('../services/imageService');

class ImageController {
  /**
   * Get all images with pagination
   * GET /api/images
   */
  async getAllImages(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const result = await imageService.getAll(page, limit);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get image by image ID
   * GET /api/images/:imageId
   */
  async getImageById(req, res, next) {
    try {
      const { imageId } = req.params;

      const image = await imageService.getByImageId(imageId);

      if (!image) {
        return res.status(404).json({
          success: false,
          error: 'Image not found',
        });
      }

      // Set appropriate headers
      res.set({
        'Content-Type': image.mimeType,
        'Content-Length': image.size,
        'Content-Disposition': `inline; filename="${image.originalName}"`,
      });

      res.send(image.imageData);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get image metadata by image ID (without image data)
   * GET /api/images/:imageId/metadata
   */
  async getImageMetadata(req, res, next) {
    try {
      const { imageId } = req.params;

      const image = await imageService.getByImageId(imageId);

      if (!image) {
        return res.status(404).json({
          success: false,
          error: 'Image not found',
        });
      }

      res.json({
        success: true,
        data: {
          imageId: image.imageId,
          originalName: image.originalName,
          mimeType: image.mimeType,
          size: image.size,
          createdAt: image.createdAt,
          updatedAt: image.updatedAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update image metadata
   * PUT /api/images/:imageId
   */
  async updateImage(req, res, next) {
    try {
      const { imageId } = req.params;
      const updateData = req.body;

      const updated = await imageService.update(imageId, updateData);

      if (!updated) {
        return res.status(404).json({
          success: false,
          error: 'Image not found',
        });
      }

      res.json({
        success: true,
        data: {
          imageId: updated.imageId,
          originalName: updated.originalName,
          mimeType: updated.mimeType,
          size: updated.size,
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete image by image ID
   * DELETE /api/images/:imageId
   */
  async deleteImage(req, res, next) {
    try {
      const { imageId } = req.params;

      const deleted = await imageService.delete(imageId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Image not found',
        });
      }

      res.json({
        success: true,
        message: 'Image deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ImageController();

