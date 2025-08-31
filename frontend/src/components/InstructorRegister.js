import React, { useState } from 'react';
import axios from 'axios';
import { showAlert } from '../utils/alerts';
import './InstructorRegister.css';

const InstructorRegister = ({ onBackToLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    instructor_name: '',
    password: '',
    confirmPassword: '',
    dob: '',
    gender: '',
    phone_number: '',
    email: '',
    address: ''
  });
  const [loading, setLoading] = useState(false);

  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const togglePasswordVisibility = (field) => {
    if (field === 'password') {
      setShowPassword(!showPassword);
    } else {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  const validateForm = () => {
    if (!formData.username || !formData.instructor_name || !formData.password || 
        !formData.confirmPassword || !formData.dob || !formData.gender || !formData.phone_number) {
      showAlert.error('Please fill in all required fields');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      showAlert.error('Passwords do not match');
      return false;
    }

    if (formData.password.length < 6) {
      showAlert.error('Password must be at least 6 characters long');
      return false;
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      showAlert.error('Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('/api/instructor/register', {
        username: formData.username,
        instructor_name: formData.instructor_name,
        password: formData.password,
        dob: formData.dob,
        gender: formData.gender,
        phone_number: formData.phone_number,
        email: formData.email || '',
        address: formData.address || ''
      });

      if (response.data.success) {
        const successMsg = response.data.message || 'Registration successful! You can now login with your credentials.';
        setSuccess(successMsg);
        showAlert.success(successMsg);
        setFormData({
          username: '',
          instructor_name: '',
          password: '',
          confirmPassword: '',
          dob: '',
          gender: '',
          phone_number: '',
          email: '',
          address: ''
        });
      } else {
        const errorMsg = response.data.error || 'Registration failed';
        showAlert.error(errorMsg);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Registration failed. Please try again.';
      showAlert.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="instructor-register-container">
      <div className="instructor-register-card">
        <div className="instructor-register-header">
          <div className="logo-container">
            <div className="logo-icon instructor">
              <i className="fas fa-chalkboard-teacher"></i>
            </div>
          </div>
          <h1>Instructor Registration</h1>
          <p>Create your instructor account</p>
        </div>
        
        <form onSubmit={handleSubmit} className="instructor-register-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="username">Username *</label>
              <div className="input-container">
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Enter username"
                  required
                />
                <div className="input-icon">
                  <i className="fas fa-user"></i>
                </div>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="instructor_name">Full Name *</label>
              <div className="input-container">
                <input
                  type="text"
                  id="instructor_name"
                  name="instructor_name"
                  value={formData.instructor_name}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Enter full name"
                  required
                />
                <div className="input-icon">
                  <i className="fas fa-id-card"></i>
                </div>
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Password *</label>
              <div className="input-container">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Enter password"
                  required
                />
                <div className="input-icon">
                  <i className="fas fa-lock"></i>
                </div>
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => togglePasswordVisibility('password')}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password *</label>
              <div className="input-container">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Confirm password"
                  required
                />
                <div className="input-icon">
                  <i className="fas fa-lock"></i>
                </div>
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => togglePasswordVisibility('confirmPassword')}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="dob">Date of Birth *</label>
              <div className="input-container">
                <input
                  type="date"
                  id="dob"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  className="form-control"
                  required
                />
                <div className="input-icon">
                  <i className="fas fa-calendar"></i>
                </div>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="gender">Gender *</label>
              <div className="input-container">
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="form-control"
                  required
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                <div className="input-icon">
                  <i className="fas fa-venus-mars"></i>
                </div>
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phone_number">Phone Number *</label>
              <div className="input-container">
                <input
                  type="tel"
                  id="phone_number"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Enter phone number"
                  required
                />
                <div className="input-icon">
                  <i className="fas fa-phone"></i>
                </div>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <div className="input-container">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Enter email (optional)"
                />
                <div className="input-icon">
                  <i className="fas fa-envelope"></i>
                </div>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="address">Address</label>
            <div className="input-container">
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="form-control"
                placeholder="Enter address (optional)"
                rows="3"
              ></textarea>
              <div className="input-icon">
                <i className="fas fa-map-marker-alt"></i>
              </div>
            </div>
          </div>
          


          {success && (
            <div className="success-message">
              <i className="fas fa-check-circle"></i>
              <span>{success}</span>
            </div>
          )}
          
          <button
            type="submit"
            className="register-btn instructor"
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Creating Account...
              </>
            ) : (
              <>
                <i className="fas fa-user-plus"></i>
                Create Account
              </>
            )}
          </button>
        </form>
        
        <div className="register-footer">
          <p>Already have an account? 
            <button 
              type="button" 
              className="login-link" 
              onClick={onBackToLogin}
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default InstructorRegister;
