const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const Post = require('../models/Post');

// @desc    Get all posts with pagination
// @route   GET /api/posts
// @access  Public
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find({})
      .populate('author', 'name avatar profile.bio')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments({});
    const pages = Math.ceil(total / limit);

    res.json({
      success: true,
      posts,
      pagination: {
        page,
        pages,
        total,
        limit
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// @desc    Get user's posts
// @route   GET /api/posts/user/me
// @access  Private
router.get('/user/me', authenticateToken, async (req, res) => {
  try {
    const posts = await Post.find({ author: req.user.id })
      .populate('author', 'name avatar profile.bio')
      .sort({ createdAt: -1 });

    const totalPosts = posts.length;

    res.json({
      success: true,
      posts,
      stats: {
        totalPosts
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// @desc    Get single post
// @route   GET /api/posts/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'name avatar profile.bio');

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }


    res.json({
      success: true,
      post
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// @desc    Create post
// @route   POST /api/posts
// @access  Private
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, content, tags } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: 'Title and content are required'
      });
    }

    // Ensure tags is always an array
    let tagsArray = [];
    if (Array.isArray(tags)) {
      tagsArray = tags;
    } else if (typeof tags === 'string') {
      tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    }

    const post = new Post({
      title,
      content,
      tags: tagsArray,
      author: req.user.id
    });

    await post.save();

    await post.populate('author', 'name avatar profile.bio');

    res.status(201).json({
      success: true,
      post
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server Error'
    });
  }
});

// @desc    Update post
// @route   PUT /api/posts/:id
// @access  Private
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    // Check if user is the author
    if (post.author.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized'
      });
    }

    const { title, content, tags } = req.body;

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      {
        title: title || post.title,
        content: content || post.content,
        tags: tags || post.tags,
        updatedAt: Date.now()
      },
      { new: true }
    ).populate('author', 'name avatar profile.bio');

    res.json({
      success: true,
      post: updatedPost
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    // Check if user is the author
    if (post.author.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized'
      });
    }

    await Post.findByIdAndDelete(post._id);

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});


module.exports = router; 