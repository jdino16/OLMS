import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './StudentCertificates.css';

const StudentCertificates = ({ student }) => {
  const [certificates, setCertificates] = useState([]);
  const [completedCourses, setCompletedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [showCertificateViewer, setShowCertificateViewer] = useState(false);
  const [generatingCertificate, setGeneratingCertificate] = useState(false);

  useEffect(() => {
    fetchCertificates();
    fetchCompletedCourses();
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/api/student/certificates');
      if (response.data.success) {
        setCertificates(response.data.certificates);
      } else {
        setError(response.data.error || 'Failed to load certificates');
      }
    } catch (error) {
      console.error('Error fetching certificates:', error);
      setError('Failed to load certificates');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompletedCourses = async () => {
    try {
      const response = await axios.get('/api/student/completed-courses');
      if (response.data.success) {
        setCompletedCourses(response.data.courses);
      }
    } catch (error) {
      console.error('Error fetching completed courses:', error);
    }
  };

  const generateCertificate = async (courseId) => {
    try {
      setGeneratingCertificate(true);
      const response = await axios.post('/api/student/generate-certificate', {
        course_id: courseId
      });
      
      if (response.data.success) {
        // Refresh certificates list
        await fetchCertificates();
        alert('Certificate generated successfully!');
      } else {
        setError(response.data.error || 'Failed to generate certificate');
      }
    } catch (error) {
      console.error('Error generating certificate:', error);
      setError('Failed to generate certificate');
    } finally {
      setGeneratingCertificate(false);
    }
  };

  const downloadCertificate = async (certificateId) => {
    try {
      const response = await axios.get(`/api/student/download-certificate/${certificateId}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `certificate-${certificateId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading certificate:', error);
      setError('Failed to download certificate');
    }
  };

  const viewCertificate = (certificate) => {
    setSelectedCertificate(certificate);
    setShowCertificateViewer(true);
  };

  const renderCertificateViewer = () => {
    if (!selectedCertificate) return null;

    return (
      <div className="certificate-viewer-overlay">
        <div className="certificate-viewer">
          <div className="certificate-viewer-header">
            <h3>Certificate Preview</h3>
            <button 
              className="close-btn"
              onClick={() => setShowCertificateViewer(false)}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div className="certificate-content">
            <div className="certificate-preview">
              <div className="certificate-header">
                <div className="certificate-logo">
                  <i className="fas fa-graduation-cap"></i>
                </div>
                <h1>Certificate of Completion</h1>
                <p>This is to certify that</p>
              </div>
              
              <div className="student-info">
                <h2>{student?.student_name || 'Student Name'}</h2>
                <p>has successfully completed the course</p>
                <h3>{selectedCertificate.course_name}</h3>
              </div>
              
              <div className="certificate-details">
                <div className="detail-row">
                  <span className="label">Completion Date:</span>
                  <span className="value">
                    {new Date(selectedCertificate.completion_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="label">Certificate ID:</span>
                  <span className="value">{selectedCertificate.certificate_id}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Final Score:</span>
                  <span className="value">{selectedCertificate.final_score}%</span>
                </div>
              </div>
              
              <div className="certificate-footer">
                <div className="signature-section">
                  <div className="signature-line"></div>
                  <p>Instructor Signature</p>
                </div>
                <div className="signature-section">
                  <div className="signature-line"></div>
                  <p>System Administrator</p>
                </div>
              </div>
            </div>
          </div>
          <div className="certificate-actions">
            <button 
              className="btn btn-primary"
              onClick={() => downloadCertificate(selectedCertificate.id)}
            >
              <i className="fas fa-download"></i>
              Download PDF
            </button>
            <button 
              className="btn btn-outline"
              onClick={() => setShowCertificateViewer(false)}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderCertificatesList = () => (
    <div className="certificates-section">
      <h3>Your Certificates</h3>
      {certificates.length === 0 ? (
        <div className="no-certificates">
          <i className="fas fa-certificate"></i>
          <p>No certificates yet. Complete a course to earn your first certificate!</p>
        </div>
      ) : (
        <div className="certificates-grid">
          {certificates.map((certificate) => (
            <div key={certificate.id} className="certificate-card">
              <div className="certificate-icon">
                <i className="fas fa-certificate"></i>
              </div>
              <div className="certificate-info">
                <h4>{certificate.course_name}</h4>
                <p className="completion-date">
                  Completed: {new Date(certificate.completion_date).toLocaleDateString()}
                </p>
                <p className="certificate-id">ID: {certificate.certificate_id}</p>
                <p className="final-score">Score: {certificate.final_score}%</p>
              </div>
              <div className="certificate-actions">
                <button 
                  className="btn btn-sm btn-primary"
                  onClick={() => viewCertificate(certificate)}
                >
                  <i className="fas fa-eye"></i>
                  View
                </button>
                <button 
                  className="btn btn-sm btn-outline"
                  onClick={() => downloadCertificate(certificate.id)}
                >
                  <i className="fas fa-download"></i>
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderCompletedCourses = () => (
    <div className="completed-courses-section">
      <h3>Completed Courses - Generate Certificates</h3>
      {completedCourses.length === 0 ? (
        <div className="no-completed-courses">
          <i className="fas fa-book"></i>
          <p>No completed courses yet. Keep learning to earn certificates!</p>
        </div>
      ) : (
        <div className="completed-courses-grid">
          {completedCourses.map((course) => (
            <div key={course.id} className="completed-course-card">
              <div className="course-info">
                <h4>{course.course_name}</h4>
                <p className="completion-date">
                  Completed: {new Date(course.completion_date).toLocaleDateString()}
                </p>
                <p className="final-score">Final Score: {course.final_score}%</p>
                <p className="status">
                  <span className="status-badge completed">Completed</span>
                </p>
              </div>
              <div className="course-actions">
                {course.has_certificate ? (
                  <button className="btn btn-sm btn-success" disabled>
                    <i className="fas fa-check"></i>
                    Certificate Generated
                  </button>
                ) : (
                  <button 
                    className="btn btn-sm btn-primary"
                    onClick={() => generateCertificate(course.id)}
                    disabled={generatingCertificate}
                  >
                    {generatingCertificate ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        Generating...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-certificate"></i>
                        Generate Certificate
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="student-certificates">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading certificates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="student-certificates">
      <div className="certificates-header">
        <h2>My Certificates</h2>
        <p>View and download your course completion certificates</p>
      </div>

      {error && (
        <div className="error-message">
          <i className="fas fa-exclamation-triangle"></i>
          <p>{error}</p>
          <button onClick={fetchCertificates} className="retry-btn">
            <i className="fas fa-redo"></i>
            Try Again
          </button>
        </div>
      )}

      <div className="certificates-content">
        {renderCertificatesList()}
        {renderCompletedCourses()}
      </div>

      {showCertificateViewer && renderCertificateViewer()}
    </div>
  );
};

export default StudentCertificates;
