const express = require('express');

/**
 * Validation middleware for request parameters
 */
const validateUUID = (req, res, next) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  // Check imageId in params (must be UUID)
  if (req.params.imageId && !uuidRegex.test(req.params.imageId)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid imageId format. Must be a valid UUID.',
    });
  }
  
  next();
};

/**
 * Validate ID parameter (can be UUID or integer)
 */
const validateId = (req, res, next) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const id = req.params.id;
  
  if (id && !uuidRegex.test(id) && isNaN(parseInt(id))) {
    return res.status(400).json({
      success: false,
      error: 'Invalid id format. Must be a valid UUID or integer.',
    });
  }
  
  next();
};

/**
 * Validate pagination parameters
 */
const validatePagination = (req, res, next) => {
  const page = parseInt(req.query.page);
  const limit = parseInt(req.query.limit);
  
  if (page !== undefined && (isNaN(page) || page < 1)) {
    return res.status(400).json({
      success: false,
      error: 'Page must be a positive integer',
    });
  }
  
  if (limit !== undefined && (isNaN(limit) || limit < 1 || limit > 100)) {
    return res.status(400).json({
      success: false,
      error: 'Limit must be between 1 and 100',
    });
  }
  
  next();
};

/**
 * Validate keypoints data structure
 */
const validateKeypoints = (req, res, next) => {
  if (!req.body.keypoints) {
    return res.status(400).json({
      success: false,
      error: 'Keypoints data is required',
    });
  }
  
  const { keypoints } = req.body;
  
  if (typeof keypoints !== 'object' || keypoints === null) {
    return res.status(400).json({
      success: false,
      error: 'Keypoints must be a valid object',
    });
  }
  
  // Basic structure validation
  if (keypoints.landmarks && !Array.isArray(keypoints.landmarks)) {
    return res.status(400).json({
      success: false,
      error: 'Keypoints landmarks must be an array',
    });
  }
  
  next();
};

module.exports = {
  validateUUID,
  validateId,
  validatePagination,
  validateKeypoints,
};

