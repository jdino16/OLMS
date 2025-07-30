import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Home.css';

axios.defaults.baseURL = 'http://localhost:5000';

function Home() {
  const navigate = useNavigate();

  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginRole, setLoginRole] = useState('student');

  const [registerName, setRegisterName] = useState('');
  const [registerRole, setRegisterRole] = useState('student');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [secretCode, setSecretCode] = useState('');

  const [forgotEmail, setForgotEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');


  useEffect(() => {
    const storedRole = localStorage.getItem('userRole');
    if (storedRole) {
      if (storedRole === 'student') navigate('/student/dashboard');
      else if (storedRole === 'instructor') navigate('/instructor/dashboard');
      else if (storedRole === 'admin') navigate('/admin/dashboard');
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/login', {
        email: loginEmail.trim(),
        password: loginPassword.trim(),
      });
      
      toast.success('Login successful');
      localStorage.setItem('userEmail', loginEmail.trim());
      localStorage.setItem('userRole', response.data.role);
      localStorage.setItem('userName', response.data.name);
      setShowLogin(false);


      switch(response.data.role) {
        case 'student': navigate('/student/dashboard'); break;
        case 'instructor': navigate('/instructor/dashboard'); break;
        case 'admin': navigate('/admin/dashboard'); break;
        default: 
          toast.error('Unknown user role');
          navigate('/home');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Login failed');
    }
  };


  const handleRegister = async (e) => {
    e.preventDefault();
    if (registerRole === 'admin') {
      toast.error('Admin registration not allowed');
      return;
    }
    if (registerRole === 'instructor' && !secretCode.trim()) {
      toast.error('Secret code is required for instructor registration');
      return;
    }
    try {
      await axios.post('/api/register', {
        name: registerName.trim(),
        email: registerEmail.trim(),
        password: registerPassword.trim(),
        role: registerRole,
        secretCode: registerRole === 'instructor' ? secretCode.trim() : undefined,
      });
      toast.success('Registration successful');
      setShowRegister(false);
      setShowLogin(true);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Registration failed');
    }
  };


  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    try {
      await axios.post('/api/reset-password', {
        email: forgotEmail.trim(),
        newPassword: newPassword.trim(),
      });
      toast.success('Password updated successfully! Please login with your new password.');
      setShowForgotPassword(false);
      setShowLogin(true);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Password reset failed');
    }
  };

  return (
    <div className="lms-homepage">

      <header className="lms-navbar">
        <div className="lms-logo">
          <span className="lms-logo-gradient">Online</span> LMS
        </div>
        <nav className="lms-nav-links">
          <button onClick={() => { setShowLogin(true); setShowRegister(false); }} className="lms-login-btn">
            Sign In
          </button>
          <button onClick={() => { setShowRegister(true); setShowLogin(false); }} className="lms-register-btn">
            Get Started
          </button>
        </nav>
      </header>

      {showLogin && (
        <div className="lms-modal-overlay">
          <div className="lms-modal">
            <button className="lms-modal-close" onClick={() => setShowLogin(false)}>×</button>
            <h2>Login</h2>
            <form onSubmit={handleLogin} className="lms-auth-form">
              <div className="lms-form-group">
                <label>Role</label>
                <select
                  value={loginRole}
                  onChange={(e) => setLoginRole(e.target.value)}
                  className="lms-form-select"
                >
                  <option value="student">Student</option>
                  <option value="instructor">Instructor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="lms-form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                />
              </div>
              <div className="lms-form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                />
              </div>
              <button type="submit" className="lms-primary-btn">Login</button>
              <p className="lms-auth-switch">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setShowRegister(true); setShowLogin(false); }}
                  className="lms-auth-switch-btn"
                >
                  Register
                </button>
              </p>
              <p className="lms-forgot-password">
                <button
                  type="button"
                  onClick={() => { setShowForgotPassword(true); setShowLogin(false); }}
                  className="lms-forgot-password-btn"
                >
                  Forgot Password?
                </button>
              </p>
            </form>
          </div>
        </div>
      )}


      {showRegister && (
        <div className="lms-modal-overlay">
          <div className="lms-modal">
            <button className="lms-modal-close" onClick={() => setShowRegister(false)}>×</button>
            <h2>Register</h2>
            <form onSubmit={handleRegister} className="lms-auth-form">
              <div className="lms-form-group">
                <label>Role</label>
                <select
                  value={registerRole}
                  onChange={(e) => setRegisterRole(e.target.value)}
                  className="lms-form-select"
                >
                  <option value="student">Student</option>
                  <option value="instructor">Instructor</option>
                </select>
              </div>

              {registerRole === 'instructor' && (
                <div className="lms-form-group">
                  <label>Secret Code</label>
                  <input
                    type="password"
                    value={secretCode}
                    onChange={(e) => setSecretCode(e.target.value)}
                    required
                    placeholder="Enter secret code"
                  />
                </div>
              )}

              <div className="lms-form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  required
                  placeholder="Enter your name"
                />
              </div>

              <div className="lms-form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                />
              </div>

              <div className="lms-form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  required
                  placeholder="Create a password"
                />
              </div>

              <button type="submit" className="lms-primary-btn">Register</button>
              <p className="lms-auth-switch">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setShowLogin(true); setShowRegister(false); }}
                  className="lms-auth-switch-btn"
                >
                  Login
                </button>
              </p>
            </form>
          </div>
        </div>
      )}

      {showForgotPassword && (
        <div className="lms-modal-overlay">
          <div className="lms-modal">
            <button className="lms-modal-close" onClick={() => setShowForgotPassword(false)}>×</button>
            <h2>Reset Password</h2>
            <form onSubmit={handleForgotPassword} className="lms-auth-form">
              <div className="lms-form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                  placeholder="Enter your registered email"
                />
              </div>
              <div className="lms-form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Enter new password"
                />
              </div>
              <div className="lms-form-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Confirm new password"
                />
              </div>
              <button type="submit" className="lms-primary-btn">Update Password</button>
              <p className="lms-auth-switch">
                Remember your password?{' '}
                <button
                  type="button"
                  onClick={() => { setShowLogin(true); setShowForgotPassword(false); }}
                  className="lms-auth-switch-btn"
                >
                  Login
                </button>
              </p>
            </form>
          </div>
        </div>
      )}


      <section className="lms-hero">
        <div className="lms-hero-content">
          <div className="lms-hero-tagline">
            <span className="lms-tagline-highlight">AI-POWERED</span> LEARNING PLATFORM
          </div>
          <h1>
            Smart Learning <span className="lms-title-accent">Management</span>
          </h1>
          <p className="lms-hero-subtext">
            Personalized insights • Predictive analytics • ML-enhanced education
          </p>
          <div className="lms-hero-buttons">
            <button onClick={() => setShowLogin(true)} className="lms-primary-btn">
              Start Learning
            </button>
            <button
              onClick={() => {
                document.querySelector('.lms-features').scrollIntoView({ behavior: 'smooth' });
              }}
              className="lms-secondary-btn"
            >
              Explore Features
            </button>
          </div>
        </div>
        <div className="lms-hero-image">
          <div className="lms-hero-glow"></div>
        </div>
      </section>


      <section className="lms-features">
        <h2 className="lms-section-title">
          <span className="lms-section-title-border">Key Features</span>
        </h2>
        <div className="lms-features-grid">
          <div className="lms-feature-card">
            <div className="lms-feature-icon">📊</div>
            <h3>Pass Prediction</h3>
            <p>
              Logistic Regression model evaluates grades, attendance & study hours
              to predict student pass/fail status.
            </p>
            <div className="lms-feature-glow"></div>
          </div>

          <div className="lms-feature-card">
            <div className="lms-feature-icon">🧠</div>
            <h3>Quiz Suggestions</h3>
            <p>
              KMeans clustering analyzes student performance and suggests
              topic-wise quizzes to improve weak areas.
            </p>
            <div className="lms-feature-glow"></div>
          </div>

          <div className="lms-feature-card">
            <div className="lms-feature-icon">⚡</div>
            <h3>Learning Speed Analysis</h3>
            <p>
              Instructors can view clusters of fast, average, and slow learners
              using quiz time, activity rate, and duration.
            </p>
            <div className="lms-feature-glow"></div>
          </div>

          <div className="lms-feature-card">
            <div className="lms-feature-icon">🎯</div>
            <h3>Student Grouping</h3>
            <p>
              Admins and instructors classify students as Good or Weak 
              based on quiz scores, activity time & completion rate.
            </p>
            <div className="lms-feature-glow"></div>
          </div>
        </div>
      </section>

      <section className="lms-roles">
        <h2 className="lms-section-title">
          <span className="lms-section-title-border">Who Can Use?</span>
        </h2>
        <div className="lms-roles-grid">
          <div className="lms-role-card">
            <h3>👩‍🎓 Students</h3>
            <p>
              Access personalized predictions and quizzes. Monitor your performance
              and learn smarter using machine learning.
            </p>
          </div>
          <div className="lms-role-card">
            <h3>👨‍🏫 Instructors</h3>
            <p>
              View student learning speeds and group performance. Take data-driven
              decisions to guide learners better.
            </p>
          </div>
          <div className="lms-role-card">
            <h3>🛠️ Admins</h3>
            <p>
              Manage users, access all analytics, and monitor platform-wide
              performance using ML-powered dashboards.
            </p>
          </div>
        </div>
      </section>

      <footer className="lms-footer">
        <div className="lms-footer-glow"></div>
        <p>© {new Date().getFullYear()} Online Learning Management System</p>
        <p className="lms-footer-subtext">Built with React • Flask • MySQL • ML</p>
      </footer>
    </div>
  );
}

export default Home;