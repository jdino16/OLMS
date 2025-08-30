import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { showAlert } from '../utils/alerts';
import './PendingInstructors.css';

const PendingInstructors = ({ onCountUpdate }) => {
  const [pendingInstructors, setPendingInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchPendingInstructors();
  }, []);

  const fetchPendingInstructors = async () => {
    try {
      const response = await axios.get('/api/admin/pending-instructors');
      setPendingInstructors(response.data.instructors);
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to fetch pending instructors';
      setError(errorMsg);
      showAlert.error(errorMsg);
      console.error('Error fetching pending instructors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (instructorId) => {
    try {
      const response = await axios.post(`/api/admin/approve-instructor/${instructorId}`);
      if (response.data.success) {
        const successMsg = 'Instructor approved successfully!';
        setSuccess(successMsg);
        showAlert.success(successMsg);
        // Remove from pending list
        setPendingInstructors(prev => prev.filter(instructor => instructor.id !== instructorId));
        // Update the pending count
        if (onCountUpdate) onCountUpdate();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to approve instructor';
      setError(errorMsg);
      showAlert.error(errorMsg);
      console.error('Error approving instructor:', error);
    }
  };

  const handleReject = async (instructorId) => {
    try {
      const response = await axios.post(`/api/admin/reject-instructor/${instructorId}`);
      if (response.data.success) {
        const successMsg = 'Instructor rejected successfully!';
        setSuccess(successMsg);
        showAlert.success(successMsg);
        // Remove from pending list
        setPendingInstructors(prev => prev.filter(instructor => instructor.id !== instructorId));
        // Update the pending count
        if (onCountUpdate) onCountUpdate();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to reject instructor';
      setError(errorMsg);
      showAlert.error(errorMsg);
      console.error('Error rejecting instructor:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="pending-instructors-container">
        <div className="loading-spinner">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading pending instructors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pending-instructors-container">
      <div className="pending-instructors-header">
        <h2>Pending Instructor Approvals</h2>
        <p>Review and approve new instructor registrations</p>
      </div>

      {error && (
        <div className="error-message">
          <i className="fas fa-exclamation-circle"></i>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="success-message">
          <i className="fas fa-check-circle"></i>
          <span>{success}</span>
        </div>
      )}

      {pendingInstructors.length === 0 ? (
        <div className="no-pending">
          <i className="fas fa-check-circle"></i>
          <h3>No Pending Approvals</h3>
          <p>All instructor registrations have been processed.</p>
        </div>
      ) : (
        <div className="pending-instructors-grid">
          {pendingInstructors.map((instructor) => (
            <div key={instructor.id} className="instructor-card">
              <div className="instructor-header">
                <div className="instructor-avatar">
                  <i className="fas fa-user"></i>
                </div>
                <div className="instructor-info">
                  <h3>{instructor.instructor_name}</h3>
                  <p className="username">@{instructor.username}</p>
                  <p className="registration-date">
                    Registered: {formatDate(instructor.created_at)}
                  </p>
                </div>
              </div>

              <div className="instructor-details">
                <div className="detail-row">
                  <span className="label">Gender:</span>
                  <span className="value">{instructor.gender}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Date of Birth:</span>
                  <span className="value">{formatDate(instructor.dob)}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Phone:</span>
                  <span className="value">{instructor.phone_number}</span>
                </div>
                {instructor.email && (
                  <div className="detail-row">
                    <span className="label">Email:</span>
                    <span className="value">{instructor.email}</span>
                  </div>
                )}
                {instructor.address && (
                  <div className="detail-row">
                    <span className="label">Address:</span>
                    <span className="value">{instructor.address}</span>
                  </div>
                )}
              </div>

              <div className="instructor-actions">
                <button
                  className="approve-btn"
                  onClick={() => handleApprove(instructor.id)}
                >
                  <i className="fas fa-check"></i>
                  Approve
                </button>
                <button
                  className="reject-btn"
                  onClick={() => handleReject(instructor.id)}
                >
                  <i className="fas fa-times"></i>
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PendingInstructors;
