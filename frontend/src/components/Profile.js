// Profile.js
import React, { useState } from 'react';
import axios from 'axios';
import './Profile.css';

const Profile = ({ admin }) => {
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const togglePasswordVisibility = (field) => {
    if (field === 'current') {
      setShowCurrentPassword(!showCurrentPassword);
    } else if (field === 'new') {
      setShowNewPassword(!showNewPassword);
    } else if (field === 'confirm') {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.new_password !== formData.confirm_password) {
      setError('New passwords do not match');
      return;
    }

    if (formData.new_password.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const response = await axios.post('/api/admin/change-password', {
        current_password: formData.current_password,
        new_password: formData.new_password
      });

      if (response.data.success) {
        setSuccess('Password updated successfully!');
        setFormData({
          current_password: '',
          new_password: '',
          confirm_password: ''
        });
        
        // Reset visibility states
        setShowCurrentPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-container">
      <div className="page-header">
        <h2>
          <i className="fas fa-user-cog"></i>
          Profile Settings
        </h2>
      </div>

      <div className="profile-content">
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar">
              {admin?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="profile-info">
              <h3>{admin?.username}</h3>
              <p>
                <i className="fas fa-shield-alt"></i>
                Administrator
              </p>
            </div>
          </div>

          <div className="profile-section">
            <h4>
              <i className="fas fa-key"></i>
              Change Password
            </h4>
            <p className="section-description">
              Update your password to keep your account secure.
            </p>

            {error && (
              <div className="error-message">
                <i className="fas fa-exclamation-circle"></i>
                {error}
              </div>
            )}

            {success && (
              <div className="success-message">
                <i className="fas fa-check-circle"></i>
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="password-form">
              <div className="form-group">
                <label>
                  <i className="fas fa-lock"></i>
                  Current Password *
                </label>
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  name="current_password"
                  value={formData.current_password}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter current password"
                />
                <i 
                  className={`fas ${showCurrentPassword ? 'fa-eye-slash' : 'fa-eye'}`}
                  onClick={() => togglePasswordVisibility('current')}
                ></i>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>
                    <i className="fas fa-key"></i>
                    New Password *
                  </label>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    name="new_password"
                    value={formData.new_password}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter new password"
                    minLength="6"
                  />
                  <i 
                    className={`fas ${showNewPassword ? 'fa-eye-slash' : 'fa-eye'}`}
                    onClick={() => togglePasswordVisibility('new')}
                  ></i>
                </div>
                <div className="form-group">
                  <label>
                    <i className="fas fa-key"></i>
                    Confirm New Password *
                  </label>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirm_password"
                    value={formData.confirm_password}
                    onChange={handleInputChange}
                    required
                    placeholder="Confirm new password"
                    minLength="6"
                  />
                  <i 
                    className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}
                    onClick={() => togglePasswordVisibility('confirm')}
                  ></i>
                </div>
              </div>

              <div className="password-requirements">
                <h5>
                  <i className="fas fa-info-circle"></i>
                  Password Requirements:
                </h5>
                <ul>
                  <li>At least 6 characters long</li>
                  <li>Should be different from current password</li>
                  <li>Keep it secure and don't share it</li>
                </ul>
              </div>

              <div className="form-actions">
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Updating Password...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-key"></i>
                      Update Password
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="profile-sidebar">
          <div className="info-card">
            <h4>
              <i className="fas fa-info-circle"></i>
              Account Information
            </h4>
            <div className="info-item">
              <span className="info-label">
                <i className="fas fa-user"></i>
                Username:
              </span>
              <span className="info-value">{admin?.username}</span>
            </div>
            <div className="info-item">
              <span className="info-label">
                <i className="fas fa-user-tag"></i>
                Role:
              </span>
              <span className="info-value">Administrator</span>
            </div>
            <div className="info-item">
              <span className="info-label">
                <i className="fas fa-circle"></i>
                Status:
              </span>
              <span className="info-value status-active">Active</span>
            </div>
          </div>

          <div className="info-card">
            <h4>
              <i className="fas fa-shield-alt"></i>
              Security Tips
            </h4>
            <ul className="security-tips">
              <li>Use a strong, unique password</li>
              <li>Never share your credentials</li>
              <li>Log out when using shared devices</li>
              <li>Change password regularly</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;