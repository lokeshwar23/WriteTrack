import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import Loading from '../Common/Loading';


const EditPost = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchPost();
  }, [id, isAuthenticated, navigate]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/posts/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const post = response.data.post;
      
      // Check if user is the author (use frontend user context)
      if (user && post.author._id !== user.id) {
        navigate('/');
        return;
      }

      setFormData({
        title: post.title,
        content: post.content,
        tags: post.tags.join(', ')
      });
    } catch (error) {
      console.error('Error fetching post:', error);
      if (error.response?.status === 404) {
        navigate('/');
      } else {
        setError('Error loading post');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const postData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };

      const token = localStorage.getItem('token');
      const res = await axios.put(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/posts/${id}`,
        postData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      navigate(`/post/${res.data.post._id}`);
    } catch (error) {
      setError(error.response?.data?.message || 'Error updating post');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <div className="modal-content" style={{ maxWidth: 600, margin: '2rem auto', overflowY: 'auto', maxHeight: '90vh', padding: '2rem' }}>
        <h2 className="form-title" style={{ marginBottom: 24 }}>Edit Post</h2>
        <p style={{ marginBottom: 24 }}>Update your post content</p>

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
              onClick={() => navigate(`/post/${id}`)}
              className="btn btn-secondary"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? 'Updating...' : 'Update Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPost; 