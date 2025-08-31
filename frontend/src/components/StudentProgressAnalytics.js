import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './StudentProgressAnalytics.css';

const StudentProgressAnalytics = ({ instructor }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState('all');
  const [timeRange, setTimeRange] = useState('month');
  const [viewMode, setViewMode] = useState('overview'); // overview, detailed, comparisons

  useEffect(() => {
    if (instructor) {
      fetchAnalytics();
    }
  }, [instructor, selectedCourse, selectedStudent, timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        course_id: selectedCourse !== 'all' ? selectedCourse : undefined,
        student_id: selectedStudent !== 'all' ? selectedStudent : undefined,
        time_range: timeRange
      };
      
      const response = await axios.get('/api/instructor/student-progress-analytics', { params });
      if (response.data.success) {
        setAnalytics(response.data.analytics);
      } else {
        setError(response.data.error || 'Failed to load progress analytics');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      if (error.response?.data?.error) {
        setError(`Backend Error: ${error.response.data.error}`);
      } else if (error.response?.status === 500) {
        setError('Internal Server Error - Please check backend logs');
      } else if (error.response?.status === 401) {
        setError('Unauthorized - Please log in again');
      } else {
        setError(`Failed to load progress analytics: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceColor = (score) => {
    if (score >= 90) return '#28a745'; // Excellent
    if (score >= 80) return '#20c997'; // Good
    if (score >= 70) return '#ffc107'; // Average
    if (score >= 60) return '#fd7e14'; // Below Average
    return '#dc3545'; // Poor
  };

  const getEngagementLevel = (activity) => {
    if (activity >= 80) return { level: 'High', color: '#28a745', icon: 'fas fa-rocket' };
    if (activity >= 60) return { level: 'Medium', color: '#ffc107', icon: 'fas fa-walking' };
    return { level: 'Low', color: '#dc3545', icon: 'fas fa-bed' };
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const renderOverviewCards = () => (
    <div className="overview-cards">
      <div className="stat-card total-students">
        <div className="stat-icon">
          <i className="fas fa-users"></i>
        </div>
        <div className="stat-content">
          <h3>{analytics?.overview?.total_students || 0}</h3>
          <p>Total Students</p>
          <span className="trend positive">
            <i className="fas fa-arrow-up"></i>
            +{analytics?.overview?.student_growth || 0}% this month
          </span>
        </div>
      </div>

      <div className="stat-card active-students">
        <div className="stat-icon">
          <i className="fas fa-user-check"></i>
        </div>
        <div className="stat-content">
          <h3>{analytics?.overview?.active_students || 0}</h3>
          <p>Active Students</p>
          <span className="trend positive">
            <i className="fas fa-arrow-up"></i>
            {analytics?.overview?.activity_rate || 0}% activity rate
          </span>
        </div>
      </div>

      <div className="stat-card avg-progress">
        <div className="stat-icon">
          <i className="fas fa-chart-line"></i>
        </div>
        <div className="stat-content">
          <h3>{analytics?.overview?.avg_progress || 0}%</h3>
          <p>Average Progress</p>
          <span className="trend positive">
            <i className="fas fa-arrow-up"></i>
            +{analytics?.overview?.progress_growth || 0}% vs last month
          </span>
        </div>
      </div>

      <div className="stat-card completion-rate">
        <div className="stat-icon">
          <i className="fas fa-trophy"></i>
        </div>
        <div className="stat-content">
          <h3>{analytics?.overview?.completion_rate || 0}%</h3>
          <p>Course Completion Rate</p>
          <span className="trend positive">
            <i className="fas fa-arrow-up"></i>
            +{analytics?.overview?.completion_growth || 0}% improvement
          </span>
        </div>
      </div>
    </div>
  );

  const renderProgressChart = () => (
    <div className="progress-chart-container">
      <h3>Progress Distribution</h3>
      <div className="progress-bars">
        {analytics?.progress_distribution?.map((range) => (
          <div key={range.range} className="progress-bar-item">
            <div className="progress-label">
              {range.range}%
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ 
                  width: `${(range.count / Math.max(...analytics.progress_distribution.map(r => r.count))) * 100}%`,
                  backgroundColor: getPerformanceColor(parseInt(range.range))
                }}
              ></div>
            </div>
            <div className="progress-count">
              {range.count} students
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStudentPerformanceTable = () => (
    <div className="student-performance">
      <h3>Student Performance Overview</h3>
      <div className="table-container">
        <table className="performance-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Course</th>
              <th>Progress</th>
              <th>Quiz Score</th>
              <th>Study Time</th>
              <th>Last Activity</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {analytics?.student_performance?.map((student, index) => (
              <tr key={`${student.id}-${student.course_name}-${index}`}>
                <td className="student-info">
                  <div className="student-avatar">
                    <i className="fas fa-user"></i>
                  </div>
                  <div>
                    <div className="student-name">{student.student_name}</div>
                    <div className="student-email">{student.email}</div>
                  </div>
                </td>
                <td>{student.course_name}</td>
                <td>
                  <div className="progress-indicator">
                    <div className="progress-bar-mini">
                      <div 
                        className="progress-fill-mini"
                        style={{ 
                          width: `${student.progress}%`,
                          backgroundColor: getPerformanceColor(student.progress)
                        }}
                      ></div>
                    </div>
                    <span className="progress-text">{student.progress}%</span>
                  </div>
                </td>
                <td>
                  <span 
                    className="quiz-score"
                    style={{ color: getPerformanceColor(student.quiz_score) }}
                  >
                    {student.quiz_score}%
                  </span>
                </td>
                <td>{formatTime(student.study_time)}</td>
                <td>{new Date(student.last_activity).toLocaleDateString()}</td>
                <td>
                  <span className={`status-badge ${student.status.toLowerCase()}`}>
                    {student.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderEngagementMetrics = () => (
    <div className="engagement-metrics">
      <h3>Student Engagement Analysis</h3>
      <div className="engagement-grid">
        <div className="engagement-card">
          <h4>Study Session Patterns</h4>
          <div className="session-stats">
            <div className="stat-item">
              <span className="stat-value">{analytics?.engagement?.avg_session_duration || 0}m</span>
              <span className="stat-label">Avg Session Duration</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{analytics?.engagement?.sessions_per_week || 0}</span>
              <span className="stat-label">Sessions per Week</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{analytics?.engagement?.peak_study_hours || 'N/A'}</span>
              <span className="stat-label">Peak Study Hours</span>
            </div>
          </div>
        </div>

        <div className="engagement-card">
          <h4>Content Interaction</h4>
          <div className="interaction-stats">
            <div className="stat-item">
              <span className="stat-value">{analytics?.engagement?.avg_completion_rate || 0}%</span>
              <span className="stat-label">Module Completion</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{analytics?.engagement?.quiz_participation || 0}%</span>
              <span className="stat-label">Quiz Participation</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{analytics?.engagement?.feedback_submissions || 0}</span>
              <span className="stat-label">Feedback Given</span>
            </div>
          </div>
        </div>

        <div className="engagement-card">
          <h4>Learning Pace</h4>
          <div className="pace-stats">
            <div className="stat-item">
              <span className="stat-value">{analytics?.engagement?.fast_learners || 0}</span>
              <span className="stat-label">Fast Learners</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{analytics?.engagement?.steady_pace || 0}</span>
              <span className="stat-label">Steady Pace</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{analytics?.engagement?.needs_support || 0}</span>
              <span className="stat-label">Need Support</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCourseComparison = () => (
    <div className="course-comparison">
      <h3>Course Performance Comparison</h3>
      <div className="comparison-chart">
        {analytics?.course_comparison?.map((course) => (
          <div key={course.course_id} className="course-metric">
            <div className="course-header">
              <h4>{course.course_name}</h4>
              <span className="student-count">{course.student_count} students</span>
            </div>
            <div className="course-metrics">
              <div className="metric">
                <span className="metric-label">Avg Progress</span>
                <span 
                  className="metric-value"
                  style={{ color: getPerformanceColor(course.avg_progress) }}
                >
                  {course.avg_progress}%
                </span>
              </div>
              <div className="metric">
                <span className="metric-label">Completion Rate</span>
                <span className="metric-value">{course.completion_rate}%</span>
              </div>
              <div className="metric">
                <span className="metric-label">Avg Quiz Score</span>
                <span 
                  className="metric-value"
                  style={{ color: getPerformanceColor(course.avg_quiz_score) }}
                >
                  {course.avg_quiz_score}%
                </span>
              </div>
              <div className="metric">
                <span className="metric-label">Engagement Score</span>
                <span className="metric-value">
                  {(() => {
                    const engagement = getEngagementLevel(course.engagement_score);
                    return (
                      <span style={{ color: engagement.color }}>
                        <i className={engagement.icon}></i>
                        {engagement.level}
                      </span>
                    );
                  })()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderActionableInsights = () => (
    <div className="actionable-insights">
      <h3>Actionable Insights & Recommendations</h3>
      <div className="insights-grid">
        {analytics?.insights?.map((insight, index) => (
          <div key={index} className={`insight-card ${insight.priority}`}>
            <div className="insight-header">
              <i className={`fas ${insight.icon}`}></i>
              <span className="insight-priority">{insight.priority}</span>
            </div>
            <h4>{insight.title}</h4>
            <p>{insight.description}</p>
            <div className="insight-actions">
              {insight.actions?.map((action, actionIndex) => (
                <button key={actionIndex} className="action-btn">
                  <i className="fas fa-lightbulb"></i>
                  {action}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="student-progress-analytics">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading student progress analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="student-progress-analytics">
        <div className="error-container">
          <i className="fas fa-exclamation-triangle"></i>
          <p>{error}</p>
          <button onClick={fetchAnalytics} className="retry-btn">
            <i className="fas fa-redo"></i>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="student-progress-analytics">
      <div className="analytics-header">
        <h2>
          <i className="fas fa-chart-line"></i>
          Student Progress Analytics
        </h2>
        <p>Comprehensive insights into student performance and engagement</p>
      </div>

      {/* Filters */}
      <div className="analytics-filters">
        <div className="filter-group">
          <label>Course:</label>
          <select 
            value={selectedCourse} 
            onChange={(e) => setSelectedCourse(e.target.value)}
          >
            <option value="all">All Courses</option>
            {analytics?.courses?.map((course) => (
              <option key={course.id} value={course.id}>
                {course.course_name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Student:</label>
          <select 
            value={selectedStudent} 
            onChange={(e) => setSelectedStudent(e.target.value)}
          >
            <option value="all">All Students</option>
            {analytics?.students?.map((student) => (
              <option key={student.id} value={student.id}>
                {student.student_name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Time Range:</label>
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
          </select>
        </div>

        <div className="view-mode-toggle">
          <button 
            className={`toggle-btn ${viewMode === 'overview' ? 'active' : ''}`}
            onClick={() => setViewMode('overview')}
          >
            <i className="fas fa-chart-pie"></i>
            Overview
          </button>
          <button 
            className={`toggle-btn ${viewMode === 'detailed' ? 'active' : ''}`}
            onClick={() => setViewMode('detailed')}
          >
            <i className="fas fa-chart-bar"></i>
            Detailed
          </button>
          <button 
            className={`toggle-btn ${viewMode === 'comparisons' ? 'active' : ''}`}
            onClick={() => setViewMode('comparisons')}
          >
            <i className="fas fa-balance-scale"></i>
            Comparisons
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="analytics-content">
        {viewMode === 'overview' && (
          <>
            {renderOverviewCards()}
            {renderProgressChart()}
            {renderEngagementMetrics()}
          </>
        )}

        {viewMode === 'detailed' && (
          <>
            {renderStudentPerformanceTable()}
            {renderActionableInsights()}
          </>
        )}

        {viewMode === 'comparisons' && (
          <>
            {renderCourseComparison()}
            {renderEngagementMetrics()}
          </>
        )}
      </div>

      {/* Export Options */}
      <div className="export-section">
        <button className="export-btn">
          <i className="fas fa-download"></i>
          Export Analytics Report
        </button>
        <button className="export-btn">
          <i className="fas fa-envelope"></i>
          Email Report
        </button>
        <button className="export-btn">
          <i className="fas fa-print"></i>
          Print Report
        </button>
      </div>
    </div>
  );
};

export default StudentProgressAnalytics;
