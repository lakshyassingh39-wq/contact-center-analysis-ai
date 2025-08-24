const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Call = require('../models/Call');
const { auth } = require('../middleware/auth');
const { validateRequest, schemas } = require('../middleware/validation');
const aiService = require('../services/aiService');
const logger = require('../utils/logger');

const router = express.Router();

// Create uploads directory if it doesn't exist
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `call-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/m4a', 'audio/x-m4a'];
  const allowedExtensions = ['.wav', '.mp3', '.m4a'];
  
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only audio files (wav, mp3, m4a) are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024 // 50MB
  }
});

/**
 * @swagger
 * /api/calls/upload:
 *   post:
 *     summary: Upload audio call recording
 *     tags: [Calls]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               audio:
 *                 type: string
 *                 format: binary
 *               metadata:
 *                 type: string
 *                 description: JSON string with call metadata
 *     responses:
 *       201:
 *         description: File uploaded successfully
 *       400:
 *         description: Invalid file or validation error
 */
router.post('/upload', auth, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No audio file provided'
      });
    }

    // Parse metadata if provided
    let metadata = {};
    if (req.body.metadata) {
      try {
        metadata = JSON.parse(req.body.metadata);
      } catch (error) {
        logger.warn('Invalid metadata format:', error);
      }
    }

    // Create call record
    const call = new Call({
      userId: req.user.id,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      metadata: {
        customerInfo: metadata.customerInfo,
        agentInfo: metadata.agentInfo || req.user.name,
        callDate: metadata.callDate ? new Date(metadata.callDate) : new Date(),
        callType: metadata.callType || 'inbound'
      }
    });

    await call.save();

    // Emit socket event for real-time updates
    req.io.to(`user-${req.user.id}`).emit('call-uploaded', {
      callId: call._id,
      status: call.status,
      fileName: call.originalName
    });

    logger.info(`File uploaded: ${req.file.originalname} by user ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      call: {
        id: call._id,
        fileName: call.originalName,
        fileSize: call.fileSize,
        uploadedAt: call.uploadedAt,
        status: call.status,
        metadata: call.metadata
      }
    });
  } catch (error) {
    // Clean up uploaded file if database save fails
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    logger.error('File upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during file upload'
    });
  }
});

/**
 * @swagger
 * /api/calls:
 *   get:
 *     summary: Get user's call recordings
 *     tags: [Calls]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of calls retrieved successfully
 */
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const filter = { userId: req.user.id };
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const calls = await Call.find(filter)
      .sort({ uploadedAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-filePath'); // Don't expose file paths

    const total = await Call.countDocuments(filter);

    res.json({
      success: true,
      calls,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    logger.error('Get calls error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving calls'
    });
  }
});

/**
 * @swagger
 * /api/calls/{id}:
 *   get:
 *     summary: Get specific call details
 *     tags: [Calls]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Call details retrieved successfully
 *       404:
 *         description: Call not found
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const call = await Call.findOne({
      _id: req.params.id,
      userId: req.user.id
    }).select('-filePath');

    if (!call) {
      return res.status(404).json({
        success: false,
        message: 'Call not found'
      });
    }

    res.json({
      success: true,
      call
    });
  } catch (error) {
    logger.error('Get call error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving call'
    });
  }
});

/**
 * @swagger
 * /api/calls/{id}:
 *   delete:
 *     summary: Delete call recording
 *     tags: [Calls]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Call deleted successfully
 *       404:
 *         description: Call not found
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const call = await Call.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!call) {
      return res.status(404).json({
        success: false,
        message: 'Call not found'
      });
    }

    // Delete file from filesystem
    if (fs.existsSync(call.filePath)) {
      fs.unlinkSync(call.filePath);
    }

    // Delete from database
    await Call.findByIdAndDelete(req.params.id);

    logger.info(`Call deleted: ${call.fileName} by user ${req.user.email}`);

    res.json({
      success: true,
      message: 'Call deleted successfully'
    });
  } catch (error) {
    logger.error('Delete call error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting call'
    });
  }
});

module.exports = router;
