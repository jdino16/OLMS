import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Feedback.css';

const Feedback = ({ student, targetType, targetId, targetName, onClose }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [category, setCategory] = useState('general');
  const [existingFeedback, setExistingFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (student && targetType && targetId) {
      fetchExistingFeedback();
    }
  }, [student, targetType, targetId]);

  const fetchExistingFeedback = async () => {
    try {
      const response = await axios.get(`/api/student/feedback?feedback_type=${targetType}&target_id=${targetId}`);
      if (response.data.success && response.data.feedback) {
        setExistingFeedback(response.data.feedback);
        setRating(response.data.feedback.rating);
        setComment(response.data.feedback.comment || '');
        setCategory(response.data.feedback.category);
      }
    } catch (error) {
      console.error('Error fetching existing feedback:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('/api/student/feedback', {
        feedback_type: targetType,
        target_id: targetId,
        rating: rating,
        comment: comment,
        category: category
      });

      if (response.data.success) {
        setSubmitted(true);
        setExistingFeedback({
          id: response.data.feedback_id,
          rating: rating,
          comment: comment,
          category: category
        });
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setError('Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!existingFeedback) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axios.put('/api/student/feedback', {
        feedback_id: existingFeedback.id,
        rating: rating,
        comment: comment
      });

      if (response.data.success) {
        setSubmitted(true);
        setExistingFeedback({
          ...existingFeedback,
          rating: rating,
          comment: comment
        });
      }
    } catch (error) {
      console.error('Error updating feedback:', error);
      setError('Failed to update feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!existingFeedback) return;

    if (!window.confirm('Are you sure you want to delete this feedback?')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.delete('/api/student/feedback', {
        data: { feedback_id: existingFeedback.id }
      });

      if (response.data.success) {
        setExistingFeedback(null);
        setRating(0);
        setComment('');
        setCategory('general');
        setSubmitted(false);
      }
    } catch (error) {
      console.error('Error deleting feedback:', error);
      setError('Failed to delete feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = () => {
    return (
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`star ${star <= rating ? 'filled' : ''}`}
            onClick={() => setRating(star)}
            disabled={loading}
          >
            <i className="fas fa-star"></i>
          </button>
        ))}
        <span className="rating-text">
          {rating > 0 ? `${rating} star${rating > 1 ? 's' : ''}` : 'Select rating'}
        </span>
      </div>
    );
  };

  const getRatingDescription = (rating) => {
    switch (rating) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Very Good';
      case 5: return 'Excellent';
      default: return '';
    }
  };

  if (submitted) {
    return (
      <div className="feedback-container">
        <div className="feedback-success">
          <div className="success-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <h3>Feedback Submitted!</h3>
          <p>Thank you for your feedback on "{targetName}".</p>
          <div className="feedback-summary">
            <div className="summary-item">
              <span className="label">Rating:</span>
              <div className="stars-display">
                {[1, 2, 3, 4, 5].map((star) => (
                  <i 
                    key={star} 
                    className={`fas fa-star ${star <= rating ? 'filled' : ''}`}
                  ></i>
                ))}
                <span className="rating-description">({getRatingDescription(rating)})</span>
              </div>
            </div>
            {comment && (
              <div className="summary-item">
                <span className="label">Comment:</span>
                <p className="comment-text">{comment}</p>
              </div>
            )}
          </div>
          <div className="feedback-actions">
            <button 
              className="btn btn-secondary"
              onClick={() => setSubmitted(false)}
            >
              <i className="fas fa-edit"></i>
              Edit Feedback
            </button>
            <button 
              className="btn btn-primary"
              onClick={onClose}
            >
              <i className="fas fa-check"></i>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="feedback-container">
      <div className="feedback-header">
        <h3>
          <i className="fas fa-comment-alt"></i>
          {existingFeedback ? 'Update Feedback' : 'Submit Feedback'}
        </h3>
        <button className="close-btn" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>
      </div>

      <div className="feedback-content">
        <div className="target-info">
          <h4>{targetName}</h4>
          <span className="target-type">{targetType === 'course' ? 'Course' : 'Lesson'}</span>
        </div>

        {error && (
          <div className="error-message">
            <i className="fas fa-exclamation-triangle"></i>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Rating *</label>
            {renderStars()}
          </div>

          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={loading}
            >
              <option value="general">General</option>
              <option value="content">Content Quality</option>
              <option value="difficulty">Difficulty Level</option>
              <option value="instructor">Instructor</option>
              <option value="technical">Technical Issues</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="comment">Comment (Optional)</label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your thoughts about this course/lesson..."
              rows="4"
              disabled={loading}
            />
          </div>

          <div className="feedback-actions">
            {existingFeedback && (
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDelete}
                disabled={loading}
              >
                <i className="fas fa-trash"></i>
                Delete
              </button>
            )}
            
            {existingFeedback ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleUpdate}
                disabled={loading}
              >
                <i className="fas fa-save"></i>
                {loading ? 'Updating...' : 'Update Feedback'}
              </button>
            ) : (
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                <i className="fas fa-paper-plane"></i>
                {loading ? 'Submitting...' : 'Submit Feedback'}
              </button>
            )}
            
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Feedback;
