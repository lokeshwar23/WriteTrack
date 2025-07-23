import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { dashboardAPI } from '../../services/api';
import { postsAPI, tasksAPI } from '../../services/api';
import '../../styles/Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    totalLikes: 0,
    totalViews: 0,
    totalComments: 0,
    totalContent: 0
  });
  const [recentPosts, setRecentPosts] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);
  const [recentUpdates, setRecentUpdates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch stats
      const statsResponse = await dashboardAPI.getStats();
      setStats(statsResponse.data);

      // Fetch recent posts (limit 5, sorted by createdAt desc)
      const postsResponse = await postsAPI.getUserPosts();
      setRecentPosts(postsResponse.data.posts.slice(0, 5) || []);

      // Fetch recent tasks (limit 5, sorted by createdAt desc)
      const tasksResponse = await tasksAPI.getTasks({
        limit: 5,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      setRecentTasks(tasksResponse.data.tasks || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-card">
          <h2>Please Login</h2>
          <p>You need to be logged in to view your dashboard.</p>
          <Link to="/login" className="btn btn-primary">
            Login
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Hey, {user.name}!</h1>
        <p>Here's what's happening with your account.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <h3>{stats.totalPosts ?? 0}</h3>
            <p>Total Posts</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <h3>{stats.totalTasks ?? 0}</h3>
            <p>Total Tasks</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.completedTasks ?? 0}</h3>
            <p>Completed Tasks</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>{stats.pendingTasks ?? 0}</h3>
            <p>Pending Tasks</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">❤️</div>
          <div className="stat-content">
            <h3>{stats.totalLikes ?? 0}</h3>
            <p>Total Likes</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👁️</div>
          <div className="stat-content">
            <h3>{stats.totalViews ?? 0}</h3>
            <p>Total Views</p>
          </div>
        </div>

        

        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>{stats.totalContent ?? 0}</h3>
            <p>Total Content</p>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="content-section">
          <div className="section-header">
            <h2>Recent Posts</h2>
            <Link to="/blog" className="btn btn-secondary">
              View All
            </Link>
          </div>
          
          <div className="posts-list">
            {recentPosts.length === 0 ? (
              <div className="no-content">
                <p>No posts found. Start writing your first blog post!</p>
                <Link to="/" className="btn btn-primary">
                  Create Post
                </Link>
              </div>
            ) : (
              recentPosts.map(post => (
                <div key={post._id} className="post-item">
                  <div className="post-info">
                    <h4>{post.title}</h4>
                    <div className="post-meta">
                      <span>👁️ {post.views || 0} views</span>
                      <span>❤️ {post.likes ? post.likes.length : 0} likes</span>
                      <span>📅 {new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Link to={`/post/${post._id}`} className="btn btn-sm">
                    View
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="content-section">
          <div className="section-header">
            <h2>Recent Tasks</h2>
            <Link to="/tasks" className="btn btn-secondary">
              View All
            </Link>
          </div>
          
          <div className="tasks-list">
            {recentTasks.length === 0 ? (
              <div className="no-content">
                <p>No tasks found. Start organizing your work!</p>
                <Link to="/tasks" className="btn btn-primary">
                  Create Task
                </Link>
              </div>
            ) : (
              recentTasks.slice(0, 5).map(task => (
                <div key={task._id} className={`task-item ${task.status}`}>
                  <div className="task-info">
                    <h4>{task.title}</h4>
                    <div className="task-meta">
                      <span className={`status ${task.status}`}>
                        {task.status === 'completed' ? '✅' : '⏳'} {task.status}
                      </span>
                      <span className={`priority ${task.priority}`}>
                        {task.priority}
                      </span>
                      <span>📅 {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}</span>
                    </div>
                  </div>
                  <Link to={`/tasks`} className="btn btn-sm">
                    View
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Updates Section */}
      <div className="content-section full-width">
        <div className="section-header">
          <h2>Recent Updates</h2>
          <span className="update-count">{recentUpdates.length} activities</span>
        </div>
        
        <div className="updates-timeline">
          {recentUpdates.length === 0 ? (
            <div className="no-content">
              <p>No recent activity. Start creating content to see updates here!</p>
            </div>
          ) : (
            recentUpdates.map((update, index) => (
              <div key={update.id} className={`update-item ${update.type}`}>
                <div className="update-icon">
                  {update.icon}
                </div>
                <div className="update-content">
                  <div className="update-header">
                    <h4>{update.title}</h4>
                    <span className="update-time">
                      {update.timestamp.toLocaleDateString()} at {update.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  <p className="update-action">
                    {update.type === 'post' ? '📝 New post created' : 
                     update.status === 'completed' ? '✅ Task completed' : '📋 Task updated'}
                  </p>
                  <Link to={update.link} className="btn btn-sm">
                    View {update.type}
                  </Link>
                </div>
                {index < recentUpdates.length - 1 && <div className="timeline-connector"></div>}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="actions-grid">
          <Link to="/create" className="action-card">
            <div className="action-icon">✏️</div>
            <h4>Create Post</h4>
            <p>Write a new blog post</p>
          </Link>

          <Link to="/tasks" className="action-card">
            <div className="action-icon">📋</div>
            <h4>Manage Tasks</h4>
            <p>View and manage your tasks</p>
          </Link>

          <Link to="/profile" className="action-card">
            <div className="action-icon">👤</div>
            <h4>Edit Profile</h4>
            <p>Update your profile information</p>
          </Link>

          <Link to="/change-password" className="action-card">
            <div className="action-icon">🔒</div>
            <h4>Change Password</h4>
            <p>Update your account password</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 