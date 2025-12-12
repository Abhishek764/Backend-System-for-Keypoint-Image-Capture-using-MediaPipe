const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  imageId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  originalName: {
    type: String,
    required: true,
  },
  mimeType: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  imageData: {
    type: Buffer,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
imageSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const Image = mongoose.model('Image', imageSchema);

module.exports = Image;
