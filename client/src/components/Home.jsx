import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Welcome to WriteTrack</h1>
          <p className="hero-subtitle">
            Your ultimate platform for blogging and task management.
            
          </p>
          <div className="hero-buttons">
            <button
              className="btn btn-primary btn-lg"
              onClick={() => navigate('/login')}
            >
              login
            </button>
            <button
              className="btn btn-outline btn-lg"
              onClick={() => navigate('/register')}
            >
              Sign Up
            </button>
          </div>
        </div>
        
      </div>

      
    </div>
  );
};

export default Home;