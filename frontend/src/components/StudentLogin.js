import React, { useState } from 'react';
import axios from 'axios';
import './StudentLogin.css';

const StudentLogin = ({ onBackToLanding, onShowRegister, onBackToMain, onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.post('/api/student/login', formData);
      
      if (response.data.success) {
        onLoginSuccess(response.data.student);
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error.response?.data?.error) {
        alert(error.response.data.error);
      } else {
        alert('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="student-login-container">
      <div className="student-login-card">
        <div className="student-login-header">
          <div className="logo-container">
            <div className="logo-icon student">
              <i className="fas fa-graduation-cap"></i>
            </div>
          </div>
          <h1>Student Portal</h1>
          <p>Sign in to continue your learning journey</p>
        </div>
        
        <form onSubmit={handleSubmit} className="student-login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <div className="input-container">
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={`form-control ${errors.username ? 'error' : ''}`}
                placeholder="Enter username"
                required
              />
              <div className="input-icon">
                <i className="fas fa-user"></i>
              </div>
            </div>
            {errors.username && (
              <span className="error-message">{errors.username}</span>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-container">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`form-control ${errors.password ? 'error' : ''}`}
                placeholder="Enter password"
                required
              />
              <div className="input-icon">
                <button
                  type="button"
                  className="password-toggle"
                  onClick={togglePasswordVisibility}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>
            {errors.password && (
              <span className="error-message">{errors.password}</span>
            )}
          </div>
          
          <button
            type="submit"
            className="login-btn student"
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Signing in...
              </>
            ) : (
              <>
                <i className="fas fa-sign-in-alt"></i>
                Sign In
              </>
            )}
          </button>
        </form>
        
        <div className="login-footer">
          <p>Don't have an account? 
            <button 
              type="button" 
              className="register-link" 
              onClick={onShowRegister}
            >
              Register here
            </button>
          </p>
          <div className="back-buttons">
            <button className="back-btn" onClick={onBackToMain}>
              <i className="fas fa-home"></i>
              Main Menu
            </button>
            <button className="back-btn" onClick={onBackToLanding}>
              <i className="fas fa-arrow-left"></i>
              Back to Courses
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentLogin;
