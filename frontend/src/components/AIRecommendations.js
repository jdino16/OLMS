import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AIRecommendations.css';

const AIRecommendations = ({ student }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [studentProfile, setStudentProfile] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseInsights, setCourseInsights] = useState({});
  const [learningPath, setLearningPath] = useState([]);
  const [showLearningPath, setShowLearningPath] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollmentSuccess, setEnrollmentSuccess] = useState(false);

  useEffect(() => {
    if (student) {
      fetchRecommendations();
    }
  }, [student]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/ai/recommendations?limit=6');
      
      if (response.data.success) {
        setRecommendations(response.data.recommendations);
        setStudentProfile(response.data.student_profile);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setError('Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseInsights = async (courseId) => {
    try {
      const response = await axios.get(`/api/ai/course-insights/${courseId}`);
      if (response.data.success) {
        setCourseInsights(response.data.insights);
      }
    } catch (error) {
      console.error('Error fetching course insights:', error);
    }
  };

  const handleCourseClick = (course) => {
    setSelectedCourse(course);
    fetchCourseInsights(course.id);
    setShowLearningPath(false);
    setEnrollmentSuccess(false);
  };

  const handleEnrollInCourse = async () => {
    if (!selectedCourse) return;
    
    try {
      setEnrolling(true);
      const response = await axios.post('/api/student/enroll-course', {
        course_id: selectedCourse.id
      });
      
      if (response.data.success) {
        setEnrollmentSuccess(true);
        // Refresh recommendations after enrollment
        setTimeout(() => {
          fetchRecommendations();
        }, 1000);
      }
    } catch (error) {
      console.error('Error enrolling in course:', error);
      alert('Failed to enroll in course. Please try again.');
    } finally {
      setEnrolling(false);
    }
  };

  const handleViewLearningPath = async () => {
    if (!selectedCourse) return;
    
    try {
      const response = await axios.get(`/api/ai/learning-path/${selectedCourse.id}`);
      if (response.data.success) {
        setLearningPath(response.data.learning_path);
        setShowLearningPath(true);
      }
    } catch (error) {
      console.error('Error fetching learning path:', error);
      alert('Failed to load learning path. Please try again.');
    }
  };

  const handleStartLearningPath = () => {
    // Enroll in the first course of the learning path
    if (learningPath.length > 0) {
      const firstCourse = learningPath[0];
      setSelectedCourse(firstCourse);
      setShowLearningPath(false);
      // You can add navigation logic here to go to the course page
      alert(`Starting learning path with: ${firstCourse.course_name}`);
    }
  };

  const getSkillLevelColor = (level) => {
    const colors = {
      'Beginner': '#28a745',
      'Intermediate': '#ffc107',
      'Advanced': '#dc3545'
    };
    return colors[level] || '#6c757d';
  };

  const getSkillLevelIcon = (level) => {
    const icons = {
      'Beginner': 'fas fa-seedling',
      'Intermediate': 'fas fa-tree',
      'Advanced': 'fas fa-crown'
    };
    return icons[level] || 'fas fa-graduation-cap';
  };

  if (loading) {
    return (
      <div className="ai-recommendations">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>AI is analyzing your learning profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ai-recommendations">
        <div className="error-container">
          <i className="fas fa-exclamation-triangle"></i>
          <p>{error}</p>
          <button onClick={fetchRecommendations} className="retry-btn">
            <i className="fas fa-redo"></i>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-recommendations">
      <div className="recommendations-header">
        <div className="header-content">
          <h2>
            <i className="fas fa-robot"></i>
            AI Learning Assistant
          </h2>
          <p>Personalized course recommendations just for you</p>
        </div>
        
        <div className="student-profile">
          <div className="profile-card">
            <div className="profile-header">
              <i className="fas fa-user-graduate"></i>
              <span>Your Learning Profile</span>
            </div>
            <div className="profile-stats">
              <div className="stat-item">
                <span className="stat-label">Skill Level</span>
                <span className="stat-value" style={{ color: getSkillLevelColor(studentProfile.skill_level) }}>
                  <i className={getSkillLevelIcon(studentProfile.skill_level)}></i>
                  {studentProfile.skill_level}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Completion Rate</span>
                <span className="stat-value">
                  {Math.round(studentProfile.completion_rate * 100)}%
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Courses Completed</span>
                <span className="stat-value">{studentProfile.total_courses_taken}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="recommendations-container">
        <div className="recommendations-grid">
          {recommendations.map((rec, index) => (
            <div 
              key={rec.course.id} 
              className={`recommendation-card ${selectedCourse?.id === rec.course.id ? 'selected' : ''}`}
              onClick={() => handleCourseClick(rec.course)}
            >
              <div className="card-header">
                <div className="course-level">
                  <span 
                    className="level-badge"
                    style={{ backgroundColor: getSkillLevelColor(rec.course.level) }}
                  >
                    {rec.course.level}
                  </span>
                </div>
                <div className="recommendation-score">
                  <span className="score">{Math.round(rec.score * 100)}%</span>
                  <span className="score-label">Match</span>
                </div>
              </div>
              
              <div className="card-content">
                <h3 className="course-title">{rec.course.course_name}</h3>
                <p className="course-description">
                  {rec.course.description || 'No description available'}
                </p>
                
                <div className="course-meta">
                  <span className="category">
                    <i className="fas fa-tag"></i>
                    {rec.course.category || 'General'}
                  </span>
                  <span className="duration">
                    <i className="fas fa-clock"></i>
                    {rec.course.duration || '4 weeks'}
                  </span>
                </div>
              </div>
              
              <div className="card-footer">
                <div className="recommendation-reason">
                  <i className="fas fa-lightbulb"></i>
                  {rec.reasoning}
                </div>
                <button className="view-course-btn">
                  <i className="fas fa-eye"></i>
                  View Course
                </button>
              </div>
            </div>
          ))}
        </div>

        {selectedCourse && (
          <div className="course-insights-panel">
            <div className="insights-header">
              <h3>
                <i className="fas fa-chart-line"></i>
                AI Insights for {selectedCourse.course_name}
              </h3>
              <button 
                className="close-insights-btn"
                onClick={() => setSelectedCourse(null)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="insights-content">
              {Object.entries(courseInsights).map(([key, value]) => (
                <div key={key} className="insight-item">
                  <h4>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h4>
                  <p>{Array.isArray(value) ? value.join(', ') : (value || 'No information available')}</p>
                </div>
              ))}
            </div>
            
            <div className="insights-actions">
              {enrollmentSuccess ? (
                <div className="enrollment-success">
                  <i className="fas fa-check-circle"></i>
                  <span>Successfully enrolled!</span>
                </div>
              ) : (
                <button 
                  className="enroll-btn" 
                  onClick={handleEnrollInCourse}
                  disabled={enrolling}
                >
                  <i className="fas fa-plus"></i>
                  {enrolling ? 'Enrolling...' : 'Enroll in Course'}
                </button>
              )}
              <button 
                className="learning-path-btn"
                onClick={handleViewLearningPath}
              >
                <i className="fas fa-route"></i>
                View Learning Path
              </button>
            </div>
          </div>
        )}

        {showLearningPath && learningPath.length > 0 && (
          <div className="learning-path-panel">
            <div className="learning-path-header">
              <h3>
                <i className="fas fa-route"></i>
                Learning Path to {selectedCourse?.course_name}
              </h3>
              <button 
                className="close-learning-path-btn"
                onClick={() => setShowLearningPath(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="learning-path-content">
              <div className="path-timeline">
                {learningPath.map((course, index) => (
                  <div key={course.id} className="path-step">
                    <div className="step-number">{index + 1}</div>
                    <div className="step-content">
                      <h4 className="course-title">{course.course_name}</h4>
                      <p className="course-description">
                        {course.description || 'No description available'}
                      </p>
                      <div className="course-meta">
                        <span className="level">
                          <i className="fas fa-signal"></i>
                          {course.level}
                        </span>
                        <span className="duration">
                          <i className="fas fa-clock"></i>
                          {course.duration || '4 weeks'}
                        </span>
                      </div>
                    </div>
                    {index < learningPath.length - 1 && (
                      <div className="path-arrow">
                        <i className="fas fa-arrow-down"></i>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="learning-path-actions">
              <button 
                className="start-path-btn"
                onClick={handleStartLearningPath}
              >
                <i className="fas fa-play"></i>
                Start Learning Path
              </button>
              <button 
                className="close-path-btn"
                onClick={() => setShowLearningPath(false)}
              >
                <i className="fas fa-times"></i>
                Close
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="ai-features">
        <h3>AI-Powered Features</h3>
        <div className="features-grid">
          <div className="feature-item">
            <i className="fas fa-brain"></i>
            <h4>Smart Recommendations</h4>
            <p>AI analyzes your learning patterns to suggest the perfect next course</p>
          </div>
          <div className="feature-item">
            <i className="fas fa-chart-bar"></i>
            <h4>Learning Analytics</h4>
            <p>Track your progress and get insights on your learning journey</p>
          </div>
          <div className="feature-item">
            <i className="fas fa-route"></i>
            <h4>Learning Paths</h4>
            <p>Get personalized roadmaps to achieve your learning goals</p>
          </div>
          <div className="feature-item">
            <i className="fas fa-lightbulb"></i>
            <h4>Course Insights</h4>
            <p>AI-generated insights help you understand what to expect from each course</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIRecommendations;
