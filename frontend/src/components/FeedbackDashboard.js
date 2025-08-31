import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Feedback from './Feedback';
import './FeedbackDashboard.css';

const FeedbackDashboard = ({ student }) => {
  const [analytics, setAnalytics] = useState(null);
  const [recentFeedback, setRecentFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackTarget, setFeedbackTarget] = useState(null);
  const [selectedFeedback, setSelectedFeedback] = useState(null);

  useEffect(() => {
    if (student) {
      fetchFeedbackAnalytics();
      fetchRecentFeedback();
    }
  }, [student]);

  const fetchFeedbackAnalytics = async () => {
    try {
      const response = await axios.get('/api/student/feedback-analytics');
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

  const fetchRecentFeedback = async () => {
    try {
      const response = await axios.get('/api/student/feedback');
      if (response.data.success) {
        setRecentFeedback(response.data.feedback);
      }
    } catch (error) {
      console.error('Error fetching recent feedback:', error);
    }
  };

  const handleDeleteFeedback = async (feedbackId) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) {
      return;
    }

    try {
      const response = await axios.delete('/api/student/feedback', {
        data: { feedback_id: feedbackId }
      });

      if (response.data.success) {
        fetchFeedbackAnalytics();
        fetchRecentFeedback();
        alert('Feedback deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting feedback:', error);
      alert('Failed to delete feedback');
    }
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

  if (loading) {
    return (
      <div className="feedback-dashboard">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading feedback analytics...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="feedback-dashboard">
        <div className="loading-container">
          <div className="loading-spinner">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Loading feedback analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="feedback-dashboard">
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
    <div className="feedback-dashboard">
      <div className="dashboard-header">
        <h2>
          <i className="fas fa-comments"></i>
          Feedback Dashboard
        </h2>
        <p>Track and manage your course and lesson feedback</p>
      </div>

      {/* Analytics Overview */}
      {analytics && analytics.overall_stats ? (
        <div className="analytics-overview">
          <div className="analytics-grid">
            <div className="analytics-card">
              <div className="analytics-icon">
                <i className="fas fa-comment-alt"></i>
              </div>
              <div className="analytics-content">
                <h3>{analytics.overall_stats.total_feedback || 0}</h3>
                <p>Total Feedback</p>
              </div>
            </div>
            
            <div className="analytics-card">
              <div className="analytics-icon rating">
                <i className="fas fa-star"></i>
              </div>
              <div className="analytics-content">
                <h3>{analytics.overall_stats.avg_rating ? (parseFloat(analytics.overall_stats.avg_rating) || 0).toFixed(1) : '0.0'}</h3>
                <p>Average Rating</p>
              </div>
            </div>
            
            <div className="analytics-card">
              <div className="analytics-icon positive">
                <i className="fas fa-thumbs-up"></i>
              </div>
              <div className="analytics-content">
                <h3>{analytics.overall_stats.positive_feedback || 0}</h3>
                <p>Positive Reviews</p>
              </div>
            </div>
            
            <div className="analytics-card">
              <div className="analytics-icon negative">
                <i className="fas fa-thumbs-down"></i>
              </div>
              <div className="analytics-content">
                <h3>{analytics.overall_stats.negative_feedback || 0}</h3>
                <p>Negative Reviews</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="no-analytics">
          <i className="fas fa-chart-bar"></i>
          <p>No feedback analytics available yet. Submit your first feedback to see statistics!</p>
        </div>
      )}

      {/* Category Breakdown */}
      {analytics && analytics.category_stats && analytics.category_stats.length > 0 ? (
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
                    <span className="stat-value">{category.avg_rating ? (parseFloat(category.avg_rating) || 0).toFixed(1) : '0.0'}</span>
                    <span className="stat-label">Avg Rating</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Recent Feedback */}
      <div className="recent-feedback">
        <div className="section-header">
          <h3>Recent Feedback</h3>
          <button 
            className="add-feedback-btn"
            onClick={() => {
              setFeedbackTarget({
                type: 'course',
                id: 1, // Default course ID
                name: 'Sample Course'
              });
              setShowFeedback(true);
            }}
          >
            <i className="fas fa-plus"></i>
            Add Feedback
          </button>
        </div>

        {recentFeedback.length === 0 ? (
          <div className="no-feedback">
            <i className="fas fa-comment-slash"></i>
            <p>You haven't submitted any feedback yet.</p>
            <button 
              className="browse-courses-btn"
              onClick={() => {
                setFeedbackTarget({
                  type: 'course',
                  id: 1,
                  name: 'Sample Course'
                });
                setShowFeedback(true);
              }}
            >
              <i className="fas fa-plus"></i>
              Submit Your First Feedback
            </button>
          </div>
        ) : (
          <div className="feedback-list">
            {recentFeedback.map((feedback) => (
              <div key={feedback.id} className="feedback-item">
                <div className="feedback-header">
                  <div className="feedback-info">
                    <h4>{feedback.target_name || 'Unknown'}</h4>
                    <span className="feedback-type">{feedback.feedback_type}</span>
                    <span className="feedback-date">
                      {new Date(feedback.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="feedback-rating">
                    {renderStars(feedback.rating)}
                    <span 
                      className="rating-text"
                      style={{ color: getRatingColor(feedback.rating) }}
                    >
                      {feedback.rating}/5
                    </span>
                  </div>
                </div>
                
                <div className="feedback-category">
                  <i 
                    className={getCategoryIcon(feedback.category)}
                    style={{ color: getCategoryColor(feedback.category) }}
                  ></i>
                  <span>{feedback.category}</span>
                </div>
                
                {feedback.comment && (
                  <div className="feedback-comment">
                    <p>{feedback.comment}</p>
                  </div>
                )}
                
                <div className="feedback-actions">
                  <button 
                    className="edit-btn"
                    onClick={() => {
                      setSelectedFeedback(feedback);
                      setFeedbackTarget({
                        type: feedback.feedback_type,
                        id: feedback.target_id,
                        name: feedback.target_name || 'Unknown'
                      });
                      setShowFeedback(true);
                    }}
                  >
                    <i className="fas fa-edit"></i>
                    Edit
                  </button>
                  
                  <button 
                    className="delete-btn"
                    onClick={() => handleDeleteFeedback(feedback.id)}
                  >
                    <i className="fas fa-trash"></i>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
            setSelectedFeedback(null);
            fetchFeedbackAnalytics();
            fetchRecentFeedback();
          }}
        />
      )}
    </div>
  );
};

export default FeedbackDashboard;
