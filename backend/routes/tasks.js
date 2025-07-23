const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Task = require('../models/Task');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const { uploadTaskFiles } = require('../middleware/upload');
const { sendEmail } = require('../utils/emailService');

const router = express.Router();

// Validation middleware
const validateTask = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority level'),
  body('category')
    .optional()
    .isIn(['work', 'personal', 'health', 'finance', 'education', 'shopping', 'other'])
    .withMessage('Invalid category'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Each tag cannot exceed 20 characters'),
];

const validateSubtask = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Subtask title must be between 1 and 100 characters'),
];

const validateComment = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Comment must be between 1 and 500 characters'),
];

// @route   GET /api/tasks
// @desc    Get all tasks for current user with filtering and pagination
// @access  Private
router.get('/', authenticateToken, [
  query('status').optional().isIn(['pending', 'in-progress', 'completed', 'cancelled']),
  query('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  query('category').optional().isIn(['work', 'personal', 'health', 'finance', 'education', 'shopping', 'other']),
  query('search').optional().trim(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('sortBy').optional().isIn(['createdAt', 'dueDate', 'priority', 'title']),
  query('sortOrder').optional().isIn(['asc', 'desc']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      status,
      priority,
      category,
      search,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { user: req.user.id, archived: false };

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;

    // Search functionality
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const tasks = await Task.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('assignedTo', 'name email avatar');

    // Get total count for pagination
    const total = await Task.countDocuments(filter);

    res.json({
      tasks,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalTasks: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Server error while fetching tasks' });
  }
});

// @route   GET /api/tasks/:id
// @desc    Get single task by ID
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('user', 'name email avatar')
      .populate('assignedTo', 'name email avatar')
      .populate('comments.user', 'name email avatar');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user owns the task or is assigned to it
    if (task.user._id.toString() !== req.user.id && 
        !task.assignedTo.some(user => user._id.toString() === req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ task });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ message: 'Server error while fetching task' });
  }
});

// @route   POST /api/tasks
// @desc    Create a new task
// @access  Private
router.post('/', authenticateToken, validateTask, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      description,
      priority,
      category,
      dueDate,
      tags,
      assignedTo,
      subtasks,
      estimatedHours,
      isPublic
    } = req.body;

    // Create task
    const task = new Task({
      title,
      description,
      priority,
      category,
      dueDate: dueDate ? new Date(dueDate) : null,
      tags,
      user: req.user.id,
      assignedTo,
      subtasks: subtasks || [],
      timeTracking: {
        estimatedHours: estimatedHours || 0
      },
      isPublic: isPublic || false
    });

    await task.save();

    // Populate user and assigned users
    await task.populate('user', 'name email avatar');
    await task.populate('assignedTo', 'name email avatar');

    // Removed notification-sending logic here

    res.status(201).json({
      message: 'Task created successfully',
      task
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Server error while creating task' });
  }
});

// @route   PUT /api/tasks/:id
// @desc    Update a task
// @access  Private
router.put('/:id', authenticateToken, validateTask, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check ownership
    if (task.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const {
      title,
      description,
      status,
      priority,
      category,
      dueDate,
      tags,
      assignedTo,
      estimatedHours,
      isPublic
    } = req.body;

    // Update fields
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = priority;
    if (category !== undefined) task.category = category;
    if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : null;
    if (tags !== undefined) task.tags = tags;
    if (assignedTo !== undefined) task.assignedTo = assignedTo;
    if (estimatedHours !== undefined) task.timeTracking.estimatedHours = estimatedHours;
    if (isPublic !== undefined) task.isPublic = isPublic;

    // Handle completion
    if (status === 'completed' && task.status !== 'completed') {
      task.completedAt = new Date();
      task.progress = 100;
    } else if (status !== 'completed' && task.status === 'completed') {
      task.completedAt = null;
    }

    await task.save();

    // Populate user and assigned users
    await task.populate('user', 'name email avatar');
    await task.populate('assignedTo', 'name email avatar');

    res.json({
      message: 'Task updated successfully',
      task
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Server error while updating task' });
  }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete a task
// @access  Private
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check ownership
    if (task.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Task.findByIdAndDelete(req.params.id);

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Server error while deleting task' });
  }
});

// @route   POST /api/tasks/:id/subtasks
// @desc    Add subtask to a task
// @access  Private
router.post('/:id/subtasks', authenticateToken, validateSubtask, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check ownership
    if (task.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { title } = req.body;
    task.subtasks.push({ title });
    await task.save();

    res.status(201).json({
      message: 'Subtask added successfully',
      subtask: task.subtasks[task.subtasks.length - 1]
    });
  } catch (error) {
    console.error('Add subtask error:', error);
    res.status(500).json({ message: 'Server error while adding subtask' });
  }
});

// @route   PUT /api/tasks/:id/subtasks/:subtaskId
// @desc    Update subtask
// @access  Private
router.put('/:id/subtasks/:subtaskId', authenticateToken, validateSubtask, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check ownership
    if (task.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const subtask = task.subtasks.id(req.params.subtaskId);
    if (!subtask) {
      return res.status(404).json({ message: 'Subtask not found' });
    }

    const { title, completed } = req.body;
    if (title !== undefined) subtask.title = title;
    if (completed !== undefined) {
      subtask.completed = completed;
      subtask.completedAt = completed ? new Date() : null;
    }

    await task.save();

    res.json({
      message: 'Subtask updated successfully',
      subtask
    });
  } catch (error) {
    console.error('Update subtask error:', error);
    res.status(500).json({ message: 'Server error while updating subtask' });
  }
});

// @route   DELETE /api/tasks/:id/subtasks/:subtaskId
// @desc    Delete subtask
// @access  Private
router.delete('/:id/subtasks/:subtaskId', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check ownership
    if (task.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const subtask = task.subtasks.id(req.params.subtaskId);
    if (!subtask) {
      return res.status(404).json({ message: 'Subtask not found' });
    }

    subtask.remove();
    await task.save();

    res.json({ message: 'Subtask deleted successfully' });
  } catch (error) {
    console.error('Delete subtask error:', error);
    res.status(500).json({ message: 'Server error while deleting subtask' });
  }
});

// @route   POST /api/tasks/:id/comments
// @desc    Add comment to a task
// @access  Private
router.post('/:id/comments', authenticateToken, validateComment, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user owns the task or is assigned to it
    if (task.user.toString() !== req.user.id && 
        !task.assignedTo.some(userId => userId.toString() === req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { content } = req.body;
    task.comments.push({
      user: req.user.id,
      content
    });

    await task.save();
    await task.populate('comments.user', 'name email avatar');

    const newComment = task.comments[task.comments.length - 1];

    res.status(201).json({
      message: 'Comment added successfully',
      comment: newComment
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Server error while adding comment' });
  }
});

// @route   POST /api/tasks/:id/upload
// @desc    Upload files to a task
// @access  Private
router.post('/:id/upload', authenticateToken, uploadTaskFiles.array('files', 5), async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check ownership
    if (task.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const uploadedFiles = [];
    for (const file of req.files) {
      const attachment = {
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url: `/uploads/${file.filename}`,
        uploadedAt: new Date()
      };

      task.attachments.push(attachment);
      uploadedFiles.push(attachment);
    }

    await task.save();

    res.status(201).json({
      message: 'Files uploaded successfully',
      attachments: uploadedFiles
    });
  } catch (error) {
    console.error('Upload files error:', error);
    res.status(500).json({ message: 'Server error while uploading files' });
  }
});

// @route   POST /api/tasks/:id/start-tracking
// @desc    Start time tracking for a task
// @access  Private
router.post('/:id/start-tracking', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check ownership
    if (task.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { description } = req.body;
    await task.startTimeTracking(description);

    res.json({
      message: 'Time tracking started successfully',
      currentEntry: task.timeTracking.timeEntries[task.timeTracking.timeEntries.length - 1]
    });
  } catch (error) {
    console.error('Start time tracking error:', error);
    res.status(500).json({ message: 'Server error while starting time tracking' });
  }
});

// @route   POST /api/tasks/:id/stop-tracking
// @desc    Stop time tracking for a task
// @access  Private
router.post('/:id/stop-tracking', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check ownership
    if (task.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await task.stopTimeTracking();

    res.json({
      message: 'Time tracking stopped successfully',
      totalHours: task.timeTracking.actualHours
    });
  } catch (error) {
    console.error('Stop time tracking error:', error);
    res.status(500).json({ message: 'Server error while stopping time tracking' });
  }
});

// @route   POST /api/tasks/:id/complete
// @desc    Mark task as completed
// @access  Private
router.post('/:id/complete', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check ownership
    if (task.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await task.markAsCompleted();

    res.json({
      message: 'Task marked as completed successfully',
      task
    });
  } catch (error) {
    console.error('Complete task error:', error);
    res.status(500).json({ message: 'Server error while completing task' });
  }
});

// @route   GET /api/tasks/stats/overview
// @desc    Get task statistics overview
// @access  Private
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const stats = await Task.aggregate([
      { $match: { user: req.user.id, archived: false } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] } },
          overdue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$status', 'completed'] },
                    { $lt: ['$dueDate', new Date()] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    const priorityStats = await Task.aggregate([
      { $match: { user: req.user.id, archived: false } },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    const categoryStats = await Task.aggregate([
      { $match: { user: req.user.id, archived: false } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      overview: stats[0] || {
        total: 0,
        completed: 0,
        pending: 0,
        inProgress: 0,
        overdue: 0
      },
      byPriority: priorityStats,
      byCategory: categoryStats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error while fetching statistics' });
  }
});

// @route   GET /api/tasks/search
// @desc    Search tasks
// @access  Private
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const skip = (page - 1) * limit;
    const searchTerm = q.trim();

    const tasks = await Task.find({
      user: req.user.id,
      archived: false,
      $or: [
        { title: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { tags: { $in: [new RegExp(searchTerm, 'i')] } }
      ]
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate('assignedTo', 'name email avatar');

    const total = await Task.countDocuments({
      user: req.user.id,
      archived: false,
      $or: [
        { title: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { tags: { $in: [new RegExp(searchTerm, 'i')] } }
      ]
    });

    res.json({
      tasks,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalTasks: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Search tasks error:', error);
    res.status(500).json({ message: 'Server error while searching tasks' });
  }
});

module.exports = router; 