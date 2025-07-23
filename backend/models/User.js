const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  avatar: {
    public_id: {
      type: String,
      default: null
    },
    url: {
      type: String,
      default: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg'
    }
  },
  role: {
    type: String,
    default: 'user',
    enum: ['user', 'admin']
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String,
    default: null
  },
  verificationTokenExpires: {
    type: Date,
    default: null
  },
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  },
  otp: {
    code: {
      type: String,
      default: null
    },
    expiresAt: {
      type: Date,
      default: null
    },
    attempts: {
      type: Number,
      default: 0
    }
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date,
    default: null
  },
  lastLogin: {
    type: Date,
    default: null
  },
  profile: {
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters']
    },
    location: {
      type: String,
      maxlength: [100, 'Location cannot exceed 100 characters']
    },
    profession: {
      type: String,
      maxlength: [100, 'Profession cannot exceed 100 characters']
    }
  },
  profilePicture: {
    type: String,
    default: '', // Will store the image URL or path
  },
}, {
  timestamps: true
});

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ resetPasswordToken: 1 });
userSchema.index({ verificationToken: 1 });

// Virtual for account lock status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to generate password reset token
userSchema.methods.generatePasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  this.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return resetToken;
};

// Method to generate verification token
userSchema.methods.generateVerificationToken = function() {
  const verificationToken = crypto.randomBytes(32).toString('hex');
  
  this.verificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  
  this.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  
  return verificationToken;
};

// Method to generate OTP
userSchema.methods.generateOTP = function() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  this.otp = {
    code: otp,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    attempts: 0
  };
  
  return otp;
};

// Method to verify OTP
userSchema.methods.verifyOTP = function(otp) {
  if (!this.otp || !this.otp.code || !this.otp.expiresAt) {
    return { valid: false, message: 'No OTP found' };
  }
  
  if (this.otp.expiresAt < new Date()) {
    return { valid: false, message: 'OTP has expired' };
  }
  
  if (this.otp.attempts >= 3) {
    return { valid: false, message: 'Too many OTP attempts' };
  }
  
  this.otp.attempts += 1;
  
  if (this.otp.code !== otp) {
    return { valid: false, message: 'Invalid OTP' };
  }
  
  // Clear OTP after successful verification
  this.otp = {
    code: null,
    expiresAt: null,
    attempts: 0
  };
  
  return { valid: true, message: 'OTP verified successfully' };
};

// Method to handle failed login attempts
userSchema.methods.handleFailedLogin = function() {
  this.loginAttempts += 1;
  
  if (this.loginAttempts >= 5) {
    this.lockUntil = Date.now() + 15 * 60 * 1000; // Lock for 15 minutes
  }
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  this.loginAttempts = 0;
  this.lockUntil = null;
  this.lastLogin = new Date();
};

// Method to clear password reset token
userSchema.methods.clearPasswordResetToken = function() {
  this.resetPasswordToken = null;
  this.resetPasswordExpires = null;
};

// Method to clear verification token
userSchema.methods.clearVerificationToken = function() {
  this.verificationToken = null;
  this.verificationTokenExpires = null;
};

// Static method to find user by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to find user by reset token
userSchema.statics.findByResetToken = function(token) {
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  return this.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() }
  });
};

// Static method to find user by verification token
userSchema.statics.findByVerificationToken = function(token) {
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  return this.findOne({
    verificationToken: hashedToken,
    verificationTokenExpires: { $gt: Date.now() }
  });
};

module.exports = mongoose.model('User', userSchema); 