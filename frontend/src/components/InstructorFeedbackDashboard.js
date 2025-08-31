import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './InstructorFeedbackDashboard.css';

const InstructorFeedbackDashboard = ({ instructor }) => {
  const [analytics, setAnalytics] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [filters, setFilters] = useState({
    feedback_type: '',
    course_id: '',
    category: '',
    rating: ''
  });
  
  // View states
  const [viewMode, setViewMode] = useState('analytics'); // 'analytics', 'feedback', 'summary'
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showFeedbackDetail, setShowFeedbackDetail] = useState(false);

  useEffect(() => {
    if (instructor) {
      fetchFeedbackAnalytics();
      fetchFeedbackSummary();
      fetchFeedback();
    }
  }, [instructor]);

  const fetchFeedbackAnalytics = async () => {
    try {
      const response = await axios.get('/api/instructor/feedback-analytics');
      if (response.data.success) {
        setAnalytics(response.data.analytics);
      }
    } catch (error) {
      console.error('Error fetching feedback analytics:', error);
      setError('Failed to load feedback analytics');
    } finally {
      setLoading(false);
    }
  };

  const fetchFeedbackSummary = async () => {
    try {
      const response = await axios.get('/api/instructor/feedback-summary');
      if (response.data.success) {
        setSummary(response.data.summary);
      }
    } catch (error) {
      console.error('Error fetching feedback summary:', error);
    }
  };

  const fetchFeedback = async () => {
    try {
      const params = {};
      if (filters.feedback_type) params.feedback_type = filters.feedback_type;
      if (filters.course_id) params.course_id = filters.course_id;
      if (filters.category) params.category = filters.category;
      if (filters.rating) params.rating = filters.rating;

      const response = await axios.get('/api/instructor/feedback', { params });
      if (response.data.success) {
        setFeedback(response.data.feedback);
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const applyFilters = () => {
    fetchFeedback();
  };

  const clearFilters = () => {
    setFilters({
      feedback_type: '',
      course_id: '',
      category: '',
      rating: ''
    });
    fetchFeedback();
  };

  const exportFeedback = async () => {
    try {
      const response = await axios.get('/api/instructor/feedback-export');
      if (response.data.success) {
        // Convert to CSV and download
        const csvContent = convertToCSV(response.data.data);
        downloadCSV(csvContent, 'instructor_feedback.csv');
      }
    } catch (error) {
      console.error('Error exporting feedback:', error);
      alert('Failed to export feedback data');
    }
  };

  const convertToCSV = (data) => {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  };

  const downloadCSV = (content, filename) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderStars = (rating) => {
    return (
      <div className="stars-display">
        {[1, 2, 3, 4, 5].map((star) => (
          <i 
            key={star} 
            className={`fas fa-star ${star <= rating ? 'filled' : ''}`}
          ></i>
        ))}
        <span className="rating-text">{rating}/5</span>
      </div>
    );
  };

  const getRatingColor = (rating) => {
    if (rating >= 4) return '#28a745';
    if (rating >= 3) return '#ffc107';
    return '#dc3545';
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'content': return 'fas fa-book';
      case 'difficulty': return 'fas fa-signal';
      case 'instructor': return 'fas fa-chalkboard-teacher';
      case 'technical': return 'fas fa-tools';
      default: return 'fas fa-comment';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'content': return '#667eea';
      case 'difficulty': return '#fd7e14';
      case 'instructor': return '#28a745';
      case 'technical': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const renderAnalyticsView = () => (
    <div className="analytics-view">
      {/* Overall Stats */}
      {analytics && (
        <div className="overall-stats">
          <h3>Overall Feedback Statistics</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon total">
                <i className="fas fa-comment-alt"></i>
              </div>
              <div className="stat-content">
                <h3>{analytics.overall_stats?.total_feedback || 0}</h3>
                <p>Total Feedback</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon rating">
                <i className="fas fa-star"></i>
              </div>
              <div className="stat-content">
                <h3>{(() => {
                  const rating = analytics.overall_stats?.avg_rating;
                  if (rating === null || rating === undefined) return '0.0';
                  const numRating = parseFloat(rating);
                  return isNaN(numRating) ? '0.0' : numRating.toFixed(1);
                })()}</h3>
                <p>Average Rating</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon positive">
                <i className="fas fa-thumbs-up"></i>
              </div>
              <div className="stat-content">
                <h3>{analytics.overall_stats?.positive_feedback || 0}</h3>
                <p>Positive Reviews</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon negative">
                <i className="fas fa-thumbs-down"></i>
              </div>
              <div className="stat-content">
                <h3>{analytics.overall_stats?.negative_feedback || 0}</h3>
                <p>Negative Reviews</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Breakdown */}
      {analytics && analytics.category_stats && (
        <div className="category-breakdown">
          <h3>Feedback by Category</h3>
          <div className="category-grid">
            {analytics.category_stats.map((category) => (
              <div key={category.category} className="category-card">
                <div className="category-header">
                  <i 
                    className={getCategoryIcon(category.category)}
                    style={{ color: getCategoryColor(category.category) }}
                  ></i>
                  <span className="category-name">{category.category}</span>
                </div>
                <div className="category-stats">
                  <div className="stat">
                    <span className="stat-value">{category.count}</span>
                    <span className="stat-label">Reviews</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">{(() => {
                      const rating = category.avg_rating;
                      if (rating === null || rating === undefined) return '0.0';
                      const numRating = parseFloat(rating);
                      return isNaN(numRating) ? '0.0' : numRating.toFixed(1);
                    })()}</span>
                    <span className="stat-label">Avg Rating</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">{category.positive_count}</span>
                    <span className="stat-label">Positive</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Course Performance */}
      {analytics && analytics.course_stats && (
        <div className="course-performance">
          <h3>Course Performance</h3>
          <div className="course-stats-table">
            <table>
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Feedback Count</th>
                  <th>Average Rating</th>
                  <th>Positive Reviews</th>
                  <th>Negative Reviews</th>
                </tr>
              </thead>
              <tbody>
                {analytics.course_stats.map((course) => (
                  <tr key={course.course_id}>
                    <td>{course.course_name}</td>
                    <td>{course.feedback_count}</td>
                    <td>
                      <span style={{ color: getRatingColor(course.avg_rating) }}>
                        {(() => {
                          const rating = course.avg_rating;
                          if (rating === null || rating === undefined) return '0.0';
                          const numRating = parseFloat(rating);
                          return isNaN(numRating) ? '0.0' : numRating.toFixed(1);
                        })()}
                      </span>
                    </td>
                    <td>{course.positive_count}</td>
                    <td>{course.negative_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Rating Distribution */}
      {analytics && analytics.rating_distribution && (
        <div className="rating-distribution">
          <h3>Rating Distribution</h3>
          <div className="rating-bars">
            {analytics.rating_distribution.map((rating) => (
              <div key={rating.rating} className="rating-bar-item">
                <div className="rating-label">
                  {rating.rating} Stars
                </div>
                <div className="rating-bar">
                  <div 
                    className="rating-fill"
                    style={{ 
                      width: `${(rating.count / Math.max(...analytics.rating_distribution.map(r => r.count))) * 100}%`,
                      backgroundColor: getRatingColor(rating.rating)
                    }}
                  ></div>
                </div>
                <div className="rating-count">{rating.count}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderFeedbackView = () => (
    <div className="feedback-view">
      {/* Filters */}
      <div className="feedback-filters">
        <h3>Filter Feedback</h3>
        <div className="filter-controls">
          <select
            value={filters.feedback_type}
            onChange={(e) => handleFilterChange('feedback_type', e.target.value)}
          >
            <option value="">All Types</option>
            <option value="course">Course</option>
            <option value="lesson">Lesson</option>
          </select>
          
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="content">Content</option>
            <option value="difficulty">Difficulty</option>
            <option value="instructor">Instructor</option>
            <option value="technical">Technical</option>
            <option value="general">General</option>
          </select>
          
          <select
            value={filters.rating}
            onChange={(e) => handleFilterChange('rating', e.target.value)}
          >
            <option value="">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
          
          <button className="apply-filters-btn" onClick={applyFilters}>
            <i className="fas fa-filter"></i>
            Apply Filters
          </button>
          
          <button className="clear-filters-btn" onClick={clearFilters}>
            <i className="fas fa-times"></i>
            Clear
          </button>
        </div>
      </div>

      {/* Feedback List */}
      <div className="feedback-list">
        <h3>Student Feedback ({feedback.length})</h3>
        {feedback.length === 0 ? (
          <div className="no-feedback">
            <i className="fas fa-comment-slash"></i>
            <p>No feedback found with the current filters.</p>
          </div>
        ) : (
          <div className="feedback-items">
            {feedback.map((item) => (
              <div key={item.id} className="feedback-item">
                <div className="feedback-header">
                  <div className="feedback-info">
                    <h4>{item.target_name || 'Unknown'}</h4>
                    <span className="feedback-type">{item.feedback_type}</span>
                    <span className="feedback-date">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="feedback-rating">
                    {renderStars(item.rating)}
                  </div>
                </div>
                
                <div className="feedback-details">
                  <div className="student-info">
                    <i className="fas fa-user"></i>
                    <span>{item.student_name} ({item.username})</span>
                    <span className="email">{item.email}</span>
                  </div>
                  
                  <div className="feedback-category">
                    <i 
                      className={getCategoryIcon(item.category)}
                      style={{ color: getCategoryColor(item.category) }}
                    ></i>
                    <span>{item.category}</span>
                  </div>
                  
                  {item.comment && (
                    <div className="feedback-comment">
                      <p>{item.comment}</p>
                    </div>
                  )}
                </div>
                
                <div className="feedback-actions">
                  <button 
                    className="view-detail-btn"
                    onClick={() => {
                      setSelectedFeedback(item);
                      setShowFeedbackDetail(true);
                    }}
                  >
                    <i className="fas fa-eye"></i>
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderSummaryView = () => (
    <div className="summary-view">
      {summary && (
        <>
          {/* Monthly Trends */}
          <div className="monthly-trends">
            <h3>Monthly Feedback Trends</h3>
            <div className="trends-chart">
              {summary.monthly_trends.map((month) => (
                <div key={month.month} className="trend-item">
                  <div className="trend-month">{month.month}</div>
                  <div className="trend-stats">
                    <span className="feedback-count">{month.feedback_count}</span>
                    <span className="avg-rating">{(() => {
                      const rating = month.avg_rating;
                      if (rating === null || rating === undefined) return '0.0';
                      const numRating = parseFloat(rating);
                      return isNaN(numRating) ? '0.0' : numRating.toFixed(1);
                    })()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Courses */}
          <div className="top-courses">
            <h3>Top Performing Courses</h3>
            <div className="top-courses-list">
              {summary.top_courses.map((course, index) => (
                <div key={index} className="top-course-item">
                  <div className="course-rank">#{index + 1}</div>
                  <div className="course-info">
                    <h4>{course.course_name}</h4>
                    <div className="course-stats">
                      <span className="rating">
                        <i className="fas fa-star"></i>
                        {(() => {
                          const rating = course.avg_rating;
                          if (rating === null || rating === undefined) return '0.0';
                          const numRating = parseFloat(rating);
                          return isNaN(numRating) ? '0.0' : numRating.toFixed(1);
                        })()}
                      </span>
                      <span className="feedback-count">
                        {course.feedback_count} reviews
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Areas for Improvement */}
          <div className="improvement-areas">
            <h3>Areas for Improvement</h3>
            <div className="improvement-list">
              {summary.improvement_areas.map((area, index) => (
                <div key={index} className="improvement-item">
                  <div className="area-category">
                    <i className={getCategoryIcon(area.category)}></i>
                    <span>{area.category}</span>
                  </div>
                  <div className="area-stats">
                    <span className="avg-rating">{(() => {
                      const rating = area.avg_rating;
                      if (rating === null || rating === undefined) return '0.0';
                      const numRating = parseFloat(rating);
                      return isNaN(numRating) ? '0.0' : numRating.toFixed(1);
                    })()}</span>
                    <span className="feedback-count">{area.feedback_count} reviews</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="instructor-feedback-dashboard">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading feedback analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="instructor-feedback-dashboard">
        <div className="error-container">
          <i className="fas fa-exclamation-triangle"></i>
          <p>{error}</p>
          <button onClick={fetchFeedbackAnalytics} className="retry-btn">
            <i className="fas fa-redo"></i>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="instructor-feedback-dashboard">
      <div className="dashboard-header">
        <h2>
          <i className="fas fa-comments"></i>
          Feedback Management Dashboard
        </h2>
        <p>Monitor student satisfaction and gather insights for course improvement</p>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button 
          className={`view-btn ${viewMode === 'analytics' ? 'active' : ''}`}
          onClick={() => setViewMode('analytics')}
        >
          <i className="fas fa-chart-bar"></i>
          Analytics
        </button>
        <button 
          className={`view-btn ${viewMode === 'feedback' ? 'active' : ''}`}
          onClick={() => setViewMode('feedback')}
        >
          <i className="fas fa-list"></i>
          All Feedback
        </button>
        <button 
          className={`view-btn ${viewMode === 'summary' ? 'active' : ''}`}
          onClick={() => setViewMode('summary')}
        >
          <i className="fas fa-chart-line"></i>
          Summary
        </button>
        <button className="export-btn" onClick={exportFeedback}>
          <i className="fas fa-download"></i>
          Export Data
        </button>
      </div>

      {/* Content */}
      <div className="dashboard-content">
        {viewMode === 'analytics' && renderAnalyticsView()}
        {viewMode === 'feedback' && renderFeedbackView()}
        {viewMode === 'summary' && renderSummaryView()}
      </div>

      {/* Feedback Detail Modal */}
      {showFeedbackDetail && selectedFeedback && (
        <div className="feedback-detail-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Feedback Details</h3>
              <button 
                className="close-btn"
                onClick={() => setShowFeedbackDetail(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="detail-section">
                <h4>Student Information</h4>
                <p><strong>Name:</strong> {selectedFeedback.student_name}</p>
                <p><strong>Username:</strong> {selectedFeedback.username}</p>
                <p><strong>Email:</strong> {selectedFeedback.email}</p>
              </div>
              
              <div className="detail-section">
                <h4>Feedback Information</h4>
                <p><strong>Type:</strong> {selectedFeedback.feedback_type}</p>
                <p><strong>Target:</strong> {selectedFeedback.target_name}</p>
                <p><strong>Category:</strong> {selectedFeedback.category}</p>
                <p><strong>Rating:</strong> {renderStars(selectedFeedback.rating)}</p>
                <p><strong>Date:</strong> {new Date(selectedFeedback.created_at).toLocaleString()}</p>
              </div>
              
              {selectedFeedback.comment && (
                <div className="detail-section">
                  <h4>Comment</h4>
                  <p className="comment-text">{selectedFeedback.comment}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstructorFeedbackDashboard;
