import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Courses.css';

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formData, setFormData] = useState({
    course_name: '',
    description: '',
    duration: '',
    level: 'Beginner',
    status: 'Active'
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/courses');
      setCourses(response.data);
    } catch (error) {
      setError('Failed to fetch courses');
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      course_name: '',
      description: '',
      duration: '',
      level: 'Beginner',
      status: 'Active'
    });
    setEditingCourse(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingCourse) {
        await axios.put(`/api/courses/${editingCourse.id}`, formData);
      } else {
        await axios.post('/api/courses', formData);
      }
      
      fetchCourses();
      setShowForm(false);
      resetForm();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to save course');
    }
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    setFormData({
      course_name: course.course_name,
      description: course.description || '',
      duration: course.duration || '',
      level: course.level || 'Beginner',
      status: course.status || 'Active'
    });
    setShowForm(true);
  };

  const handleDelete = async (courseId) => {
    if (window.confirm('Are you sure you want to delete this course? This will also delete all associated modules.')) {
      try {
        await axios.delete(`/api/courses/${courseId}`);
        fetchCourses();
      } catch (error) {
        setError('Failed to delete course');
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status) => {
    const statusClass = status === 'Active' ? 'status-active' : 'status-inactive';
    return <span className={`status-badge ${statusClass}`}>{status}</span>;
  };

  const getLevelBadge = (level) => {
    const levelClass = level === 'Beginner' ? 'level-beginner' : 
                     level === 'Intermediate' ? 'level-intermediate' : 'level-advanced';
    return <span className={`level-badge ${levelClass}`}>{level}</span>;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <i className="fas fa-spinner fa-spin"></i>
        <p>Loading courses...</p>
      </div>
    );
  }

  return (
    <div className="courses-container">
      <div className="page-header">
        <h2>Manage Courses</h2>
        <button 
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          <i className="fas fa-plus"></i>
          Add Course
        </button>
      </div>

      {error && (
        <div className="error-message">
          <i className="fas fa-exclamation-circle"></i>
          {error}
        </div>
      )}

      {showForm && (
        <div className="form-overlay">
          <div className="form-modal">
            <div className="form-header">
              <h3>{editingCourse ? 'Edit Course' : 'Add New Course'}</h3>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="course-form">
              <div className="form-group">
                <label>Course Name *</label>
                <input
                  type="text"
                  name="course_name"
                  value={formData.course_name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter course name"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="4"
                  placeholder="Enter course description"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Duration</label>
                  <input
                    type="text"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    placeholder="e.g., 8 weeks, 3 months"
                  />
                </div>
                <div className="form-group">
                  <label>Level</label>
                  <select
                    name="level"
                    value={formData.level}
                    onChange={handleInputChange}
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingCourse ? 'Update' : 'Create'} Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Course Name</th>
              <th>Description</th>
              <th>Duration</th>
              <th>Level</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <tr key={course.id}>
                <td>{course.id}</td>
                <td className="course-name">{course.course_name}</td>
                <td className="course-description">
                  {course.description ? (
                    course.description.length > 50 
                      ? `${course.description.substring(0, 50)}...` 
                      : course.description
                  ) : '-'}
                </td>
                <td>{course.duration || '-'}</td>
                <td>{getLevelBadge(course.level)}</td>
                <td>{getStatusBadge(course.status)}</td>
                <td>{formatDate(course.created_at)}</td>
                <td className="actions">
                  <button 
                    className="btn btn-sm btn-edit"
                    onClick={() => handleEdit(course)}
                    title="Edit"
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                  <button 
                    className="btn btn-sm btn-delete"
                    onClick={() => handleDelete(course.id)}
                    title="Delete"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {courses.length === 0 && (
          <div className="empty-state">
            <i className="fas fa-book"></i>
            <p>No courses found</p>
            <button 
              className="btn btn-primary"
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
            >
              Add First Course
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Courses;
