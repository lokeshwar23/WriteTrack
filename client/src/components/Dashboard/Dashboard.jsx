import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { dashboardAPI } from '../../services/api';
import { postsAPI, tasksAPI } from '../../services/api';
import { IonIcon } from '@ionic/react';
import { bookOutline, listOutline, checkmarkDoneOutline, listCircleOutline, createOutline, clipboardOutline, lockClosedOutline, calendarOutline, checkmarkCircleOutline, timeOutline, documentTextOutline, checkmarkOutline, hourglassOutline } from 'ionicons/icons';

import '../../styles/Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    totalContent: 0
  });
  const [recentPosts, setRecentPosts] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchDashboardData();
    } else if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, user, navigate]);

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

  if (!isAuthenticated) {
    return null; // Will redirect to login
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
           <div className="stat-icon"><IonIcon icon={documentTextOutline} style={{ color: '#3b82f6' }} /></div>
            <div className="stat-content">
              <h3>{stats.totalPosts ?? 0}</h3>
              <p>Total Posts</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon"><IonIcon icon={listOutline} style={{ color: '#10b981' }} /></div>
            <div className="stat-content">
              <h3>{stats.totalTasks ?? 0}</h3>
              <p>Total Tasks</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon"><IonIcon icon={checkmarkCircleOutline} style={{ color: '#059669' }} /></div>
            <div className="stat-content">
              <h3>{stats.completedTasks ?? 0}</h3>
              <p>Completed Tasks</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon"><IonIcon icon={timeOutline} style={{ color: '#f59e0b' }} /></div>
            <div className="stat-content">
              <h3>{stats.pendingTasks ?? 0}</h3>
              <p>Pending Tasks</p>
            </div>
          </div>


         <div className="stat-card">
           <div className="stat-icon"><IonIcon icon={calendarOutline} style={{ color: '#8b5cf6' }} /></div>
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
                      <span><IonIcon icon={calendarOutline} style={{ fontSize: '14px', marginRight: '4px' }} />{new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
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
              recentTasks.map(task => (
                <div key={task._id} className={`task-item ${task.status}`}>
                  <div className="task-info">
                    <h4>{task.title}</h4>
                    <div className="task-meta">
                      <span className={`status ${task.status}`}>
                        <IonIcon icon={task.status === 'completed' ? checkmarkOutline : hourglassOutline} style={{ fontSize: '14px', marginRight: '4px' }} />
                        {task.status}
                      </span>
                      <span className={`priority ${task.priority}`}>
                        {task.priority}
                      </span>
                      <span><IonIcon icon={calendarOutline} style={{ fontSize: '14px', marginRight: '4px' }} />{task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No due date'}</span>
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

      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="actions-grid">
          <Link to="/create" className="action-card">
             <div className="action-icon"><IonIcon icon={createOutline} /></div>
             <h4>Create Post</h4>
             <p>Write a new blog post</p>
           </Link>

           <Link to="/tasks" className="action-card">
             <div className="action-icon"><IonIcon icon={clipboardOutline} /></div>
             <h4>Manage Tasks</h4>
             <p>View and manage your tasks</p>
           </Link>

           <Link to="/change-password" className="action-card">
             <div className="action-icon"><IonIcon icon={lockClosedOutline} /></div>
             <h4>Change Password</h4>
             <p>Update your account password</p>
           </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 