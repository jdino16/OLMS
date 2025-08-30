import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Feedback from './Feedback';
import './CourseProgress.css';

const CourseProgress = ({ student }) => {
  const [courseProgress, setCourseProgress] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackTarget, setFeedbackTarget] = useState(null);

  useEffect(() => {
    if (student) {
      fetchCourseProgress();
      fetchAnalytics();
    }
  }, [student]);

  const fetchCourseProgress = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/student/course-progress');
      if (response.data.success) {
        setCourseProgress(response.data.progress);
      }
    } catch (error) {
      console.error('Error fetching course progress:', error);
      setError('Failed to load course progress');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get('/api/student/progress-analytics');
      if (response.data.success) {
        setAnalytics(response.data.analytics);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const startStudySession = async (courseId, lessonId = null) => {
    try {
      const response = await axios.post('/api/student/study-session', {
        course_id: courseId,
        lesson_id: lessonId
      });
      
      if (response.data.success) {
        setActiveSession({
          id: response.data.session_id,
          courseId,
          lessonId,
          startTime: new Date()
        });
        setSessionStartTime(new Date());
      }
    } catch (error) {
      console.error('Error starting study session:', error);
      alert('Failed to start study session');
    }
  };

  const endStudySession = async () => {
    if (!activeSession) return;

    try {
      const endTime = new Date();
      const studyTime = Math.round((endTime - sessionStartTime) / 60000); // Convert to minutes
      
      const response = await axios.put('/api/student/study-session', {
        session_id: activeSession.id,
        study_time: studyTime,
        completed_pages: 1 // You can make this dynamic based on actual progress
      });
      
      if (response.data.success) {
        setActiveSession(null);
        setSessionStartTime(null);
        fetchCourseProgress();
        fetchAnalytics();
      }
    } catch (error) {
      console.error('Error ending study session:', error);
      alert('Failed to end study session');
    }
  };

  const updateCourseProgress = async (courseId, completedModules, studyTime = 0) => {
    try {
      const response = await axios.put('/api/student/course-progress', {
        course_id: courseId,
        completed_modules: completedModules,
        study_time: studyTime
      });
      
      if (response.data.success) {
        fetchCourseProgress();
        fetchAnalytics();
      }
    } catch (error) {
      console.error('Error updating course progress:', error);
      alert('Failed to update progress');
    }
  };

  const markCourseComplete = async (courseId) => {
    try {
      const response = await axios.put('/api/student/complete-course', {
        course_id: courseId
      });
      
      if (response.data.success) {
        fetchCourseProgress();
        fetchAnalytics();
        alert('Course marked as completed!');
      }
    } catch (error) {
      console.error('Error marking course complete:', error);
      alert('Failed to mark course complete');
    }
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return '#28a745';
    if (percentage >= 60) return '#ffc107';
    if (percentage >= 40) return '#fd7e14';
    return '#dc3545';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return '#28a745';
      case 'Active': return '#007bff';
      case 'Dropped': return '#dc3545';
      default: return '#6c757d';
    }
  };

  if (loading) {
    return (
      <div className="course-progress">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your course progress...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="course-progress">
        <div className="error-container">
          <i className="fas fa-exclamation-triangle"></i>
          <p>{error}</p>
          <button onClick={fetchCourseProgress} className="retry-btn">
            <i className="fas fa-redo"></i>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="course-progress">
      <div className="progress-header">
        <h2>
          <i className="fas fa-chart-line"></i>
          Course Progress Dashboard
        </h2>
        <p>Track your learning journey and study analytics</p>
      </div>

      {/* Analytics Overview */}
      {analytics && (
        <div className="analytics-overview">
          <div className="analytics-grid">
            <div className="analytics-card">
              <div className="analytics-icon">
                <i className="fas fa-graduation-cap"></i>
              </div>
              <div className="analytics-content">
                <h3>{analytics.overall_stats.total_enrollments}</h3>
                <p>Total Enrollments</p>
              </div>
            </div>
            
            <div className="analytics-card">
              <div className="analytics-icon completed">
                <i className="fas fa-check-circle"></i>
              </div>
              <div className="analytics-content">
                <h3>{analytics.overall_stats.completed_courses}</h3>
                <p>Completed Courses</p>
              </div>
            </div>
            
            <div className="analytics-card">
              <div className="analytics-icon active">
                <i className="fas fa-play-circle"></i>
              </div>
              <div className="analytics-content">
                <h3>{analytics.overall_stats.active_courses}</h3>
                <p>Active Courses</p>
              </div>
            </div>
            
            <div className="analytics-card">
              <div className="analytics-icon time">
                <i className="fas fa-clock"></i>
              </div>
              <div className="analytics-content">
                <h3>{formatTime(analytics.overall_stats.total_study_time || 0)}</h3>
                <p>Total Study Time</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Course Progress List */}
      <div className="progress-container">
        <div className="progress-list">
          <h3>Your Course Progress</h3>
          
          {courseProgress.length === 0 ? (
            <div className="no-progress">
              <i className="fas fa-book-open"></i>
              <p>You haven't enrolled in any courses yet.</p>
              <button className="browse-courses-btn">
                <i className="fas fa-search"></i>
                Browse Courses
              </button>
            </div>
          ) : (
            courseProgress.map((course) => (
              <div key={course.id} className="progress-card">
                <div className="course-info">
                  <h4 className="course-name">{course.course_name}</h4>
                  <p className="course-description">{course.description}</p>
                  <div className="course-meta">
                    <span className="level">
                      <i className="fas fa-signal"></i>
                      {course.level}
                    </span>
                    <span className="duration">
                      <i className="fas fa-clock"></i>
                      {course.duration}
                    </span>
                    <span className="status" style={{ color: getStatusColor(course.status) }}>
                      <i className="fas fa-circle"></i>
                      {course.status}
                    </span>
                  </div>
                </div>
                
                <div className="progress-details">
                  <div className="progress-bar-container">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ 
                          width: `${course.progress_percentage}%`,
                          backgroundColor: getProgressColor(course.progress_percentage)
                        }}
                      ></div>
                    </div>
                    <span className="progress-percentage">
                      {Math.round(course.progress_percentage)}%
                    </span>
                  </div>
                  
                  <div className="progress-stats">
                    <div className="stat">
                      <span className="stat-label">Modules Completed</span>
                      <span className="stat-value">
                        {course.completed_modules} / {course.total_modules}
                      </span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Study Time</span>
                      <span className="stat-value">
                        {formatTime(course.total_study_time || 0)}
                      </span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Enrolled</span>
                      <span className="stat-value">
                        {new Date(course.enrollment_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="course-actions">
                  {activeSession && activeSession.courseId === course.course_id ? (
                    <button 
                      className="end-session-btn"
                      onClick={endStudySession}
                    >
                      <i className="fas fa-stop"></i>
                      End Session
                    </button>
                  ) : (
                    <button 
                      className="start-session-btn"
                      onClick={() => startStudySession(course.course_id)}
                    >
                      <i className="fas fa-play"></i>
                      Start Session
                    </button>
                  )}
                  
                                     <button 
                     className="view-course-btn"
                     onClick={() => setSelectedCourse(course)}
                   >
                     <i className="fas fa-eye"></i>
                     View Details
                   </button>
                   
                   <button 
                     className="feedback-btn"
                     onClick={() => {
                       setFeedbackTarget({
                         type: 'course',
                         id: course.course_id,
                         name: course.course_name
                       });
                       setShowFeedback(true);
                     }}
                   >
                     <i className="fas fa-comment-alt"></i>
                     Feedback
                   </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Course Details Panel */}
        {selectedCourse && (
          <div className="course-details-panel">
            <div className="details-header">
              <h3>
                <i className="fas fa-info-circle"></i>
                {selectedCourse.course_name}
              </h3>
              <button 
                className="close-details-btn"
                onClick={() => setSelectedCourse(null)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="details-content">
              <div className="detail-section">
                <h4>Course Information</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Level:</span>
                    <span className="detail-value">{selectedCourse.level}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Duration:</span>
                    <span className="detail-value">{selectedCourse.duration}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Status:</span>
                    <span className="detail-value" style={{ color: getStatusColor(selectedCourse.status) }}>
                      {selectedCourse.status}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Enrollment Date:</span>
                    <span className="detail-value">
                      {new Date(selectedCourse.enrollment_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              
                             <div className="detail-section">
                 <h4>Progress Overview</h4>
                 <div className="progress-overview">
                   <div 
                     className="progress-circle"
                     style={{ 
                       '--progress': `${selectedCourse.progress_percentage * 3.6}deg`
                     }}
                   >
                     <div className="circle-progress">
                       <span className="circle-percentage">
                         {Math.round(selectedCourse.progress_percentage)}%
                       </span>
                     </div>
                   </div>
                  <div className="progress-breakdown">
                    <div className="breakdown-item">
                      <span className="breakdown-label">Modules Completed</span>
                      <span className="breakdown-value">
                        {selectedCourse.completed_modules} / {selectedCourse.total_modules}
                      </span>
                    </div>
                    <div className="breakdown-item">
                      <span className="breakdown-label">Total Lessons</span>
                      <span className="breakdown-value">{selectedCourse.total_lessons}</span>
                    </div>
                    <div className="breakdown-item">
                      <span className="breakdown-label">Study Time</span>
                      <span className="breakdown-value">
                        {formatTime(selectedCourse.total_study_time || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="detail-section">
                <h4>Quick Actions</h4>
                <div className="quick-actions">
                                     <button 
                     className="action-btn primary"
                     onClick={() => {
                       // Navigate to course content in the main dashboard
                       window.location.href = `#enrolled`;
                       // You can also trigger a custom event to communicate with parent component
                       window.dispatchEvent(new CustomEvent('navigateToCourse', {
                         detail: { courseId: selectedCourse.course_id }
                       }));
                     }}
                   >
                     <i className="fas fa-play"></i>
                     Continue Learning
                   </button>
                  
                  <button 
                    className="action-btn secondary"
                    onClick={() => {
                      const newModules = Math.min(selectedCourse.completed_modules + 1, selectedCourse.total_modules);
                      updateCourseProgress(selectedCourse.course_id, newModules);
                    }}
                  >
                    <i className="fas fa-plus"></i>
                    Mark Module Complete
                  </button>
                  
                                     {selectedCourse.status === 'Active' && (
                     <button 
                       className="action-btn success"
                       onClick={() => markCourseComplete(selectedCourse.course_id)}
                     >
                       <i className="fas fa-check"></i>
                       Mark Course Complete
                     </button>
                   )}
                   
                   <button 
                     className="action-btn feedback"
                     onClick={() => {
                       setFeedbackTarget({
                         type: 'course',
                         id: selectedCourse.course_id,
                         name: selectedCourse.course_name
                       });
                       setShowFeedback(true);
                     }}
                   >
                     <i className="fas fa-comment-alt"></i>
                     Give Feedback
                   </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recent Study Sessions */}
      {analytics && analytics.recent_sessions && analytics.recent_sessions.length > 0 && (
        <div className="recent-sessions">
          <h3>Recent Study Sessions</h3>
          <div className="sessions-list">
            {analytics.recent_sessions.slice(0, 5).map((session) => (
              <div key={session.id} className="session-item">
                <div className="session-info">
                  <h4>{session.course_name}</h4>
                  {session.lesson_name && (
                    <p className="lesson-name">{session.lesson_name}</p>
                  )}
                  <span className="session-time">
                    {new Date(session.start_time).toLocaleDateString()}
                  </span>
                </div>
                <div className="session-duration">
                  {session.study_time ? formatTime(session.study_time) : 'In Progress'}
                </div>
              </div>
            ))}
          </div>
                 </div>
       )}
       
       {/* Feedback Modal */}
       {showFeedback && feedbackTarget && (
         <Feedback
           student={student}
           targetType={feedbackTarget.type}
           targetId={feedbackTarget.id}
           targetName={feedbackTarget.name}
           onClose={() => {
             setShowFeedback(false);
             setFeedbackTarget(null);
           }}
         />
       )}
     </div>
   );
 };

export default CourseProgress;
