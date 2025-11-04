import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import Loading from '../Common/Loading';


const PostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPost();
    } else {
      navigate('/login');
    }
  }, [id, isAuthenticated, navigate]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/posts/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPost(res.data.post);
    } catch (error) {
      console.error('Error fetching post:', error);
      if (error.response?.status === 404) {
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };


  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/posts/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        navigate('/');
      } catch (error) {
        console.error('Error deleting post:', error);
        alert('Error deleting post');
      }
    }
  };


  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  if (loading) {
    return <Loading />;
  }

  if (!post) {
    return (
      <div className="container">
        <div className="error-message">
          <h2>Post not found</h2>
          <Link to="/" className="btn btn-primary">Back to Home</Link>
        </div>
      </div>
    );
  }

  const isAuthor = user && user.id === post.author._id;

  return (
    <div className="container">
      <article className="post-detail">
        <header className="post-header">
          <h1 className="post-title">{post.title}</h1>
          
          <div className="post-meta-detailed">
            <div className="author-info">
              {post.author.avatar && (
                <img 
                  src={post.author.avatar}
                  alt={post.author.name}
                  className="avatar-medium"
                />
              )}
              <div>
                <h4>{post.author.name}</h4>
                {post.author.bio && <p className="author-bio">{post.author.bio}</p>}
                <span className="publish-date">
                  Published on {new Date(post.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
            
            {isAuthenticated && isAuthor && (
              <div className="post-actions">
                <Link
                  to={`/edit/${post._id}`}
                  className="btn btn-outline btn-sm"
                >
                  Edit
                </Link>
                <button
                  onClick={handleDelete}
                  className="btn btn-danger btn-sm"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="post-content-body">
          {post.content.split('\n').map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>

        <footer className="post-footer-detailed">
          {post.tags.length > 0 && (
            <div className="post-tags-detailed">
              <strong>Tags: </strong>
              {post.tags.map(tag => (
                <span key={tag} className="tag">#{tag}</span>
              ))}
            </div>
          )}
        </footer>
      </article>

      <div className="back-link">
        <Link to="/" className="btn btn-outline">← Back to Posts</Link>
      </div>
    </div>
  );
};

export default PostDetail; 