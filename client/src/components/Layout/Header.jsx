import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Header = () => {
  const { user, isAuthenticated, logout, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [avatarTimestamp, setAvatarTimestamp] = useState(Date.now());

  useEffect(() => {
    setAvatarTimestamp(Date.now());
  }, [user?.avatar?.url]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Don't render navigation during initial loading
  if (loading) {
    return (
      <header className="header">
        <div className="container">
          <Link to="/" className="logo">
            <h1>WriteTrack</h1>
          </Link>
          <nav className="nav">
            {/* Empty nav during loading */}
          </nav>
        </div>
      </header>
    );
  }

  return (
    <header className="header">
      <div className="container">
        <Link to="/" className="logo">
          <h1>WriteTrack</h1>
        </Link>
        
        <nav className="nav">
          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
              >
                Dashboard
              </Link>
              <Link
                to="/blog"
                className={`nav-link ${location.pathname === '/blog' ? 'active' : ''}`}
              >
                Blog
              </Link>
              <Link
                to="/tasks"
                className={`nav-link ${location.pathname === '/tasks' ? 'active' : ''}`}
              >
                Tasks
              </Link>
              <button onClick={handleLogout} className="btn logout">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className={`nav-link ${location.pathname === '/login' ? 'active' : ''}`}
              >
                Login
              </Link>
              <Link
                to="/register"
                className={`nav-link ${location.pathname === '/register' ? 'active' : ''}`}
              >
                Sign Up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header; 