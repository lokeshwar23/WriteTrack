const jwt = require('jsonwebtoken');

// Token types and their configurations
const tokenTypes = {
  access: {
    secret: process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'your-access-secret-key',
    expiresIn: '15m' // 15 minutes
  },
  refresh: {
    secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'your-refresh-secret-key',
    expiresIn: '7d' // 7 days
  },
  verification: {
    secret: process.env.JWT_VERIFICATION_SECRET || process.env.JWT_SECRET || 'your-verification-secret-key',
    expiresIn: '24h' // 24 hours
  },
  reset: {
    secret: process.env.JWT_RESET_SECRET || process.env.JWT_SECRET || 'your-reset-secret-key',
    expiresIn: '10m' // 10 minutes
  }
};

// Generate JWT token
const generateToken = (userId, type = 'access', additionalData = {}) => {
  try {
    const tokenConfig = tokenTypes[type];
    if (!tokenConfig) {
      throw new Error(`Invalid token type: ${type}`);
    }

    const payload = {
      userId,
      type,
      ...additionalData
    };

    return jwt.sign(payload, tokenConfig.secret, {
      expiresIn: tokenConfig.expiresIn,
      issuer: 'task-manager-api',
      audience: 'task-manager-client'
    });
  } catch (error) {
    console.error('Error generating token:', error);
    throw error;
  }
};

// Verify JWT token
const verifyToken = (token, type = 'access') => {
  try {
    const tokenConfig = tokenTypes[type];
    if (!tokenConfig) {
      throw new Error(`Invalid token type: ${type}`);
    }

    const decoded = jwt.verify(token, tokenConfig.secret, {
      issuer: 'task-manager-api',
      audience: 'task-manager-client'
    });

    // Verify token type matches
    if (decoded.type !== type) {
      throw new Error('Token type mismatch');
    }

    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    } else {
      throw error;
    }
  }
};

// Decode token without verification (for debugging)
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

// Check if token is expired
const isTokenExpired = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) {
      return true;
    }
    
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true;
  }
};

// Generate token pair (access + refresh)
const generateTokenPair = (userId, additionalData = {}) => {
  const accessToken = generateToken(userId, 'access', additionalData);
  const refreshToken = generateToken(userId, 'refresh', additionalData);
  
  return {
    accessToken,
    refreshToken
  };
};

// Refresh access token using refresh token
const refreshAccessToken = (refreshToken) => {
  try {
    const decoded = verifyToken(refreshToken, 'refresh');
    const newAccessToken = generateToken(decoded.userId, 'access');
    
    return {
      accessToken: newAccessToken,
      refreshToken: refreshToken // Return the same refresh token if it's still valid
    };
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};

// Generate verification token
const generateVerificationToken = (userId) => {
  return generateToken(userId, 'verification');
};

// Generate password reset token
const generatePasswordResetToken = (userId) => {
  return generateToken(userId, 'reset');
};

// Extract user ID from token
const getUserIdFromToken = (token, type = 'access') => {
  try {
    const decoded = verifyToken(token, type);
    return decoded.userId;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Get token expiration time
const getTokenExpiration = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) {
      return null;
    }
    
    return new Date(decoded.exp * 1000);
  } catch (error) {
    console.error('Error getting token expiration:', error);
    return null;
  }
};

// Get time until token expires
const getTimeUntilExpiration = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) {
      return 0;
    }
    
    const currentTime = Math.floor(Date.now() / 1000);
    const timeUntilExpiration = decoded.exp - currentTime;
    
    return Math.max(0, timeUntilExpiration);
  } catch (error) {
    console.error('Error getting time until expiration:', error);
    return 0;
  }
};

// Validate token format
const isValidTokenFormat = (token) => {
  if (!token || typeof token !== 'string') {
    return false;
  }
  
  // Check if token has the correct format (3 parts separated by dots)
  const parts = token.split('.');
  return parts.length === 3;
};

// Blacklist management (in-memory for development, use Redis in production)
const tokenBlacklist = new Set();

// Blacklist a token
const blacklistToken = (token) => {
  tokenBlacklist.add(token);
};

// Check if token is blacklisted
const isTokenBlacklisted = (token) => {
  return tokenBlacklist.has(token);
};

// Clear expired tokens from blacklist
const clearExpiredBlacklistedTokens = () => {
  for (const token of tokenBlacklist) {
    if (isTokenExpired(token)) {
      tokenBlacklist.delete(token);
    }
  }
};

// Set up periodic cleanup of expired blacklisted tokens
setInterval(clearExpiredBlacklistedTokens, 60 * 60 * 1000); // Run every hour

module.exports = {
  generateToken,
  verifyToken,
  decodeToken,
  isTokenExpired,
  generateTokenPair,
  refreshAccessToken,
  generateVerificationToken,
  generatePasswordResetToken,
  getUserIdFromToken,
  getTokenExpiration,
  getTimeUntilExpiration,
  isValidTokenFormat,
  blacklistToken,
  isTokenBlacklisted,
  tokenTypes
}; 