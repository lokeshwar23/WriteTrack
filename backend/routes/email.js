const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Task = require('../models/Task');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');
const { sendEmail, sendBulkEmails, sendTaskReminders } = require('../utils/emailService');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Validation middleware
const validateEmailRequest = [
  body('to')
    .isEmail()
    .withMessage('Valid email address is required'),
  body('subject')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Subject must be between 1 and 200 characters'),
  body('template')
    .isIn(['emailVerification', 'passwordReset', 'otpCode', 'taskAssigned', 'taskReminder'])
    .withMessage('Invalid email template'),
];

const validateBulkEmailRequest = [
  body('recipients')
    .isArray({ min: 1 })
    .withMessage('Recipients must be an array with at least one email'),
  body('recipients.*')
    .isEmail()
    .withMessage('Each recipient must be a valid email address'),
  body('subject')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Subject must be between 1 and 200 characters'),
  body('template')
    .isIn(['emailVerification', 'passwordReset', 'otpCode', 'taskAssigned', 'taskReminder'])
    .withMessage('Invalid email template'),
];

// @route   POST /api/email/send
// @desc    Send a single email
// @access  Private/Admin
router.post('/send', authenticateToken, authorizeAdmin, validateEmailRequest, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { to, subject, template, data } = req.body;

  const result = await sendEmail({
    to,
    subject,
    template,
    data: data || {}
  });

  if (result.success) {
    res.json({
      success: true,
      message: 'Email sent successfully',
      messageId: result.messageId
    });
  } else {
    res.status(500).json({
      success: false,
      message: 'Failed to send email',
      error: result.error
    });
  }
}));

// @route   POST /api/email/bulk
// @desc    Send bulk emails
// @access  Private/Admin
router.post('/bulk', authenticateToken, authorizeAdmin, validateBulkEmailRequest, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { recipients, subject, template, data } = req.body;

  const emails = recipients.map(email => ({
    to: email,
    subject,
    template,
    data: data || {}
  }));

  const results = await sendBulkEmails(emails);

  const successful = results.filter(result => result.success).length;
  const failed = results.filter(result => !result.success).length;

  res.json({
    success: true,
    message: `Bulk email completed. ${successful} sent, ${failed} failed`,
    results: {
      total: recipients.length,
      successful,
      failed,
      details: results
    }
  });
}));

// @route   POST /api/email/task-reminders
// @desc    Send task reminders to users
// @access  Private/Admin
router.post('/task-reminders', authenticateToken, authorizeAdmin, asyncHandler(async (req, res) => {
  const { daysAhead = 1 } = req.body;

  // Find tasks due in the specified number of days
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + parseInt(daysAhead));

  const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59);

  const tasks = await Task.find({
    dueDate: { $gte: startOfDay, $lte: endOfDay },
    status: { $nin: ['completed', 'cancelled'] }
  }).populate('user', 'name email preferences');

  const results = await sendTaskReminders(tasks);

  const successful = results.filter(result => result.success).length;
  const failed = results.filter(result => !result.success).length;

  res.json({
    success: true,
    message: `Task reminders sent. ${successful} successful, ${failed} failed`,
    results: {
      totalTasks: tasks.length,
      successful,
      failed,
      details: results
    }
  });
}));

// @route   POST /api/email/overdue-notifications
// @desc    Send overdue task notifications
// @access  Private/Admin
router.post('/overdue-notifications', authenticateToken, authorizeAdmin, asyncHandler(async (req, res) => {
  // Find overdue tasks
  const overdueTasks = await Task.find({
    dueDate: { $lt: new Date() },
    status: { $nin: ['completed', 'cancelled'] }
  }).populate('user', 'name email preferences');

  const emails = [];

  for (const task of overdueTasks) {
    if (task.user && task.user.preferences.notifications.email) {
      emails.push({
        to: task.user.email,
        subject: 'Overdue Task Notification',
        template: 'taskReminder',
        data: {
          name: task.user.name,
          taskTitle: task.title,
          dueDate: task.dueDate.toLocaleDateString(),
          priority: task.priority,
          category: task.category
        }
      });
    }
  }

  const results = await sendBulkEmails(emails);

  const successful = results.filter(result => result.success).length;
  const failed = results.filter(result => !result.success).length;

  res.json({
    success: true,
    message: `Overdue notifications sent. ${successful} successful, ${failed} failed`,
    results: {
      totalTasks: overdueTasks.length,
      emailsSent: emails.length,
      successful,
      failed,
      details: results
    }
  });
}));

// @route   POST /api/email/welcome-series
// @desc    Send welcome email series to new users
// @access  Private/Admin
router.post('/welcome-series', authenticateToken, authorizeAdmin, asyncHandler(async (req, res) => {
  const { daysSinceRegistration = 1 } = req.body;

  // Find users who registered in the last specified days
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - parseInt(daysSinceRegistration));

  const newUsers = await User.find({
    createdAt: { $gte: cutoffDate },
    isVerified: true
  });

  const emails = newUsers.map(user => ({
    to: user.email,
    subject: 'Welcome to Task Manager!',
    template: 'emailVerification', // Using existing template for welcome
    data: {
      name: user.name,
      verificationUrl: `${process.env.CLIENT_URL}/dashboard`
    }
  }));

  const results = await sendBulkEmails(emails);

  const successful = results.filter(result => result.success).length;
  const failed = results.filter(result => !result.success).length;

  res.json({
    success: true,
    message: `Welcome emails sent. ${successful} successful, ${failed} failed`,
    results: {
      totalUsers: newUsers.length,
      successful,
      failed,
      details: results
    }
  });
}));

// @route   GET /api/email/templates
// @desc    Get available email templates
// @access  Private/Admin
router.get('/templates', authenticateToken, authorizeAdmin, asyncHandler(async (req, res) => {
  const templates = [
    {
      id: 'emailVerification',
      name: 'Email Verification',
      subject: 'Verify Your Email Address',
      description: 'Sent when users register to verify their email address',
      variables: ['name', 'verificationUrl']
    },
    {
      id: 'passwordReset',
      name: 'Password Reset',
      subject: 'Password Reset Request',
      description: 'Sent when users request a password reset',
      variables: ['name', 'resetUrl']
    },
    {
      id: 'otpCode',
      name: 'OTP Code',
      subject: 'Your OTP Code',
      description: 'Sent for two-factor authentication',
      variables: ['name', 'otp']
    },
    {
      id: 'taskAssigned',
      name: 'Task Assigned',
      subject: 'New Task Assigned',
      description: 'Sent when a task is assigned to a user',
      variables: ['name', 'taskTitle', 'assignedBy']
    },
    {
      id: 'taskReminder',
      name: 'Task Reminder',
      subject: 'Task Reminder',
      description: 'Sent as a reminder for upcoming or overdue tasks',
      variables: ['name', 'taskTitle', 'dueDate', 'priority', 'category']
    }
  ];

  res.json({
    success: true,
    templates
  });
}));

// @route   GET /api/email/stats
// @desc    Get email statistics
// @access  Private/Admin
router.get('/stats', authenticateToken, authorizeAdmin, asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments();
  const verifiedUsers = await User.countDocuments({ isVerified: true });
  const usersWithEmailNotifications = await User.countDocuments({
    'preferences.notifications.email': true
  });

  const totalTasks = await Task.countDocuments();
  const overdueTasks = await Task.countDocuments({
    dueDate: { $lt: new Date() },
    status: { $nin: ['completed', 'cancelled'] }
  });

  const upcomingTasks = await Task.countDocuments({
    dueDate: {
      $gte: new Date(),
      $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    },
    status: { $nin: ['completed', 'cancelled'] }
  });

  res.json({
    success: true,
    stats: {
      users: {
        total: totalUsers,
        verified: verifiedUsers,
        withEmailNotifications: usersWithEmailNotifications
      },
      tasks: {
        total: totalTasks,
        overdue: overdueTasks,
        upcoming: upcomingTasks
      }
    }
  });
}));

// @route   POST /api/email/test
// @desc    Send test email
// @access  Private/Admin
router.post('/test', authenticateToken, authorizeAdmin, asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email address is required' });
  }

  const result = await sendEmail({
    to: email,
    subject: 'Test Email from Task Manager',
    template: 'emailVerification',
    data: {
      name: 'Test User',
      verificationUrl: 'https://example.com/test'
    }
  });

  if (result.success) {
    res.json({
      success: true,
      message: 'Test email sent successfully',
      messageId: result.messageId
    });
  } else {
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: result.error
    });
  }
}));

// @route   PUT /api/email/preferences
// @desc    Update user email preferences
// @access  Private
router.put('/preferences', authenticateToken, asyncHandler(async (req, res) => {
  const { emailNotifications, pushNotifications } = req.body;

  const user = await User.findById(req.user.id);

  if (emailNotifications !== undefined) {
    user.preferences.notifications.email = emailNotifications;
  }

  if (pushNotifications !== undefined) {
    user.preferences.notifications.push = pushNotifications;
  }

  await user.save();

  res.json({
    success: true,
    message: 'Email preferences updated successfully',
    preferences: user.preferences.notifications
  });
}));

module.exports = router; 