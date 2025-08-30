import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Login from './components/Login';
import InstructorLogin from './components/InstructorLogin';
import InstructorRegister from './components/InstructorRegister';
import AdminApp from './components/AdminApp';
import InstructorDashboard from './components/InstructorDashboard';
import StudentDashboard from './components/StudentDashboard';
import StudentLanding from './components/StudentLanding';
import StudentLogin from './components/StudentLogin';
import StudentRegister from './components/StudentRegister';
import './App.css';
import './utils/alerts.css';

// Configure axios to include credentials
axios.defaults.withCredentials = true;

function App() {
  const [userType, setUserType] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showInstructorRegister, setShowInstructorRegister] = useState(false);
  const [showStudentLogin, setShowStudentLogin] = useState(false);
  const [showStudentRegister, setShowStudentRegister] = useState(false);
  const [hoveredButton, setHoveredButton] = useState(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Check admin auth first
      const adminResponse = await axios.get('/api/check-auth');
      if (adminResponse.data.authenticated) {
        setUserType('admin');
        setUser(adminResponse.data.admin);
        setLoading(false);
        return;
      }
    } catch (error) {
      console.log('Admin not authenticated');
    }

    try {
      // Check instructor auth
      const instructorResponse = await axios.get('/api/instructor/check-auth');
      if (instructorResponse.data.authenticated) {
        setUserType('instructor');
        setUser(instructorResponse.data.instructor);
        setLoading(false);
        return;
      }
    } catch (error) {
      console.log('Instructor not authenticated');
    }

    try {
      // Check student auth
      const studentResponse = await axios.get('/api/student/check-auth');
      if (studentResponse.data.authenticated) {
        setUserType('student');
        setUser(studentResponse.data.student);
        setLoading(false);
        return;
      }
    } catch (error) {
      console.log('Student not authenticated');
    }

    setLoading(false);
  };

  const handleAdminLogin = async (credentials) => {
    try {
      console.log('Attempting admin login with:', credentials);
      const response = await axios.post('/api/login', credentials);
      console.log('Admin login response:', response.data);
      
      if (response.data.success) {
        setUserType('admin');
        setUser(response.data.admin);
        return { success: true };
      } else {
        console.log('Admin login failed:', response.data.error);
        return { success: false, error: response.data.error };
      }
    } catch (error) {
      console.error('Admin login error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed' 
      };
    }
  };

  const handleInstructorLogin = async (credentials) => {
    try {
      const response = await axios.post('/api/instructor/login', credentials);
      if (response.data.success) {
        setUserType('instructor');
        setUser(response.data.instructor);
        return { success: true };
      } else {
        return { success: false, error: response.data.error };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed' 
      };
    }
  };

  const handleLogout = async () => {
    try {
      if (userType === 'admin') {
        await axios.post('/api/logout');
      } else if (userType === 'instructor') {
        await axios.post('/api/logout');
      } else if (userType === 'student') {
        await axios.post('/api/student/logout');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUserType(null);
      setUser(null);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="animated-spinner">
          <div className="book-icon">
            <div className="book-cover">
              <div className="book-spine"></div>
              <div className="book-page book-page-1"></div>
              <div className="book-page book-page-2"></div>
              <div className="book-page book-page-3"></div>
            </div>
          </div>
          <div className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <p className="loading-text">Preparing your learning journey</p>
        </div>
      </div>
    );
  }

  if (!userType) {
    return (
      <div className="login-selection">
        {/* Animated background elements */}
        <div className="floating-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
          <div className="shape shape-4"></div>
        </div>
        
        <div className="login-options">
          <div className="logo-section">
            <div className="animated-logo">
              <div className="logo-icon">
                <i className="fas fa-graduation-cap"></i>
              </div>
              <div className="pulse-ring"></div>
            </div>
            <h1>Learning Management System</h1>
            <p className="subtitle">Empowering Education Through Technology</p>
          </div>
          
          <div className="login-buttons">
            <button 
              className={`role-btn admin ${hoveredButton === 'admin' ? 'hovered' : ''}`}
              onClick={() => setUserType('admin')}
              onMouseEnter={() => setHoveredButton('admin')}
              onMouseLeave={() => setHoveredButton(null)}
            >
              <div className="btn-icon">
                <i className="fas fa-shield-alt"></i>
              </div>
              <div className="btn-content">
                <span className="btn-title">Admin Portal</span>
                <span className="btn-subtitle">System Management</span>
              </div>
              <div className="btn-arrow">
                <i className="fas fa-arrow-right"></i>
              </div>
            </button>
            
            <button 
              className={`role-btn instructor ${hoveredButton === 'instructor' ? 'hovered' : ''}`}
              onClick={() => setUserType('instructor')}
              onMouseEnter={() => setHoveredButton('instructor')}
              onMouseLeave={() => setHoveredButton(null)}
            >
              <div className="btn-icon">
                <i className="fas fa-chalkboard-teacher"></i>
              </div>
              <div className="btn-content">
                <span className="btn-title">Instructor Portal</span>
                <span className="btn-subtitle">Course Management</span>
              </div>
              <div className="btn-arrow">
                <i className="fas fa-arrow-right"></i>
              </div>
            </button>

            <button 
              className={`role-btn student ${hoveredButton === 'student' ? 'hovered' : ''}`}
              onClick={() => setUserType('student')}
              onMouseEnter={() => setHoveredButton('student')}
              onMouseLeave={() => setHoveredButton(null)}
            >
              <div className="btn-icon">
                <i className="fas fa-user-graduate"></i>
              </div>
              <div className="btn-content">
                <span className="btn-title">Student Portal</span>
                <span className="btn-subtitle">Learning Hub</span>
              </div>
              <div className="btn-arrow">
                <i className="fas fa-arrow-right"></i>
              </div>
            </button>
          </div>
          
          <div className="footer-info">
            <p>Choose your role to access the platform</p>
            <div className="features">
              <span><i className="fas fa-check-circle"></i> Secure Access</span>
              <span><i className="fas fa-check-circle"></i> Real-time Updates</span>
              <span><i className="fas fa-check-circle"></i> Mobile Friendly</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (userType === 'admin') {
    if (user) {
      return <AdminApp admin={user} onLogout={handleLogout} />;
    }
    return <Login onLogin={handleAdminLogin} />;
  }

  if (userType === 'instructor') {
    if (user) {
      return <InstructorDashboard instructor={user} onLogout={handleLogout} />;
    }
    if (showInstructorRegister) {
      return <InstructorRegister onBackToLogin={() => setShowInstructorRegister(false)} />;
    }
    return <InstructorLogin onLogin={handleInstructorLogin} onShowRegister={() => setShowInstructorRegister(true)} />;
  }

  if (userType === 'student') {
    if (user) {
      return <StudentDashboard student={user} onLogout={handleLogout} />;
    }
    if (showStudentLogin) {
      return <StudentLogin 
        onBackToLanding={() => setShowStudentLogin(false)} 
        onShowRegister={() => setShowStudentRegister(true)}
        onBackToMain={() => setUserType(null)}
        onLoginSuccess={(studentData) => {
          setUser(studentData);
          setShowStudentLogin(false);
        }}
      />;
    }
    if (showStudentRegister) {
      return <StudentRegister 
        onBackToLanding={() => setShowStudentRegister(false)}
        onShowLogin={() => setShowStudentLogin(true)}
        onBackToMain={() => setUserType(null)}
      />;
    }
    return <StudentLanding 
      onShowLogin={() => setShowStudentLogin(true)}
      onShowRegister={() => setShowStudentRegister(true)}
      onBackToMain={() => setUserType(null)}
    />;
  }

  return null;
}

export default App;