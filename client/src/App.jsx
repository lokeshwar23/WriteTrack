import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import PostList from './components/Blog/PostList';
import PostDetail from './components/Blog/PostDetail';
import CreatePost from './components/Blog/CreatePost';
import EditPost from './components/Blog/EditPost';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ForgotPassword from './components/Auth/ForgotPassword';
import ResetPassword from './components/Auth/ResetPassword';
import VerifyEmail from './components/Auth/VerifyEmail';
import Profile from './components/Auth/Profile';
import ChangePassword from './components/Auth/ChangePassword';
import OTPVerification from './components/Auth/OTPVerification';
import Dashboard from './components/Dashboard/Dashboard';
import TaskManagementApp from './components/TaskManagementApp';
import './styles/App.css';

function App() {
  const [showSessionTimeout, setShowSessionTimeout] = useState(false);

  useEffect(() => {
    window.handleSessionTimeout = () => setShowSessionTimeout(true);
    return () => { window.handleSessionTimeout = undefined; };
  }, []);

  const handleSessionTimeoutClose = () => {
    setShowSessionTimeout(false);
    window.location.href = '/login';
  };

  return (
    <div className="App">
      <Header />
      <main className="main-content">
        {showSessionTimeout && (
          <div className="modal-overlay" style={{ zIndex: 2000 }}>
            <div className="modal-content" style={{ maxWidth: 400, margin: '10% auto', padding: '2rem', textAlign: 'center' }}>
              <h2>Session Expired</h2>
              <p>Your session has expired. Please log in again.</p>
              <button className="btn btn-primary" onClick={handleSessionTimeoutClose} style={{ marginTop: 24 }}>
                Go to Login
              </button>
            </div>
          </div>
        )}
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/blog" element={<PostList />} />
          <Route path="/post/:id" element={<PostDetail />} />
          <Route path="/create" element={<CreatePost />} />
          <Route path="/edit/:id" element={<EditPost />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/otp-verification" element={<OTPVerification />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tasks" element={<TaskManagementApp />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App; 