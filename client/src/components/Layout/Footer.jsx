import React from 'react';
import { useNavigate } from 'react-router-dom';

const Footer = () => {
  const navigate = useNavigate();

  const handleCreateTask = () => {
    navigate('/tasks?showForm=add');
  };

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
              <li><a href="/Dashboard">Dashboard</a></li>
              <li><a href="/Blog">Blog</a></li>
              <li><a href="/tasks">Tasks</a></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>Categories</h4>
            <ul>
              <li><a href="/create">Add Blog</a></li>
              <li><a href="/tasks?showForm=add">Create Task</a></li>
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