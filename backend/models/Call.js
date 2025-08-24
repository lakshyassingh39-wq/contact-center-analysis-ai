const mongoose = require('mongoose');

const callSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  duration: {
    type: Number, // in seconds
    default: null
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['uploaded', 'transcribing', 'transcribed', 'analyzing', 'analyzed', 'coaching-generated', 'failed'],
    default: 'uploaded'
  },
  transcript: {
    type: String,
    default: null
  },
  transcriptionTime: {
    type: Date,
    default: null
  },
  metadata: {
    customerInfo: {
      type: String,
      default: null
    },
    agentInfo: {
      type: String,
      default: null
    },
    callDate: {
      type: Date,
      default: null
    },
    callType: {
      type: String,
      enum: ['inbound', 'outbound'],
      default: 'inbound'
    }
  },
  error: {
    message: String,
    timestamp: Date,
    step: String
  }
});

// Index for efficient queries
callSchema.index({ userId: 1, uploadedAt: -1 });
callSchema.index({ status: 1 });

module.exports = mongoose.model('Call', callSchema);
