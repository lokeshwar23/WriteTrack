import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';


const CreatePost = ({ onPostCreated, inlineMode }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const postData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };

      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/posts`,
        postData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (inlineMode && typeof onPostCreated === 'function') {
        onPostCreated();
      } else {
        navigate(`/post/${res.data.post._id}`);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Error creating post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <div className="modal-content" style={{ maxWidth: 600, margin: '2rem auto', overflowY: 'auto', maxHeight: '90vh', padding: '2rem' }}>
        <h2 className="form-title" style={{ marginBottom: 24 }}>Create New Post</h2>
        <p style={{ marginBottom: 24 }}>Share your thoughts with the community</p>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 16 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="post-form">
          <div className="form-group">
            <label className="form-label" htmlFor="title">Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="Enter your post title"
              className="form-input"
            />
          </div>


          <div className="form-group">
            <label className="form-label" htmlFor="content">Content *</label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              required
              placeholder="Write your post content here..."
              className="form-input form-textarea"
              rows="10"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="tags">Tags</label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="Enter tags separated by commas (e.g., technology, web development, react)"
              className="form-input"
            />
            <small>Separate tags with commas</small>
          </div>

          <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: 16, marginTop: 32 }}>
            <button
              type="button"
              onClick={() => (inlineMode && typeof onPostCreated === 'function' ? onPostCreated() : navigate('/blog'))}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Publishing...' : 'Publish Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePost; 