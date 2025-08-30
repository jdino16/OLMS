import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ChatbotButton from './ChatbotButton';
import './StudentLanding.css';

const StudentLanding = ({ onShowLogin, onShowRegister, onBackToMain }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showCourseDetails, setShowCourseDetails] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      console.log('Fetching courses...');
      setError(null);
      const response = await axios.get('/api/courses/public');
      console.log('Courses response:', response.data);
      if (response.data.success) {
        setCourses(response.data.courses);
        console.log('Courses set:', response.data.courses);
      } else {
        console.log('No success in response');
        setError('Failed to fetch courses');
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      setError(error.response?.data?.error || 'Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (course) => {
    setSelectedCourse(course);
    setShowCourseDetails(true);
  };

  const handleBackToList = () => {
    setShowCourseDetails(false);
    setSelectedCourse(null);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading courses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-content">
          <i className="fas fa-exclamation-triangle"></i>
          <h3>Error Loading Courses</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={fetchCourses}>
            <i className="fas fa-redo"></i>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (showCourseDetails && selectedCourse) {
    return (
      <CourseDetails 
        course={selectedCourse} 
        onBack={handleBackToList}
        onEnroll={() => onShowRegister()}
      />
    );
  }

  return (
    <div className="student-landing">
      <header className="landing-header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-icon">
              <i className="fas fa-graduation-cap"></i>
            </div>
            <h1>Learning Management System</h1>
          </div>
          <div className="header-actions">
            <button className="btn btn-outline" onClick={onBackToMain}>
              <i className="fas fa-arrow-left"></i>
              Back to Main Menu
            </button>
            <button className="btn btn-outline" onClick={onShowLogin}>
              <i className="fas fa-sign-in-alt"></i>
              Login
            </button>
            <button className="btn btn-primary" onClick={onShowRegister}>
              <i className="fas fa-user-plus"></i>
              Register
            </button>
          </div>
        </div>
      </header>

      <main className="landing-content">
        <div className="hero-section">
          <div className="hero-content">
            <h2>Discover Amazing Courses</h2>
            <p>Explore our comprehensive collection of courses designed to enhance your skills and knowledge</p>
          </div>
        </div>

        <div className="courses-section">
          <div className="section-header">
            <h3>Available Courses</h3>
            <p>Browse through our course catalog and find the perfect learning path for you</p>
          </div>

          <div className="courses-grid">
            {courses.length > 0 ? (
              courses.map((course) => (
                <div key={course.id} className="course-card">
                  <div className="course-image">
                    <i className="fas fa-book"></i>
                  </div>
                  <div className="course-content">
                    <h4>{course.course_name}</h4>
                    <p>{course.description || 'No description available'}</p>
                    <div className="course-meta">
                      <span className="meta-item">
                        <i className="fas fa-layer-group"></i>
                        {course.module_count || 0} Modules
                      </span>
                      <span className="meta-item">
                        <i className="fas fa-clock"></i>
                        {course.duration || 'Self-paced'}
                      </span>
                    </div>
                    <div className="course-actions">
                      <button 
                        className="btn btn-outline btn-small"
                        onClick={() => handleViewDetails(course)}
                      >
                        <i className="fas fa-eye"></i>
                        View Details
                      </button>
                      <button 
                        className="btn btn-primary btn-small"
                        onClick={() => onShowRegister()}
                      >
                        <i className="fas fa-graduation-cap"></i>
                        Enroll Now
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-courses">
                <i className="fas fa-book-open"></i>
                <h3>No Courses Available</h3>
                <p>There are currently no courses available. Please check back later or contact an administrator.</p>
              </div>
            )}
          </div>
        </div>
      </main>
      
      {/* AI Learning Assistant Chatbot */}
      <ChatbotButton student={null} />
    </div>
  );
};

// Course Details Component
const CourseDetails = ({ course, onBack, onEnroll }) => {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourseModules();
  }, [course.id]);

  const fetchCourseModules = async () => {
    try {
      const response = await axios.get(`/api/courses/${course.id}/modules`);
      if (response.data.success) {
        setModules(response.data.modules);
      }
    } catch (error) {
      console.error('Error fetching modules:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="course-details">
      <div className="details-header">
        <button className="back-btn" onClick={onBack}>
          <i className="fas fa-arrow-left"></i>
          Back to Courses
        </button>
        <h2>{course.course_name}</h2>
        <p>{course.description || 'No description available'}</p>
      </div>

      <div className="course-info">
        <div className="info-grid">
          <div className="info-item">
            <i className="fas fa-layer-group"></i>
            <span>{modules.length} Modules</span>
          </div>
          <div className="info-item">
            <i className="fas fa-clock"></i>
            <span>{course.duration || 'Self-paced'}</span>
          </div>
          <div className="info-item">
            <i className="fas fa-users"></i>
            <span>{course.enrolled_students || 0} Students</span>
          </div>
        </div>
      </div>

      <div className="modules-section">
        <h3>Course Modules</h3>
        {loading ? (
          <div className="loading-modules">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Loading modules...</p>
          </div>
        ) : (
          <div className="modules-list">
            {modules.map((module, index) => (
              <div key={module.id} className="module-item">
                <div className="module-header">
                  <div className="module-number">{index + 1}</div>
                  <div className="module-info">
                    <h4>{module.module_name}</h4>
                    <p>{module.description || 'No description available'}</p>
                  </div>
                  <div className="module-status">
                    <span className={`status-badge ${module.status.toLowerCase()}`}>
                      {module.status}
                    </span>
                  </div>
                </div>
                <div className="module-lessons">
                  <span className="lesson-count">
                    <i className="fas fa-file-pdf"></i>
                    {module.lesson_count || 0} Lessons
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="enroll-section">
        <div className="enroll-content">
          <h3>Ready to Start Learning?</h3>
          <p>Enroll now and get access to all course materials, lessons, and progress tracking.</p>
          <button className="btn btn-primary btn-large" onClick={onEnroll}>
            <i className="fas fa-graduation-cap"></i>
            Enroll in Course
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentLanding;