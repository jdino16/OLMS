import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './StudentRegister.css';

const StudentRegister = ({ onBackToLanding, onShowLogin, onBackToMain }) => {
  const [formData, setFormData] = useState({
    student_name: '',
    username: '',
    email: '',
    phone_number: '',
    dob: '',
    gender: '',
    address: '',
    password: '',
    confirm_password: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState('');

  // Check password strength
  useEffect(() => {
    if (formData.password) {
      let strength = 'weak';
      if (formData.password.length >= 8) {
        if (/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])/.test(formData.password)) {
          strength = 'strong';
        } else if (formData.password.length >= 8 && /(?=.*[a-z])(?=.*[A-Z])/.test(formData.password)) {
          strength = 'medium';
        }
      }
      setPasswordStrength(strength);
    } else {
      setPasswordStrength('');
    }
  }, [formData.password]);

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
    } else {
      // Validate age (at least 13 years old)
      const birthDate = new Date(formData.dob);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      if (age < 13) {
        newErrors.dob = 'You must be at least 13 years old to register';
      }
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
      // Add shake animation to error fields
      const errorFields = document.querySelectorAll('.form-control.error');
      errorFields.forEach(field => {
        field.classList.remove('error');
        setTimeout(() => field.classList.add('error'), 10);
      });
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.post('/api/student/register', formData);
      
      if (response.data.success) {
        // Add success animation
        document.querySelector('.register-container').classList.add('success-animation');
        setTimeout(() => {
          alert('Registration successful! You can now login with your credentials.');
          onShowLogin();
        }, 500);
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

  const LoadingDots = () => (
    <div className="loading-dots">
      <span></span>
      <span></span>
      <span></span>
    </div>
  );

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
              <i className="fas fa-user-graduate"></i>
            </div>
            <h2>Student Registration</h2>
          </div>
          <p>Create your account to access courses and track your progress</p>
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="student_name">
                <i className="fas fa-user"></i> Full Name *
              </label>
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
                <span className="error-message">
                  <i className="fas fa-exclamation-circle"></i>
                  {errors.student_name}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="username">
                <i className="fas fa-at"></i> Username *
              </label>
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
                <span className="error-message">
                  <i className="fas fa-exclamation-circle"></i>
                  {errors.username}
                </span>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">
                <i className="fas fa-envelope"></i> Email Address *
              </label>
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
                <span className="error-message">
                  <i className="fas fa-exclamation-circle"></i>
                  {errors.email}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="phone_number">
                <i className="fas fa-phone"></i> Phone Number *
              </label>
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
                <span className="error-message">
                  <i className="fas fa-exclamation-circle"></i>
                  {errors.phone_number}
                </span>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="dob">
                <i className="fas fa-calendar-alt"></i> Date of Birth *
              </label>
              <input
                type="date"
                id="dob"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                className={`form-control ${errors.dob ? 'error' : ''}`}
              />
              {errors.dob && (
                <span className="error-message">
                  <i className="fas fa-exclamation-circle"></i>
                  {errors.dob}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="gender">
                <i className="fas fa-venus-mars"></i> Gender *
              </label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className={`form-control ${errors.gender ? 'error' : ''}`}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {errors.gender && (
                <span className="error-message">
                  <i className="fas fa-exclamation-circle"></i>
                  {errors.gender}
                </span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="address">
              <i className="fas fa-map-marker-alt"></i> Address *
            </label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className={`form-control ${errors.address ? 'error' : ''}`}
              placeholder="Enter your address"
              rows="3"
            />
            {errors.address && (
              <span className="error-message">
                <i className="fas fa-exclamation-circle"></i>
                {errors.address}
              </span>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">
                <i className="fas fa-lock"></i> Password *
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`form-control ${errors.password ? 'error' : ''}`}
                placeholder="Create a password"
              />
              {formData.password && (
                <div className={`password-strength strength-${passwordStrength}`}></div>
              )}
              {errors.password && (
                <span className="error-message">
                  <i className="fas fa-exclamation-circle"></i>
                  {errors.password}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirm_password">
                <i className="fas fa-lock"></i> Confirm Password *
              </label>
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
                <span className="error-message">
                  <i className="fas fa-exclamation-circle"></i>
                  {errors.confirm_password}
                </span>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onShowLogin} className="btn btn-outline">
              <i className="fas fa-sign-in-alt"></i>
              Already have an account? Login
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <LoadingDots />
                  Creating Account...
                </>
              ) : (
                <>
                  <i className="fas fa-user-plus"></i>
                  Create Account
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentRegister;