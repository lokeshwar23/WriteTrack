import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/Auth.css';

const Profile = () => {
  const { user, updateProfile, updatePreferences, loadUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    profession: '',
    location: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const nameInputRef = useRef(null);
  const [avatarTimestamp, setAvatarTimestamp] = useState(Date.now());

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        bio: user.profile?.bio || '',
        profession: user.profile?.profession || '',
        location: user.profile?.location || ''
      });
    }
  }, [user]);

  useEffect(() => {
    if (isEditing && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [isEditing]);

  const handleCancelEdit = () => {
    if (user) {
      setFormData({
        name: user.name || '',
        bio: user.profile?.bio || '',
        profession: user.profile?.profession || '',
        location: user.profile?.location || ''
      });
    }
    setIsEditing(false);
    setSelectedImage(null);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      await updateProfile(formData);
      setMessage('Profile updated successfully');
      setIsEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
    }
  };

  const handleImageUpload = async (e) => {
    e.preventDefault();
    if (!selectedImage) return;
    setUploading(true);
    setError('');
    setMessage('');
    try {
      const formData = new FormData();
      formData.append('profilePicture', selectedImage);
      const res = await fetch('/api/auth/profile-picture', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Upload failed');
      setMessage('Profile picture updated!');
      setSelectedImage(null);
      if (typeof loadUser === 'function') await loadUser();
      setAvatarTimestamp(Date.now());
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const isCustomAvatar = user.avatar?.url && !user.avatar.url.includes('cloudinary.com/demo/image/upload/v1312461204/sample.jpg');

  if (!user) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2>Please Login</h2>
          <p>You need to be logged in to view your profile.</p>
          <Link to="/login" className="btn btn-primary">
            Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card profile-card">
        <h2>Profile Settings</h2>

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

        <div className="profile-tabs">
          <button
            className={`tab-button active`}
            onClick={() => setActiveTab('profile')}
          >
            Profile Information
          </button>
        </div>

        {activeTab === 'profile' && (
          <form onSubmit={handleProfileSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                required
                className="form-input"
                disabled={!isEditing}
                ref={nameInputRef}
              />
            </div>

            <div className="form-group">
              <label htmlFor="bio">Bio</label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Tell us about yourself"
                rows="4"
                className="form-input"
                disabled={!isEditing}
              />
            </div>

            <div className="form-group">
              <label htmlFor="profession">Profession</label>
              <input
                type="text"
                id="profession"
                name="profession"
                value={formData.profession}
                onChange={handleInputChange}
                placeholder="Enter your profession"
                className="form-input"
                disabled={!isEditing}
              />
            </div>

            <div className="form-group">
              <label htmlFor="location">Location</label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="Enter your location"
                className="form-input"
                disabled={!isEditing}
              />
            </div>

            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              {isCustomAvatar ? (
                <img
                  key={user.avatar.url + avatarTimestamp}
                  src={user.avatar.url + '?t=' + avatarTimestamp}
                  alt="Profile"
                  style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', marginBottom: 10 }}
                />
              ) : (
                <div
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: '50%',
                    background: '#eee',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 40,
                    color: '#888',
                    margin: '0 auto 10px auto'
                  }}
                >
                  {user.name ? user.name[0].toUpperCase() : '?'}
                </div>
              )}
              <form onSubmit={async (e) => {
                await handleImageUpload(e);
                if (typeof loadUser === 'function') await loadUser();
              }} style={{ marginTop: 10 }}>
                <input type="file" accept="image/*" onChange={handleImageChange} disabled={!isEditing} />
                <button type="submit" disabled={uploading || !selectedImage || !isEditing} style={{ marginLeft: 10 }}>
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </form>
            </div>

            {!isEditing ? (
              <button
                type="button"
                className="btn btn-primary btn-full"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary btn-full"
                >
                  {isLoading ? 'Updating...' : 'Update Profile'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-full"
                  onClick={handleCancelEdit}
                  disabled={isLoading}
                >
                  Cancel
                </button>
              </div>
            )}
          </form>
        )}

        <div className="auth-links">
          <Link to="/change-password" className="link">
            Change Password
          </Link>
          <Link to="/dashboard" className="link">
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Profile; 