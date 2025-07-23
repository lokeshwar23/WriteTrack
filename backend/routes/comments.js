const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const Comment = require('../models/Comment');
const Post = require('../models/Post');

// @desc    Get comments for a post
// @route   GET /api/comments/post/:postId
// @access  Public
router.get('/post/:postId', async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.postId })
      .populate('author', 'name avatar')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      comments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// @desc    Create comment
// @route   POST /api/comments
// @access  Private
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { content, postId } = req.body;

    if (!content || !postId) {
      return res.status(400).json({
        success: false,
        error: 'Content and post ID are required'
      });
    }

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    const comment = new Comment({
      content,
      post: postId,
      author: req.user.id
    });

    await comment.save();

    // Add comment to post
    post.comments.push(comment._id);
    await post.save();

    await comment.populate('author', 'name avatar');

    res.status(201).json({
      success: true,
      comment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// @desc    Update comment
// @route   PUT /api/comments/:id
// @access  Private
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
    }

    // Check if user is the author
    if (comment.author.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized'
      });
    }

    const { content } = req.body;

    const updatedComment = await Comment.findByIdAndUpdate(
      req.params.id,
      {
        content,
        updatedAt: Date.now()
      },
      { new: true }
    ).populate('author', 'name avatar');

    res.json({
      success: true,
      comment: updatedComment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// @desc    Delete comment
// @route   DELETE /api/comments/:id
// @access  Private
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
    }

    // Check if user is the author
    if (comment.author.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized'
      });
    }

    // Remove comment from post
    await Post.findByIdAndUpdate(comment.post, {
      $pull: { comments: comment._id }
    });

    await Comment.findByIdAndDelete(comment._id);

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// @desc    Toggle like on comment
// @route   POST /api/comments/:id/like
// @access  Private
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
    }

    const likeIndex = comment.likes.indexOf(req.user.id);

    if (likeIndex > -1) {
      // Unlike
      comment.likes.splice(likeIndex, 1);
    } else {
      // Like
      comment.likes.push(req.user.id);
    }

    await comment.save();

    res.json({
      success: true,
      isLiked: likeIndex === -1,
      likes: comment.likes.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

module.exports = router; 