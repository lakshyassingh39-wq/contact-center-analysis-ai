const express = require('express');
const Call = require('../models/Call');
const Analysis = require('../models/Analysis');
const { auth } = require('../middleware/auth');
const aiService = require('../services/aiService');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @swagger
 * /api/analysis/transcribe/{callId}:
 *   post:
 *     summary: Transcribe audio call using AI
 *     tags: [Analysis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: callId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transcription completed successfully
 *       404:
 *         description: Call not found
 */
router.post('/transcribe/:callId', auth, async (req, res) => {
  try {
    const call = await Call.findOne({
      _id: req.params.callId,
      userId: req.user.id
    });

    if (!call) {
      return res.status(404).json({
        success: false,
        message: 'Call not found'
      });
    }

    if (call.status === 'transcribing') {
      return res.status(400).json({
        success: false,
        message: 'Transcription already in progress'
      });
    }

    if (call.transcript) {
      return res.status(200).json({
        success: true,
        message: 'Call already transcribed',
        transcript: call.transcript
      });
    }

    // Update status to transcribing
    call.status = 'transcribing';
    await call.save();

    // Emit progress update
    req.io.to(`call-${call._id}`).emit('transcription-started', {
      callId: call._id,
      status: 'transcribing'
    });

    // Perform transcription asynchronously
    transcribeCallAsync(call, req.io);

    res.json({
      success: true,
      message: 'Transcription started',
      callId: call._id,
      status: call.status
    });
  } catch (error) {
    logger.error('Transcription initiation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error starting transcription'
    });
  }
});

/**
 * Async function to handle transcription
 */
async function transcribeCallAsync(call, io) {
  try {
    logger.info(`Starting transcription for call ${call._id}`);
    
    const startTime = Date.now();
    const transcriptionResult = await aiService.transcribeAudio(call.filePath);
    const processingTime = Date.now() - startTime;

    // Update call with transcript
    call.transcript = transcriptionResult.text;
    call.duration = transcriptionResult.duration;
    call.status = 'transcribed';
    call.transcriptionTime = new Date();
    await call.save();

    // Emit completion event
    io.to(`call-${call._id}`).emit('transcription-completed', {
      callId: call._id,
      status: 'transcribed',
      transcript: transcriptionResult.text,
      duration: transcriptionResult.duration,
      processingTime
    });

    logger.info(`Transcription completed for call ${call._id} in ${processingTime}ms`);
  } catch (error) {
    logger.error(`Transcription failed for call ${call._id}:`, error);
    
    // Update call with error
    call.status = 'failed';
    call.error = {
      message: error.message,
      timestamp: new Date(),
      step: 'transcription'
    };
    await call.save();

    // Emit error event
    io.to(`call-${call._id}`).emit('transcription-failed', {
      callId: call._id,
      status: 'failed',
      error: error.message
    });
  }
}

/**
 * @swagger
 * /api/analysis/analyze/{callId}:
 *   post:
 *     summary: Analyze call quality using AI
 *     tags: [Analysis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: callId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Analysis completed successfully
 *       404:
 *         description: Call not found
 */
router.post('/analyze/:callId', auth, async (req, res) => {
  try {
    const call = await Call.findOne({
      _id: req.params.callId,
      userId: req.user.id
    });

    if (!call) {
      return res.status(404).json({
        success: false,
        message: 'Call not found'
      });
    }

    if (!call.transcript) {
      return res.status(400).json({
        success: false,
        message: 'Call must be transcribed before analysis'
      });
    }

    // Check if analysis already exists
    const existingAnalysis = await Analysis.findOne({ callId: call._id });
    if (existingAnalysis) {
      return res.status(200).json({
        success: true,
        message: 'Analysis already completed',
        analysis: existingAnalysis
      });
    }

    // Update call status
    call.status = 'analyzing';
    await call.save();

    // Emit progress update
    req.io.to(`call-${call._id}`).emit('analysis-started', {
      callId: call._id,
      status: 'analyzing'
    });

    // Perform analysis asynchronously
    analyzeCallAsync(call, req.user, req.io);

    res.json({
      success: true,
      message: 'Analysis started',
      callId: call._id,
      status: call.status
    });
  } catch (error) {
    logger.error('Analysis initiation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error starting analysis'
    });
  }
});

/**
 * Async function to handle call analysis
 */
async function analyzeCallAsync(call, user, io) {
  try {
    logger.info(`Starting analysis for call ${call._id}`);
    
    const startTime = Date.now();
    const analysisResult = await aiService.analyzeCall(call.transcript, call.metadata);
    const processingTime = Date.now() - startTime;

    // Create analysis record
    const analysis = new Analysis({
      callId: call._id,
      userId: user.id,
      scores: analysisResult.scores,
      overallScore: analysisResult.overallScore,
      strengths: analysisResult.strengths,
      improvementAreas: analysisResult.improvementAreas,
      keyInsights: analysisResult.keyInsights,
      processingTime
    });

    await analysis.save();

    // Update call status
    call.status = 'analyzed';
    await call.save();

    // Emit completion event
    io.to(`call-${call._id}`).emit('analysis-completed', {
      callId: call._id,
      status: 'analyzed',
      analysis: analysis,
      processingTime
    });

    logger.info(`Analysis completed for call ${call._id} in ${processingTime}ms`);
  } catch (error) {
    logger.error(`Analysis failed for call ${call._id}:`, error);
    
    // Update call with error
    call.status = 'failed';
    call.error = {
      message: error.message,
      timestamp: new Date(),
      step: 'analysis'
    };
    await call.save();

    // Emit error event
    io.to(`call-${call._id}`).emit('analysis-failed', {
      callId: call._id,
      status: 'failed',
      error: error.message
    });
  }
}

/**
 * @swagger
 * /api/analysis/{callId}:
 *   get:
 *     summary: Get analysis results for a call
 *     tags: [Analysis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: callId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Analysis retrieved successfully
 *       404:
 *         description: Analysis not found
 */
router.get('/:callId', auth, async (req, res) => {
  try {
    const analysis = await Analysis.findOne({
      callId: req.params.callId,
      userId: req.user.id
    }).populate('callId', 'originalName uploadedAt duration transcript');

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Analysis not found'
      });
    }

    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    logger.error('Get analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving analysis'
    });
  }
});

/**
 * @swagger
 * /api/analysis:
 *   get:
 *     summary: Get all analyses for user
 *     tags: [Analysis]
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
 *     responses:
 *       200:
 *         description: Analyses retrieved successfully
 */
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const analyses = await Analysis.find({ userId: req.user.id })
      .populate('callId', 'originalName uploadedAt duration')
      .sort({ analyzedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Analysis.countDocuments({ userId: req.user.id });

    res.json({
      success: true,
      analyses,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    logger.error('Get analyses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving analyses'
    });
  }
});

module.exports = router;
