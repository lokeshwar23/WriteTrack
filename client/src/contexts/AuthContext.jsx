import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
    case 'REGISTER_SUCCESS':
      localStorage.setItem('token', action.payload.accessToken);
      return {
        ...state,
        token: action.payload.accessToken,
        user: action.payload.user,
        isAuthenticated: true,
        loading: false
      };
    case 'LOGIN_FAIL':
    case 'REGISTER_FAIL':
    case 'LOGOUT':
      localStorage.removeItem('token');
      return {
        ...state,
        token: null,
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
    user: null,
    isAuthenticated: !!localStorage.getItem('token'), // Initialize based on token presence
    loading: true
  });

  // Load user
  const loadUser = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const res = await authAPI.getMe();
        dispatch({ type: 'USER_LOADED', payload: res.data.user });
      } catch (error) {
        // If token is expired or invalid, logout automatically
        dispatch({ type: 'LOGOUT' });
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
    }
    // Always dispatch logout regardless of API call success
    dispatch({ type: 'LOGOUT' });
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
      changePassword
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
