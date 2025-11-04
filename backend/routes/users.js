const express = require('express');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users (for task assignment)
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const User = require('../models/User');
    const users = await User.find({}, 'name email avatar'); // Only return needed fields
    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error while fetching users' });
  }
});


module.exports = router; 