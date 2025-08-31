import React, { useState } from 'react';
import { showAlert } from '../utils/alerts';
import './InstructorLogin.css';

const InstructorLogin = ({ onLogin, onShowRegister }) => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await onLogin(credentials);
    
    if (!result.success) {
      showAlert.error(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="instructor-login-container">
      <div className="instructor-login-card">
        <div className="instructor-login-header">
          <div className="logo-container">
            <div className="logo-icon instructor">
              <i className="fas fa-chalkboard-teacher"></i>
            </div>
          </div>
          <h1>Instructor Portal</h1>
          <p>Sign in to your teaching dashboard</p>
        </div>
        
        <form onSubmit={handleSubmit} className="instructor-login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <div className="input-container">
              <input
                type="text"
                id="username"
                name="username"
                value={credentials.username}
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
            <label htmlFor="password">Password</label>
            <div className="input-container">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={credentials.password}
                onChange={handleChange}
                className="form-control"
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
          </div>
          

          
          <button
            type="submit"
            className="login-btn instructor"
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
          <p>Need help? Contact your administrator</p>
          <p>Don't have an account? 
            <button 
              type="button" 
              className="register-link" 
              onClick={onShowRegister}
            >
              Register here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default InstructorLogin;
