const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Task = require('../models/Task');
const { authenticateToken, authorizeAdmin, authorizeUser } = require('../middleware/auth');
const { uploadAvatar, handleUploadError } = require('../middleware/upload');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Validation middleware
const validateProfileUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('profile.bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
  body('profile.phone')
    .optional()
    .isLength({ min: 3, max: 20 })
    .withMessage('Phone number must be between 3 and 20 characters'),
  body('profile.location')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location cannot exceed 100 characters'),
  body('profile.website')
    .optional()
    .isString()
    .withMessage('Website must be a string'),
];

const validatePreferencesUpdate = [
  body('preferences.theme')
    .optional()
    .isIn(['light', 'dark'])
    .withMessage('Theme must be either light or dark'),
  body('preferences.notifications.email')
    .optional()
    .isBoolean()
    .withMessage('Email notifications must be a boolean'),
  body('preferences.notifications.push')
    .optional()
    .isBoolean()
    .withMessage('Push notifications must be a boolean'),
  body('preferences.timezone')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Timezone must be between 1 and 50 characters'),
];

// @route   GET /api/users/profile
// @desc    Get current user's profile
// @access  Private
// @route   GET /api/users
// @desc    Get all users (for task assignment)
// @access  Private (or Admin, if you want)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const users = await User.find({}, 'name email avatar'); // Only return needed fields
    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error while fetching users' });
  }
});

router.get('/profile', authenticateToken, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id)
    .select('-password -resetPasswordToken -resetPasswordExpires -verificationToken -verificationTokenExpires');

  res.json({
    success: true,
    user
  });
}));

// @route   PUT /api/users/profile
// @desc    Update current user's profile
// @access  Private
router.put('/profile', authenticateToken, validateProfileUpdate, uploadAvatar.single('avatar'), handleUploadError, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, profile } = req.body;
  const user = await User.findById(req.user.id);

  // Update basic info
  if (name) user.name = name;
  if (profile) {
    if (profile.bio !== undefined) user.profile.bio = profile.bio;
    if (profile.phone !== undefined) user.profile.phone = profile.phone;
    if (profile.location !== undefined) user.profile.location = profile.location;
    if (profile.website !== undefined) user.profile.website = profile.website;
  }

  // Handle avatar upload
  if (req.file) {
    user.avatar.url = `/uploads/avatars/${req.file.filename}`;
  }

  await user.save();

  res.json({
    success: true,
    message: 'Profile updated successfully',
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      profile: user.profile
    }
  });
}));

// @route   PUT /api/users/preferences
// @desc    Update user preferences
// @access  Private
router.put('/preferences', authenticateToken, validatePreferencesUpdate, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { preferences } = req.body;
  const user = await User.findById(req.user.id);

  if (preferences) {
    if (preferences.theme !== undefined) user.preferences.theme = preferences.theme;
    if (preferences.notifications) {
      if (preferences.notifications.email !== undefined) {
        user.preferences.notifications.email = preferences.notifications.email;
      }
      if (preferences.notifications.push !== undefined) {
        user.preferences.notifications.push = preferences.notifications.push;
      }
    }
    if (preferences.timezone !== undefined) user.preferences.timezone = preferences.timezone;
  }

  await user.save();

  res.json({
    success: true,
    message: 'Preferences updated successfully',
    preferences: user.preferences
  });
}));

// @route   GET /api/users/stats
// @desc    Get user statistics
// @access  Private
router.get('/stats', authenticateToken, asyncHandler(async (req, res) => {
  const stats = await Task.aggregate([
    { $match: { user: req.user.id } },
    {
      $group: {
        _id: null,
        totalTasks: { $sum: 1 },
        completedTasks: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        pendingTasks: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        inProgressTasks: { $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] } },
        totalHours: { $sum: '$timeTracking.actualHours' },
        averageCompletionTime: {
          $avg: {
            $cond: [
              { $eq: ['$status', 'completed'] },
              { $subtract: ['$completedAt', '$createdAt'] },
              null
            ]
          }
        }
      }
    }
  ]);

  const priorityStats = await Task.aggregate([
    { $match: { user: req.user.id } },
    {
      $group: {
        _id: '$priority',
        count: { $sum: 1 }
      }
    }
  ]);

  const categoryStats = await Task.aggregate([
    { $match: { user: req.user.id } },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 }
      }
    }
  ]);

  res.json({
    success: true,
    stats: stats[0] || {
      totalTasks: 0,
      completedTasks: 0,
      pendingTasks: 0,
      inProgressTasks: 0,
      totalHours: 0,
      averageCompletionTime: 0
    },
    byPriority: priorityStats,
    byCategory: categoryStats
  });
}));

// @route   GET /api/users/activity
// @desc    Get user activity log
// @access  Private
router.get('/activity', authenticateToken, asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const tasks = await Task.find({ user: req.user.id })
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .select('title status updatedAt createdAt');

  const total = await Task.countDocuments({ user: req.user.id });

  res.json({
    success: true,
    activity: tasks,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalItems: total
    }
  });
}));

// @route   GET /api/users/search
// @desc    Search users (admin only)
// @access  Private/Admin
router.get('/search', authenticateToken, authorizeAdmin, asyncHandler(async (req, res) => {
  const { q, page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const searchQuery = q ? {
    $or: [
      { name: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } }
    ]
  } : {};

  const users = await User.find(searchQuery)
    .select('-password -resetPasswordToken -resetPasswordExpires -verificationToken -verificationTokenExpires')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await User.countDocuments(searchQuery);

  res.json({
    success: true,
    users,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalUsers: total
    }
  });
}));

// @route   GET /api/users/:id
// @desc    Get user by ID (admin or self)
// @access  Private
router.get('/:id', authenticateToken, authorizeUser, asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select('-password -resetPasswordToken -resetPasswordExpires -verificationToken -verificationTokenExpires');

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  res.json({
    success: true,
    user
  });
}));

// @route   PUT /api/users/:id
// @desc    Update user by ID (admin only)
// @access  Private/Admin
router.put('/:id', authenticateToken, authorizeAdmin, validateProfileUpdate, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, role, isVerified, profile } = req.body;
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Update fields
  if (name) user.name = name;
  if (role) user.role = role;
  if (isVerified !== undefined) user.isVerified = isVerified;
  if (profile) {
    if (profile.bio !== undefined) user.profile.bio = profile.bio;
    if (profile.phone !== undefined) user.profile.phone = profile.phone;
    if (profile.location !== undefined) user.profile.location = profile.location;
    if (profile.website !== undefined) user.profile.website = profile.website;
  }

  await user.save();

  res.json({
    success: true,
    message: 'User updated successfully',
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      profile: user.profile
    }
  });
}));

// @route   DELETE /api/users/:id
// @desc    Delete user by ID (admin only)
// @access  Private/Admin
router.delete('/:id', authenticateToken, authorizeAdmin, asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Delete user's tasks
  await Task.deleteMany({ user: req.params.id });

  // Delete user
  await User.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'User and associated tasks deleted successfully'
  });
}));

// @route   GET /api/users/:id/tasks
// @desc    Get tasks for a specific user (admin or self)
// @access  Private
router.get('/:id/tasks', authenticateToken, authorizeUser, asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const skip = (page - 1) * limit;

  const filter = { user: req.params.id };
  if (status) filter.status = status;

  const tasks = await Task.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Task.countDocuments(filter);

  res.json({
    success: true,
    tasks,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalTasks: total
    }
  });
}));

// @route   POST /api/users/:id/verify
// @desc    Verify user email (admin only)
// @access  Private/Admin
router.post('/:id/verify', authenticateToken, authorizeAdmin, asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  user.isVerified = true;
  user.clearVerificationToken();
  await user.save();

  res.json({
    success: true,
    message: 'User verified successfully'
  });
}));

// @route   POST /api/users/:id/reset-password
// @desc    Reset user password (admin only)
// @access  Private/Admin
router.post('/:id/reset-password', authenticateToken, authorizeAdmin, asyncHandler(async (req, res) => {
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long' });
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  user.password = newPassword;
  user.clearPasswordResetToken();
  await user.save();

  res.json({
    success: true,
    message: 'Password reset successfully'
  });
}));

// @route   GET /api/users/dashboard
// @desc    Get user dashboard data
// @access  Private
router.get('/dashboard', authenticateToken, asyncHandler(async (req, res) => {
  // Get recent tasks
  const recentTasks = await Task.find({ user: req.user.id })
    .sort({ updatedAt: -1 })
    .limit(5)
    .select('title status priority dueDate');

  // Get overdue tasks
  const overdueTasks = await Task.find({
    user: req.user.id,
    dueDate: { $lt: new Date() },
    status: { $nin: ['completed', 'cancelled'] }
  }).select('title dueDate priority');

  // Get upcoming tasks (due in next 7 days)
  const upcomingTasks = await Task.find({
    user: req.user.id,
    dueDate: {
      $gte: new Date(),
      $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    },
    status: { $nin: ['completed', 'cancelled'] }
  }).select('title dueDate priority');

  // Get task statistics
  const taskStats = await Task.aggregate([
    { $match: { user: req.user.id } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] } }
      }
    }
  ]);

  res.json({
    success: true,
    dashboard: {
      recentTasks,
      overdueTasks,
      upcomingTasks,
      stats: taskStats[0] || {
        total: 0,
        completed: 0,
        pending: 0,
        inProgress: 0
      }
    }
  });
}));

module.exports = router; 