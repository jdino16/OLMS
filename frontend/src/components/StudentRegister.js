import React, { useState } from 'react';
import axios from 'axios';
import './StudentRegister.css';

const StudentRegister = ({ onBackToLanding, onShowLogin, onBackToMain }) => {
  const [formData, setFormData] = useState({
    student_name: '',
    username: '',
    email: '',
    phone_number: '',
    dob: '',
    gender: 'Other',
    address: '',
    password: '',
    confirm_password: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.student_name.trim()) {
      newErrors.student_name = 'Full name is required';
    }
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.phone_number.trim()) {
      newErrors.phone_number = 'Phone number is required';
    }
    
    if (!formData.dob) {
      newErrors.dob = 'Date of birth is required';
    }
    
    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }
    
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!formData.confirm_password) {
      newErrors.confirm_password = 'Please confirm your password';
    } else if (formData.password !== formData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match';
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
      const response = await axios.post('/api/student/register', formData);
      
      if (response.data.success) {
        alert('Registration successful! You can now login with your credentials.');
        onShowLogin();
      }
    } catch (error) {
      console.error('Registration error:', error);
      if (error.response?.data?.error) {
        alert(error.response.data.error);
      } else {
        alert('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="student-register">
      <div className="register-container">
        <div className="register-header">
          <div className="header-buttons">
            <button className="back-btn" onClick={onBackToMain}>
              <i className="fas fa-home"></i>
              Main Menu
            </button>
            <button className="back-btn" onClick={onBackToLanding}>
              <i className="fas fa-arrow-left"></i>
              Back to Courses
            </button>
          </div>
          <div className="logo-section">
            <div className="logo-icon">
              <i className="fas fa-graduation-cap"></i>
            </div>
            <h2>Student Registration</h2>
          </div>
          <p>Create your account to access courses and track your progress</p>
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="student_name">Full Name *</label>
              <input
                type="text"
                id="student_name"
                name="student_name"
                value={formData.student_name}
                onChange={handleChange}
                className={`form-control ${errors.student_name ? 'error' : ''}`}
                placeholder="Enter your full name"
              />
              {errors.student_name && (
                <span className="error-message">{errors.student_name}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="username">Username *</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={`form-control ${errors.username ? 'error' : ''}`}
                placeholder="Choose a username"
              />
              {errors.username && (
                <span className="error-message">{errors.username}</span>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`form-control ${errors.email ? 'error' : ''}`}
                placeholder="Enter your email address"
              />
              {errors.email && (
                <span className="error-message">{errors.email}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="phone_number">Phone Number *</label>
              <input
                type="tel"
                id="phone_number"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                className={`form-control ${errors.phone_number ? 'error' : ''}`}
                placeholder="Enter your phone number"
              />
              {errors.phone_number && (
                <span className="error-message">{errors.phone_number}</span>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="dob">Date of Birth *</label>
              <input
                type="date"
                id="dob"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                className={`form-control ${errors.dob ? 'error' : ''}`}
                required
              />
              {errors.dob && (
                <span className="error-message">{errors.dob}</span>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="gender">Gender *</label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className={`form-control ${errors.gender ? 'error' : ''}`}
                required
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {errors.gender && (
                <span className="error-message">{errors.gender}</span>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="address">Address *</label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className={`form-control ${errors.address ? 'error' : ''}`}
                placeholder="Enter your address"
                rows="3"
                required
              />
              {errors.address && (
                <span className="error-message">{errors.address}</span>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Password *</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`form-control ${errors.password ? 'error' : ''}`}
                placeholder="Create a password"
              />
              {errors.password && (
                <span className="error-message">{errors.password}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirm_password">Confirm Password *</label>
              <input
                type="password"
                id="confirm_password"
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleChange}
                className={`form-control ${errors.confirm_password ? 'error' : ''}`}
                placeholder="Confirm your password"
              />
              {errors.confirm_password && (
                <span className="error-message">{errors.confirm_password}</span>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onShowLogin} className="btn btn-outline">
              Already have an account? Login
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentRegister;
