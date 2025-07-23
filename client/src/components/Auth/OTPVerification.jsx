import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/Auth.css';

const OTPVerification = () => {
  const navigate = useNavigate();
  const { sendOTP, verifyOTP } = useAuth();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      await sendOTP(email);
      setMessage('OTP sent successfully to your email');
      setOtpSent(true);
      setCountdown(60); // 60 seconds cooldown
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      await verifyOTP(email, otp);
      setMessage('OTP verified successfully');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      await sendOTP(email);
      setMessage('OTP resent successfully');
      setCountdown(60);
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>OTP Verification</h2>
        
        {!otpSent ? (
          <>
            <p className="auth-subtitle">
              Enter your email address to receive a one-time password.
            </p>

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

            <form onSubmit={handleSendOTP} className="auth-form">
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="form-input"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary btn-full"
              >
                {isLoading ? 'Sending...' : 'Send OTP'}
              </button>
            </form>
          </>
        ) : (
          <>
            <p className="auth-subtitle">
              Enter the 6-digit code sent to {email}
            </p>

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

            <form onSubmit={handleVerifyOTP} className="auth-form">
              <div className="form-group">
                <label htmlFor="otp">OTP Code</label>
                <input
                  type="text"
                  id="otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit code"
                  required
                  className="form-input otp-input"
                  maxLength={6}
                  pattern="[0-9]{6}"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="btn btn-primary btn-full"
              >
                {isLoading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </form>

            <div className="otp-actions">
              {countdown > 0 ? (
                <p className="countdown">
                  Resend available in {formatTime(countdown)}
                </p>
              ) : (
                <button
                  onClick={handleResendOTP}
                  disabled={isLoading}
                  className="btn btn-secondary"
                >
                  {isLoading ? 'Sending...' : 'Resend OTP'}
                </button>
              )}
            </div>
          </>
        )}

        <div className="auth-links">
          <Link to="/login" className="link">
            Back to Login
          </Link>
          <Link to="/forgot-password" className="link">
            Forgot Password?
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification; 