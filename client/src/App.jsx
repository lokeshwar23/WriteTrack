import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import Home from './components/Home';
import PostList from './components/Blog/PostList';
import PostDetail from './components/Blog/PostDetail';
import CreatePost from './components/Blog/CreatePost';
import EditPost from './components/Blog/EditPost';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ChangePassword from './components/Auth/ChangePassword';
import Dashboard from './components/Dashboard/Dashboard';
import TaskManagementApp from './components/tasks/TaskManagementApp';
import { useAuth } from './contexts/AuthContext';
import './styles/App.css';


function App() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    if (!loading) {
      setInitialLoad(false);
    }
  }, [loading]);

  // Show loading spinner during initial auth check
  if (loading && initialLoad) {
    return (
      <div className="App">
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          flexDirection: 'column'
        }}>
          <div className="loading-spinner" style={{ marginBottom: '1rem' }}>
            <div className="spinner"></div>
          </div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Define public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/register', '/change-password'];

  // If not authenticated and trying to access protected route, redirect to login
  if (!isAuthenticated && !publicRoutes.includes(location.pathname)) {
    return (
      <div className="App">
        <Header />
        <main className="main-content">
          <Login />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="App">
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/blog" element={<PostList />} />
          <Route path="/post/:id" element={<PostDetail />} />
          <Route path="/create" element={<CreatePost />} />
          <Route path="/edit/:id" element={<EditPost />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tasks" element={<TaskManagementApp />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App; 