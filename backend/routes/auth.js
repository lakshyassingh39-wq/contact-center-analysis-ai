const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { validateRequest, schemas } = require('../middleware/validation');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', validateRequest(schemas.login), async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists and get password
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact administrator.'
      });
    }

    // Validate password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    // Remove password from response
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      lastLogin: user.lastLogin
    };

    logger.info(`User logged in: ${user.email}`);

    res.json({
      success: true,
      token,
      user: userResponse
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register new user (demo purposes)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               role:
 *                 type: string
 *                 enum: [agent, supervisor, admin]
 *               department:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: User already exists or validation error
 */
router.post('/register', validateRequest(schemas.register), async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'agent',
      department
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    // Remove password from response
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department
    };

    logger.info(`New user registered: ${user.email}`);

    res.status(201).json({
      success: true,
      token,
      user: userResponse
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

/**
 * @swagger
 * /api/auth/demo-login:
 *   post:
 *     summary: Demo login (hardcoded credentials)
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Demo login successful
 */
router.post('/demo-login', async (req, res) => {
  try {
    // Create or get demo user
    let demoUser = await User.findOne({ email: 'demo@omind.ai' });
    
    if (!demoUser) {
      demoUser = await User.create({
        name: 'Demo Agent',
        email: 'demo@omind.ai',
        password: 'password',
        role: 'agent',
        department: 'Customer Service'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: demoUser._id, email: demoUser.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    const userResponse = {
      id: demoUser._id,
      name: demoUser.name,
      email: demoUser.email,
      role: demoUser.role,
      department: demoUser.department
    };

    logger.info('Demo user logged in');

    res.json({
      success: true,
      token,
      user: userResponse
    });
  } catch (error) {
    logger.error('Demo login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during demo login'
    });
  }
});

module.exports = router;
