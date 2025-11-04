const mongoose = require('mongoose');

const paintingSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  artist: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  qrCode: {
    type: String,
    default: null
  },
  image: {
    type: String,
    default: null
  },
  imageType: {
    type: String,
    default: null
  },
  scans: {
    type: Number,
    default: 0
  },
  // ✅ FIXED: Allow null with sparse
  scannedBy: {
    type: String,
    default: null,
    sparse: true
  },
  lastScannedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const scanSchema = new mongoose.Schema({
  paintingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Painting',
    required: true
  },
  paintingName: {
    type: String,
    required: true
  },
  scanType: {
    type: String,
    enum: ['qr', 'image', 'vision'],
    required: true
  },
  userAgent: {
    type: String,
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  viewingTime: {
    type: Number,
    default: 0
  },
  ipAddress: {
    type: String,
    default: null
  },
  location: {
    type: String,
    default: null
  }
});

const analyticsSchema = new mongoose.Schema({
  totalScans: {
    type: Number,
    default: 0
  },
  qrScans: {
    type: Number,
    default: 0
  },
  imageScans: {
    type: Number,
    default: 0
  },
  visionApiScans: {
    type: Number,
    default: 0
  },
  mostScannedPainting: {
    type: String,
    default: null
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

const Painting = mongoose.model('Painting', paintingSchema);
const Scan = mongoose.model('Scan', scanSchema);
const Analytics = mongoose.model('Analytics', analyticsSchema);

module.exports = { Painting, Scan, Analytics };
