import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [avatarTimestamp, setAvatarTimestamp] = useState(Date.now());

  useEffect(() => {
    setAvatarTimestamp(Date.now());
  }, [user?.avatar?.url]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  return (
    <header className="header">
      <div className="container">
        <Link to="/" className="logo">
          <h1>WriteTrack</h1>
        </Link>
        
        <nav className="nav">
          <Link to="/dashboard" className="nav-link">Dashboard</Link>
          <Link to="/blog" className="nav-link">Blog</Link>
          
          {isAuthenticated ? (
            <>
              <Link to="/tasks" className="nav-link">Tasks</Link>
              <div className="user-menu">
                <div className="user-info" onClick={toggleDropdown}>
                  {user?.avatar?.url && (
                    <img 
                      src={user.avatar.url + '?t=' + avatarTimestamp}
                      alt="Avatar"
                      className="avatar-small"
                    />
                  )}
                  <span>{user?.name}</span>
                  <span className="dropdown-arrow">▼</span>
                </div>
                
                {showDropdown && (
                  <div className="dropdown-menu">
                    <Link to="/dashboard" className="dropdown-item">
                      📊 Dashboard
                    </Link>
                    <Link to="/profile" className="dropdown-item">
                      👤 Profile
                    </Link>
                    <Link to="/change-password" className="dropdown-item">
                      🔒 Change Password
                    </Link>
                    <div className="dropdown-divider"></div>
                    <button onClick={handleLogout} className="dropdown-item logout-btn">
                      🚪 Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/register" className="btn btn-primary">Sign Up</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header; 