const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { verifyToken, isTokenBlacklisted } = require('../utils/tokenService');

// Main authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: 'Access token is required' });
    }

    // Check if token is blacklisted
    if (isTokenBlacklisted(token)) {
      return res.status(401).json({ message: 'Token has been invalidated' });
    }

    // Verify token
    const decoded = verifyToken(token, 'access');
    
    // Find user
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Check if user is verified (optional, depending on your requirements)
    // Commented out for development - uncomment in production
    // if (!user.isVerified) {
    //   return res.status(403).json({ message: 'Please verify your email address first' });
    // }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error.message === 'Token has expired') {
      return res.status(401).json({ message: 'Token has expired' });
    } else if (error.message === 'Invalid token') {
      return res.status(401).json({ message: 'Invalid token' });
    } else {
      return res.status(401).json({ message: 'Authentication failed' });
    }
  }
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return next(); // Continue without authentication
    }

    if (isTokenBlacklisted(token)) {
      return next(); // Continue without authentication
    }

    const decoded = verifyToken(token, 'access');
    const user = await User.findById(decoded.userId).select('-password');
    
    if (user && user.isVerified) {
      req.user = user;
    }
    
    next();
  } catch (error) {
    // Continue without authentication on error
    next();
  }
};

// Refresh token authentication
const authenticateRefreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token is required' });
    }

    if (isTokenBlacklisted(refreshToken)) {
      return res.status(401).json({ message: 'Refresh token has been invalidated' });
    }

    const decoded = verifyToken(refreshToken, 'refresh');
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Refresh token authentication error:', error);
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
};

// Role-based authorization middleware
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. Required roles: ${roles.join(', ')}` 
      });
    }

    next();
  };
};

// Admin authorization middleware
const authorizeAdmin = (req, res, next) => {
  return authorizeRoles('admin')(req, res, next);
};

// User authorization middleware (user can access their own resources)
const authorizeUser = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  // Allow if user is admin
  if (req.user.role === 'admin') {
    return next();
  }

  // Allow if user is accessing their own resource
  const resourceUserId = req.params.userId || req.params.id;
  if (resourceUserId && resourceUserId === req.user._id.toString()) {
    return next();
  }

  return res.status(403).json({ message: 'Access denied' });
};

// Task ownership authorization middleware
const authorizeTaskAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const taskId = req.params.id || req.params.taskId;
    if (!taskId) {
      return res.status(400).json({ message: 'Task ID is required' });
    }

    const Task = require('../models/Task');
    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Allow if user is admin
    if (req.user.role === 'admin') {
      req.task = task;
      return next();
    }

    // Allow if user owns the task
    if (task.user.toString() === req.user._id.toString()) {
      req.task = task;
      return next();
    }

    // Allow if user is assigned to the task
    if (task.assignedTo.some(userId => userId.toString() === req.user._id.toString())) {
      req.task = task;
      return next();
    }

    return res.status(403).json({ message: 'Access denied to this task' });
  } catch (error) {
    console.error('Task authorization error:', error);
    return res.status(500).json({ message: 'Server error during authorization' });
  }
};

// Rate limiting for authentication attempts
const authRateLimit = require('express-rate-limit');

const loginRateLimit = authRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per windowMs
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

const registerRateLimit = authRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 registration attempts per hour
  message: 'Too many registration attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

const passwordResetRateLimit = authRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 password reset attempts per hour
  message: 'Too many password reset attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Session validation middleware
const validateSession = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: 'Session expired' });
  }

  // Check if session user matches token user
  if (req.user && req.session.userId !== req.user._id.toString()) {
    return res.status(401).json({ message: 'Session mismatch' });
  }

  next();
};

// CSRF protection middleware
const csrfProtection = (req, res, next) => {
  // Skip CSRF check for API routes that don't modify data
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }

  const csrfToken = req.headers['x-csrf-token'] || req.body._csrf;
  const sessionToken = req.session.csrfToken;

  if (!csrfToken || !sessionToken || csrfToken !== sessionToken) {
    return res.status(403).json({ message: 'CSRF token validation failed' });
  }

  next();
};

// Generate CSRF token
const generateCSRFToken = (req, res, next) => {
  if (!req.session.csrfToken) {
    req.session.csrfToken = require('crypto').randomBytes(32).toString('hex');
  }
  res.locals.csrfToken = req.session.csrfToken;
  next();
};

// Logout middleware
const logout = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      // Blacklist the token
      const { blacklistToken } = require('../utils/tokenService');
      blacklistToken(token);
    }

    // Clear session
    if (req.session) {
      req.session.destroy();
    }

    next();
  } catch (error) {
    console.error('Logout error:', error);
    next();
  }
};

// Security headers middleware
const securityHeaders = (req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';");
  
  next();
};

module.exports = {
  authenticateToken,
  optionalAuth,
  authenticateRefreshToken,
  authorizeRoles,
  authorizeAdmin,
  authorizeUser,
  authorizeTaskAccess,
  loginRateLimit,
  registerRateLimit,
  passwordResetRateLimit,
  validateSession,
  csrfProtection,
  generateCSRFToken,
  logout,
  securityHeaders
}; 