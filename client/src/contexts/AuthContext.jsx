import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
    case 'REGISTER_SUCCESS':
      localStorage.setItem('token', action.payload.accessToken);
      localStorage.setItem('refreshToken', action.payload.refreshToken);
      return {
        ...state,
        token: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
        user: action.payload.user,
        isAuthenticated: true,
        loading: false
      };
    case 'LOGIN_FAIL':
    case 'REGISTER_FAIL':
    case 'LOGOUT':
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      return {
        ...state,
        token: null,
        refreshToken: null,
        user: null,
        isAuthenticated: false,
        loading: false
      };
    case 'USER_LOADED':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        loading: false
      };
    case 'USER_UPDATED':
      return {
        ...state,
        user: action.payload
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    token: localStorage.getItem('token'),
    refreshToken: localStorage.getItem('refreshToken'),
    user: null,
    isAuthenticated: false,
    loading: true
  });

  // Load user
  const loadUser = async () => {
    if (state.token) {
      try {
        const res = await authAPI.getMe();
        dispatch({ type: 'USER_LOADED', payload: res.data.user });
      } catch (error) {
        // Try to refresh token if access token is expired
        if (error.response?.status === 401 && state.refreshToken) {
          try {
            const refreshRes = await authAPI.refreshToken(state.refreshToken);
            localStorage.setItem('token', refreshRes.data.accessToken);
            localStorage.setItem('refreshToken', refreshRes.data.refreshToken);
            
            // Retry loading user with new token
            const userRes = await authAPI.getMe();
            dispatch({ type: 'USER_LOADED', payload: userRes.data.user });
          } catch (refreshError) {
            dispatch({ type: 'LOGIN_FAIL' });
          }
        } else {
          dispatch({ type: 'LOGIN_FAIL' });
        }
      }
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Register user
  const register = async (userData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const res = await authAPI.register(userData);
      dispatch({ type: 'REGISTER_SUCCESS', payload: res.data });
      return { success: true };
    } catch (error) {
      dispatch({ type: 'REGISTER_FAIL' });
      throw error;
    }
  };

  // Login user
  const login = async (userData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const res = await authAPI.login(userData);
      dispatch({ type: 'LOGIN_SUCCESS', payload: res.data });
      return { success: true };
    } catch (error) {
      dispatch({ type: 'LOGIN_FAIL' });
      throw error;
    }
  };

  // Logout user
  const logout = async () => {
    try {
      if (state.token) {
        await authAPI.logout();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: 'LOGOUT' });
    }
  };

  // Forgot password
  const forgotPassword = async (email) => {
    try {
      const res = await authAPI.forgotPassword(email);
      return res.data;
    } catch (error) {
      throw error;
    }
  };

  // Reset password
  const resetPassword = async (token, password) => {
    try {
      const res = await authAPI.resetPassword(token, password);
      return res.data;
    } catch (error) {
      throw error;
    }
  };

  // Verify email
  const verifyEmail = async (token) => {
    try {
      const res = await authAPI.verifyEmail(token);
      return res.data;
    } catch (error) {
      throw error;
    }
  };

  // Resend verification
  const resendVerification = async (email) => {
    try {
      const res = await authAPI.resendVerification(email);
      return res.data;
    } catch (error) {
      throw error;
    }
  };

  // Send OTP
  const sendOTP = async (email) => {
    try {
      const res = await authAPI.sendOTP(email);
      return res.data;
    } catch (error) {
      throw error;
    }
  };

  // Verify OTP
  const verifyOTP = async (email, otp) => {
    try {
      const res = await authAPI.verifyOTP(email, otp);
      return res.data;
    } catch (error) {
      throw error;
    }
  };

  // Change password
  const changePassword = async (currentPassword, newPassword) => {
    try {
      const res = await authAPI.changePassword(currentPassword, newPassword);
      return res.data;
    } catch (error) {
      throw error;
    }
  };

  // Update profile
  const updateProfile = async (profileData) => {
    try {
      const res = await authAPI.updateProfile(profileData);
      dispatch({ type: 'USER_UPDATED', payload: res.data.user });
      return res.data;
    } catch (error) {
      throw error;
    }
  };

  // Update preferences
  const updatePreferences = async (preferences) => {
    try {
      const res = await authAPI.updatePreferences(preferences);
      dispatch({ type: 'USER_UPDATED', payload: res.data.user });
      return res.data;
    } catch (error) {
      throw error;
    }
  };

  // Delete account
  const deleteAccount = async (password) => {
    try {
      const res = await authAPI.deleteAccount(password);
      dispatch({ type: 'LOGOUT' });
      return res.data;
    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  return (
    <AuthContext.Provider value={{
      ...state,
      register,
      login,
      logout,
      loadUser,
      forgotPassword,
      resetPassword,
      verifyEmail,
      resendVerification,
      sendOTP,
      verifyOTP,
      changePassword,
      updateProfile,
      updatePreferences,
      deleteAccount
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 