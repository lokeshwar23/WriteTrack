import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { postsAPI } from '../../services/api';
import Loading from '../Common/Loading';
import CreatePost from './CreatePost';
import { useAuth } from '../../contexts/AuthContext';
import { IonIcon } from '@ionic/react';
import { createOutline } from 'ionicons/icons';

const PostList = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUserPosts();
    } else if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, user, navigate]);

  const fetchUserPosts = async () => {
    try {
      setLoading(true);
      const res = await postsAPI.getUserPosts();
      setPosts(res.data.posts);
      setPagination({ pages: 1, page: 1, total: res.data.posts.length, limit: res.data.posts.length });
    } catch (error) {
      console.error('Error fetching user posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostCreated = () => {
    setShowCreate(false);
    fetchUserPosts();
  };



  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  if (loading && posts.length === 0) {
    return <Loading />;
  }

  return (
    <div className="container posts-page">
      <div className="posts-header">
        <h2>Latest Blog Posts</h2>
        <p>Discover amazing stories and insights from our community</p>
        {isAuthenticated && (
          <div style={{ display: 'flex', justifyContent: 'center', margin: '2rem 0 1rem 0' }}>
            <button
              className="add-post-beautiful-btn"
              onClick={() => setShowCreate(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: 'linear-gradient(90deg, #6366f1 0%, #60a5fa 100%)',
                color: '#fff',
                fontWeight: 600,
                fontSize: 20,
                border: 'none',
                borderRadius: 12,
                padding: '0.75rem 2.5rem',
                boxShadow: '0 2px 12px rgba(99,102,241,0.12)',
                cursor: 'pointer',
                transition: 'background 0.2s, box-shadow 0.2s',
              }}
              onMouseOver={e => e.currentTarget.style.background = 'linear-gradient(90deg, #4f46e5 0%, #2563eb 100%)'}
              onMouseOut={e => e.currentTarget.style.background = 'linear-gradient(90deg, #6366f1 0%, #60a5fa 100%)'}
            >
              <span style={{ fontSize: 26, fontWeight: 700, marginRight: 4, display: 'flex', alignItems: 'center' }}>+</span>
              Add Post
            </button>
          </div>
        )}
      </div>

      {/* Modal for Add Post */}
      {showCreate && isAuthenticated && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal-content" style={{ maxWidth: 600, margin: '5% auto' }}>
            <button className="btn btn-secondary" style={{ float: 'right' }} onClick={() => setShowCreate(false)}>
              Close
            </button>
            <CreatePost onPostCreated={handlePostCreated} inlineMode />
          </div>
        </div>
      )}

      {posts.length === 0 ? (
        <div className="no-posts">
          <h3>No posts found</h3>
          <p>Be the first to create a post!</p>
        </div>
      ) : (
        <>
          <div className="posts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginTop: '2rem' }}>
            {posts.map(post => (
              <article key={post._id} className="post-card" style={{ background: '#fff', borderRadius: '1rem', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', padding: '2rem', display: 'flex', flexDirection: 'column', minHeight: 260 }}>
                <div className="post-meta" style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                  {post.author.avatar && (
                    <img 
                      src={post.author.avatar}
                      alt={post.author.name}
                      className="avatar-small"
                      style={{ width: 36, height: 36, borderRadius: '50%', marginRight: 12 }}
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    <span className="author" style={{ fontWeight: 600 }}>{post.author.name}</span>
                    <span className="date" style={{ color: '#888', marginLeft: 12 }}>{new Date(post.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                  {/* Edit button for author */}
                  {isAuthenticated && user && post.author._id === user.id && (
                    <Link to={`/edit/${post._id}`} className="btn btn-sm btn-secondary" style={{ marginLeft: 8 }}>
                      <IonIcon icon={createOutline} style={{ fontSize: '16px' }} />
                    </Link>
                  )}
                </div>
                <h3 className="post-title" style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>
                  <Link to={`/post/${post._id}`}>{post.title}</Link>
                </h3>
                <p className="post-excerpt" style={{ color: '#444', marginBottom: 16 }}>{post.excerpt}</p>
                <div style={{ flex: 1 }} />
                <div className="post-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: 12 }}>
                  {post.tags.length > 0 && (
                    <div className="post-tags" style={{ display: 'flex', gap: 6 }}>
                      {post.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="tag" style={{ background: '#f3f4f6', color: '#555', borderRadius: 8, padding: '2px 10px', fontSize: 13 }}>#{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="pagination">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="btn btn-outline"
              >
                Previous
              </button>
              
              <span className="page-info">
                Page {currentPage} of {pagination.pages}
              </span>
              
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.pages))}
                disabled={currentPage === pagination.pages}
                className="btn btn-outline"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PostList; 