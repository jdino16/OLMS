import React, { useState } from 'react';
import { showAlert } from '../utils/alerts';
import './Login.css';

const Login = ({ onLogin }) => {
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

    console.log('Submitting login with credentials:', credentials);
    
    try {
      const result = await onLogin(credentials);
      console.log('Login result:', result);
      
      if (!result.success) {
        showAlert.error(result.error);
      }
    } catch (error) {
      console.error('Login error:', error);
      showAlert.error('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <div className="logo-container">
            <div className="logo-icon admin">
              <i className="fas fa-shield-alt"></i>
            </div>
          </div>
          <h1>Admin Portal</h1>
          <p>Sign in to your admin dashboard</p>
        </div>
        
        <form onSubmit={handleSubmit} className="admin-login-form">
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
            <div className="input-container password-field">
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
            className="login-btn admin"
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
          <p>Need help? Contact system administrator</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
