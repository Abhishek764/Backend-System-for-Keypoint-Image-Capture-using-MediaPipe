const express = require('express');
const multer = require('multer');
const poseController = require('./controllers/poseController');
const imageController = require('./controllers/imageController');
const backupController = require('./controllers/backupController');
const { validateUUID, validateId, validatePagination, validateKeypoints } = require('../middleware/validation');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// Pose extraction routes
router.post('/extract-pose', upload.single('image'), poseController.extractPose);

// Keypoint CRUD routes
router.get('/keypoints', validatePagination, poseController.getAllKeypoints);
router.get('/keypoints/:id', validateId, poseController.getKeypointById);
router.get('/keypoints/image/:imageId', validateUUID, poseController.getKeypointByImageId);
router.put('/keypoints/image/:imageId', validateUUID, validateKeypoints, poseController.updateKeypoint);
router.delete('/keypoints/:id', validateId, poseController.deleteKeypointById);
router.delete('/keypoints/image/:imageId', validateUUID, poseController.deleteKeypoint);

// Image CRUD routes
router.get('/images', validatePagination, imageController.getAllImages);
router.get('/images/:imageId', validateUUID, imageController.getImageById);
router.get('/images/:imageId/metadata', validateUUID, imageController.getImageMetadata);
router.put('/images/:imageId', validateUUID, imageController.updateImage);
router.delete('/images/:imageId', validateUUID, imageController.deleteImage);

// Backup routes
router.post('/backup/trigger', backupController.triggerBackup);
router.get('/backup/status', backupController.getBackupStatus);
router.post('/backup/test-email', backupController.testEmail);

module.exports = router;

