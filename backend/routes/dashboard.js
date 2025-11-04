const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const Task = require('../models/Task');
const Post = require('../models/Post');

router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    // Get counts for tasks
    const totalTasks = await Task.countDocuments({ user: userId });
    const completedTasks = await Task.countDocuments({ user: userId, status: 'completed' });
    const pendingTasks = await Task.countDocuments({ user: userId, status: 'pending' });
    // Get posts and calculate post-related stats
    const posts = await Post.find({ author: userId });
    const totalPosts = posts.length;
    const totalContent = totalPosts + totalTasks;
    res.json({
      totalPosts,
      totalTasks,
      completedTasks,
      pendingTasks,
      totalContent
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// Get recent tasks for the current user
router.get('/recent-tasks', authenticateToken, async (req, res) => {
  try {
    const recentTasks = await Task.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(5);
    res.json({ success: true, tasks: recentTasks });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch recent tasks' });
  }
});

module.exports = router; 