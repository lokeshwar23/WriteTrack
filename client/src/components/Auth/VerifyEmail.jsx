import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/Auth.css';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const { verifyEmail, resendVerification } = useAuth();

  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      handleVerification();
    }
  }, [token]);

  const handleVerification = async () => {
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await verifyEmail(token);
      setMessage(response.message);
      setIsVerified(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred during verification');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await resendVerification();
      setMessage(response.message);
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2>Verifying Email</h2>
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Please wait while we verify your email...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Email Verification</h2>
        
        {message && (
          <div className="alert alert-success">
            {message}
          </div>
        )}

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {!token && !isVerified && (
          <div className="verification-content">
            <p className="auth-subtitle">
              Please check your email for a verification link. If you haven't received it, you can request a new one.
            </p>
            
            <button
              onClick={handleResendVerification}
              disabled={isLoading}
              className="btn btn-primary btn-full"
            >
              {isLoading ? 'Sending...' : 'Resend Verification Email'}
            </button>
          </div>
        )}

        {isVerified && (
          <div className="verification-success">
            <div className="success-icon">✓</div>
            <p>Your email has been verified successfully!</p>
            <p>Redirecting to login page...</p>
          </div>
        )}

        <div className="auth-links">
          <Link to="/login" className="link">
            Back to Login
          </Link>
          <Link to="/register" className="link">
            Create New Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail; 