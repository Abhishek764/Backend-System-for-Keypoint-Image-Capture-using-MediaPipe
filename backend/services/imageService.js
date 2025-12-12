const Image = require('../models/imageModel');
const { v4: uuidv4 } = require('uuid');

class ImageService {
  /**
   * Create a new image record
   */
  async create(file, imageId) {
    if (!file || !file.buffer) {
      throw new Error('File buffer is required');
    }

    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    const image = new Image({
      imageId: imageId || uuidv4(),
      originalName: file.originalname || 'unknown',
      mimeType: file.mimetype,
      size: file.size,
      imageData: file.buffer,
    });

    try {
      return await image.save();
    } catch (error) {
      if (error.code === 11000) { // MongoDB duplicate key error
        throw new Error(`Image with imageId ${image.imageId} already exists`);
      }
      throw error;
    }
  }

  /**
   * Get image by image ID
   */
  async getByImageId(imageId) {
    return await Image.findOne({ imageId });
  }

  /**
   * Get all images with pagination
   */
  async getAll(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const total = await Image.countDocuments();
    const images = await Image.find()
      .select('-imageData') // Exclude image data for list view
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return {
      data: images,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update image metadata
   */
  async update(imageId, updateData) {
    return await Image.findOneAndUpdate(
      { imageId },
      { ...updateData, updatedAt: Date.now() },
      { new: true }
    );
  }

  /**
   * Delete image by image ID
   */
  async delete(imageId) {
    return await Image.findOneAndDelete({ imageId });
  }

  /**
   * Get all images for backup (with image data)
   */
  async getAllForBackup() {
    return await Image.find().select('+imageData');
  }
}

module.exports = new ImageService();
