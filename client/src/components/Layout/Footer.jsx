import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Footer = () => {
  const { isAuthenticated } = useAuth();


  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h4>Task and Blog Management System</h4>
            <p>A modern Task and Blogging platform built with MongoDB, Express, React, and Node.js</p>
          </div>
          
          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li><Link to={isAuthenticated ? "/dashboard" : "/login"}>Dashboard</Link></li>
              <li><Link to={isAuthenticated ? "/blog" : "/login"}>Blog</Link></li>
              <li><Link to={isAuthenticated ? "/tasks" : "/login"}>Tasks</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Actions</h4>
            <ul>
              <li><Link to={isAuthenticated ? "/create" : "/login"}>Add Blog Post</Link></li>
              <li><Link to={isAuthenticated ? "/tasks?showForm=add" : "/login"}>Create Task</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; 2025 WriteTrack. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 